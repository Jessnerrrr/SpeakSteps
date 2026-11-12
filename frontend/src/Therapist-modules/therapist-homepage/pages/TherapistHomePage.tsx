import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { TherapistShell } from '@/components/therapist/TherapistShell';
import { useTherapist } from '@/components/therapist/TherapistProvider';
import { QuickActions } from '@/Therapist-modules/therapist-homepage/components/QuickActions';
import { RecentSubmissions } from '@/Therapist-modules/therapist-homepage/components/RecentSubmissions';
import { StatGrid } from '@/Therapist-modules/therapist-homepage/components/StatGrid';
import {
  formatHomeDate,
  greetingName,
  timeGreeting,
  type Submission,
} from '@/Therapist-modules/therapist-homepage/data/sampleData';
import { homeStyles } from '@/Therapist-modules/therapist-homepage/styles/homepage.styles';

export default function TherapistHomePage() {
  const { palette, profile, notificationsOpen, setAddPatientOpen } = useTherapist();
  const openReviews = (_submission?: Submission) => {
    router.push('/therapist/reviews' as never);
  };

  return (
    <TherapistShell active="home">
      <ScrollView
        scrollEnabled={!notificationsOpen}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={homeStyles.content}
      >
        <Text style={[homeStyles.date, { color: palette.faint }]}>{formatHomeDate(new Date())}</Text>
        <Text style={[homeStyles.greeting, { color: palette.primary }]}>
          {timeGreeting()}, {greetingName(profile.fullName)}
        </Text>
        <Text style={[homeStyles.subtitle, { color: palette.muted }]}>Here&apos;s what needs your attention today.</Text>
        <View style={homeStyles.block}>
          <QuickActions
            onAssign={() => router.push('/therapist/activities/assign?id=ready-set-r' as never)}
            onAddPatient={() => setAddPatientOpen(true)}
          />
        </View>
        <View style={homeStyles.block}>
          <StatGrid />
        </View>
        <RecentSubmissions onViewAll={openReviews} onOpen={openReviews} />
      </ScrollView>
    </TherapistShell>
  );
}
