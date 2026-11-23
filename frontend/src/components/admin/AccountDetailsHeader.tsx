import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const C = {
  background: '#FFFFFF',
  ink: '#17364D',
  muted: '#48657A',
  line: '#D9E5EE',
  yellow: '#8A5B00',
  yellowBackground: '#FFF5DB',
  red: '#AD3B42',
  redBackground: '#FCEEF0',
  blue: '#0865AD',
  blueBackground: '#ECF6FD',
  neutral: '#48657A',
  neutralBackground: '#F0F4F7',
};

type Tone = 'green' | 'yellow' | 'red' | 'blue' | 'neutral';

function State({ label, tone }: { label: string; tone: Tone }) {
  const color = tone === 'green' ? '#286443' : tone === 'yellow' ? C.yellow : tone === 'red' ? C.red : tone === 'blue' ? C.blue : C.neutral;
  const backgroundColor = tone === 'green' ? '#EEF7F0' : tone === 'yellow' ? C.yellowBackground : tone === 'red' ? C.redBackground : tone === 'blue' ? C.blueBackground : C.neutralBackground;
  return <View style={{ alignSelf: 'flex-start', maxWidth: '100%', minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5, backgroundColor }}>
    <View style={{ width: 7, height: 7, borderRadius: 4, flexShrink: 0, backgroundColor: color }} />
    <Text style={{ color, fontFamily: 'Geist-Medium', fontSize: 11, flexShrink: 1, textAlign: 'center' }}>{label}</Text>
  </View>;
}

export default function AccountDetailsHeader({ name, identifier, email, avatar, states, onClose }: {
  name: string;
  identifier: string;
  email?: string;
  avatar: React.ReactNode;
  states: { label: string; tone: Tone }[];
  onClose: () => void;
}) {
  return <View style={{ paddingHorizontal: 8, paddingBottom: 17, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.background }}>
    <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {avatar}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={2} style={{ color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 21, lineHeight: 27, letterSpacing: -0.25 }}>{name}</Text>
        <Text numberOfLines={2} style={{ color: C.muted, fontSize: 12, lineHeight: 17, marginTop: 2 }}>{identifier}</Text>
        {email ? <Text numberOfLines={2} style={{ color: C.muted, fontSize: 12, lineHeight: 17, marginTop: 1 }}>{email}</Text> : null}
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close account details" onPress={onClose} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: '#F0F6FA' }}>
        <Ionicons name="close" size={19} color={C.ink} />
      </TouchableOpacity>
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
      {states.map((state) => <State key={state.label} {...state} />)}
    </View>
  </View>;
}
