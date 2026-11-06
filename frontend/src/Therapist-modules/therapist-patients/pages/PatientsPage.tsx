import { TherapistShell } from '@/components/therapist/TherapistShell';
import { PatientDirectory } from '@/Therapist-modules/therapist-patients/components/PatientDirectory';

export default function PatientsPage() {
  return (
    <TherapistShell active="patients">
      <PatientDirectory />
    </TherapistShell>
  );
}
