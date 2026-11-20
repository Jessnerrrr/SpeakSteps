// =============================================================================
// THERAPIST ACTIVITIES — Library, Creator/Editor, Detail & Assignment in one file
// Replaces: therapist-activities/pages, components, data
// =============================================================================

import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { TherapistShell } from '@/components/therapist/TherapistShell';
import { useTherapist } from '@/components/therapist/TherapistProvider';
import { ChevronLeftIcon, ChevronRightIcon, FilterIcon, PencilIcon, SearchIcon, TrashIcon } from '@/components/therapist/icons';
import {
  activityLanguages,
  levelColors,
  positionChoices,
  positionsFromLabel,
  practiceLevels,
  targetSounds,
  usesPhraseFields,
  wordPositions,
  type Activity,
  type PracticeLevel,
  type TargetSound,
  type WordPosition,
} from '@/Therapist-modules/therapist-activities/data/activityData';
import { patientName } from '@/Therapist-modules/therapist-patients/data/samplePatients';
import { useActivities } from '@/Therapist-modules/therapist-activities/state/ActivitiesProvider';

// ─── Simple Audio Demo Card ──────────────────────────────────────────────────

function AudioCard({ title, meta }: { title: string; meta: string }) {
  const [playing, setPlaying] = useState(false);
  const bars = [8, 14, 10, 18, 12, 16, 9, 15];
  return (
    <Pressable accessibilityRole="button" onPress={() => setPlaying((c) => !c)} style={actStyles.audioCard}>
      <View style={actStyles.audioPlay}>
        <Text style={actStyles.audioPlayIcon}>{playing ? '❚❚' : '▶'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={actStyles.audioTitle}>{title}</Text>
        <Text style={actStyles.audioMeta}>{playing ? 'Playing demo…' : meta}</Text>
      </View>
      <View style={actStyles.audioBars}>
        {bars.map((height, i) => (
          <View key={i} style={[actStyles.audioBar, { height: playing ? height + 4 : height }]} />
        ))}
      </View>
    </Pressable>
  );
}

// ─── Reusable Field Dropdowns ────────────────────────────────────────────────

function FieldMenu({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const { palette } = useTherapist();
  const [open, setOpen] = useState(false);
  return (
    <View style={actStyles.menuWrap}>
      {label ? <Text style={[actStyles.menuLabel, { color: palette.text }]}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((c) => !c)}
        style={[actStyles.menuControl, { borderColor: palette.line, backgroundColor: palette.card }]}
      >
        <Text style={[actStyles.menuValue, { color: palette.text }]} numberOfLines={1}>
          {value}
        </Text>
        <View style={{ transform: [{ rotate: '90deg' }] }}>
          <ChevronRightIcon color={palette.faint} size={16} />
        </View>
      </Pressable>
      {open ? (
        <View style={[actStyles.dropdownMenu, { borderColor: palette.line, backgroundColor: palette.card }]}>
          {options.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              onPress={() => {
                onChange(option);
                setOpen(false);
              }}
              style={[actStyles.dropdownOption, option === value && { backgroundColor: '#F8F1EA' }]}
            >
              <Text style={[actStyles.dropdownOptionText, { color: palette.text }]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ChecklistMenu({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const { palette } = useTherapist();
  const [open, setOpen] = useState(false);
  const allSelected = options.every((option) => selected.includes(option));
  const summary = selected.length === 0 ? 'Select sounds' : allSelected ? 'All sounds' : selected.join(', ');

  const toggle = (option: string) => {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  };

  return (
    <View style={actStyles.menuWrap}>
      <Text style={[actStyles.menuLabel, { color: palette.text }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((c) => !c)}
        style={[actStyles.menuControl, { borderColor: palette.line, backgroundColor: palette.card }]}
      >
        <Text style={[actStyles.menuValue, { color: selected.length ? palette.text : palette.faint }]} numberOfLines={1}>
          {summary}
        </Text>
        <View style={{ transform: [{ rotate: '90deg' }] }}>
          <ChevronRightIcon color={palette.faint} size={16} />
        </View>
      </Pressable>
      {open ? (
        <View style={[actStyles.dropdownMenu, { borderColor: palette.line, backgroundColor: palette.card }]}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: allSelected }}
            onPress={() => onChange(allSelected ? [] : [...options])}
            style={actStyles.dropdownOption}
          >
            <View style={[actStyles.checkSquare, allSelected && actStyles.checkSquareOn]}>
              {allSelected ? <Text style={actStyles.checkMark}>✓</Text> : null}
            </View>
            <Text style={[actStyles.dropdownOptionText, { color: palette.text }]}>Select all</Text>
          </Pressable>
          {options.map((option) => {
            const checked = selected.includes(option);
            return (
              <Pressable
                key={option}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={() => toggle(option)}
                style={actStyles.dropdownOption}
              >
                <View style={[actStyles.checkSquare, checked && actStyles.checkSquareOn]}>
                  {checked ? <Text style={actStyles.checkMark}>✓</Text> : null}
                </View>
                <Text style={[actStyles.dropdownOptionText, { color: palette.text }]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// ─── 1. Activity Library & Word Bank ─────────────────────────────────────────

const tabs = ['Unassigned', 'Assigned', 'Completed'] as const;

export function ActivityLibrary() {
  const { palette } = useTherapist();
  const { activities, beginNewActivity, wordBank } = useActivities();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<(typeof tabs)[number]>('Unassigned');
  const [filters, setFilters] = useState<PracticeLevel[]>([]);
  const [section, setSection] = useState<'library' | 'bank'>('library');

  if (section === 'bank') return <WordBank onOpenLibrary={() => setSection('library')} />;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return activities.filter((activity) => {
      if (activity.status !== tab) return false;
      if (filters.length > 0 && !filters.includes(activity.level)) return false;
      if (!needle) return true;
      return `${activity.title} ${activity.sound} ${activity.level}`.toLowerCase().includes(needle);
    });
  }, [activities, filters, query, tab]);

  const toggle = (level: PracticeLevel) => {
    setFilters((current) => (current.includes(level) ? current.filter((item) => item !== level) : [...current, level]));
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={actStyles.content}>
      <Text style={[actStyles.kicker, { color: palette.faint }]}>PURPOSEFUL PRACTICE</Text>
      <Text style={[actStyles.title, { color: palette.primary }]}>The activity library.</Text>
      <Text style={[actStyles.subtitle, { color: palette.muted }]}>Build the small steps that make a big difference.</Text>

      <View style={[actStyles.sectionTabs, { borderBottomColor: palette.line }]}>
        <Text style={[actStyles.sectionTab, { color: palette.primary, borderBottomColor: palette.primary }]}>
          Activity Library
        </Text>
        <Pressable accessibilityRole="button" onPress={() => setSection('bank')}>
          <Text style={[actStyles.sectionTab, { color: palette.faint }]}>Word Bank ({wordBank.length})</Text>
        </Pressable>
      </View>

      <View style={actStyles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search activities..."
          placeholderTextColor={palette.faint}
          style={[actStyles.search, { borderColor: palette.line, color: palette.text, backgroundColor: palette.card }]}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            beginNewActivity();
            router.push('/therapist/activities/edit' as never);
          }}
          style={[actStyles.create, { backgroundColor: palette.primary }]}
        >
          <Text style={actStyles.createText}>+ Create a task</Text>
        </Pressable>
      </View>

      <View style={actStyles.statusRow}>
        {tabs.map((item) => {
          const selected = item === tab;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => setTab(item)}
              style={[actStyles.statusBtn, selected ? { backgroundColor: palette.primary } : { backgroundColor: '#F3F4F6' }]}
            >
              <Text style={[actStyles.statusBtnText, { color: selected ? '#FFFFFF' : palette.muted }]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={actStyles.filtersRow}>
        {practiceLevels.map((level) => {
          const selected = filters.includes(level);
          return (
            <Pressable key={level} accessibilityRole="button" onPress={() => toggle(level)} style={[actStyles.filterChip, selected && actStyles.filterChipOn]}>
              <Text style={[actStyles.filterChipText, selected && actStyles.filterChipTextOn]}>{level}</Text>
              {selected ? <Text style={actStyles.filterChipX}>×</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={actStyles.grid}>
        {visible.map((activity) => (
          <Pressable
            key={activity.id}
            accessibilityRole="button"
            onPress={() => router.push(`/therapist/activities/${activity.id}` as never)}
            style={[actStyles.card, { borderColor: palette.line, backgroundColor: palette.card }]}
          >
            <View style={[actStyles.swatch, { backgroundColor: levelColors[activity.level] }]}>
              <Text style={actStyles.sound}>{activity.sound}</Text>
              <Text style={actStyles.wave}>≋</Text>
            </View>
            <View style={actStyles.cardBody}>
              <View style={actStyles.levelPill}>
                <Text style={actStyles.levelText}>{activity.level}</Text>
              </View>
              <Text style={[actStyles.cardTitle, { color: palette.text }]}>{activity.title}</Text>
              <Text style={[actStyles.cardMeta, { color: palette.faint }]}>{activity.language} · Therapist-created</Text>
              <Text style={[actStyles.viewLink, { color: palette.muted }]}>View activity ›</Text>
            </View>
          </Pressable>
        ))}
      </View>
      {visible.length === 0 ? <Text style={[actStyles.empty, { color: palette.muted }]}>No activities in this view.</Text> : null}
    </ScrollView>
  );
}

// ─── Word Bank View ──────────────────────────────────────────────────────────

function WordBank({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  const { palette } = useTherapist();
  const { wordBank, addBankWord, removeBankWord } = useActivities();
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sounds, setSounds] = useState<TargetSound[]>(['/r/', '/s/']);
  const [positions, setPositions] = useState<WordPosition[]>(['Initial']);
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [word, setWord] = useState('');
  const [sound, setSound] = useState<TargetSound>('/r/');
  const [position, setPosition] = useState<WordPosition>('Initial');
  const [language, setLanguage] = useState<string>('English');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return wordBank.filter((item) => {
      if (sounds.length > 0 && !sounds.includes(item.sound)) return false;
      if (positions.length > 0 && !positions.includes(item.position)) return false;
      if (languages.length > 0 && !languages.includes(item.language)) return false;
      if (!needle) return true;
      return item.text.toLowerCase().includes(needle);
    });
  }, [languages, positions, query, sounds, wordBank]);

  const toggle = <T extends string>(value: T, selected: T[], setSelected: (next: T[]) => void) => {
    setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  const save = () => {
    const text = word.trim().toLowerCase();
    if (!text) return;
    addBankWord({ id: `bank-${Date.now()}`, text, sound, position, language });
    setWord('');
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={actStyles.content} keyboardShouldPersistTaps="handled">
      <Text style={[actStyles.kicker, { color: palette.faint }]}>PURPOSEFUL PRACTICE</Text>
      <Text style={[actStyles.title, { color: palette.primary }]}>The word bank.</Text>
      <Text style={[actStyles.subtitle, { color: palette.muted }]}>Reusable targets organized by sound, position and language.</Text>

      <View style={[actStyles.sectionTabs, { borderBottomColor: palette.line }]}>
        <Pressable accessibilityRole="button" onPress={onOpenLibrary}>
          <Text style={[actStyles.sectionTab, { color: palette.faint }]}>Activity Library</Text>
        </Pressable>
        <Text style={[actStyles.sectionTab, { color: palette.primary, borderBottomColor: palette.primary }]}>
          Word Bank ({wordBank.length})
        </Text>
      </View>

      <View style={actStyles.searchRow}>
        <View style={[actStyles.bankSearchBox, { borderColor: palette.line, backgroundColor: palette.card }]}>
          <SearchIcon color={palette.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for a specific word..."
            placeholderTextColor={palette.faint}
            style={[actStyles.searchInput, { color: palette.text }]}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setAdding((c) => !c);
            setEditing(false);
          }}
          style={[actStyles.addBtn, { backgroundColor: palette.primary }]}
        >
          <Text style={actStyles.addBtnText}>+ Add a word</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter word bank"
          onPress={() => setFiltersOpen((c) => !c)}
          style={[actStyles.filterToggle, { borderColor: palette.line, backgroundColor: palette.card }]}
        >
          <FilterIcon color={palette.text} />
        </Pressable>
      </View>

      {filtersOpen ? (
        <View style={[actStyles.filterPanel, { borderColor: palette.line, backgroundColor: palette.card }]}>
          <Text style={[actStyles.filterLabel, { color: palette.muted }]}>Sound</Text>
          <View style={actStyles.choiceRow}>
            {targetSounds.map((item) => (
              <Pressable key={item} accessibilityRole="button" onPress={() => toggle(item, sounds, setSounds)} style={[actStyles.choice, sounds.includes(item) && actStyles.choiceOn]}>
                <Text style={[actStyles.choiceText, sounds.includes(item) && actStyles.choiceTextOn]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[actStyles.filterLabel, { color: palette.muted }]}>Position</Text>
          <View style={actStyles.choiceRow}>
            {wordPositions.map((item) => (
              <Pressable key={item} accessibilityRole="button" onPress={() => toggle(item, positions, setPositions)} style={[actStyles.choice, positions.includes(item) && actStyles.choiceOn]}>
                <Text style={[actStyles.choiceText, positions.includes(item) && actStyles.choiceTextOn]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[actStyles.filterLabel, { color: palette.muted }]}>Language</Text>
          <View style={actStyles.choiceRow}>
            {activityLanguages.map((item) => (
              <Pressable key={item} accessibilityRole="button" onPress={() => toggle(item, languages, setLanguages)} style={[actStyles.choice, languages.includes(item) && actStyles.choiceOn]}>
                <Text style={[actStyles.choiceText, languages.includes(item) && actStyles.choiceTextOn]}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {adding ? (
        <View style={actStyles.formWrap}>
          <Text style={[actStyles.formTitle, { color: palette.text }]}>Add a Word Bank Entry</Text>
          <Text style={[actStyles.fieldLabel, { color: palette.text }]}>Word</Text>
          <TextInput
            value={word}
            onChangeText={setWord}
            placeholder="Target word"
            placeholderTextColor={palette.faint}
            style={[actStyles.wordInput, { borderColor: palette.line, color: palette.text, backgroundColor: palette.card }]}
          />
          <View style={{ marginBottom: 12 }}>
            <FieldMenu label="Sound" value={sound} options={targetSounds} onChange={(v) => setSound(v as TargetSound)} />
          </View>
          <View style={{ marginBottom: 12 }}>
            <FieldMenu label="Position" value={position} options={wordPositions} onChange={(v) => setPosition(v as WordPosition)} />
          </View>
          <View style={{ marginBottom: 12 }}>
            <FieldMenu label="Language" value={language} options={activityLanguages} onChange={setLanguage} />
          </View>
          <Pressable accessibilityRole="button" onPress={save} style={[actStyles.saveWordBtn, { backgroundColor: palette.primary }]}>
            <Text style={actStyles.saveWordBtnText}>Save Phrase</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={actStyles.listHeader}>
        <Text style={[actStyles.listTitle, { color: palette.text }]}>Word Bank List</Text>
        {adding ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={editing ? 'Finish removing words' : 'Remove words'}
            onPress={() => setEditing((c) => !c)}
            hitSlop={8}
          >
            {editing ? <TrashIcon color={palette.faint} /> : <PencilIcon color={palette.faint} />}
          </Pressable>
        ) : null}
      </View>

      <View style={[actStyles.bankList, { borderColor: palette.line, backgroundColor: palette.card }]}>
        {visible.map((item, index) => (
          <View key={item.id} style={[actStyles.bankRow, index > 0 && { borderTopColor: palette.line, borderTopWidth: 1 }]}>
            <Text style={[actStyles.bankWordText, { color: palette.text }]}>{item.text}</Text>
            {editing ? (
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.text}`} onPress={() => removeBankWord(item.id)} hitSlop={8}>
                <Text style={[actStyles.bankMinus, { color: palette.faint }]}>—</Text>
              </Pressable>
            ) : (
              <View style={actStyles.bankBadge}>
                <Text style={actStyles.bankBadgeText}>{item.position}</Text>
              </View>
            )}
          </View>
        ))}
        {visible.length === 0 ? <Text style={[actStyles.empty, { color: palette.muted }]}>No words match this view.</Text> : null}
      </View>
    </ScrollView>
  );
}

// ─── 2. Activity Detail ──────────────────────────────────────────────────────

export function ActivityDetail({ activityId }: { activityId: string }) {
  const { palette } = useTherapist();
  const { activities, beginEdit } = useActivities();
  const activity = activities.find((item) => item.id === activityId);

  if (!activity) {
    return <Text style={{ color: palette.muted, padding: 20 }}>This activity is no longer in the library.</Text>;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={actStyles.content}>
      <Pressable accessibilityLabel="Back to library" onPress={() => router.push('/therapist/activities' as never)} style={[actStyles.detailBack, { borderColor: palette.line }]}>
        <ChevronLeftIcon color={palette.text} size={18} />
      </Pressable>
      <View style={actStyles.detailBadge}><Text style={actStyles.detailBadgeText}>{activity.level}</Text></View>
      <Text style={[actStyles.detailTitle, { color: palette.text }]}>{activity.title}</Text>
      <Text style={[actStyles.detailMeta, { color: palette.faint }]}>{activity.sound} · {activity.positions[0] || 'Initial'} · {activity.language}</Text>
      <Section title="Instructions" body={activity.instructions} />
      <Section title="Articulatory Guide" body={activity.guide} />
      <PracticeContent activity={activity} />
      <Text style={[actStyles.sectionHead, { color: palette.text }]}>Preview Audio Model</Text>
      <AudioCard title="Pronunciation Model" meta="Demo Playback • 0:08" />
      <Text style={[actStyles.sectionHead, { color: palette.text }]}>Visual Material</Text>
      <View style={[actStyles.visualBox, { borderColor: palette.line }]}><Text style={{ color: palette.faint }}>{activity.visualName || '▶'}</Text></View>
      <View style={actStyles.detailActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            beginEdit(activity.id);
            router.push('/therapist/activities/edit' as never);
          }}
          style={[actStyles.detailSecondary, { borderColor: palette.line }]}
        >
          <Text style={[actStyles.detailSecondaryText, { color: palette.text }]}>Edit Activity</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push(`/therapist/activities/assign?id=${activity.id}` as never)} style={actStyles.detailPrimary}>
          <Text style={actStyles.detailPrimaryText}>Assign Activity</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function PracticeContent({ activity }: { activity: Activity }) {
  const { palette } = useTherapist();
  const phraseMode = usesPhraseFields(activity.level);
  return (
    <View style={actStyles.practiceBox}>
      <Text style={[actStyles.sectionHead, { color: palette.text }]}>Practice Content</Text>
      {wordPositions.map((position) => {
        const words = activity.words.filter((word) => word.position === position);
        return (
          <View key={position} style={actStyles.posBlock}>
            <Text style={[actStyles.posTitle, { color: palette.text }]}>{position} · {words.length} targets</Text>
            {words.length === 0 ? <Text style={{ color: palette.faint }}>No targets yet.</Text> : null}
            <View style={actStyles.chipGroup}>
              {words.map((word) => (
                <View key={word.id} style={actStyles.practiceChip}><Text style={actStyles.practiceChipText}>{word.text}</Text></View>
              ))}
            </View>
            {phraseMode ? words.map((word) => (word.phrase ? <Text key={`${word.id}-line`} style={{ color: palette.muted }}>{word.phrase}</Text> : null)) : null}
          </View>
        );
      })}
      {phraseMode ? activity.customLines.map((line, index) => <Text key={index} style={{ color: palette.muted }}>{line}</Text>) : null}
    </View>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  const { palette } = useTherapist();
  return (
    <View style={actStyles.sectionBlock}>
      <Text style={[actStyles.sectionHead, { color: palette.text }]}>{title}</Text>
      <Text style={{ color: palette.muted, lineHeight: 18 }}>{body}</Text>
    </View>
  );
}

// ─── 3. Activity Editor / Creator ───────────────────────────────────────────

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
    const word = { id: `custom-${Date.now()}`, text, sound: draft.customSound, position: draft.customPosition, phrase: '' };
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
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={actStyles.content} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={[actStyles.detailBack, { borderColor: palette.line }]}>
        <ChevronLeftIcon color={palette.text} size={18} />
      </Pressable>
      <View style={actStyles.stepper}>
        {steps.map((step) => {
          const active = draft.step === step.key;
          return (
            <Pressable key={step.key} onPress={() => setDraft({ step: step.key })} style={actStyles.stepItem}>
              <View style={[actStyles.stepLine, { backgroundColor: active ? '#C48B5A' : '#E6EBEF' }]} />
              <Text style={[actStyles.stepLabel, { color: active ? '#C48B5A' : palette.faint }]}>{step.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {draft.step === 'focus' ? (
        <View style={actStyles.editorBlock}>
          <EditorField label="Activity Title" value={draft.title} onChangeText={(title) => setDraft({ title })} placeholder="Ready, set, /r/" />
          <View style={actStyles.editorRow}>
            <FieldMenu label="Target Sound" value={draft.sound} options={targetSounds} onChange={(s) => setDraft({ sound: s as TargetSound, selectedSounds: [s as TargetSound] })} />
            <FieldMenu label="Practice Level" value={draft.level} options={practiceLevels} onChange={(l) => setDraft({ level: l as typeof draft.level })} />
          </View>
          <FieldMenu label="Word Position" value={draft.positionLabel} options={positionChoices} onChange={(p) => setDraft({ positionLabel: p as typeof draft.positionLabel })} />
          <FieldMenu label="Language" value={draft.language} options={activityLanguages} onChange={(language) => setDraft({ language })} />
          <EditorField label="Instructions for Student/Facilitator" value={draft.instructions} onChangeText={(instructions) => setDraft({ instructions })} placeholder="Listen to the model..." />
          <EditorField label="Articulatory Guide" value={draft.guide} onChangeText={(guide) => setDraft({ guide })} placeholder="Pull tongue tip back, lips slightly relaxed." />
          {error ? <Text style={actStyles.errorText}>{error}</Text> : null}
          <View style={actStyles.editorActions}>
            <Pressable accessibilityRole="button" onPress={() => { if (!draft.title.trim()) { setError('Enter an activity title.'); return; } saveActivity(); router.push('/therapist/activities' as never); }} style={[actStyles.detailSecondary, { borderColor: palette.line }]}>
              <Text style={[actStyles.detailSecondaryText, { color: palette.text }]}>Save Draft</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={continueFocus} style={actStyles.detailPrimary}>
              <Text style={actStyles.detailPrimaryText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {draft.step === 'content' ? (
        <View style={actStyles.editorBlock}>
          <Text style={[actStyles.editorHeading, { color: palette.text }]}>Word Origin</Text>
          <RadioItem label="Word Bank" selected={draft.origin === 'bank'} onPress={() => setDraft({ origin: 'bank' })} />
          <RadioItem label="Custom Word" selected={draft.origin === 'custom'} onPress={() => setDraft({ origin: 'custom' })} />

          {draft.origin === 'bank' ? (
            <>
              <View style={actStyles.countersRow}>
                {wordPositions.map((pos) => {
                  const count = selectedWords.filter((w) => w.position === pos).length;
                  const included = positions.includes(pos);
                  return (
                    <View key={pos} style={[actStyles.counterBox, included && count > 0 && actStyles.counterBoxOn]}>
                      <Text style={actStyles.counterLabel}>{pos}</Text>
                      <Text style={actStyles.counterVal}>{included ? count : 0}/5</Text>
                    </View>
                  );
                })}
              </View>
              <ChecklistMenu label="Target Sound" options={targetSounds} selected={draft.selectedSounds} onChange={(s) => setDraft({ selectedSounds: s as TargetSound[] })} />
              <TextInput
                value={bankQuery}
                onChangeText={setBankQuery}
                placeholder="Search existing from wordbank..."
                placeholderTextColor={palette.faint}
                style={[actStyles.editorInput, { borderColor: palette.line, color: palette.text }]}
              />
              <View style={[actStyles.bankPicker, { borderColor: palette.line }]}>
                {bankResults.map((w) => {
                  const checked = draft.selectedWordIds.includes(w.id);
                  return (
                    <Pressable key={w.id} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => toggleWord(w.id, w.position)} style={actStyles.bankPickRow}>
                      <View style={[actStyles.checkSquare, checked && actStyles.checkSquareOn]}>{checked ? <Text style={actStyles.checkMark}>✓</Text> : null}</View>
                      <Text style={{ color: palette.text }}>{w.text}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={actStyles.chipGroup}>
                {selectedWords.map((w) => (
                  <View key={w.id} style={actStyles.editorChip}>
                    <Text style={actStyles.editorChipText}>{w.text}</Text>
                    <Pressable onPress={() => toggleWord(w.id, w.position)}><Text style={actStyles.editorChipX}>×</Text></Pressable>
                  </View>
                ))}
              </View>
              {phraseMode
                ? selectedWords.map((w) => (
                    <View key={`${w.id}-phrase`} style={{ gap: 6 }}>
                      <Text style={[actStyles.phraseLabel, { color: palette.text }]}>{w.text}</Text>
                      <TextInput
                        value={draft.phrases[w.id] || ''}
                        onChangeText={(val) => setDraft({ phrases: { ...draft.phrases, [w.id]: val } })}
                        placeholder="Write the phrase or sentence."
                        placeholderTextColor={palette.faint}
                        style={[actStyles.editorInput, { borderColor: palette.line, color: palette.text }]}
                      />
                    </View>
                  ))
                : null}
            </>
          ) : (
            <>
              <Text style={[actStyles.editorHeading, { color: palette.text }]}>Custom Word</Text>
              <TextInput
                value={draft.customInput}
                onChangeText={(customInput) => setDraft({ customInput })}
                placeholder="Add a custom word"
                placeholderTextColor={palette.faint}
                style={[actStyles.editorInput, { borderColor: palette.line, color: palette.text }]}
              />
              <View style={actStyles.chipGroup}>
                {draft.customWords.map((w) => (
                  <View key={w.id} style={actStyles.editorChip}>
                    <Text style={actStyles.editorChipText}>{w.text}</Text>
                    <Pressable onPress={() => setDraft({ customWords: draft.customWords.filter((i) => i.id !== w.id) })}><Text style={actStyles.editorChipX}>×</Text></Pressable>
                  </View>
                ))}
              </View>
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: draft.saveToBank }} onPress={() => setDraft({ saveToBank: !draft.saveToBank })} style={actStyles.radioRow}>
                <View style={[actStyles.radioOuter, draft.saveToBank && actStyles.radioOn]} />
                <Text style={{ color: palette.text }}>Save to Word Bank</Text>
              </Pressable>
              <View style={actStyles.editorRow}>
                <FieldMenu label="Target Sound" value={draft.customSound} options={targetSounds} onChange={(s) => setDraft({ customSound: s as TargetSound })} />
                <FieldMenu label="Position" value={draft.customPosition} options={wordPositions} onChange={(p) => setDraft({ customPosition: p as WordPosition })} />
              </View>
              <Pressable accessibilityRole="button" onPress={saveWord} style={actStyles.smallPrimaryBtn}>
                <Text style={actStyles.detailPrimaryText}>{phraseMode ? 'Save Phrase' : 'Save Word'}</Text>
              </Pressable>
              {phraseMode ? (
                <View style={{ gap: 6 }}>
                  <Text style={[actStyles.editorHeading, { color: palette.text }]}>Practice Content Builder</Text>
                  <Text style={[actStyles.helpText, { color: palette.muted }]}>Target words are vocabulary references. Write the exact phrases the child will say.</Text>
                  {draft.customLines.map((line, index) => (
                    <View key={`line-${index}`} style={actStyles.customLineRow}>
                      <TextInput
                        value={line}
                        onChangeText={(val) => setDraft({ customLines: draft.customLines.map((item, i) => (i === index ? val : item)) })}
                        placeholder="The rice is rich."
                        placeholderTextColor={palette.faint}
                        style={[actStyles.editorInput, { flex: 1, borderColor: palette.line, color: palette.text }]}
                      />
                      <Pressable onPress={() => setDraft({ customLines: draft.customLines.filter((_, i) => i !== index) })}>
                        <Text style={actStyles.editorChipX}>–</Text>
                      </Pressable>
                    </View>
                  ))}
                  <Pressable onPress={() => setDraft({ customLines: [...draft.customLines, ''] })} style={[actStyles.detailSecondary, { borderColor: palette.line, alignSelf: 'flex-start' }]}>
                    <Text style={[actStyles.detailSecondaryText, { color: palette.text }]}>+ Add line</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          )}

          <EditorField label="Instructions for Student/Facilitator" value={draft.instructions} onChangeText={(instructions) => setDraft({ instructions })} placeholder="" />
          <Text style={[actStyles.editorHeading, { color: palette.text }]}>Visual Material</Text>
          <Pressable accessibilityRole="button" onPress={() => pickVisual((visualName) => setDraft({ visualName }))} style={[actStyles.uploadBox, { borderColor: palette.line }]}>
            <Text style={actStyles.uploadIcon}>↑</Text>
            <Text style={{ color: palette.text, fontWeight: '700' }}>{draft.visualName || 'Upload or browse files here'}</Text>
            <Text style={{ color: palette.faint, fontSize: 12 }}>MP4 or MOV, up to 20 MB per file</Text>
          </Pressable>
          <Text style={[actStyles.editorHeading, { color: palette.text }]}>Preview Audio Model</Text>
          <AudioCard title="Sample Audio Model" meta="Demo Playback • 0:08" />
          <View style={actStyles.editorActions}>
            <Pressable accessibilityRole="button" onPress={() => setDraft({ step: 'focus' })} style={[actStyles.detailSecondary, { borderColor: palette.line }]}>
              <Text style={[actStyles.detailSecondaryText, { color: palette.text }]}>Back</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setDraft({ step: 'preview' })} style={actStyles.detailPrimary}>
              <Text style={actStyles.detailPrimaryText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {draft.step === 'preview' ? (
        <View style={actStyles.editorBlock}>
          <View style={actStyles.previewCard}>
            <Text style={actStyles.previewSound}>{draft.sound}</Text>
            <Text style={actStyles.previewTitle}>{draft.title || 'Untitled activity'}</Text>
            <Text style={actStyles.previewMeta}>{draft.level} · {draft.positionLabel} · {draft.language}</Text>
            <Text style={actStyles.previewHeading}>Instructions</Text>
            <Text style={actStyles.previewBody}>{draft.instructions}</Text>
            <Text style={actStyles.previewHeading}>Articulatory Guide</Text>
            <Text style={actStyles.previewBody}>{draft.guide || 'No guide yet.'}</Text>
            <Text style={actStyles.previewHeading}>Practice Content</Text>
            <View style={actStyles.chipGroup}>
              {(draft.origin === 'custom' ? draft.customWords : selectedWords).map((w) => (
                <View key={w.id} style={actStyles.brownChip}><Text style={actStyles.brownChipText}>{w.text}</Text></View>
              ))}
            </View>
            {phraseMode && draft.origin === 'bank'
              ? selectedWords.map((w) => <Text key={w.id} style={actStyles.previewBody}>{draft.phrases[w.id]}</Text>)
              : null}
            {phraseMode && draft.origin === 'custom'
              ? draft.customLines.filter(Boolean).map((line, i) => <Text key={i} style={actStyles.previewBody}>{line}</Text>)
              : null}
            <Text style={actStyles.previewHeading}>Preview Audio Model</Text>
            <AudioCard title="Pronunciation Model" meta="Demo Playback • 0:08" />
            <Text style={actStyles.previewHeading}>Visual Material</Text>
            <View style={actStyles.previewVisual}><Text style={{ color: '#8B9AAB' }}>{draft.visualName || '▶'}</Text></View>
          </View>
          <View style={actStyles.editorActions}>
            <Pressable accessibilityRole="button" onPress={() => setDraft({ step: 'content' })} style={[actStyles.detailSecondary, { borderColor: palette.line }]}>
              <Text style={[actStyles.detailSecondaryText, { color: palette.text }]}>Back</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                saveActivity();
                router.push('/therapist/activities' as never);
              }}
              style={actStyles.detailPrimary}
            >
              <Text style={actStyles.detailPrimaryText}>Save Activity</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function EditorField({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (v: string) => void; placeholder: string }) {
  const { palette } = useTherapist();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[actStyles.editorHeading, { color: palette.text }]}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={palette.faint} style={[actStyles.editorInput, { borderColor: palette.line, color: palette.text }]} />
    </View>
  );
}

function RadioItem({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { palette } = useTherapist();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={actStyles.radioRow}>
      <View style={[actStyles.radioOuter, selected && actStyles.radioOn]} />
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

// ─── 4. Assign Activity Screen ───────────────────────────────────────────────

export function AssignActivity() {
  const { palette, patients } = useTherapist();
  const { activities, assignActivity, beginEdit } = useActivities();
  const params = useLocalSearchParams<{ id?: string }>();
  const initialId = (Array.isArray(params.id) ? params.id[0] : params.id) || 'ready-set-r';
  const studentNames = patients.map((patient) => patientName(patient));
  const [student, setStudent] = useState(studentNames[0] || '');
  const [activityId, setActivityId] = useState(initialId || activities[0]?.id || '');
  const [dueDate, setDueDate] = useState('01/11/2026');
  const activity = activities.find((item) => item.id === activityId) || activities[0];
  const [instructions, setInstructions] = useState(activity?.instructions || '');
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');

  const chooseActivity = (title: string) => {
    const next = activities.find((item) => item.title === title);
    if (!next) return;
    setActivityId(next.id);
    setInstructions(next.instructions);
    setPreview(false);
  };

  const assign = () => {
    if (!student || !activity) {
      setError('Choose a student and an activity.');
      return;
    }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dueDate)) {
      setError('Enter the due date as mm/dd/yyyy.');
      return;
    }
    assignActivity(activity.id, student, dueDate, instructions);
    router.push('/therapist/activities' as never);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={actStyles.content} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={[actStyles.detailBack, { borderColor: palette.line }]}>
        <ChevronLeftIcon color={palette.text} size={18} />
      </Pressable>
      <Text style={[actStyles.assignTitle, { color: palette.text }]}>Assign Activity</Text>
      <FieldMenu label="Student" value={student} options={studentNames} onChange={setStudent} />
      <FieldMenu label="Activity" value={activity?.title || 'Select activity'} options={activities.map((item) => item.title)} onChange={chooseActivity} />
      <Pressable accessibilityRole="button" onPress={() => setPreview((open) => !open)} style={actStyles.previewToggleBtn}>
        <Text style={actStyles.previewToggleText}>Activity Preview</Text>
        <Text style={actStyles.previewToggleText}>{preview ? '▴' : '▾'}</Text>
      </Pressable>
      {preview && activity ? (
        <View style={{ gap: 10 }}>
          <PracticeContent activity={{ ...activity, instructions }} />
          <View style={actStyles.editorActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                beginEdit(activity.id);
                router.push('/therapist/activities/edit' as never);
              }}
              style={[actStyles.detailSecondary, { borderColor: palette.line }]}
            >
              <Text style={[actStyles.detailSecondaryText, { color: palette.text }]}>Edit Activity</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={assign} style={actStyles.detailPrimary}>
              <Text style={actStyles.detailPrimaryText}>Assign Activity</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <Text style={[actStyles.fieldLabel, { color: palette.text }]}>Due Date</Text>
      <TextInput value={dueDate} onChangeText={setDueDate} placeholder="mm/dd/yyyy" placeholderTextColor={palette.faint} style={[actStyles.editorInput, { borderColor: palette.line, color: palette.text }]} />
      <Text style={[actStyles.fieldLabel, { color: palette.text }]}>Instructions</Text>
      <TextInput
        value={instructions}
        onChangeText={setInstructions}
        multiline
        style={[actStyles.editorInput, { minHeight: 72, paddingVertical: 10, borderColor: palette.line, color: palette.text }]}
      />
      {error ? <Text style={actStyles.errorText}>{error}</Text> : null}
      <View style={actStyles.editorActions}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={[actStyles.detailSecondary, { borderColor: palette.line }]}>
          <Text style={[actStyles.detailSecondaryText, { color: palette.text }]}>Cancel</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={assign} style={actStyles.detailPrimary}>
          <Text style={actStyles.detailPrimaryText}>Assign Activity</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ─── Default Page Exports with TherapistShell ────────────────────────────────

export default function TherapistActivities() {
  return (
    <TherapistShell active="activities">
      <ActivityLibrary />
    </TherapistShell>
  );
}

export function TherapistActivityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <TherapistShell active="activities">
      <ActivityDetail activityId={Array.isArray(id) ? id[0] : id || ''} />
    </TherapistShell>
  );
}

export function TherapistActivityEdit() {
  return (
    <TherapistShell active="activities">
      <ActivityEditor />
    </TherapistShell>
  );
}

export function TherapistActivityAssign() {
  return (
    <TherapistShell active="activities">
      <AssignActivity />
    </TherapistShell>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const actStyles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  kicker: { fontSize: 11, letterSpacing: 0.6, fontWeight: '700' },
  title: { fontFamily: 'SourGummy-Bold', fontSize: 24, marginTop: 4 },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 14 },
  sectionTabs: { flexDirection: 'row', gap: 18, borderBottomWidth: 1, marginBottom: 14 },
  sectionTab: { fontSize: 14, fontWeight: '700', paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  search: { flex: 1, height: 40, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13 },
  create: { borderRadius: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  createText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statusBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  statusBtnText: { fontSize: 13, fontWeight: '700' },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  filterChip: { borderWidth: 1, borderColor: '#E6EBEF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterChipOn: { borderColor: '#C48B5A' },
  filterChipText: { fontSize: 12, color: '#63778A' },
  filterChipTextOn: { color: '#C48B5A', fontWeight: '700' },
  filterChipX: { color: '#C48B5A', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  swatch: { height: 92, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  sound: { fontSize: 28, fontWeight: '500', color: '#3F4A3A' },
  wave: { fontSize: 18, color: '#C48B5A' },
  cardBody: { padding: 12, gap: 4 },
  levelPill: { alignSelf: 'flex-start', backgroundColor: '#F8E7DC', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  levelText: { fontSize: 10, color: '#C48B5A', fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardMeta: { fontSize: 11 },
  viewLink: { fontSize: 12, marginTop: 4 },
  empty: { marginTop: 16, textAlign: 'center' },

  // Word Bank
  bankSearchBox: { flex: 1, height: 40, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  addBtn: { height: 40, borderRadius: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  filterToggle: { width: 40, height: 40, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterPanel: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12, gap: 8 },
  filterLabel: { fontSize: 12, fontWeight: '700' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderColor: '#D7E8F2', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  choiceOn: { borderColor: '#0EA5E9', backgroundColor: '#E7F6FD' },
  choiceText: { fontSize: 12, color: '#63778A' },
  choiceTextOn: { color: '#0284C7', fontWeight: '700' },
  formWrap: { marginBottom: 8 },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  wordInput: { height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 14, marginBottom: 12 },
  saveWordBtn: { alignSelf: 'flex-end', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4, marginBottom: 16 },
  saveWordBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  listTitle: { fontSize: 16, fontWeight: '700' },
  bankList: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  bankRow: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bankWordText: { fontSize: 14 },
  bankBadge: { backgroundColor: '#D9F3FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  bankBadgeText: { color: '#38B6E6', fontSize: 12, fontWeight: '700' },
  bankMinus: { fontSize: 18, fontWeight: '700', paddingHorizontal: 6 },

  // Detail
  detailBack: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  detailBadge: { alignSelf: 'flex-start', backgroundColor: '#F8E7DC', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  detailBadgeText: { color: '#C48B5A', fontSize: 12, fontWeight: '700' },
  detailTitle: { fontSize: 28, fontWeight: '700' },
  detailMeta: { fontSize: 13, marginBottom: 8 },
  sectionHead: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  sectionBlock: { gap: 4, borderTopWidth: 1, borderTopColor: '#E6EBEF', paddingTop: 8 },
  visualBox: { height: 140, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  detailPrimary: { backgroundColor: '#C48B5A', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  detailPrimaryText: { color: '#FFFFFF', fontWeight: '700' },
  detailSecondary: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  detailSecondaryText: { fontWeight: '700' },

  // Practice Content
  practiceBox: { gap: 8, borderTopWidth: 1, borderTopColor: '#E6EBEF', paddingTop: 8 },
  posBlock: { gap: 6 },
  posTitle: { fontSize: 14, fontWeight: '700' },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  practiceChip: { borderWidth: 1, borderColor: '#E7C7A8', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  practiceChipText: { color: '#C48B5A', fontWeight: '600' },

  // Editor
  stepper: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  stepItem: { flex: 1, gap: 6 },
  stepLine: { height: 3, borderRadius: 2 },
  stepLabel: { fontSize: 11, fontWeight: '700' },
  editorBlock: { gap: 12 },
  editorHeading: { fontSize: 15, fontWeight: '700' },
  helpText: { fontSize: 12, lineHeight: 17 },
  editorInput: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 14 },
  editorRow: { flexDirection: 'row', gap: 10 },
  editorActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  errorText: { color: '#F5693F', fontSize: 13 },
  smallPrimaryBtn: { alignSelf: 'flex-end', backgroundColor: '#C48B5A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioOuter: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#C48B5A' },
  radioOn: { backgroundColor: '#C48B5A' },
  countersRow: { flexDirection: 'row', gap: 8 },
  counterBox: { flex: 1, borderWidth: 1, borderColor: '#E6EBEF', borderRadius: 12, padding: 10 },
  counterBoxOn: { backgroundColor: '#F8F1EA', borderColor: '#F0D2BC' },
  counterLabel: { fontSize: 12, color: '#63778A' },
  counterVal: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  bankPicker: { borderWidth: 1, borderRadius: 12, padding: 8 },
  bankPickRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  editorChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E7C7A8', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  editorChipText: { color: '#C48B5A', fontWeight: '600', textTransform: 'capitalize' },
  editorChipX: { color: '#C48B5A', fontSize: 14 },
  phraseLabel: { fontSize: 13, fontWeight: '700' },
  customLineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uploadBox: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, minHeight: 110, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 12 },
  uploadIcon: { color: '#C48B5A', fontSize: 20, fontWeight: '700' },
  previewCard: { backgroundColor: '#FBF6F1', borderRadius: 18, padding: 16, gap: 8 },
  previewSound: { textAlign: 'center', color: '#C48B5A', fontSize: 28 },
  previewTitle: { textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#1E293B' },
  previewMeta: { textAlign: 'center', color: '#8B9AAB', fontSize: 12, marginBottom: 8 },
  previewHeading: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 6 },
  previewBody: { fontSize: 13, color: '#63778A', lineHeight: 18 },
  brownChip: { backgroundColor: '#C48B5A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  brownChipText: { color: '#FFFFFF', fontWeight: '700' },
  previewVisual: { height: 120, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },

  // Assign
  assignTitle: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  previewToggleBtn: { borderWidth: 1, borderColor: '#F0D2BC', backgroundColor: '#FFF8F3', borderRadius: 10, minHeight: 42, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  previewToggleText: { color: '#C48B5A', fontWeight: '700' },

  // Dropdown menu
  menuWrap: { flex: 1, gap: 6 },
  menuLabel: { fontSize: 14, fontWeight: '700' },
  menuControl: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  menuValue: { flex: 1, fontSize: 14 },
  dropdownMenu: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  dropdownOption: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  dropdownOptionText: { fontSize: 14 },
  checkSquare: { width: 16, height: 16, borderRadius: 3, borderWidth: 1.5, borderColor: '#C48B5A', alignItems: 'center', justifyContent: 'center' },
  checkSquareOn: { backgroundColor: '#C48B5A' },
  checkMark: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Audio demo card
  audioCard: { borderWidth: 1, borderColor: '#F0D2BC', backgroundColor: '#FFF8F3', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  audioPlay: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  audioPlayIcon: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  audioTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  audioMeta: { fontSize: 12, color: '#8B9AAB', marginTop: 2 },
  audioBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 22 },
  audioBar: { width: 4, borderRadius: 2, backgroundColor: '#F97316' },
});
