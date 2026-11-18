export type ProfessionalRole = 'Therapist' | 'Teacher';
export type ProfessionalStatus = 'Active' | 'Suspended' | 'Deactivated';
export type InvitationStatus = 'Not sent' | 'Pending' | 'Failed' | 'Completed';
export type PatientAccess = 'Active' | 'Suspended' | 'Setup pending';
export type EnrollmentStatus = 'Enrolled' | 'Archived';
export type RequestStatus = 'Pending' | 'Approved' | 'Declined';

export type Professional = {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email: string;
  role: ProfessionalRole;
  /** Admin-provided identifier for Therapists. Never derive this from the local account id. */
  staffId?: string;
  /** School/database-provided identifier for Teachers. Never derive this from the local account id. */
  professionalIdentifier?: string;
  school?: string;
  gradeSections?: string[];
  professionalTitle?: string;
  specialization?: string;
  licenseNumber?: string;
  contactNumber?: string;
  /** Operational access state, separate from whether the professional belongs to the center. */
  access?: 'Active' | 'Suspended';
  membership?: 'Active' | 'Deactivated';
  status: ProfessionalStatus;
  invitation: InvitationStatus;
  joined: string;
  invitationUpdated: string;
};

export type TherapistStaffRecord = {
  staffId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  name: string;
  email: string;
  professionalTitle: string;
  specialization: string;
  licenseNumber: string;
  contactNumber: string;
};

export type TeacherSchoolRecord = {
  lookupStaffId: string;
  professionalIdentifier: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  name: string;
  email: string;
  school: string;
  gradeSections: string[];
};

export type Patient = {
  id: string;
  name: string;
  studentNumber: string;
  therapistId: string | null;
  access: PatientAccess;
  setup?: 'Pending' | 'Completed';
  enrollment: EnrollmentStatus;
  therapyStatus: 'In progress' | 'On hold';
  registered: string;
  guardian: string;
  guardianContact: string;
  school: string;
  grade?: string;
  section?: string;
  teacherId?: string;
};

export type SuspensionRequest = {
  id: string;
  patientId: string;
  therapistId: string;
  reason: string;
  submitted: string;
  status: RequestStatus;
};

export type ReleaseRequest = {
  id: string;
  patientId: string;
  therapistId: string;
  reason: 'Transferred to another school' | 'Officially withdrawn' | 'Discontinued attending classes' | 'No longer receiving services';
  explanation: string;
  attachment?: string;
  submitted: string;
  status: 'Pending' | 'More information requested' | 'Approved & reassigned' | 'Approved & archived' | 'Declined';
};

export type ActivityEntry = {
  id: string;
  title: string;
  detail: string;
  actor: string;
  date: string;
  category: 'Account' | 'Student' | 'Request' | 'Settings';
  read: boolean;
};

export type AdminNotification = {
  id: string;
  title: string;
  detail: string;
  date: string;
  read: boolean;
};

