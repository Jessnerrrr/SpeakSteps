import { useLocalSearchParams } from 'expo-router';

import { TherapistShell } from '@/components/therapist/TherapistShell';
import { ActivityDetail } from '@/Therapist-modules/therapist-activities/components/ActivityDetail';

export default function ActivityDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <TherapistShell active="activities">
      <ActivityDetail activityId={Array.isArray(id) ? id[0] : id || ''} />
    </TherapistShell>
  );
}
