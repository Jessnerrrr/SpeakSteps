import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { resolveAudioUrl } from '@/services/user-api';

export function AudioPlaybackButton({
  audioUrl,
  label = 'Play audio',
  style,
  buttonStyle,
  renderIcon,
  variant = 'button',
  color,
}: {
  audioUrl?: string | null;
  label?: string;
  style?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  renderIcon?: (playing: boolean) => ReactNode;
  variant?: 'button' | 'inline';
  color?: string;
}) {
  if (!audioUrl) return null;
  return <AudioPlayerButton audioUrl={audioUrl} label={label} style={style} buttonStyle={buttonStyle} renderIcon={renderIcon} variant={variant} color={color} />;
}

function AudioPlayerButton({
  audioUrl,
  label,
  style,
  buttonStyle,
  renderIcon,
  variant,
  color,
}: {
  audioUrl: string;
  label: string;
  style?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  renderIcon?: (playing: boolean) => ReactNode;
  variant: 'button' | 'inline';
  color?: string;
}) {
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
    <View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${status.playing ? 'Pause' : 'Play'} ${label}`}
        onPress={() => void togglePlayback()}
        style={[styles.button, variant === 'inline' && styles.inlineButton, buttonStyle]}
      >
        {renderIcon ? renderIcon(status.playing) : <>
          <Text style={[styles.icon, color ? { color } : null]}>{status.playing ? '❚❚' : '▶'}</Text>
          <Text style={[styles.label, color ? { color } : null]}>{status.playing ? 'Pause' : label}</Text>
        </>}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    backgroundColor: '#E8F4FB',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  inlineButton: { backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0 },
  icon: { color: '#0865AD', fontSize: 13, fontWeight: '700' },
  label: { color: '#0865AD', fontSize: 13, fontWeight: '700' },
  error: { color: '#B42318', fontSize: 12, marginTop: 4 },
});