export const initialProfessionals: Professional[] = [
  { id: 'pro-1', name: 'Maria Santos', firstName: 'Maria', lastName: 'Santos', email: 'maria.santos@sample.org', role: 'Therapist', staffId: 'TH-1041', professionalTitle: 'Speech-Language Pathologist', specialization: 'Articulation and language', licenseNumber: 'SLP-48210', contactNumber: '+63 917 555 1041', status: 'Active', invitation: 'Completed', joined: '2025-08-12', invitationUpdated: '2025-08-12' },
  { id: 'pro-2', name: 'Mark Dizon', firstName: 'Mark', lastName: 'Dizon', email: 'mark.dizon@sample.org', role: 'Teacher', professionalIdentifier: 'EDU-RLC-0035', school: 'Riverside Learning Center', gradeSections: ['Grade 2 · Narra', 'Grade 3 · Sampaguita'], status: 'Active', invitation: 'Completed', joined: '2025-09-04', invitationUpdated: '2025-09-04' },
  { id: 'pro-3', name: 'Ana Cruz', firstName: 'Ana', lastName: 'Cruz', email: 'ana.cruz@sample.org', role: 'Therapist', staffId: 'TH-1088', professionalTitle: 'Speech-Language Pathologist', specialization: 'Early language development', licenseNumber: 'SLP-49302', contactNumber: '+63 917 555 1088', status: 'Active', invitation: 'Pending', joined: '2026-10-30', invitationUpdated: '2026-10-30' },
  { id: 'pro-4', name: 'John Reyes', firstName: 'John', lastName: 'Reyes', email: 'john.reyes@sample.org', role: 'Therapist', staffId: 'TH-1126', professionalTitle: 'Speech-Language Pathologist', specialization: 'Fluency', licenseNumber: 'SLP-50774', contactNumber: '+63 917 555 1126', status: 'Active', invitation: 'Completed', joined: '2025-11-18', invitationUpdated: '2025-11-18' },
  { id: 'pro-5', name: 'Leah Navarro', firstName: 'Leah', lastName: 'Navarro', email: 'leah.navarro@sample.org', role: 'Therapist', staffId: 'TH-1152', professionalTitle: 'Speech-Language Pathologist', specialization: 'Speech sound disorders', licenseNumber: 'SLP-51639', contactNumber: '+63 917 555 1152', status: 'Suspended', invitation: 'Completed', joined: '2025-12-02', invitationUpdated: '2025-12-02' },
  { id: 'pro-6', name: 'Paolo Lim', firstName: 'Paolo', lastName: 'Lim', email: 'paolo.lim@sample.org', role: 'Teacher', professionalIdentifier: 'EDU-EFA-0214', school: 'Eastfield Academy', gradeSections: ['Grade 1 · Molave', 'Grade 2 · Narra'], status: 'Active', invitation: 'Completed', joined: '2026-02-20', invitationUpdated: '2026-02-20' },
  { id: 'pro-7', name: 'Nina Flores', firstName: 'Nina', lastName: 'Flores', email: 'nina.flores@sample.org', role: 'Therapist', staffId: 'TH-1197', professionalTitle: 'Speech-Language Pathologist', specialization: 'Language and literacy', licenseNumber: 'SLP-52881', contactNumber: '+63 917 555 1197', status: 'Active', invitation: 'Completed', joined: '2026-03-08', invitationUpdated: '2026-03-08' },
];

export const therapistStaffRecords: TherapistStaffRecord[] = [
  { staffId: 'TH-1041', firstName: 'Maria', lastName: 'Santos', name: 'Maria Santos', email: 'maria.santos@sample.org', professionalTitle: 'Speech-Language Pathologist', specialization: 'Articulation and language', licenseNumber: 'SLP-48210', contactNumber: '+63 917 555 1041' },
  { staffId: 'TH-1088', firstName: 'Ana', lastName: 'Cruz', name: 'Ana Cruz', email: 'ana.cruz@sample.org', professionalTitle: 'Speech-Language Pathologist', specialization: 'Early language development', licenseNumber: 'SLP-49302', contactNumber: '+63 917 555 1088' },
  { staffId: 'TH-1126', firstName: 'John', lastName: 'Reyes', name: 'John Reyes', email: 'john.reyes@sample.org', professionalTitle: 'Speech-Language Pathologist', specialization: 'Fluency', licenseNumber: 'SLP-50774', contactNumber: '+63 917 555 1126' },
  { staffId: 'TH-1152', firstName: 'Leah', lastName: 'Navarro', name: 'Leah Navarro', email: 'leah.navarro@sample.org', professionalTitle: 'Speech-Language Pathologist', specialization: 'Speech sound disorders', licenseNumber: 'SLP-51639', contactNumber: '+63 917 555 1152' },
  { staffId: 'TH-1197', firstName: 'Nina', lastName: 'Flores', name: 'Nina Flores', email: 'nina.flores@sample.org', professionalTitle: 'Speech-Language Pathologist', specialization: 'Language and literacy', licenseNumber: 'SLP-52881', contactNumber: '+63 917 555 1197' },
  { staffId: 'TH-1234', firstName: 'Alex', middleName: 'R.', lastName: 'Rivera', name: 'Alex R. Rivera', email: 'alex.rivera@sample.org', professionalTitle: 'Speech-Language Pathologist', specialization: 'Pediatric communication', licenseNumber: 'SLP-60418', contactNumber: '+63 917 555 2034' },
];

