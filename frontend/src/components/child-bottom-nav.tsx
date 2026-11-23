import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ChildBottomNavProps {
  activeTab?: 'home' | 'play' | 'stars' | 'buddy';
}

export function ChildBottomNav({ activeTab = 'home' }: ChildBottomNavProps) {
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home-outline' as const,
      activeIcon: 'home' as const,
      route: '/patient-dashboard',
    },
    {
      id: 'play',
      label: 'Play',
      icon: 'game-controller-outline' as const,
      activeIcon: 'game-controller' as const,
      route: '/sentences',
    },
    {
      id: 'stars',
      label: 'Stars',
      icon: 'star-outline' as const,
      activeIcon: 'star' as const,
      route: '/patient-stars',
    },
    {
      id: 'buddy',
      label: 'Buddy',
      icon: 'paw-outline' as const,
      activeIcon: 'paw' as const,
      route: '/pick-buddy',
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            activeOpacity={0.7}
            onPress={() => {
              if (!isActive && tab.route) {
                router.navigate(tab.route as any);
              }
            }}
          >
            <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={24}
                color={isActive ? '#0D68AC' : '#5F8BAE'}
              />
            </View>
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#CCE0F0',
    paddingVertical: 10,
    paddingBottom: 14,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  iconWrapper: {
    width: 42,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrapper: { backgroundColor: '#E7F4FF' },
  tabLabel: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 12,
    color: '#0D68AC',
    marginTop: 2,
  },
  activeTabLabel: {
    color: '#0D68AC',
  },
});
