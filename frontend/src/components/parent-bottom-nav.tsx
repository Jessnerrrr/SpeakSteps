import { FontAwesome6 } from '@expo/vector-icons';
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
      icon: 'house',
      route: '/parent-dashboard',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: 'clipboard-list',
      route: '/parent-tasks',
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: 'chart-column',
      route: '/parent-progress',
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={styles.tabItem}
            activeOpacity={0.7}
            onPress={() => {
              if (!isActive && tab.route) {
                router.navigate(tab.route as any);
              }
            }}
          >
            <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
              <FontAwesome6
                name={tab.icon}
                solid
                size={21}
                color={isActive ? '#0D68AC' : '#648199'}
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#CBE0EF',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 70,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 32,
    borderRadius: 16,
  },
  activeIconWrapper: { backgroundColor: '#E7F4FF', borderColor: '#BBDDF7', borderWidth: 1 },
  tabLabel: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 11,
    color: '#56758E',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#0D68AC',
  },
});