export const teacherSchoolRecords: TeacherSchoolRecord[] = [
  { lookupStaffId: 'TCH-0035', professionalIdentifier: 'EDU-RLC-0035', firstName: 'Mark', lastName: 'Dizon', name: 'Mark Dizon', email: 'mark.dizon@sample.org', school: 'Riverside Learning Center', gradeSections: ['Grade 2 · Narra', 'Grade 3 · Sampaguita'] },
  { lookupStaffId: 'TCH-0214', professionalIdentifier: 'EDU-EFA-0214', firstName: 'Paolo', lastName: 'Lim', name: 'Paolo Lim', email: 'paolo.lim@sample.org', school: 'Eastfield Academy', gradeSections: ['Grade 1 · Molave', 'Grade 2 · Narra'] },
  { lookupStaffId: 'TR-1234', professionalIdentifier: 'EDU-RLC-0287', firstName: 'Rina', middleName: 'Mae', lastName: 'Villanueva', name: 'Rina Mae Villanueva', email: 'rina.villanueva@riverside.edu', school: 'Riverside Learning Center', gradeSections: ['Grade 1 · Molave', 'Grade 2 · Narra'] },
];

export const initialPatients: Patient[] = [
  { id: 'pt-1', name: 'Liam Reyes', studentNumber: 'SS-24108', therapistId: 'pro-1', access: 'Active', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: '2026-09-02', guardian: 'Carla Reyes', guardianContact: 'carla.reyes@example.org', school: 'Riverside Learning Center', grade: 'Grade 2', section: 'Narra', teacherId: 'pro-2' },
  { id: 'pt-2', name: 'Sophia Garcia', studentNumber: 'SS-24122', therapistId: 'pro-1', access: 'Active', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: '2026-09-11', guardian: 'Elena Garcia', guardianContact: 'elena.garcia@example.org', school: 'Riverside Learning Center', grade: 'Grade 1', section: 'Molave', teacherId: 'pro-6' },
  { id: 'pt-3', name: 'Noah Lim', studentNumber: 'SS-23891', therapistId: 'pro-1', access: 'Suspended', enrollment: 'Enrolled', therapyStatus: 'On hold', registered: '2026-07-21', guardian: 'Teresa Lim', guardianContact: 'teresa.lim@example.org', school: 'Northview School', grade: 'Grade 3', section: 'Sampaguita', teacherId: 'pro-2' },
  { id: 'pt-4', name: 'Isabel Flores', studentNumber: 'SS-24304', therapistId: 'pro-2', access: 'Active', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: '2026-10-03', guardian: 'Ramon Flores', guardianContact: 'ramon.flores@example.org', school: 'Riverside Learning Center', grade: 'Grade 2', section: 'Narra', teacherId: 'pro-6' },
  { id: 'pt-5', name: 'Ethan Tan', studentNumber: 'SS-24037', therapistId: 'pro-4', access: 'Active', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: '2026-08-14', guardian: 'Maya Tan', guardianContact: 'maya.tan@example.org', school: 'Eastfield Academy', grade: 'Grade 1', section: 'Molave', teacherId: 'pro-6' },
  { id: 'pt-6', name: 'Mia Ramos', studentNumber: 'SS-24261', therapistId: 'pro-4', access: 'Active', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: '2026-09-27', guardian: 'Luis Ramos', guardianContact: 'luis.ramos@example.org', school: 'Eastfield Academy', grade: 'Grade 2', section: 'Narra', teacherId: 'pro-2' },
  { id: 'pt-7', name: 'Lucas Bautista', studentNumber: 'SS-23779', therapistId: 'pro-4', access: 'Active', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: '2026-06-19', guardian: 'Nina Bautista', guardianContact: 'nina.bautista@example.org', school: 'Northview School', grade: 'Grade 3', section: 'Sampaguita', teacherId: 'pro-6' },
  { id: 'pt-8', name: 'Emma Torres', studentNumber: 'SS-22903', therapistId: 'pro-1', access: 'Active', enrollment: 'Archived', therapyStatus: 'On hold', registered: '2026-02-10', guardian: 'Rosa Torres', guardianContact: 'rosa.torres@example.org', school: 'Riverside Learning Center', grade: 'Grade 1', section: 'Molave', teacherId: 'pro-2' },
  { id: 'pt-9', name: 'Ava Mendoza', studentNumber: 'SS-24415', therapistId: 'pro-7', access: 'Active', setup: 'Pending', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: '2026-10-28', guardian: 'Diego Mendoza', guardianContact: 'diego.mendoza@example.org', school: 'Eastfield Academy', grade: 'Grade 2', section: 'Narra', teacherId: 'pro-6' },
  { id: 'pt-10', name: 'Caleb de la Cruz', studentNumber: 'SS-23950', therapistId: 'pro-7', access: 'Active', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: '2026-08-03', guardian: 'Ana de la Cruz', guardianContact: 'ana.delacruz@example.org', school: 'Northview School', grade: 'Grade 3', section: 'Sampaguita', teacherId: 'pro-2' },
];

