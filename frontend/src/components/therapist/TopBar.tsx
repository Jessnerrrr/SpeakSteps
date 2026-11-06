import { Pressable, StyleSheet, View } from 'react-native';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { BellIcon, MenuIcon } from '@/components/therapist/icons';

type TopBarProps = {
  onMenu: () => void;
  onBell: () => void;
  bellActive: boolean;
};

export function TopBar({ onMenu, onBell, bellActive }: TopBarProps) {
  const { palette, unreadCount } = useTherapist();

  return (
    <View style={styles.bar}>
      <Pressable accessibilityLabel="Open menu" hitSlop={8} onPress={onMenu} style={styles.hit}>
        <MenuIcon color={palette.text} />
      </Pressable>
      <Pressable accessibilityLabel="Notifications" hitSlop={8} onPress={onBell} style={styles.hit}>
        <BellIcon color={bellActive ? palette.primary : palette.text} alert={unreadCount > 0} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hit: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
