import { CENTER_NAME } from '@/data/center-name';
export type ProfessionalRole = 'Therapist' | 'Teacher';
export type ProfessionalStatus = 'Active' | 'Suspended' | 'Deactivated';
export type InvitationStatus = 'Not sent' | 'Pending' | 'Expired' | 'Completed';
export type PatientAccess = 'Active' | 'Suspended' | 'Setup pending';
export type EnrollmentStatus = 'Enrolled' | 'Archived';
export type CareEpisodeClosureCategory = 'Clinical discharge' | 'Authorized withdrawal' | 'External transfer' | 'Other authorized administrative closure';
export type ArchiveRecord = { archivedAt: string; reason: string; archivedBy?: string };
export type CareEpisode = {
  id: string;
  patientId: string;
  startedAt?: string;
  effectiveCloseDate?: string;
  closureCategory?: CareEpisodeClosureCategory;
  closureReason?: string;
  authorizedBy?: string;
  authorizationReference?: string;
  therapistIdAtClose?: string | null;
} & ({ status: 'Active' } | { status: 'Closed'; archive: ArchiveRecord; restoredAt?: string });
export type AssignmentHistory = {
  id: string;
  patientId: string;
  professionalId: string;
  role: ProfessionalRole;
  endedAt?: string;
  endReason?: string;
};
export type RequestStatus = 'Pending' | 'More information requested' | 'Approved' | 'Declined';

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
  lifecycleUpdatedAt?: string;
  /** Effective local date of the latest access or membership transition. */
  lifecycleEffectiveDate?: string;
  archive?: ArchiveRecord;
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
  membership?: 'Active' | 'Deactivated';
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
  lifecycleUpdatedAt?: string;
  archive?: ArchiveRecord;
  /** Effective local date of the latest access, membership, or enrollment transition. */
  lifecycleEffectiveDate?: string;
};

export type SuspensionRequest = {
  id: string;
  patientId: string;
  therapistId: string;
  reason: string;
  submitted: string;
  status: RequestStatus;
  events?: RequestEvent[];
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionReason?: string;
  /** Authorized file records from the originating request workflow. */
  attachments?: RequestAttachment[];
};

export type RequestAttachment = {
  id: string;
  fileName: string;
  uri: string;
  mimeType?: string;
  sizeBytes?: number;
};

export type ReleaseRequest = {
  id: string;
  patientId: string;
  therapistId: string;
  origin?: 'Guardian' | 'Teacher' | 'Therapist';
  followupRecipient?: 'Guardian' | 'Teacher' | 'Therapist';
  requestType?: 'Transfer' | 'Withdrawal' | 'Enrollment release' | 'Therapist assignment release';
  workflowStage?: 'Awaiting Guardian Confirmation' | 'Awaiting Teacher Verification' | 'Ready for Admin Review' | 'Awaiting Supporting Evidence';
  guardianConfirmation?: 'Confirmed' | 'Disputed' | 'Pending' | 'Not required';
  teacherVerification?: 'Verified' | 'Unable to Verify' | 'More Information Needed' | 'Pending' | 'Not required';
  events?: RequestEvent[];
  reminderCount?: number;
  lastReminderAt?: string;
  reason: 'Transferred to another school' | 'Officially withdrawn' | 'Discontinued attending classes' | 'No longer receiving services';
  explanation: string;
  attachment?: string;
  submitted: string;
  status: 'Pending' | 'More information requested' | 'Approved & reassigned' | 'Approved & archived' | 'Declined';
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionReason?: string;
  effectiveCloseDate?: string;
  authorizationReference?: string;
  /** Original files from the originating request workflow. */
  attachments?: RequestAttachment[];
};

export type RequestEvent = {
  id: string;
  title: string;
  detail: string;
  actor: string;
  date: string;
  /** Files submitted with this specific verification or follow-up event. */
  attachments?: RequestAttachment[];
};

