import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { NewPatientInput } from '@/Therapist-modules/therapist-patients/data/samplePatients';

export type AccountRole = 'parent' | 'therapist' | 'teacher' | 'admin';

export type FamilyUser = {
  id: string;
  fullName: string;
  email: string;
  childName: string;
  childAge: number;
  startingLevel: string;
  status: 'pending' | 'verified' | 'rejected';
  role: AccountRole;
};

type ApiResponse<T, P = T> = {
  success: boolean;
  error?: string;
  code?: string;
  challengeToken?: string;
  message?: string;
  profile?: T;
  user?: T;
  patient?: P;
  patients?: T[];
  patientCode?: string;
  token?: string;
  setupRequired?: boolean;
  expiresIn?: number;
  expiresAt?: number;
  activities?: T[];
  words?: T[];
  assignments?: T[];
  unlockedLevels?: string[];
  submissions?: T[];
  submission?: T;
  reviews?: T[];
  review?: T;
  feedback?: T[];
  progress?: T;
  practiceItems?: T[];
  results?: T[];
  result?: T;
  notes?: T[];
  note?: T;
  accomplishments?: T[];
  notifications?: T[];
  users?: T[];
  sessions?: T[];
  auditLogs?: T[];
  word?: T;
  activity?: T;
  assignment?: T;
  accomplishment?: T;
  temporaryPassword?: string;
  invitationToken?: string;
  resetCode?: string;
  secret?: string;
  otpauthUrl?: string;
};

export type ApiActivityWord = {
  id: string;
  text: string;
  sound: string;
  position: 'Initial' | 'Medial' | 'Final';
  phrase: string;
  modelAudioUrl?: string;
};

export type ApiActivity = {
  id: string;
  title: string;
  sound: string;
  level: string;
  positions: string[];
  language: string;
  instructions: string;
  guide: string;
  status: 'Unassigned' | 'Assigned' | 'Completed';
  words: ApiActivityWord[];
  customLines: string[];
  visualName: string;
  studentName?: string;
  dueDate?: string;
};

export type ApiWordBankEntry = {
  id: string;
  text: string;
  sound: string;
  position: 'Initial' | 'Medial' | 'Final';
  language: string;
  isStandard: boolean;
  modelAudioUrl?: string;
};

export type ApiAssignment = {
  id: string;
  activityId: string;
  patientId: string;
  patientCode: string;
  studentName: string;
  status: 'Assigned' | 'Completed';
  assignedAt: string;
  dueDate: string | null;
  completedAt: string | null;
  activity: ApiActivity;
};

export type ApiSubmission = {
  id: string;
  patientId: string;
  patientCode: string;
  student: string;
  initial: string;
  activity: string;
  sound: string;
  level: string;
  audioRecordingUrl: string;
  waveformSample: number[];
  durationSeconds: number | null;
  status: 'Pending' | 'Reviewed';
  submittedAt: string;
  review: {
    observations: string;
    parentFeedback: string;
    homePractice: string;
    averageScore: number | null;
  } | null;
  teacherReview: {
    rating: 'Correct' | 'Approximate' | 'Incorrect';
    notes: string;
    reviewedAt: string;
  } | null;
};

export type ApiReviewTarget = {
  id: string;
  text: string;
  position: 'Initial' | 'Medial' | 'Final';
  score: number | null;
  feedback: string;
  remarks: string;
};

export type ApiReview = {
  id: string;
  submissionId: string;
  assignmentId?: string;
  student: string;
  initial: string;
  activity: string;
  sound: string;
  level: string;
  language: string;
  status: 'Pending' | 'Reviewed';
  observations: string;
  parentFeedback: string;
  homePractice: string;
  targets: ApiReviewTarget[];
  audioRecordingUrl: string;
  submittedAt: string;
};

