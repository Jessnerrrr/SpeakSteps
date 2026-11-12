import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { ChevronRightIcon } from '@/components/therapist/icons';

type SelectFieldProps = {
  label?: string;
  required?: boolean;
  value: string;
  placeholder: string;
  options: readonly string[];
  onChange: (value: string) => void;
  error?: boolean;
};

export function SelectField({ label, required, value, placeholder, options, onChange, error }: SelectFieldProps) {
  const { palette } = useTherapist();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: palette.muted }]}>
          {label}
          {required ? <Text style={{ color: palette.alert }}> *</Text> : null}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((current) => !current)}
        style={[styles.control, { backgroundColor: palette.input, borderColor: error ? palette.alert : palette.line }]}
      >
        <Text style={[styles.value, { color: value ? palette.text : palette.faint }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <View style={{ transform: [{ rotate: open ? '-90deg' : '90deg' }] }}>
          <ChevronRightIcon color={palette.faint} size={16} />
        </View>
      </Pressable>
      {open ? (
        <View style={[styles.menu, { backgroundColor: palette.card, borderColor: palette.line }]}>
          {options.map((option) => {
            const selected = option === value;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => {
                  onChange(option);
                  setOpen(false);
                }}
                style={[styles.option, selected && { backgroundColor: palette.primarySoft }]}
              >
                <Text style={[styles.optionText, { color: selected ? palette.primaryText : palette.text }]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600' },
  control: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  value: { flex: 1, fontSize: 13 },
  menu: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionText: { fontSize: 13 },
});
