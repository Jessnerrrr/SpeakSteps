import { getCurrentSession, clearSession, type AccountRole } from '@/services/user-api';
import { useRouter, useSegments, type Href } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type GuardState = 'checking' | 'allowed' | 'redirecting' | 'error';

type RoleGuardProps = {
  role: AccountRole;
  loginRoute: Href;
  children: ReactNode;
  publicRoutes?: string[];
};

export function RoleGuard({ role, loginRoute, children, publicRoutes = [] }: RoleGuardProps) {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = String(segments[segments.length - 1] || '');
  const isPublicRoute = publicRoutes.includes(currentRoute);
  const [state, setState] = useState<GuardState>('checking');
  const [sessionValidated, setSessionValidated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (isPublicRoute) {
      setSessionValidated(false);
      setState('checking');
      return;
    }

    if (sessionValidated) {
      setState('allowed');
      return;
    }

    let active = true;
    setState('checking');
    setErrorMessage('');

    void (async () => {
      try {
        const session = await getCurrentSession();
        console.log('[RoleGuard] session:', session);
        if (!active) return;

        if (!session) {
          setState('redirecting');
          router.replace(loginRoute);
          return;
        }

        if (session.user.role !== role) {
          await clearSession();
          if (!active) return;
          setSessionValidated(false);
          setState('redirecting');
          router.replace(loginRoute);
          return;
        }

        setSessionValidated(true);
        setState('allowed');
      } catch (error) {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : 'Could not verify your session.');
        setState('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [isPublicRoute, loginRoute, retryCount, role, sessionValidated]);

  const showOverlay = !isPublicRoute && !(state === 'allowed' && sessionValidated);

  return (
    <View style={styles.root}>
      {children}
      {showOverlay ? (
        <View style={styles.overlay}>
          {state === 'error' ? (
            <>
              <Text style={styles.message}>{errorMessage}</Text>
              <TouchableOpacity onPress={() => setRetryCount((count) => count + 1)}>
                <Text style={styles.retry}>Retry</Text>
              </TouchableOpacity>
            </>
          ) : (
            <ActivityIndicator color="#0D68AC" />
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 999,
  },
  message: { color: '#334155', textAlign: 'center', marginBottom: 12 },
  retry: { color: '#0D68AC', fontWeight: '700' },
});