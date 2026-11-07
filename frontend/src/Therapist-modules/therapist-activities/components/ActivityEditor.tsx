import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { useTherapist } from '@/components/therapist/TherapistProvider';
import { ChevronLeftIcon } from '@/components/therapist/icons';
import { AudioCard } from '@/Therapist-modules/therapist-activities/components/AudioCard';
import { ChecklistMenu, FieldMenu } from '@/Therapist-modules/therapist-activities/components/FieldMenu';
import {
  activityLanguages,
  positionChoices,
  positionsFromLabel,
  practiceLevels,
  targetSounds,
  usesPhraseFields,
  wordPositions,
  type TargetSound,
  type WordPosition,
} from '@/Therapist-modules/therapist-activities/data/activityData';
import { useActivities } from '@/Therapist-modules/therapist-activities/state/ActivitiesProvider';

const steps = [
  { key: 'focus', label: 'Clinical focus' },
  { key: 'content', label: 'Activity content' },
  { key: 'preview', label: 'Preview & save' },
] as const;

export function ActivityEditor() {
  const { palette } = useTherapist();
  const { draft, setDraft, saveActivity, wordBank, addBankWord } = useActivities();
  const [error, setError] = useState('');
  const [bankQuery, setBankQuery] = useState('');
  const phraseMode = usesPhraseFields(draft.level);
  const positions = positionsFromLabel(draft.positionLabel);

  const bankResults = wordBank.filter(
    (word) => draft.selectedSounds.includes(word.sound) && word.text.includes(bankQuery.trim().toLowerCase()),
  );
  const selectedWords = wordBank.filter((word) => draft.selectedWordIds.includes(word.id));

  const continueFocus = () => {
    if (!draft.title.trim()) {
      setError('Enter an activity title.');
      return;
    }
    setError('');
    setDraft({ step: 'content' });
  };

  const saveWord = () => {
    const text = draft.customInput.trim().toLowerCase();
    if (!text) return;
    const word = {
      id: `custom-${Date.now()}`,
      text,
      sound: draft.customSound,
      position: draft.customPosition,
      phrase: '',
    };
    setDraft({
      customWords: draft.customWords.some((item) => item.text === text) ? draft.customWords : [...draft.customWords, word],
      customInput: '',
    });
    if (draft.saveToBank) addBankWord(word);
  };

  const toggleWord = (id: string, position: WordPosition) => {
    const selected = draft.selectedWordIds.includes(id);
    if (!selected) {
      const count = selectedWords.filter((word) => word.position === position).length;
      if (count >= 5) return;
    }
    setDraft({
      selectedWordIds: selected ? draft.selectedWordIds.filter((item) => item !== id) : [...draft.selectedWordIds, id],
    });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={[styles.back, { borderColor: palette.line }]}>
        <ChevronLeftIcon color={palette.text} size={18} />
      </Pressable>
      <View style={styles.stepper}>
        {steps.map((step) => {
          const active = draft.step === step.key;
          return (
            <Pressable key={step.key} onPress={() => setDraft({ step: step.key })} style={styles.step}>
              <View style={[styles.stepLine, { backgroundColor: active ? '#C48B5A' : '#E6EBEF' }]} />
              <Text style={[styles.stepLabel, { color: active ? '#C48B5A' : palette.faint }]}>{step.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {draft.step === 'focus' ? (
        <View style={styles.block}>
          <Field label="Activity Title" value={draft.title} onChangeText={(title) => setDraft({ title })} placeholder="Ready, set, /r/" />
          <View style={styles.row}>
            <FieldMenu label="Target Sound" value={draft.sound} options={targetSounds} onChange={(sound) => setDraft({ sound: sound as TargetSound, selectedSounds: [sound as TargetSound] })} />
            <FieldMenu label="Practice Level" value={draft.level} options={practiceLevels} onChange={(level) => setDraft({ level: level as typeof draft.level })} />
          </View>
          <FieldMenu label="Word Position" value={draft.positionLabel} options={positionChoices} onChange={(positionLabel) => setDraft({ positionLabel: positionLabel as typeof draft.positionLabel })} />
          <FieldMenu label="Language" value={draft.language} options={activityLanguages} onChange={(language) => setDraft({ language })} />
          <Field label="Instructions for Student/Facilitator" value={draft.instructions} onChangeText={(instructions) => setDraft({ instructions })} placeholder="Listen to the model..." />
          <Field label="Articulatory Guide" value={draft.guide} onChangeText={(guide) => setDraft({ guide })} placeholder="Pull tongue tip back, lips slightly relaxed." />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => { if (!draft.title.trim()) { setError('Enter an activity title.'); return; } saveActivity(); router.push('/therapist/activities' as never); }} style={[styles.secondary, { borderColor: palette.line }]}>
              <Text style={[styles.secondaryText, { color: palette.text }]}>Save Draft</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={continueFocus} style={styles.primary}>
              <Text style={styles.primaryText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {draft.step === 'content' ? (
        <View style={styles.block}>
          <Text style={[styles.heading, { color: palette.text }]}>Word Origin</Text>
          <Radio label="Word Bank" selected={draft.origin === 'bank'} onPress={() => setDraft({ origin: 'bank' })} />
          <Radio label="Custom Word" selected={draft.origin === 'custom'} onPress={() => setDraft({ origin: 'custom' })} />

          {draft.origin === 'bank' ? (
            <>
              <View style={styles.counters}>
                {wordPositions.map((position) => {
                  const count = selectedWords.filter((word) => word.position === position).length;
                  const included = positions.includes(position);
                  return (
                    <View key={position} style={[styles.counter, included && count > 0 && styles.counterOn]}>
                      <Text style={styles.counterLabel}>{position}</Text>
                      <Text style={styles.counterValue}>{included ? count : 0}/5</Text>
                    </View>
                  );
                })}
              </View>
              <ChecklistMenu
                label="Target Sound"
                options={targetSounds}
                selected={draft.selectedSounds}
                onChange={(selectedSounds) => setDraft({ selectedSounds: selectedSounds as TargetSound[] })}
              />
              <TextInput
                value={bankQuery}
                onChangeText={setBankQuery}
                placeholder="Search existing from wordbank..."
                placeholderTextColor={palette.faint}
                style={[styles.input, { borderColor: palette.line, color: palette.text }]}
              />
              <View style={[styles.bank, { borderColor: palette.line }]}>
                {bankResults.map((word) => {
                  const checked = draft.selectedWordIds.includes(word.id);
                  return (
                    <Pressable key={word.id} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => toggleWord(word.id, word.position)} style={styles.bankRow}>
                      <View style={[styles.check, checked && styles.checkOn]}>{checked ? <Text style={styles.checkMark}>✓</Text> : null}</View>
                      <Text style={{ color: palette.text }}>{word.text}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.chips}>
                {selectedWords.map((word) => (
                  <View key={word.id} style={styles.chip}>
                    <Text style={styles.chipText}>{word.text}</Text>
                    <Pressable onPress={() => toggleWord(word.id, word.position)}><Text style={styles.chipX}>×</Text></Pressable>
                  </View>
                ))}
              </View>
              {phraseMode
                ? selectedWords.map((word) => (
                    <View key={`${word.id}-phrase`} style={styles.phraseBlock}>
                      <Text style={[styles.phraseLabel, { color: palette.text }]}>{word.text}</Text>
                      <TextInput
                        value={draft.phrases[word.id] || ''}
                        onChangeText={(value) => setDraft({ phrases: { ...draft.phrases, [word.id]: value } })}
                        placeholder="Write the phrase or sentence."
                        placeholderTextColor={palette.faint}
                        style={[styles.input, { borderColor: palette.line, color: palette.text }]}
                      />
                    </View>
                  ))
                : null}
            </>
          ) : (
            <>
              <Text style={[styles.heading, { color: palette.text }]}>Custom Word</Text>
              <TextInput
                value={draft.customInput}
                onChangeText={(customInput) => setDraft({ customInput })}
                placeholder="Add a custom word"
                placeholderTextColor={palette.faint}
                style={[styles.input, { borderColor: palette.line, color: palette.text }]}
              />
              <View style={styles.chips}>
                {draft.customWords.map((word) => (
                  <View key={word.id} style={styles.chip}>
                    <Text style={styles.chipText}>{word.text}</Text>
                    <Pressable onPress={() => setDraft({ customWords: draft.customWords.filter((item) => item.id !== word.id) })}><Text style={styles.chipX}>×</Text></Pressable>
                  </View>
                ))}
              </View>
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: draft.saveToBank }} onPress={() => setDraft({ saveToBank: !draft.saveToBank })} style={styles.radio}>
                <View style={[styles.radioOuter, draft.saveToBank && styles.radioOn]} />
                <Text style={{ color: palette.text }}>Save to Word Bank</Text>
              </Pressable>
              <View style={styles.row}>
                <FieldMenu label="Target Sound" value={draft.customSound} options={targetSounds} onChange={(customSound) => setDraft({ customSound: customSound as TargetSound })} />
                <FieldMenu label="Position" value={draft.customPosition} options={wordPositions} onChange={(customPosition) => setDraft({ customPosition: customPosition as WordPosition })} />
              </View>
              <Pressable accessibilityRole="button" onPress={saveWord} style={styles.smallPrimary}>
                <Text style={styles.primaryText}>{phraseMode ? 'Save Phrase' : 'Save Word'}</Text>
              </Pressable>
              {phraseMode ? (
                <View style={styles.phraseBlock}>
                  <Text style={[styles.heading, { color: palette.text }]}>Practice Content Builder</Text>
                  <Text style={[styles.help, { color: palette.muted }]}>Target words are vocabulary references. Write the exact phrases the child will say.</Text>
                  {draft.customLines.map((line, index) => (
                    <View key={`line-${index}`} style={styles.lineRow}>
                      <TextInput
                        value={line}
                        onChangeText={(value) => setDraft({ customLines: draft.customLines.map((item, itemIndex) => (itemIndex === index ? value : item)) })}
                        placeholder="The rice is rich."
                        placeholderTextColor={palette.faint}
                        style={[styles.input, styles.lineInput, { borderColor: palette.line, color: palette.text }]}
                      />
                      <Pressable onPress={() => setDraft({ customLines: draft.customLines.filter((_, itemIndex) => itemIndex !== index) })}>
                        <Text style={styles.chipX}>–</Text>
                      </Pressable>
                    </View>
                  ))}
                  <Pressable onPress={() => setDraft({ customLines: [...draft.customLines, ''] })} style={[styles.secondary, { borderColor: palette.line, alignSelf: 'flex-start' }]}>
                    <Text style={[styles.secondaryText, { color: palette.text }]}>+ Add line</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          )}

          <Field label="Instructions for Student/Facilitator" value={draft.instructions} onChangeText={(instructions) => setDraft({ instructions })} placeholder="" />
          <Text style={[styles.heading, { color: palette.text }]}>Visual Material</Text>
          <Pressable accessibilityRole="button" onPress={() => pickVisual((visualName) => setDraft({ visualName }))} style={[styles.upload, { borderColor: palette.line }]}>
            <Text style={styles.uploadIcon}>↑</Text>
            <Text style={{ color: palette.text, fontWeight: '700' }}>{draft.visualName || 'Upload or browse files here'}</Text>
            <Text style={{ color: palette.faint, fontSize: 12 }}>MP4 or MOV, up to 20 MB per file</Text>
          </Pressable>
          <Text style={[styles.heading, { color: palette.text }]}>Preview Audio Model</Text>
          <AudioCard title="Sample Audio Model" meta="Demo Playback • 0:08" />
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => setDraft({ step: 'focus' })} style={[styles.secondary, { borderColor: palette.line }]}>
              <Text style={[styles.secondaryText, { color: palette.text }]}>Back</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setDraft({ step: 'preview' })} style={styles.primary}>
              <Text style={styles.primaryText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {draft.step === 'preview' ? (
        <View style={styles.block}>
          <View style={styles.previewCard}>
            <Text style={styles.previewSound}>{draft.sound}</Text>
            <Text style={styles.previewTitle}>{draft.title || 'Untitled activity'}</Text>
            <Text style={styles.previewMeta}>{draft.level} · {draft.positionLabel} · {draft.language}</Text>
            <Text style={styles.previewHeading}>Instructions</Text>
            <Text style={styles.previewBody}>{draft.instructions}</Text>
            <Text style={styles.previewHeading}>Articulatory Guide</Text>
            <Text style={styles.previewBody}>{draft.guide || 'No guide yet.'}</Text>
            <Text style={styles.previewHeading}>Practice Content</Text>
            <View style={styles.chips}>
              {(draft.origin === 'custom' ? draft.customWords : selectedWords).map((word) => (
                <View key={word.id} style={styles.brownChip}><Text style={styles.brownChipText}>{word.text}</Text></View>
              ))}
            </View>
            {phraseMode && draft.origin === 'bank'
              ? selectedWords.map((word) => <Text key={word.id} style={styles.previewBody}>{draft.phrases[word.id]}</Text>)
              : null}
            {phraseMode && draft.origin === 'custom'
              ? draft.customLines.filter(Boolean).map((line, index) => <Text key={index} style={styles.previewBody}>{line}</Text>)
              : null}
            <Text style={styles.previewHeading}>Preview Audio Model</Text>
            <AudioCard title="Pronunciation Model" meta="Demo Playback • 0:08" />
            <Text style={styles.previewHeading}>Visual Material</Text>
            <View style={styles.visual}><Text style={{ color: '#8B9AAB' }}>{draft.visualName || '▶'}</Text></View>
          </View>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => setDraft({ step: 'content' })} style={[styles.secondary, { borderColor: palette.line }]}>
              <Text style={[styles.secondaryText, { color: palette.text }]}>Back</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                saveActivity();
                router.push('/therapist/activities' as never);
              }}
              style={styles.primary}
            >
              <Text style={styles.primaryText}>Save Activity</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Field({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string }) {
  const { palette } = useTherapist();
  return (
    <View style={styles.field}>
      <Text style={[styles.heading, { color: palette.text }]}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={palette.faint} style={[styles.input, { borderColor: palette.line, color: palette.text }]} />
    </View>
  );
}

function Radio({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { palette } = useTherapist();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={styles.radio}>
      <View style={[styles.radioOuter, selected && styles.radioOn]} />
      <Text style={{ color: palette.text }}>{label}</Text>
    </Pressable>
  );
}

function pickVisual(onPick: (name: string) => void) {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/mp4,video/quicktime,.mp4,.mov';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      onPick(file.size > 20 * 1024 * 1024 ? '' : file.name);
    };
    input.click();
    return;
  }
  onPick('visual-material.mp4');
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 28 },
  back: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  stepper: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  step: { flex: 1, gap: 6 },
  stepLine: { height: 3, borderRadius: 2 },
  stepLabel: { fontSize: 11, fontWeight: '700' },
  block: { gap: 12 },
  field: { gap: 6 },
  heading: { fontSize: 15, fontWeight: '700' },
  help: { fontSize: 12, lineHeight: 17 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 14 },
  row: { flexDirection: 'row', gap: 10 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  primary: { backgroundColor: '#C48B5A', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
  secondary: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  secondaryText: { fontWeight: '700' },
  smallPrimary: { alignSelf: 'flex-end', backgroundColor: '#C48B5A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  error: { color: '#F5693F', fontSize: 13 },
  radio: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioOuter: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#C48B5A' },
  radioOn: { backgroundColor: '#C48B5A' },
  counters: { flexDirection: 'row', gap: 8 },
  counter: { flex: 1, borderWidth: 1, borderColor: '#E6EBEF', borderRadius: 12, padding: 10 },
  counterOn: { backgroundColor: '#F8F1EA', borderColor: '#F0D2BC' },
  counterLabel: { fontSize: 12, color: '#63778A' },
  counterValue: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  bank: { borderWidth: 1, borderRadius: 12, padding: 8 },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  check: { width: 16, height: 16, borderRadius: 3, borderWidth: 1.5, borderColor: '#C48B5A', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: '#C48B5A' },
  checkMark: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E7C7A8', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { color: '#C48B5A', fontWeight: '600', textTransform: 'capitalize' },
  chipX: { color: '#C48B5A', fontSize: 14 },
  phraseBlock: { gap: 6 },
  phraseLabel: { fontSize: 13, fontWeight: '700' },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineInput: { flex: 1 },
  upload: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, minHeight: 110, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 12 },
  uploadIcon: { color: '#C48B5A', fontSize: 20, fontWeight: '700' },
  previewCard: { backgroundColor: '#FBF6F1', borderRadius: 18, padding: 16, gap: 8 },
  previewSound: { textAlign: 'center', color: '#C48B5A', fontSize: 28 },
  previewTitle: { textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#1E293B' },
  previewMeta: { textAlign: 'center', color: '#8B9AAB', fontSize: 12, marginBottom: 8 },
  previewHeading: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 6 },
  previewBody: { fontSize: 13, color: '#63778A', lineHeight: 18 },
  brownChip: { backgroundColor: '#C48B5A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  brownChipText: { color: '#FFFFFF', fontWeight: '700' },
  visual: { height: 120, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
});
