import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/therapist/BottomNav';
import { NotificationPanel } from '@/components/therapist/NotificationPanel';
import { SettingsScreen, type SettingsEntry } from '@/components/therapist/SettingsScreen';
import { SideMenu } from '@/components/therapist/SideMenu';
import { TopBar } from '@/components/therapist/TopBar';
import { useTherapist } from '@/components/therapist/TherapistProvider';
import { AddPatientModal } from '@/Therapist-modules/therapist-patients/components/AddPatientModal';
import type { TherapistTab } from '@/navigation/therapistTabs';
import type { ReactNode } from 'react';

export function TherapistShell({ active, children }: { active: TherapistTab; children: ReactNode }) {
  const { palette, isDark, settingsOpen, setSettingsOpen, notificationsOpen, setNotificationsOpen, addPatientOpen } = useTherapist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsEntry, setSettingsEntry] = useState<SettingsEntry>('settings');
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const columnWidth = Math.min(width, wide ? 520 : width);

  const openMenu = () => {
    setNotificationsOpen(false);
    setMenuOpen(true);
  };

  const openFromMenu = (entry: SettingsEntry) => {
    setSettingsEntry(entry);
    setMenuOpen(false);
    setSettingsOpen(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: wide ? palette.canvas : palette.background, alignItems: 'center' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, width: columnWidth, backgroundColor: palette.background }}>
        {settingsOpen ? (
          <SettingsScreen entry={settingsEntry} />
        ) : (
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <TopBar
              onMenu={openMenu}
              onBell={() => setNotificationsOpen(!notificationsOpen)}
              bellActive={notificationsOpen}
            />
            <View style={{ flex: 1 }}>
              {children}
              {notificationsOpen ? <NotificationPanel /> : null}
            </View>
            <BottomNav active={active} />
          </SafeAreaView>
        )}
        {menuOpen && !settingsOpen ? <SideMenu onClose={() => setMenuOpen(false)} onProfile={() => openFromMenu('profile')} onSettings={() => openFromMenu('settings')} /> : null}
        {addPatientOpen ? <AddPatientModal /> : null}
      </View>
    </View>
  );
}