export type ApiSoapNote = {
  id: string;
  number: number;
  date: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

export type ApiAccomplishment = {
  id: string;
  title: string;
  achievedDate: string;
  targetAccuracy: string;
  clinicianNotes: string;
  quote: string;
  audioSampleUrl: string;
  accentColor: string;
  waveform: number[];
};

export type FamilyRegistration = {
  fullName: string;
  email: string;
  contactNo: string;
  password: string;
  childName: string;
  childAge: string;
  startingLevel: string;
  studentId: string;
  profileImageData?: string;
  verificationImageData: string;
};

export type RegistrationResult = {
  user: FamilyUser;
  message: string;
  patientCode: string;
};

export type PatientSearchResult = {
  id: string;
  patientCode: string;
  createdAt: string;
  primaryTherapistId: string;
  assignedTeacherId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  age?: string;
  guardianName?: string;
  relationship?: string;
  guardianEmail?: string;
  contactNumber?: string;
  diagnosis?: string;
  languageProfile?: string;
  targetSound?: string;
  hierarchyLevel?: string;
  phonemePositions?: string[];
  secondaryTargets?: string;
  dominantErrorPattern?: string;
  dominantErrorOther?: string;
  errorPatternTaxonomy?: string;
  clinicalNotation?: string;
};

export type AdminUser = {
  id: string;
  profileId?: string;
  name: string;
  email: string;
  role: AccountRole;
  status: FamilyUser['status'];
  createdAt: string;
  childName: string;
  childAge: number | null;
  studentId: string;
  contact: string;
  archivedAt?: string | null;
  archiveReason?: string;
};

export type AdminUserInvitation = {
  user: AdminUser;
  temporaryPassword: string;
  invitationToken: string;
  patient?: { id: string; patientCode: string; firstName: string; lastName: string };
};

export type ActiveSession = {
  sessionId: string;
  deviceLabel: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
  current: boolean;
};

export type AuditLogEntry = {
  id: string;
  actorId: string;
  actorRole: string;
  actorName: string;
  action: string;
  category: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
};

export type AccountProfile = {
  id: string;
  fullName: string;
  email: string;
  contact: string;
  role: AccountRole;
  totpEnabled?: boolean;
};

export type TherapistProfileData = AccountProfile & {
  title: string;
  license: string;
  clinic: string;
  specializations: string[];
};

export type AuthSession = {
  user: FamilyUser;
  token: string;
  expiresAt: number;
};

const TOKEN_STORAGE_KEY = 'speaksteps.authToken';
let webSessionToken: string | null = null;

function getExpoHost(): string | undefined {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return undefined;

  try {
    const url = new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`);
    return url.hostname;
  } catch {
    return undefined;
  }
}

function getApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const host = getExpoHost() || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  let baseUrl = configuredUrl || `http://${host}:5000/api`;

  if (configuredUrl && Platform.OS !== 'web') {
    try {
      const url = new URL(configuredUrl);
      if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && getExpoHost()) {
        url.hostname = host;
        baseUrl = url.toString();
      }
    } catch {
      return configuredUrl.replace(/\/+$/, '');
    }
  }

  return baseUrl.replace(/\/+$/, '');
}

const apiBaseUrl = getApiBaseUrl();

function isPrivateHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || host === '::1' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) return true;

  const octets = host.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }
  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 169 && octets[1] === 254)
  );
}

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly challengeToken?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class TotpRequiredError extends Error {
  constructor() {
    super('Authenticator verification is required.');
    this.name = 'TotpRequiredError';
  }
}

export class AccountSetupRequiredError extends Error {
  constructor() {
    super('Complete authenticator setup to activate this invited account.');
    this.name = 'AccountSetupRequiredError';
  }
}

let pendingTotpChallenge: string | null = null;
let pendingAccountSetup: { email: string; password: string; role: AccountRole } | null = null;

export function getPendingAccountSetup() {
  return pendingAccountSetup;
}

async function getSessionToken(): Promise<string | null> {
  if (Platform.OS === 'web') return webSessionToken;
  return SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
}

async function storeSessionToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    webSessionToken = token;
    return;
  }
  await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
}

export async function clearSession(): Promise<void> {
  if (Platform.OS === 'web') {
    webSessionToken = null;
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
}

async function request<T, P = T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; authenticated?: boolean } = {},
): Promise<ApiResponse<T, P>> {
  let url: URL;
  try {
    url = new URL(`${apiBaseUrl}${path}`);
  } catch {
    throw new Error('The backend URL is invalid. Check EXPO_PUBLIC_API_URL.');
  }
  if (url.protocol !== 'https:' && !(__DEV__ && isPrivateHost(url.hostname))) {
    throw new Error('Use HTTPS for the backend URL, or a private local-network URL during development.');
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.authenticated !== false) {
    const token = await getSessionToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: options.method || 'GET',
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
  } catch {
    throw new Error('Could not reach the backend. Check that it is running and EXPO_PUBLIC_API_URL uses your computer’s local IP for Expo Go.');
  }

  let result: ApiResponse<T, P>;
  try {
    result = await response.json() as ApiResponse<T, P>;
  } catch {
    throw new Error('The backend returned an invalid response.');
  }
  if (!response.ok || !result.success) {
    throw new ApiError(result.error || `Request failed (${response.status}).`, response.status, result.code, result.challengeToken);
  }
  return result;
}

