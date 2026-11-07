import { useLocalSearchParams } from 'expo-router';

import { TherapistShell } from '@/components/therapist/TherapistShell';
import { PatientRecordScreen } from '@/Therapist-modules/therapist-patients/components/PatientRecordScreen';

export default function PatientDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <TherapistShell active="patients">
      <PatientRecordScreen patientId={Array.isArray(id) ? id[0] : id || ''} />
    </TherapistShell>
  );
}
