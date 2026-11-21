import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const C = {
  background: '#FFFFFF',
  ink: '#17364D',
  muted: '#48657A',
  line: '#D9E5EE',
  green: '#287A4B',
  greenBackground: '#E8F5EC',
  yellow: '#8A5B00',
  yellowBackground: '#FFF4D8',
  red: '#AD3B42',
  redBackground: '#FDEBED',
  blue: '#0865AD',
  blueBackground: '#EAF7FF',
  neutral: '#48657A',
  neutralBackground: '#EDF3F6',
};

type Tone = 'green' | 'yellow' | 'red' | 'blue' | 'neutral';

function State({ label, tone }: { label: string; tone: Tone }) {
  const color = tone === 'green' ? C.green : tone === 'yellow' ? C.yellow : tone === 'red' ? C.red : tone === 'blue' ? C.blue : C.neutral;
  const backgroundColor = tone === 'green' ? C.greenBackground : tone === 'yellow' ? C.yellowBackground : tone === 'red' ? C.redBackground : tone === 'blue' ? C.blueBackground : C.neutralBackground;
  return <View style={{ minHeight: 25, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 6, paddingHorizontal: 8, backgroundColor }}>
    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    <Text style={{ color, fontFamily: 'Geist-Medium', fontSize: 11 }}>{label}</Text>
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
