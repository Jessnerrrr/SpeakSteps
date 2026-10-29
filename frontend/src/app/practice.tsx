import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Position } from '../types/sentences';

export default function PracticeScreen() {
  const params = useLocalSearchParams<{
    sentenceId: string;
    sound: string;
    syllable: string;
    stars: string;
    position: string;
  }>();

  const position = (params.position ?? 'Initial') as Position;
  const sound = params.sound ?? '/s/';
  const syllable = params.syllable ?? 'sa';

  const [recording, setRecording] = useState(false);

  const [fontsLoaded] = useFonts({
    SourGummy: require('../../assets/fonts/SourGummy.ttf'),
  });
  if (!fontsLoaded) return null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Practice</Text>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Sound Banner (Chirpy) */}
          <View style={styles.banner}>
            <Image
              source={require('../../assets/images/bird-logo.gif')}
              style={styles.chirpy}
              contentFit="contain"
            />
            <View style={styles.bannerText}>
              <Text style={styles.bannerLabel}>Sounds · {position}</Text>
              <Text style={styles.bannerSound}>{sound} {syllable}</Text>
            </View>
          </View>

          {/* Video Card */}
          <View style={styles.videoCard}>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderText}>▶</Text>
            </View>
            <Text style={styles.videoHint}>Watch the video how to say the word</Text>
            <TouchableOpacity style={styles.watchAgainBtn}>
              <Text style={styles.watchAgainText}>▶  Watch again</Text>
            </TouchableOpacity>
          </View>

          {/* Mic Section */}
          <View style={styles.micSection}>
            <TouchableOpacity
              style={[styles.micBtn, recording && styles.micBtnActive]}
              onPressIn={() => setRecording(true)}
              onPressOut={() => setRecording(false)}
              activeOpacity={0.85}
            >
              <Image
                source={require('../../assets/images/mic.png')}
                style={styles.micIconImg}
                contentFit="contain"
              />
            </TouchableOpacity>
            <Text style={styles.micLabel}>Ask your child to say it</Text>
            <Text style={styles.micHint}>Long press the mic to record your voice</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={() => router.back()}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer Navigation */}
        <View style={styles.footerNav}>
          <TouchableOpacity style={styles.footerTab} onPress={() => router.replace('/')}>
            <Text style={styles.footerTabText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerTab} onPress={() => router.replace('/sentences')}>
            <Text style={[styles.footerTabText, styles.footerTabTextActive]}>Play</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerTab}>
            <Text style={styles.footerTabText}>Stars</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerTab}>
            <Text style={styles.footerTabText}>Buddy</Text>
          </TouchableOpacity>
        </View>

      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#0865AD',
  },
  backBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  backIcon: { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: 'bold' },
  headerTitle: { fontFamily: 'SourGummy', color: '#fff', fontSize: 20 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0865AD',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  chirpy: { width: 70, height: 70, marginRight: 16 },
  bannerText: { flex: 1 },
  bannerLabel: { fontFamily: 'SourGummy', color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  bannerSound: { fontFamily: 'SourGummy', color: '#fff', fontSize: 30, fontWeight: 'bold' },

  videoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBE6F6',
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  videoPlaceholder: {
    width: 100,
    height: 80,
    backgroundColor: '#E8F4FB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoPlaceholderText: { fontSize: 36, color: '#0865AD' },
  videoHint: {
    fontFamily: 'SourGummy',
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 14,
  },
  watchAgainBtn: {
    backgroundColor: '#FFB923',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  watchAgainText: { fontFamily: 'SourGummy', color: '#fff', fontSize: 18, fontWeight: 'bold' },

  micSection: { alignItems: 'center', marginTop: 24 },
  micBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F66540',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#F66540',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  micBtnActive: { backgroundColor: '#DE502C', transform: [{ scale: 0.95 }] },
  micIconImg: {
    width: 52,
    height: 52,
  },
  micLabel: {
    fontFamily: 'SourGummy',
    fontSize: 16,
    color: '#0865AD',
    fontWeight: 'bold',
    marginTop: 12,
  },
  micHint: {
    fontFamily: 'SourGummy',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },

  submitBtn: {
    backgroundColor: '#0865AD',
    marginHorizontal: 40,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  submitText: { fontFamily: 'SourGummy', color: '#fff', fontSize: 20, fontWeight: 'bold' },

  footerNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#E2EEF8',
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  footerTab: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerTabText: {
    fontFamily: 'SourGummy',
    fontSize: 14,
    color: '#6B8299',
    fontWeight: '600',
  },
  footerTabTextActive: {
    color: '#0865AD',
    fontWeight: 'bold',
  },
});

