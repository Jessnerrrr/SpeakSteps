import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import type { RequestAttachment } from '../../data/center-admin';

const colors = {
  ink: '#17364D',
  muted: '#48657A',
  subtle: '#60788D',
  blue: '#0865AD',
  blueSoft: '#EAF7FF',
  line: '#D9E5EE',
  red: '#AD3B42',
  white: '#FFFFFF',
};

type DropEvent = {
  preventDefault?: () => void;
  stopPropagation?: () => void;
  nativeEvent?: {
    preventDefault?: () => void;
    stopPropagation?: () => void;
    dataTransfer?: DataTransfer;
    relatedTarget?: EventTarget | null;
  };
  dataTransfer?: DataTransfer;
  currentTarget?: HTMLElement;
  relatedTarget?: EventTarget | null;
};

export default function SupportingDocumentDropzone({
  value,
  onChange,
}: {
  value: RequestAttachment | null;
  onChange: (file: RequestAttachment | null) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const acceptFile = (file: { name: string; uri: string; type?: string | null; size?: number | null }) => {
    setError('');
    onChange({
      id: `closure-evidence-${Date.now()}`,
      fileName: file.name || 'Supporting document',
      uri: file.uri,
      mimeType: file.type || undefined,
      sizeBytes: file.size ?? undefined,
    });
  };

  const browseFiles = async () => {
    setError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: false, copyToCacheDirectory: true, base64: false });
      if (result.canceled || !result.assets[0]) return;
      const file = result.assets[0];
      acceptFile({ name: file.name, uri: file.uri, type: file.mimeType, size: file.size });
    } catch {
      setError('This file could not be attached. Try browsing for it again.');
    }
  };

  const preventDefault = (event: DropEvent) => {
    event.preventDefault?.();
    event.stopPropagation?.();
    event.nativeEvent?.preventDefault?.();
    event.nativeEvent?.stopPropagation?.();
  };

  const onDrop = (event: DropEvent) => {
    preventDefault(event);
    setDragging(false);
    const transfer = event.dataTransfer ?? event.nativeEvent?.dataTransfer;
    const file = transfer?.files?.[0];
    if (!file) return;
    try {
      acceptFile({ name: file.name, uri: URL.createObjectURL(file), type: file.type, size: file.size });
    } catch {
      setError('This file could not be attached. Try browsing for it instead.');
    }
  };

  const dragEvents = Platform.OS === 'web' ? {
    onDragEnter: (event: DropEvent) => { preventDefault(event); setDragging(true); },
    onDragOver: (event: DropEvent) => { preventDefault(event); setDragging(true); },
    onDragLeave: (event: DropEvent) => {
      const target = event.relatedTarget ?? event.nativeEvent?.relatedTarget;
      if (!target || !event.currentTarget?.contains(target as Node)) setDragging(false);
    },
    onDrop,
  } as any : {};

  const fileType = value?.mimeType?.startsWith('image/') ? 'Image' : value?.mimeType === 'application/pdf' || value?.fileName.toLowerCase().endsWith('.pdf') ? 'PDF document' : 'Supporting document';
  const sizeLabel = value?.sizeBytes ? value.sizeBytes < 1024 * 1024 ? `${Math.max(1, Math.round(value.sizeBytes / 1024))} KB` : `${(value.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : '';

  return <View
    {...dragEvents}
    style={[styles.dropzone, dragging && styles.dropzoneActive, value && styles.dropzoneSelected]}
    accessibilityLabel="Required supporting document upload"
  >
    {value ? <View style={styles.selectedFile}>
      <View style={styles.fileIcon}><Ionicons name={fileType === 'Image' ? 'image-outline' : 'document-text-outline'} size={19} color={colors.blue} /></View>
      <View style={styles.fileCopy}>
        <Text numberOfLines={1} style={styles.fileName}>{value.fileName}</Text>
        <Text style={styles.fileMeta}>{[fileType, sizeLabel].filter(Boolean).join(' · ')}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Replace supporting document" onPress={browseFiles} style={styles.action}>
        <Text style={styles.actionText}>Replace</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Remove supporting document" onPress={() => { onChange(null); setError(''); }} style={styles.action}>
        <Text style={styles.removeText}>Remove</Text>
      </Pressable>
    </View> : <Pressable accessibilityRole="button" accessibilityLabel="Choose required supporting document" onPress={browseFiles} style={styles.emptyTarget}>
      <View style={[styles.fileIcon, dragging && styles.fileIconActive]}><Ionicons name="cloud-upload-outline" size={21} color={colors.blue} /></View>
      <View style={styles.fileCopy}>
        <Text style={styles.prompt}>{dragging ? 'Drop to attach the file' : 'Drop a supporting document here'}</Text>
        <Text style={styles.helper}>{Platform.OS === 'web' ? 'or ' : ''}<Text style={styles.actionText}>browse files</Text><Text style={styles.helper}> · PDF, Word, or image</Text></Text>
      </View>
    </Pressable>}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </View>;
}

const styles = {
  dropzone: { minHeight: 82, borderWidth: 1, borderStyle: 'dashed' as const, borderColor: '#9DB8CB', borderRadius: 7, backgroundColor: '#FBFDFF', justifyContent: 'center' as const, paddingHorizontal: 12, paddingVertical: 10 },
  dropzoneActive: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  dropzoneSelected: { borderStyle: 'solid' as const, borderColor: colors.line, backgroundColor: colors.white },
  emptyTarget: { minHeight: 58, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 11, cursor: 'pointer' as const },
  selectedFile: { minHeight: 58, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 9 },
  fileIcon: { width: 38, height: 38, borderRadius: 6, backgroundColor: colors.blueSoft, alignItems: 'center' as const, justifyContent: 'center' as const },
  fileIconActive: { backgroundColor: colors.white },
  fileCopy: { flex: 1, minWidth: 0, gap: 3 },
  prompt: { color: colors.ink, fontFamily: 'Geist-SemiBold' as const, fontSize: 12, lineHeight: 17 },
  helper: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  fileName: { color: colors.ink, fontFamily: 'Geist-SemiBold' as const, fontSize: 12, lineHeight: 17 },
  fileMeta: { color: colors.subtle, fontSize: 10, lineHeight: 14 },
  action: { minHeight: 38, justifyContent: 'center' as const, paddingHorizontal: 6, cursor: 'pointer' as const },
  actionText: { color: colors.blue, fontFamily: 'Geist-Medium' as const, fontSize: 11, lineHeight: 16 },
  removeText: { color: colors.red, fontFamily: 'Geist-Medium' as const, fontSize: 11, lineHeight: 16 },
  error: { color: colors.red, fontSize: 11, lineHeight: 16, marginTop: 7 },
};