export type ActivityEntry = {
  id: string;
  title: string;
  detail: string;
  actor: string;
  date: string;
  category: 'Account' | 'Student' | 'Request' | 'Settings';
  subject?: { name: string; identifier: string; type: ProfessionalRole | 'Student' };
  result?: string;
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
  { id: 'pro-3', name: 'Ana Cruz', firstName: 'Ana', lastName: 'Cruz', email: 'ana.cruz@sample.org', role: 'Therapist', staffId: 'TH-1088', professionalTitle: 'Speech-Language Pathologist', specialization: 'Early language development', licenseNumber: 'SLP-49302', contactNumber: '+63 917 555 1088', status: 'Active', invitation: 'Expired', joined: '2026-10-30', invitationUpdated: '2026-10-30' },
  { id: 'pro-4', name: 'John Reyes', firstName: 'John', lastName: 'Reyes', email: 'john.reyes@sample.org', role: 'Therapist', staffId: 'TH-1126', professionalTitle: 'Speech-Language Pathologist', specialization: 'Fluency', licenseNumber: 'SLP-50774', contactNumber: '+63 917 555 1126', status: 'Active', invitation: 'Completed', joined: '2025-11-18', invitationUpdated: '2025-11-18' },
  { id: 'pro-5', name: 'Leah Navarro', firstName: 'Leah', lastName: 'Navarro', email: 'leah.navarro@sample.org', role: 'Therapist', staffId: 'TH-1152', professionalTitle: 'Speech-Language Pathologist', specialization: 'Speech sound disorders', licenseNumber: 'SLP-51639', contactNumber: '+63 917 555 1152', status: 'Suspended', archive: { archivedAt: '2026-11-06', reason: 'Sign-in suspended pending an administrative account review (demo record).' }, invitation: 'Completed', joined: '2025-12-02', invitationUpdated: '2025-12-02' },
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
  { id: 'pt-3', name: 'Noah Lim', studentNumber: 'SS-23891', therapistId: 'pro-1', access: 'Suspended', archive: { archivedAt: '2026-11-02T11:05:00', archivedBy: 'Center Admin', reason: 'Student and Guardian sign-in suspended by Center Admin. The original reason was not recorded.' }, enrollment: 'Enrolled', therapyStatus: 'On hold', registered: '2026-07-21', guardian: 'Teresa Lim', guardianContact: 'teresa.lim@example.org', school: 'Northview School', grade: 'Grade 3', section: 'Sampaguita', teacherId: 'pro-2' },
  { id: 'pt-4', name: 'Isabel Flores', studentNumber: 'SS-24304', therapistId: 'pro-2', access: 'Active', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: '2026-10-03', guardian: 'Ramon Flores', guardianContact: 'ramon.flores@example.org', school: 'Riverside Learning Center', grade: 'Grade 2', section: 'Narra', teacherId: 'pro-6' },
  { id: 'pt-5', name: 'Ethan Tan', studentNumber: 'SS-24037', therapistId: 'pro-4', access: 'Active', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: '2026-08-14', guardian: 'Maya Tan', guardianContact: 'maya.tan@example.org', school: 'Eastfield Academy', grade: 'Grade 1', section: 'Molave', teacherId: 'pro-6' },
  { id: 'pt-6', name: 'Mia Ramos', studentNumber: 'SS-24261', therapistId: 'pro-4', access: 'Active', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: '2026-09-27', guardian: 'Luis Ramos', guardianContact: 'luis.ramos@example.org', school: 'Eastfield Academy', grade: 'Grade 2', section: 'Narra', teacherId: 'pro-2' },
  { id: 'pt-7', name: 'Lucas Bautista', studentNumber: 'SS-23779', therapistId: 'pro-4', access: 'Active', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: '2026-06-19', guardian: 'Nina Bautista', guardianContact: 'nina.bautista@example.org', school: 'Northview School', grade: 'Grade 3', section: 'Sampaguita', teacherId: 'pro-6' },
  { id: 'pt-8', name: 'Emma Torres', studentNumber: 'SS-22903', therapistId: 'pro-1', access: 'Active', enrollment: 'Archived', therapyStatus: 'On hold', registered: '2026-02-10', guardian: 'Rosa Torres', guardianContact: 'rosa.torres@example.org', school: 'Riverside Learning Center', grade: 'Grade 1', section: 'Molave', teacherId: 'pro-2' },
  { id: 'pt-9', name: 'Ava Mendoza', studentNumber: 'SS-24415', therapistId: 'pro-7', access: 'Active', setup: 'Pending', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: '2026-10-28', guardian: 'Diego Mendoza', guardianContact: 'diego.mendoza@example.org', school: 'Eastfield Academy', grade: 'Grade 2', section: 'Narra', teacherId: 'pro-6' },
  { id: 'pt-10', name: 'Caleb de la Cruz', studentNumber: 'SS-23950', therapistId: null, access: 'Active', enrollment: 'Enrolled', therapyStatus: 'In progress', registered: '2026-08-03', guardian: 'Ana de la Cruz', guardianContact: 'ana.delacruz@example.org', school: 'Northview School', grade: 'Grade 3', section: 'Sampaguita' },
];

