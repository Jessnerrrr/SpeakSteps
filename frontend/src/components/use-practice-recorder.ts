import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder } from 'expo-audio';

export function usePracticeRecorder(prompt: number) {
  const [takes, setTakes] = useState<Record<number, string>>({});
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const activePrompt = useRef<number | null>(null);
  const operation = useRef(false);
  const focused = useRef(false);
  const blobs = useRef(new Set<string>());
  const take = takes[prompt];
  const player = useAudioPlayer(take ?? null);
  const playback = useAudioPlayerStatus(player);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
    const index = activePrompt.current;
    if (index === null || (!status.isFinished && !status.hasError)) return;
    activePrompt.current = null;
    setRecording(false);
    if (status.url && !status.hasError) {
      const url = status.url;
      if (url.startsWith('blob:')) blobs.current.add(url);
      setTakes((current) => ({ ...current, [index]: url }));
    } else {
      setError('That recording could not be saved. Try again.');
    }
    void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
  });

  useFocusEffect(useCallback(() => {
    focused.current = true;
    return () => {
      focused.current = false;
      player.pause();
      if (activePrompt.current !== null) {
        void recorder.stop().catch(() => {});
      }
    };
  }, [player, recorder]));

  useEffect(() => () => {
    for (const url of blobs.current) URL.revokeObjectURL(url);
  }, []);

  const record = async () => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError('');
    try {
      if (activePrompt.current !== null) {
        await recorder.stop();
        return;
      }
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!focused.current) return;
      if (!permission.granted) {
        setError('Allow microphone access to record, or continue without a recording.');
        return;
      }
      player.pause();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      if (!focused.current) {
        await setAudioModeAsync({ allowsRecording: false });
        return;
      }
      await recorder.prepareToRecordAsync();
      if (!focused.current) {
        await recorder.stop();
        await setAudioModeAsync({ allowsRecording: false });
        return;
      }
      activePrompt.current = prompt;
      recorder.record({ forDuration: 30 });
      setRecording(true);
    } catch {
      activePrompt.current = null;
      setRecording(false);
      setError('The microphone is unavailable. Try again or continue without recording.');
      void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };

  const listen = async () => {
    if (!take || operation.current || activePrompt.current !== null) return;
    operation.current = true;
    setBusy(true);
    setError('');
    try {
      if (playback.playing) {
        player.pause();
      } else {
        await player.seekTo(0);
        if (focused.current) player.play();
      }
    } catch {
      setError('This recording could not play. Try recording again.');
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };

  return { take, recording, busy, error, playing: playback.playing, record, listen, stopPlayback: () => player.pause() };
}
