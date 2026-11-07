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
      icon: 'phone-portrait-outline' as const, 
      activeIcon: 'phone-portrait' as const,
      route: '/practice', // Fixed this route to point to practice.tsx!
    },
    {
      id: 'stars',
      label: 'Stars',
      icon: 'star-half-outline' as const, 
      activeIcon: 'star' as const,
      route: '/patient-stars',
    },
    {
      id: 'buddy',
      label: 'Buddy',
      icon: 'happy-outline' as const, 
      activeIcon: 'happy' as const,
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
            activeOpacity={0.7}
            onPress={() => {
              if (!isActive && tab.route) {
                router.push(tab.route as any);
              }
            }}
          >
            <View style={styles.iconWrapper}>
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
    width: 32,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
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