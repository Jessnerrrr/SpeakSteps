/**
 * SpeakSteps - Authentication Mock Data
 * 
 * BACKEND INTEGRATION NOTE:
 * When connecting to your real authentication backend (e.g., Supabase, Firebase, or Node API),
 * replace this file with your actual auth provider and API calls.
 */

export interface MockUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: 'patient' | 'therapist';
  childName?: string;
}

export const MOCK_AUTH_USERS: MockUser[] = [
  {
    id: 'patient-1',
    email: 'parent@gmail.com',
    password: 'password123',
    fullName: 'Sarah Johnson',
    role: 'patient',
    childName: 'Mia',
  },
  {
    id: 'patient-demo',
    email: 'test@gmail.com',
    password: '123',
    fullName: 'Demo Parent',
    role: 'patient',
    childName: 'Mia',
  },
  {
    id: 'therapist-1',
    email: 'therapist@gmail.com',
    password: 'password123',
    fullName: 'Dr. Emily Vance',
    role: 'therapist',
  },
];

/**
 * Validates login credentials against mock data
 */
export function authenticateMockUser(email: string, password: string): { success: boolean; user?: MockUser; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const user = MOCK_AUTH_USERS.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
  );

  if (!user) {
    return {
      success: false,
      error: 'Invalid email or password. You can use parent@gmail.com / password123 or tap Quick Fill.',
    };
  }

  return { success: true, user };
}

