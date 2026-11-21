import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TotpSetupScreen() {
  return (
    <ImageBackground
      source={require('../../../assets/images/admin-bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.card}>
          <Ionicons name="shield-outline" size={44} color="#0284C7" />
          <Text style={styles.title}>TOTP setup unavailable</Text>
          <Text style={styles.message}>
            Authenticator enrollment is not connected to the backend. No code was generated, no authenticator was enrolled, and no verification was performed.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: 'center' },
  safeArea: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 480, alignSelf: 'center', alignItems: 'center', gap: 16, padding: 28, borderRadius: 24, backgroundColor: '#FFFFFF' },
  title: { color: '#0F172A', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  message: { color: '#475569', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  button: { minWidth: 150, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: '#0284C7' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
