import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { resolveAudioUrl, uploadAudioFile } from '@/services/user-api';

const bars = [8, 14, 10, 18, 12, 16, 9, 15];

type AudioCardProps = {
  title: string;
  meta: string;
  audioUrl?: string;
  recordable?: boolean;
  onUploaded?: (audioUrl: string) => void;
  onUploadStateChange?: (uploading: boolean) => void;
  onRecordingStateChange?: (recording: boolean) => void;
  empty?: string;
};

export function AudioCard(props: AudioCardProps) {
  if (props.recordable) return <RecordableAudioCard {...props} />;
  if (props.audioUrl) return <PlayableAudioCard {...props} audioUrl={props.audioUrl} />;
  if (props.empty) {
    return (
      <AudioCardView
        title={props.title}
        meta={props.empty}
        active={false}
        icon="▶"
        disabled
        onPress={() => {}}
        accessibilityLabel={props.empty}
      />
    );
  }
  return <DemoAudioCard title={props.title} meta={props.meta} />;
}

function RecordableAudioCard({
  title,
  meta,
  audioUrl,
  onUploaded,
  onUploadStateChange,
  onRecordingStateChange,
}: AudioCardProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [uploadedUri, setUploadedUri] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const recordingStateCallback = useRef(onRecordingStateChange);
  const source = audioUrl || recordingUri;
  const player = useAudioPlayer(source ? resolveAudioUrl(source) : null);
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    recordingStateCallback.current = onRecordingStateChange;
  }, [onRecordingStateChange]);

  useEffect(() => () => {
    if (recorder.isRecording) recordingStateCallback.current?.(false);
  }, [recorder]);

  const uploadRecording = async (uri: string) => {
    if (!onUploaded) {
      setError('Audio upload is not available.');
      return;
    }
    setUploading(true);
    onUploadStateChange?.(true);
    setError('');
    try {
      const uploadedUrl = await uploadAudioFile(uri);
      setUploadedUri(uri);
      onUploaded(uploadedUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload model audio.');
    } finally {
      setUploading(false);
      onUploadStateChange?.(false);
    }
  };

  const handlePress = async () => {
    setError('');
    if (uploading) return;
    try {
      if (recorderState.isRecording) {
        await recorder.stop();
        onRecordingStateChange?.(false);
        const uri = recorder.uri;
        if (!uri) throw new Error('The recording file could not be saved.');
        setRecordingUri(uri);
        await uploadRecording(uri);
        return;
      }
      if (recordingUri && uploadedUri !== recordingUri) {
        await uploadRecording(recordingUri);
        return;
      }
      if (source) {
        if (playerStatus.playing) {
          player.pause();
          return;
        }
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
        if (playerStatus.didJustFinish) await player.seekTo(0);
        player.play();
        return;
      }
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Microphone access is required to record model audio.');
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      onRecordingStateChange?.(true);
    } catch (audioError) {
      setError(audioError instanceof Error ? audioError.message : 'Could not record model audio.');
    }
  };

  const cardMeta = error
    || (recorderState.isRecording ? 'Recording… Tap to stop' : null)
    || (uploading ? 'Uploading…' : null)
    || (playerStatus.playing ? 'Playing…' : null)
    || (source ? meta : 'Tap to record model audio');

  return (
    <AudioCardView
      title={title}
      meta={cardMeta}
      active={recorderState.isRecording || playerStatus.playing}
      icon={recorderState.isRecording ? '■' : playerStatus.playing ? '❚❚' : source ? '▶' : '●'}
      onPress={() => void handlePress()}
      accessibilityLabel={recorderState.isRecording ? 'Stop recording model audio' : source ? 'Play model audio' : 'Record model audio'}
    />
  );
}

function PlayableAudioCard({ title, meta, audioUrl }: AudioCardProps & { audioUrl: string }) {
  const player = useAudioPlayer(resolveAudioUrl(audioUrl));
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState('');

  const togglePlayback = async () => {
    setError('');
    if (status.playing) {
      player.pause();
      return;
    }
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      if (status.didJustFinish) await player.seekTo(0);
      player.play();
    } catch (playError) {
      setError(playError instanceof Error ? playError.message : 'Could not play this audio.');
    }
  };

  return (
    <AudioCardView
      title={title}
      meta={error || (status.playing ? 'Playing…' : meta)}
      active={status.playing}
      icon={status.playing ? '❚❚' : '▶'}
      onPress={() => void togglePlayback()}
      accessibilityLabel={status.playing ? 'Pause audio' : 'Play audio'}
    />
  );
}

function DemoAudioCard({ title, meta }: Pick<AudioCardProps, 'title' | 'meta'>) {
  const [playing, setPlaying] = useState(false);
  return (
    <AudioCardView
      title={title}
      meta={playing ? 'Playing demo…' : meta}
      active={playing}
      icon={playing ? '❚❚' : '▶'}
      onPress={() => setPlaying((current) => !current)}
      accessibilityLabel={playing ? 'Pause demo audio' : 'Play demo audio'}
    />
  );
}

function AudioCardView({
  title,
  meta,
  active,
  icon,
  onPress,
  accessibilityLabel,
  disabled = false,
}: {
  title: string;
  meta: string;
  active: boolean;
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.play}>
        <Text style={styles.playIcon}>{icon}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      <View style={styles.bars}>
        {bars.map((height, index) => (
          <View key={index} style={[styles.bar, { height: active ? height + 4 : height }]} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#F0D2BC',
    backgroundColor: '#FFF8F3',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  play: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  copy: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  meta: { fontSize: 12, color: '#8B9AAB', marginTop: 2 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 22 },
  bar: { width: 4, borderRadius: 2, backgroundColor: '#F97316' },
});
