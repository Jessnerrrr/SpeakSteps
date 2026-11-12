import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { ActivitiesIcon, HomeIcon, ReviewsIcon, StudentsIcon } from '@/components/therapist/icons';
import { therapistTabs, type TherapistTab } from '@/navigation/therapistTabs';

const icons = {
  home: HomeIcon,
  patients: StudentsIcon,
  activities: ActivitiesIcon,
  reviews: ReviewsIcon,
};

export function BottomNav({ active }: { active: TherapistTab }) {
  const { palette } = useTherapist();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: palette.nav,
          borderTopColor: palette.line,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {therapistTabs.map((tab) => {
        const selected = tab.key === active;
        const color = selected ? palette.primary : palette.navInactive;
        const Icon = icons[tab.key];
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) router.push(tab.href as never);
            }}
            style={styles.item}
          >
            <View style={[styles.dash, { backgroundColor: selected ? palette.primary : 'transparent' }]} />
            <Icon color={color} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  dash: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