export const initialCareEpisodes: CareEpisode[] = [
  {
    id: 'legacy-pt-8',
    patientId: 'pt-8',
    status: 'Closed',
    archive: { archivedAt: '2026-11-09', reason: 'The demo record has no documented closure category or clinical discharge.' },
    therapistIdAtClose: 'pro-1',
  },
];

export const initialRequests: SuspensionRequest[] = [
  { id: 'req-1008', patientId: 'pt-2', therapistId: 'pro-1', reason: 'Sophia’s family requested a temporary pause while they update their home internet access.', submitted: '2026-11-16', status: 'Pending', events: [{ id: 'req-1008-created', title: 'Request submitted', detail: 'Original explanation received from the Therapist.', actor: 'Maria Santos', date: '2026-11-16T08:42:00' }] },
  { id: 'req-1004', patientId: 'pt-5', therapistId: 'pro-4', reason: 'The family asked to pause account access during an extended school absence.', submitted: '2026-11-10', status: 'Pending', events: [{ id: 'req-1004-created', title: 'Request submitted', detail: 'Original explanation received from the Therapist.', actor: 'John Reyes', date: '2026-11-10T09:15:00' }] },
  { id: 'req-0991', patientId: 'pt-1', therapistId: 'pro-1', reason: 'Duplicate request; the family confirmed access should remain active.', submitted: '2026-10-25', status: 'Declined', events: [{ id: 'req-0991-created', title: 'Request submitted', detail: 'Original explanation received from the Therapist.', actor: 'Maria Santos', date: '2026-10-25T09:30:00' }] },
];

export const initialReleaseRequests: ReleaseRequest[] = [
  { id: 'rel-2501', patientId: 'pt-1', therapistId: 'pro-1', origin: 'Therapist', requestType: 'Therapist assignment release', workflowStage: 'Ready for Admin Review', guardianConfirmation: 'Not required', teacherVerification: 'Not required', reason: 'No longer receiving services', explanation: 'The family has asked to end services with the assigned Therapist. Please review the assignment before making a change.', submitted: '2026-11-15', status: 'Pending', reminderCount: 0, events: [{ id: 'rel-2501-created', title: 'Request submitted', detail: 'Original explanation received from the Therapist.', actor: 'Maria Santos', date: '2026-11-15T10:16:00' }] },
  { id: 'rel-2492', patientId: 'pt-3', therapistId: 'pro-1', origin: 'Guardian', followupRecipient: 'Teacher', requestType: 'Transfer', workflowStage: 'Awaiting Teacher Verification', guardianConfirmation: 'Confirmed', teacherVerification: 'Pending', reason: 'Transferred to another school', explanation: 'We moved to Northview School this month. Please confirm the school record before changing enrollment.', submitted: '2026-11-05', status: 'Pending', reminderCount: 2, lastReminderAt: '2026-11-12T09:00:00', events: [{ id: 'rel-2492-created', title: 'Guardian request submitted', detail: 'Guardian selected the transfer reason and submitted the original explanation.', actor: 'Teresa Lim', date: '2026-11-05T09:00:00' }, { id: 'rel-2492-day3', title: 'Day 3 reminder recorded', detail: 'Teacher verification reminder recorded in mock state. No message was sent.', actor: 'System simulation', date: '2026-11-08T09:00:00' }, { id: 'rel-2492-day7', title: 'Day 7 reminder recorded', detail: 'Second Teacher follow-up reminder recorded in mock state. No message was sent.', actor: 'System simulation', date: '2026-11-12T09:00:00' }, { id: 'rel-2492-day14', title: 'Day 14 admin follow-up flagged', detail: 'No Teacher verification is recorded. The request remains unresolved and Student enrollment is unchanged.', actor: 'System simulation', date: '2026-11-19T09:00:00' }] },
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
  { id: 'note-4', title: 'Student request overdue', detail: 'Teacher verification is overdue for Noah Lim. Review request rel-2492.', date: '2026-11-19T09:00:00', read: false },
  { id: 'note-2', title: 'Invitation awaiting setup', detail: 'Ana Cruz has not completed account setup.', date: '2026-10-30T14:10:00', read: false },
];

export const centerProfile = {
  name: CENTER_NAME,
  email: 'admin@headwayschool.example',
  phone: '+63 2 8123 4567',
  address: '18 Orchard Lane, Quezon City, Philippines',
};

/** Demonstration-only Center Admin details; no administrator identity provider is connected. */
export const initialAdminProfile = {
  firstName: 'Center',
  lastName: 'Admin',
  contactNumber: '',
};