function getResponseUser<T>(response: ApiResponse<T>): T {
  if (!response.user) throw new Error('The backend response did not include an account.');
  return response.user;
}

function getResponsePatientCode<T>(response: ApiResponse<T>): string {
  if (!response.patientCode || !/^\d{9}$/.test(response.patientCode)) {
    throw new Error('The backend response did not include a valid patient ID.');
  }
  return response.patientCode;
}

export async function registerFamilyAccount(input: FamilyRegistration): Promise<RegistrationResult> {
  const result = await request<FamilyUser>('/users/register', {
    method: 'POST',
    body: input,
    authenticated: false,
  });
  return {
    user: getResponseUser(result),
    message: result.message || 'Account created successfully.',
    patientCode: getResponsePatientCode(result),
  };
}

export async function searchPatients(query: string): Promise<PatientSearchResult[]> {
  const result = await request<PatientSearchResult>(
    `/patients/search?q=${encodeURIComponent(query.trim())}`,
  );
  if (!Array.isArray(result.patients)) {
    throw new Error('The backend response did not include patient search results.');
  }
  return result.patients;
}

export async function createTherapistPatient(input: NewPatientInput): Promise<PatientSearchResult> {
  const result = await request<PatientSearchResult>('/patients', {
    method: 'POST',
    body: input,
  });
  if (!result.patient || !/^\d{9}$/.test(result.patient.patientCode)) {
    throw new Error('The backend response did not include a valid patient ID.');
  }
  return result.patient;
}

export async function loginAccount(
  email: string,
  password: string,
  role: AccountRole,
): Promise<AuthSession> {
  await clearSession();
  const loginPath = role === 'parent' ? '/users/login' : role === 'admin' ? '/admin/login' : `/${role}s/login`;
  let result: ApiResponse<FamilyUser>;
  try {
    result = await request<FamilyUser>(loginPath, {
      method: 'POST',
      body: { email, password, deviceLabel: `${Platform.OS} device` },
      authenticated: false,
    });
  } catch (error) {
    if (error instanceof ApiError && error.code === 'TOTP_REQUIRED' && error.challengeToken) {
      pendingTotpChallenge = error.challengeToken;
      throw new TotpRequiredError();
    }
    throw error;
  }
  if (result.setupRequired && result.user?.role === role) {
    pendingAccountSetup = { email, password, role };
    throw new AccountSetupRequiredError();
  }
  if (
    !result.token ||
    typeof result.expiresIn !== 'number' ||
    !Number.isInteger(result.expiresIn) ||
    !result.user ||
    result.user.role !== role
  ) {
    throw new Error('The backend response did not include a valid sign-in session.');
  }
  await storeSessionToken(result.token);
  return {
    user: result.user,
    token: result.token,
    expiresAt: Date.now() + result.expiresIn * 1000,
  };
}

export async function verifyTotpLogin(code: string): Promise<AuthSession> {
  if (!pendingTotpChallenge) throw new Error('No authenticator sign-in challenge is active.');
  const result = await request<FamilyUser>('/auth/totp/verify', {
    method: 'POST',
    body: { purpose: 'login', code, challengeToken: pendingTotpChallenge, deviceLabel: `${Platform.OS} device` },
    authenticated: false,
  });
  if (!result.token || typeof result.expiresIn !== 'number' || !result.user) {
    throw new Error('The backend response did not include a valid sign-in session.');
  }
  pendingTotpChallenge = null;
  await storeSessionToken(result.token);
  return { user: result.user, token: result.token, expiresAt: Date.now() + result.expiresIn * 1000 };
}

export async function requestPasswordReset(email: string): Promise<{ resetCode?: string }> {
  const result = await request<never>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    authenticated: false,
  });
  return { resetCode: result.resetCode };
}

export async function resetPassword(email: string, token: string, newPassword: string): Promise<void> {
  await request('/auth/reset-password', {
    method: 'POST',
    body: { email, token, newPassword },
    authenticated: false,
  });
}

