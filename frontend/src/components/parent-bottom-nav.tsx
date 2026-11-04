import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ParentBottomNavProps {
  activeTab?: 'home' | 'tasks' | 'progress';
}

export function ParentBottomNav({ activeTab = 'home' }: ParentBottomNavProps) {
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home-outline' as const,
      activeIcon: 'home' as const,
      route: '/parent-dashboard',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: 'list-outline' as const,
      activeIcon: 'list' as const,
      route: '',
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: 'stats-chart-outline' as const,
      activeIcon: 'stats-chart' as const,
      route: '',
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
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
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
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#E7F2FA',
    borderTopWidth: 1.5,
    borderTopColor: '#CBE0EF',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 70,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  tabLabel: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 11,
    color: '#5F8BAE',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#0D68AC',
  },
});

