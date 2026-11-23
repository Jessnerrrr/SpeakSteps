import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Text } from 'react-native';
import type { ComponentProps } from 'react';
import type { AdventureCategory } from '../data/patient-dashboard-mock';
import type { PracticeLevel } from '../data/practice-levels';

export const practiceLevelIcons: Record<PracticeLevel, ComponentProps<typeof Ionicons>['name']> = {
  Sound: 'musical-note',
  Syllables: 'apps',
  Words: 'text',
  Phrases: 'chatbubble-ellipses',
  Sentences: 'book',
};

export const adventurePracticeLevels: Record<AdventureCategory['iconType'], PracticeLevel> = {
  sounds: 'Sound',
  syllables: 'Syllables',
  words: 'Words',
  phrases: 'Phrases',
  sentences: 'Sentences',
};

export function AdventureIcon({ type, size }: { type: AdventureCategory['iconType']; size: number }) {
  if (type === 'syllables') {
    return <Ionicons name={practiceLevelIcons.Syllables} size={size} color="#FFFFFF" />;
  }
  if (type === 'phrases') {
    return <Image source={require('../../assets/images/adventure-phrases.png')} style={{ width: size, height: size }} contentFit="contain" />;
  }

  if (type === 'words') {
    return <Text style={{ fontFamily: 'SourGummy-Bold', fontSize: size - 4, color: '#FFFFFF' }}>Aa</Text>;
  }

  return <Ionicons name={type === 'sounds' ? 'musical-notes' : 'clipboard'} size={type === 'sounds' ? size : size - 2} color="#FFFFFF" />;
}