export async function setupTotp(email: string, password: string): Promise<{ secret: string; otpauthUrl: string }> {
  const result = await request<never>('/auth/totp/setup', {
    method: 'POST',
    body: { email, password },
    authenticated: false,
  });
  if (!result.secret || !result.otpauthUrl) throw new Error('The backend response did not include the authenticator setup details.');
  return { secret: result.secret, otpauthUrl: result.otpauthUrl };
}

export async function verifyTotpSetup(email: string, password: string, code: string): Promise<AuthSession> {
  const result = await request<FamilyUser>('/auth/totp/verify', {
    method: 'POST',
    body: { purpose: 'setup', email, password, code, deviceLabel: `${Platform.OS} device` },
    authenticated: false,
  });
  if (!result.token || typeof result.expiresIn !== 'number' || !result.user) {
    throw new Error('The backend response did not include a valid sign-in session.');
  }
  pendingAccountSetup = null;
  await storeSessionToken(result.token);
  return { user: result.user, token: result.token, expiresAt: Date.now() + result.expiresIn * 1000 };
}

export async function getActiveSessions(): Promise<ActiveSession[]> {
  const result = await request<ActiveSession>('/auth/sessions');
  return requireArray(result.sessions, 'active sessions');
}

export async function revokeSession(sessionId: string): Promise<void> {
  await request(`/auth/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
}

function requireArray<T>(value: T[] | undefined, label: string): T[] {
  if (!Array.isArray(value)) throw new Error(`The backend response did not include ${label}.`);
  return value;
}

export async function getPatients(): Promise<PatientSearchResult[]> {
  const result = await request<PatientSearchResult>('/patients');
  return requireArray(result.patients, 'patient records');
}

export async function getMyPatients(): Promise<PatientSearchResult[]> {
  const result = await request<PatientSearchResult>('/patients/me');
  return requireArray(result.patients, 'patient records');
}

export async function updateMyChildProfile(input: { childName: string; childAge: number }): Promise<PatientSearchResult> {
  const result = await request<PatientSearchResult>('/patients/me/profile', {
    method: 'PATCH',
    body: input,
  });
  if (!result.patient) throw new Error('The backend response did not include the updated patient profile.');
  return result.patient;
}

export async function getAccountProfile(): Promise<AccountProfile> {
  const result = await request<AccountProfile>('/account/profile');
  if (!result.profile) throw new Error('The backend response did not include the account profile.');
  return result.profile;
}

export async function updateAccountProfile(input: { fullName: string; contact: string }): Promise<AccountProfile> {
  const result = await request<AccountProfile>('/account/profile', { method: 'PATCH', body: input });
  if (!result.profile) throw new Error('The backend response did not include the updated account profile.');
  return result.profile;
}

export async function getTherapistProfile(): Promise<TherapistProfileData> {
  const result = await request<TherapistProfileData>('/therapist/profile');
  if (!result.profile) throw new Error('The backend response did not include the therapist profile.');
  return result.profile;
}

export async function updateTherapistProfile(
  input: Pick<TherapistProfileData, 'fullName' | 'contact' | 'title' | 'license' | 'clinic'> & {
    specializations?: string[];
  },
): Promise<TherapistProfileData> {
  const result = await request<TherapistProfileData>('/therapist/profile', { method: 'PATCH', body: input });
  if (!result.profile) throw new Error('The backend response did not include the updated therapist profile.');
  return result.profile;
}

export async function changeAccountPassword(input: { currentPassword: string; newPassword: string }): Promise<void> {
  await request('/account/password', { method: 'PATCH', body: input });
}

export async function getActivities(): Promise<ApiActivity[]> {
  const result = await request<ApiActivity>('/activities');
  return requireArray(result.activities, 'activities');
}

export async function saveActivity(activity: Omit<ApiActivity, 'status'> & { status?: ApiActivity['status'] }): Promise<ApiActivity> {
  const isUpdate = /^[a-f\d]{24}$/i.test(activity.id);
  const result = await request<ApiActivity>(isUpdate ? `/activities/${activity.id}` : '/activities', {
    method: isUpdate ? 'PUT' : 'POST',
    body: activity,
  });
  if (!result.activity) throw new Error('The backend response did not include the saved activity.');
  return result.activity;
}

export async function getWordBank(): Promise<ApiWordBankEntry[]> {
  const result = await request<ApiWordBankEntry>('/word-bank');
  return requireArray(result.words, 'word bank entries');
}

export async function createWordBankEntry(word: {
  text: string;
  sound: string;
  position: string;
  language: string;
  modelAudioUrl?: string;
}) {
  const result = await request<ApiWordBankEntry>('/word-bank', {
    method: 'POST',
    body: word,
  });
  if (!result.word) throw new Error('The backend response did not include the saved word.');
  return result.word;
}

export async function deleteWordBankEntry(id: string): Promise<void> {
  await request(`/word-bank/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function getAssignments(): Promise<ApiAssignment[]> {
  const result = await request<ApiAssignment>('/assignments');
  return requireArray(result.assignments, 'assignments');
}

export async function createAssignment(input: { activityId: string; patientCode: string; dueDate?: string; instructions?: string }) {
  const result = await request<ApiAssignment>('/assignments', { method: 'POST', body: input });
  if (!result.assignment) throw new Error('The backend response did not include the created assignment.');
  return result.assignment;
}

export async function updateAssignmentStatus(id: string, status: 'assigned' | 'in_progress' | 'completed' | 'overdue') {
  const result = await request<ApiAssignment>(`/assignments/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { status },
  });
  if (!result.assignment) throw new Error('The backend response did not include the updated assignment.');
  return result.assignment;
}

export async function getSubmissions(): Promise<ApiSubmission[]> {
  const result = await request<ApiSubmission>('/submissions');
  return requireArray(result.submissions, 'submissions');
}

export async function submitTeacherFeedback(input: {
  submissionId: string;
  rating: 'Correct' | 'Approximate' | 'Incorrect';
  notes: string;
}): Promise<void> {
  await request('/reviews', { method: 'POST', body: input });
}

export async function createSubmission(input: {
  patientId?: string;
  patientCode?: string;
  assignmentId?: string;
  practiceItemId?: string;
  audioRecordingUrl: string;
  waveformSample?: number[];
  durationSeconds?: number;
}): Promise<{ id: string; patientId: string; status: string; starsAwarded: number }> {
  const result = await request<{ id: string; patientId: string; status: string; starsAwarded: number }>('/submissions', {
    method: 'POST',
    body: input,
  });
  if (!result.submission) throw new Error('The backend response did not include the saved submission.');
  return result.submission;
}

const audioMimeTypes: Record<string, string> = {
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  webm: 'audio/webm',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
};

function audioExtensionFromMimeType(mimeType: string): string | undefined {
  const normalized = mimeType.toLowerCase().split(';')[0].trim();
  return Object.entries(audioMimeTypes).find(([, type]) => type === normalized)?.[0];
}

export async function uploadAudioFile(localUri: string): Promise<string> {
  const token = await getSessionToken();
  if (!token) throw new Error('Sign in before uploading audio.');

  const uriExtension = /\.([a-z\d]+)(?:[?#].*)?$/i.exec(localUri)?.[1]?.toLowerCase();
  let extension = uriExtension && audioMimeTypes[uriExtension] ? uriExtension : undefined;
  const formData = new FormData();
  let filename: string;

  if (Platform.OS === 'web') {
    let fileResponse: Response;
    try {
      fileResponse = await fetch(localUri);
    } catch {
      throw new Error('Could not read the recorded audio file.');
    }
    if (!fileResponse.ok) throw new Error('Could not read the recorded audio file.');
    const blob = await fileResponse.blob();
    extension = extension || audioExtensionFromMimeType(blob.type) || 'webm';
    filename = `recording-${Date.now()}.${extension}`;
    formData.append('audio', blob, filename);
  } else {
    extension = extension || 'm4a';
    filename = `recording-${Date.now()}.${extension}`;
    const nativeFile = {
      uri: localUri,
      name: filename,
      type: audioMimeTypes[extension],
    };
    // React Native FormData accepts URI-backed files; the DOM type only describes Blob values.
    const nativeFormData = formData as FormData & {
      append(name: string, value: typeof nativeFile): void;
    };
    nativeFormData.append('audio', nativeFile);
  }

  let url: URL;
  try {
    url = new URL(`${apiBaseUrl}/audio/upload`);
  } catch {
    throw new Error('The backend URL is invalid. Check EXPO_PUBLIC_API_URL.');
  }
  if (url.protocol !== 'https:' && !(__DEV__ && isPrivateHost(url.hostname))) {
    throw new Error('Use HTTPS for the backend URL, or a private local-network URL during development.');
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch {
    throw new Error('Could not upload the audio file. Check that the backend is reachable.');
  }

  let result: { audioUrl?: string; error?: string };
  try {
    result = await response.json() as { audioUrl?: string; error?: string };
  } catch {
    throw new Error('The backend returned an invalid audio upload response.');
  }
  if (!response.ok || typeof result.audioUrl !== 'string' || !result.audioUrl) {
    throw new Error(result.error || `Audio upload failed (${response.status}).`);
  }
  return result.audioUrl;
}

export function resolveAudioUrl(audioUrl: string): string {
  if (!audioUrl.trim()) throw new Error('An audio URL is required.');
  try {
    return new URL(audioUrl, apiBaseUrl).toString();
  } catch {
    throw new Error('The audio URL is invalid.');
  }
}

export async function getReviews(): Promise<ApiReview[]> {
  const result = await request<ApiReview>('/reviews');
  return requireArray(result.reviews, 'reviews');
}

export async function saveReview(input: {
  submissionId: string;
  observations: string;
  parentFeedback: string;
  homePractice: string;
  targets: Array<Pick<ApiReviewTarget, 'text' | 'position' | 'score' | 'feedback' | 'remarks'>>;
}) {
  const result = await request<{ submissionId: string; averageScore: number | null }>('/reviews', {
    method: 'POST',
    body: input,
  });
  if (!result.review) throw new Error('The backend response did not include the saved review.');
  return result.review;
}

export async function getParentFeedback() {
  const result = await request<{
    id: string;
    submissionId: string;
    assignmentId?: string;
    therapistName: string;
    specialty: string;
    title: string;
    category: string;
    date: string;
    parentFeedback: string;
    homePractice: string;
    observations: string;
    reviewedAt: string;
    averageScore: number | null;
  }>('/feedback');
  return requireArray(result.feedback, 'therapist feedback');
}

export async function getProgress(patientId?: string) {
  const query = patientId ? `?patientId=${encodeURIComponent(patientId)}` : '';
  const result = await request<{
    patient: PatientSearchResult;
    assignedCount: number;
    completedCount: number;
    submissionCount: number;
    stars: number;
    unlockedLevels: string[];
    completedByLevel: Record<string, number>;
    assignedByLevel: Record<string, number>;
    attemptsByLevel: Record<string, number>;
    recentSubmissions: Array<{
      id: string;
      assignmentId: string;
      status: string;
      submittedAt: string;
      practiceItemId: string;
      starsAwarded: number;
      activityTitle: string;
      level: string;
    }>;
  }>(`/progress${query}`);
  if (!result.progress) throw new Error('The backend response did not include progress.');
  return result.progress;
}

export async function getPracticeItems(input: { sound?: string; position?: string; language?: string } = {}) {
  const params = new URLSearchParams();
  if (input.sound) params.set('sound', input.sound);
  if (input.position) params.set('position', input.position);
  if (input.language) params.set('language', input.language);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const result = await request<{
    id: string;
    language: string;
    position: string;
    sound: string;
    syllable: string;
    sentenceText: string;
    videoDemoUrl: string;
    sampleAudioUrl: string;
    starRatingBenchmark: number | null;
  }>(`/practice-items${suffix}`);
  return requireArray(result.practiceItems, 'practice items');
}

export async function getSpeechCheckins(patientId?: string) {
  const query = patientId ? `?patientId=${encodeURIComponent(patientId)}` : '';
  const result = await request<{
    id: string;
    responses: unknown;
    evaluatedSound: string | null;
    initialScore: number | null;
    summaryOutcome: string | null;
    completedAt: string;
  }>(`/speech-checkins${query}`);
  return requireArray(result.results, 'speech check-in results');
}

export async function createSpeechCheckin(input: { patientId: string; responses: unknown }) {
  const result = await request<{ id: string; completedAt: string }>('/speech-checkins', {
    method: 'POST',
    body: input,
  });
  if (!result.result) throw new Error('The backend response did not include the saved check-in.');
  return result.result;
}

export async function getSoapNotes(patientId: string): Promise<ApiSoapNote[]> {
  const result = await request<ApiSoapNote>(`/patients/${encodeURIComponent(patientId)}/soap-notes`);
  return requireArray(result.notes, 'SOAP notes');
}

export async function createSoapNote(patientId: string, note: Omit<ApiSoapNote, 'id'>): Promise<ApiSoapNote> {
  const result = await request<ApiSoapNote>(`/patients/${encodeURIComponent(patientId)}/soap-notes`, {
    method: 'POST',
    body: {
      sessionNumber: note.number,
      sessionDate: note.date,
      subjective: note.subjective,
      objective: note.objective,
      assessment: note.assessment,
      plan: note.plan,
    },
  });
  if (!result.note) throw new Error('The backend response did not include the saved SOAP note.');
  return result.note;
}

export async function getAccomplishments(patientId: string): Promise<ApiAccomplishment[]> {
  const result = await request<ApiAccomplishment>(`/patients/${encodeURIComponent(patientId)}/accomplishments`);
  return requireArray(result.accomplishments, 'patient accomplishments');
}

export async function createAccomplishment(patientId: string, accomplishment: Omit<ApiAccomplishment, 'id'>) {
  const result = await request<{ id: string; title: string }>(`/patients/${encodeURIComponent(patientId)}/accomplishments`, {
    method: 'POST',
    body: accomplishment,
  });
  if (!result.accomplishment) throw new Error('The backend response did not include the saved accomplishment.');
  return result.accomplishment;
}

export async function getNotifications() {
  const result = await request<{ id: string; name: string; action: string; detail: string; time: string; unread: boolean }>('/notifications');
  return requireArray(result.notifications, 'notifications');
}

export async function getAdminUsers(role?: string, status?: string) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (status) params.set('status', status);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const result = await request<AdminUser>(`/admin/users${suffix}`);
  return requireArray(result.users, 'accounts');
}

export async function createAdminUser(input: {
  role: AccountRole;
  fullName: string;
  email: string;
  contact?: string;
  staffId?: string;
  professionalIdentifier?: string;
  professionalTitle?: string;
  specialization?: string;
  licenseNumber?: string;
  school?: string;
  gradeSections?: string[];
  childName?: string;
  studentId?: string;
  relationship?: string;
  grade?: string;
  section?: string;
  primaryTherapistId?: string;
  assignedTeacherId?: string;
}) : Promise<AdminUserInvitation> {
  const result = await request<AdminUser, AdminUserInvitation['patient']>('/admin/users', { method: 'POST', body: input });
  if (!result.user || !result.temporaryPassword || !result.invitationToken) {
    throw new Error('The backend response did not include complete account invitation details.');
  }
  return {
    user: result.user,
    temporaryPassword: result.temporaryPassword,
    invitationToken: result.invitationToken,
    ...(result.patient ? { patient: result.patient } : {}),
  };
}

export async function resendAdminInvitation(userId: string): Promise<{ temporaryPassword: string; invitationToken: string }> {
  const result = await request<AdminUser>(`/admin/users/${encodeURIComponent(userId)}/invitation`, { method: 'POST' });
  if (!result.temporaryPassword || !result.invitationToken) {
    throw new Error('The backend response did not include updated invitation credentials.');
  }
  return { temporaryPassword: result.temporaryPassword, invitationToken: result.invitationToken };
}

export async function archiveAdminUser(userId: string, archived: boolean, reason = '') {
  const result = await request<{ id: string; status: string; archivedAt: string | null; archiveReason: string }>(
    `/admin/users/${encodeURIComponent(userId)}/archive`,
    { method: 'PATCH', body: { archived, reason } },
  );
  if (!result.user) throw new Error('The backend response did not include the updated account.');
  return result.user;
}

export async function fetchAuditLogs(search = '', category = ''): Promise<AuditLogEntry[]> {
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  if (category && category !== 'All activity') params.set('category', category);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const result = await request<AuditLogEntry>(`/admin/audit-logs${suffix}`);
  return requireArray(result.auditLogs, 'audit logs');
}

export async function updateAdminUserStatus(userId: string, status: 'verified' | 'rejected') {
  const result = await request<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
  }>(`/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    body: { status },
  });
  if (!result.user) throw new Error('The backend response did not include the updated account.');
  return result.user;
}

export async function getCurrentSession(): Promise<{ user: FamilyUser; expiresAt: number } | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const result = await request<FamilyUser>('/users/session');
    if (typeof result.expiresAt !== 'number') throw new Error('The backend response did not include a session expiry.');
    return { user: getResponseUser(result), expiresAt: result.expiresAt };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await clearSession();
      return null;
    }
    throw error;
  }
}
