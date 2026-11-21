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
        const color = selected ? '#0284C7' : '#63778A';
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
            {selected && <View style={styles.topIndicator} />}
            <View style={styles.iconContainer}>
              <Icon color={color} size={24} />
            </View>
            <Text style={[styles.label, { color, fontWeight: selected ? '700' : '600' }]}>{tab.label}</Text>
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
    backgroundColor: '#FFFFFF',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    position: 'relative',
    gap: 4,
  },
  topIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#0284C7',
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
  },
});
