import { FontAwesome6 } from '@expo/vector-icons';
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
      icon: 'house',
      route: '/patient-dashboard',
    },
    {
      id: 'play',
      label: 'Play',
      icon: 'gamepad',
      route: '/sentences',
    },
    {
      id: 'stars',
      label: 'Stars',
      icon: 'star',
      route: '/patient-stars',
    },
    {
      id: 'buddy',
      label: 'Buddy',
      icon: 'paw',
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
              <FontAwesome6
                name={tab.icon}
                regular={tab.id === 'stars'}
                solid={tab.id !== 'stars'}
                size={21}
                color={isActive ? '#0D68AC' : '#648199'}
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  iconWrapper: {
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrapper: { backgroundColor: '#E7F4FF', borderColor: '#BBDDF7', borderWidth: 1 },
  tabLabel: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 12,
    color: '#56758E',
    marginTop: 2,
  },
  activeTabLabel: {
    color: '#0D68AC',
  },
});
