import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { PersonIcon } from '@/components/therapist/icons';

type QuickActionsProps = {
  onAssign: () => void;
};

export function QuickActions({ onAssign }: QuickActionsProps) {
  const { palette } = useTherapist();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        onPress={onAssign}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: palette.primarySoft, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <PersonIcon color={palette.primaryText} size={18} />
        <Text style={[styles.label, { color: palette.primaryText }]}>Assign Activity</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});
