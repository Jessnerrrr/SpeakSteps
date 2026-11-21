import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const C = { ink: '#17364D', muted: '#48657A', blue: '#0865AD', line: '#D9E5EE', white: '#FFFFFF', red: '#AD3B42' };

export default function AccountDetailsActionRow({ title, detail, label, onPress, tone = 'secondary' }: {
  title: string;
  detail: string;
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary' | 'danger';
}) {
  const backgroundColor = tone === 'primary' ? C.blue : C.white;
  const borderColor = tone === 'primary' ? C.blue : tone === 'danger' ? '#F1C7CC' : C.line;
  const color = tone === 'primary' ? C.white : tone === 'danger' ? C.red : C.ink;
  return <View style={{ minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.line }}>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={{ color: C.ink, fontFamily: 'Geist-SemiBold', fontSize: 14, lineHeight: 19 }}>{title}</Text>
      {detail ? <Text style={{ color: C.muted, fontSize: 12, lineHeight: 17, marginTop: 2 }}>{detail}</Text> : null}
    </View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ minHeight: 38, paddingHorizontal: 12, borderWidth: 1, borderColor, borderRadius: 7, backgroundColor, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontFamily: 'Geist-SemiBold', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  </View>;
}