export const initialRequests: SuspensionRequest[] = [
  { id: 'req-1008', patientId: 'pt-2', therapistId: 'pro-1', reason: 'Sophia’s family requested a temporary pause while they update their home internet access.', submitted: '2026-11-16', status: 'Pending' },
  { id: 'req-1004', patientId: 'pt-5', therapistId: 'pro-4', reason: 'The family asked to pause account access during an extended school absence.', submitted: '2026-11-10', status: 'Pending' },
  { id: 'req-0991', patientId: 'pt-1', therapistId: 'pro-1', reason: 'Duplicate request; the family confirmed access should remain active.', submitted: '2026-10-25', status: 'Declined' },
];

export const initialReleaseRequests: ReleaseRequest[] = [
  { id: 'rel-2501', patientId: 'pt-1', therapistId: 'pro-1', reason: 'Transferred to another school', explanation: 'The family has moved and is confirming whether they will continue enrollment at the new school. Please keep Liam assigned until the transfer is verified.', submitted: '2026-11-15', status: 'Pending' },
];

export const initialActivity: ActivityEntry[] = [
  { id: 'evt-1', title: 'Student enrolled', detail: 'Ava Mendoza · SS-24415', actor: 'Maria Santos', date: '2026-10-28T09:24:00', category: 'Student', read: true },
  { id: 'evt-2', title: 'Invitation created', detail: 'Ana Cruz · Therapist', actor: 'Center admin', date: '2026-10-30T14:10:00', category: 'Account', read: true },
  { id: 'evt-3', title: 'Student access suspended', detail: 'Noah Lim · SS-23891', actor: 'Center admin', date: '2026-11-02T11:05:00', category: 'Student', read: true },
  { id: 'evt-4', title: 'Suspension request submitted', detail: 'Sophia Garcia · SS-24122', actor: 'Maria Santos', date: '2026-11-16T08:42:00', category: 'Request', read: false },
];

export const initialNotifications: AdminNotification[] = [
  { id: 'note-3', title: 'Student release request', detail: 'Maria Santos requested release of Liam Reyes. Review the student assignment.', date: '2026-11-15T10:16:00', read: false },
  { id: 'note-1', title: 'Student access request', detail: 'Maria Santos requested suspension for Sophia Garcia.', date: '2026-11-16T08:42:00', read: false },
  { id: 'note-2', title: 'Invitation awaiting setup', detail: 'Ana Cruz has not completed account setup.', date: '2026-10-30T14:10:00', read: false },
];

export const centerProfile = {
  name: 'Riverside Speech & Learning Center',
  email: 'admin@riversidespeech.example',
  phone: '+63 2 8123 4567',
  address: '18 Orchard Lane, Quezon City, Philippines',
};
