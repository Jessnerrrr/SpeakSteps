import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { RequestAttachment, RequestEvent } from '../../data/center-admin';

const colors = {
  ink: '#17364D',
  muted: '#48657A',
  subtle: '#60788D',
  blue: '#0865AD',
  blueSoft: '#EAF7FF',
  line: '#D9E5EE',
  white: '#FFFFFF',
  red: '#AD3B42',
  redSoft: '#FDEBED',
};

type AttachmentGroup = {
  id: string;
  title: string;
  actor?: string;
  date?: string;
  files: RequestAttachment[];
};

function attachmentKind(file: RequestAttachment) {
  const mimeType = file.mimeType?.toLowerCase() ?? '';
  const fileName = file.fileName.toLowerCase();
  if (mimeType.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic)$/i.test(fileName)) return 'image';
  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) return 'pdf';
  return 'document';
}

function fileType(file: RequestAttachment) {
  const extension = file.fileName.split('.').pop();
  if (extension && extension !== file.fileName) return extension.toUpperCase();
  return file.mimeType?.split('/').pop()?.toUpperCase() ?? 'FILE';
}

function fileSize(bytes?: number) {
  if (!bytes || bytes <= 0) return '';
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date?: string) {
  if (!date) return '';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? '' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
}

function AttachmentRow({ file, onPreview }: { file: RequestAttachment; onPreview: (file: RequestAttachment) => void }) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [opening, setOpening] = useState(false);
  const kind = attachmentKind(file);
  const metadata = [fileType(file), fileSize(file.sizeBytes)].filter(Boolean).join(' · ');

  const openFile = async () => {
    setOpenError(false);
    if (kind === 'image') {
      onPreview(file);
      return;
    }
    setOpening(true);
    try {
      await Linking.openURL(file.uri);
    } catch {
      setOpenError(true);
    } finally {
      setOpening(false);
    }
  };

  return <View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${file.fileName}, ${metadata}${kind === 'image' ? ', image preview' : ''}`} onPress={openFile} style={({ pressed, hovered }) => [styles.attachmentRow, hovered && styles.attachmentRowHover, pressed && styles.attachmentRowPressed]}>
      {kind === 'image' && !thumbnailFailed
        ? <Image source={{ uri: file.uri }} style={styles.thumbnail} contentFit="cover" onError={() => setThumbnailFailed(true)} accessibilityLabel={`Preview of ${file.fileName}`} />
        : <View style={[styles.fileIcon, kind === 'pdf' && styles.pdfIcon]}><Ionicons name={kind === 'image' ? 'image-outline' : kind === 'pdf' ? 'document-text-outline' : 'document-outline'} size={18} color={kind === 'pdf' ? colors.red : colors.blue} /></View>}
      <View style={styles.attachmentCopy}>
        <Text numberOfLines={1} style={styles.attachmentName}>{file.fileName}</Text>
        <Text style={styles.attachmentMetadata}>{metadata}</Text>
      </View>
      {opening ? <ActivityIndicator size="small" color={colors.blue} /> : <Ionicons name="open-outline" size={16} color={colors.subtle} />}
    </Pressable>
    {openError ? <Text accessibilityRole="alert" style={styles.openError}>This file could not be opened. Check that you still have access and try again.</Text> : null}
  </View>;
}

export default function SupportingAttachments({
  attachments = [],
  events = [],
  originalTitle = 'Original submission',
  originalSubmitter,
  originalSubmittedAt,
}: {
  attachments?: RequestAttachment[];
  events?: RequestEvent[];
  originalTitle?: string;
  originalSubmitter?: string;
  originalSubmittedAt?: string;
}) {
  const [preview, setPreview] = useState<RequestAttachment | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const groups: AttachmentGroup[] = [
    ...(attachments.length ? [{ id: 'original-submission', title: originalTitle, actor: originalSubmitter, date: originalSubmittedAt, files: attachments }] : []),
    ...events.filter((event) => event.attachments?.length).map((event) => ({ id: event.id, title: event.title, actor: event.actor, date: event.date, files: event.attachments! })),
  ];
  const fileCount = groups.reduce((total, group) => total + group.files.length, 0);

  return <>
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Supporting attachments</Text>
        {fileCount ? <Text style={styles.fileCount}>{fileCount} {fileCount === 1 ? 'file' : 'files'}</Text> : null}
      </View>
      {fileCount === 0 ? <View style={styles.emptyState}>
        <View style={styles.emptyIcon}><Ionicons name="attach-outline" size={17} color={colors.blue} /></View>
        <View style={styles.emptyCopy}><Text style={styles.emptyTitle}>No supporting attachments attached</Text><Text style={styles.groupMetadata}>Files provided with this request will appear here.</Text></View>
      </View> : null}
      {groups.map((group) => <View key={group.id} style={styles.group}>
        {groups.length > 1 || group.title !== 'Original submission' ? <Text style={styles.groupTitle}>{group.title}</Text> : null}
        {group.actor || group.date ? <Text style={styles.groupMetadata}>{[group.actor, formatDate(group.date)].filter(Boolean).join(' · ')}</Text> : null}
        <View style={styles.attachmentList}>{group.files.map((file) => <AttachmentRow key={file.id} file={file} onPreview={(selected) => { setPreview(selected); setPreviewFailed(false); setPreviewLoading(true); }} />)}</View>
      </View>)}
    </View>
    <Modal visible={Boolean(preview)} transparent animationType="fade" accessibilityViewIsModal onRequestClose={() => setPreview(null)}>
      <Pressable style={styles.previewOverlay} onPress={() => setPreview(null)}>
        <Pressable style={styles.previewDialog} onPress={(event) => event.stopPropagation()}>
          <View style={styles.previewHeader}>
            <Text numberOfLines={1} style={styles.previewTitle}>{preview?.fileName}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close image preview" onPress={() => setPreview(null)} style={styles.closeButton}><Ionicons name="close" size={19} color={colors.ink} /></Pressable>
          </View>
          {previewLoading && !previewFailed ? <ActivityIndicator style={styles.previewLoading} size="large" color={colors.blue} /> : null}
          {previewFailed ? <View style={styles.previewError} accessibilityRole="alert"><Ionicons name="image-outline" size={24} color={colors.red} /><Text style={styles.openError}>This image could not be loaded. Check that you still have access and try again.</Text></View> : preview ? <ScrollView contentContainerStyle={styles.previewImageWrap} maximumZoomScale={4} minimumZoomScale={1} centerContent><Image source={{ uri: preview.uri }} style={styles.previewImage} contentFit="contain" onLoad={() => setPreviewLoading(false)} onError={() => { setPreviewLoading(false); setPreviewFailed(true); }} accessibilityLabel={`Full image preview: ${preview.fileName}`} /></ScrollView> : null}
        </Pressable>
      </Pressable>
    </Modal>
  </>;
}

const styles = {
  section: { paddingTop: 17, paddingBottom: 14, borderTopWidth: 1, borderTopColor: colors.line },
  sectionHeading: { minHeight: 26, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: 10, marginBottom: 8 },
  sectionTitle: { color: colors.ink, fontFamily: 'Geist-SemiBold' as const, fontSize: 15, lineHeight: 20 },
  fileCount: { color: colors.muted, backgroundColor: '#F0F6FA', borderRadius: 12, overflow: 'hidden' as const, paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontFamily: 'Geist-SemiBold' as const },
  emptyState: { minHeight: 64, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, padding: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: '#FBFDFF' },
  emptyIcon: { width: 34, height: 34, alignItems: 'center' as const, justifyContent: 'center' as const, borderRadius: 6, backgroundColor: colors.blueSoft },
  emptyCopy: { flex: 1, minWidth: 0, gap: 2 },
  emptyTitle: { color: colors.ink, fontSize: 11, lineHeight: 16, fontFamily: 'Geist-SemiBold' as const },
  group: { marginTop: 6 },
  groupTitle: { color: colors.ink, fontSize: 11, lineHeight: 16, fontFamily: 'Geist-SemiBold' as const, marginBottom: 1 },
  groupMetadata: { color: colors.subtle, fontSize: 10, lineHeight: 15, marginBottom: 4 },
  attachmentList: { borderWidth: 1, borderColor: colors.line, borderRadius: 8, overflow: 'hidden' as const },
  attachmentRow: { minHeight: 58, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.white },
  attachmentRowHover: { backgroundColor: '#F7FAFC' },
  attachmentRowPressed: { backgroundColor: colors.blueSoft },
  thumbnail: { width: 36, height: 36, borderRadius: 5, backgroundColor: '#F0F6FA' },
  fileIcon: { width: 36, height: 36, borderRadius: 5, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: colors.blueSoft },
  pdfIcon: { backgroundColor: colors.redSoft },
  attachmentCopy: { flex: 1, minWidth: 0, gap: 2 },
  attachmentName: { color: colors.ink, fontSize: 12, lineHeight: 17, fontFamily: 'Geist-SemiBold' as const },
  attachmentMetadata: { color: colors.muted, fontSize: 10, lineHeight: 14 },
  openError: { color: colors.red, fontSize: 11, lineHeight: 16, marginTop: 4 },
  previewOverlay: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: 'rgba(14, 38, 56, 0.58)', padding: 18 },
  previewDialog: { width: '100%' as const, maxWidth: 900, maxHeight: '90%' as const, backgroundColor: colors.white, borderRadius: 10, padding: 14 },
  previewHeader: { minHeight: 42, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: 12, marginBottom: 8 },
  previewTitle: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 14, fontFamily: 'Geist-SemiBold' as const },
  closeButton: { width: 40, height: 40, alignItems: 'center' as const, justifyContent: 'center' as const, borderRadius: 7, backgroundColor: '#F0F6FA' },
  previewLoading: { marginVertical: 28 },
  previewImageWrap: { width: '100%' as const, minHeight: 180, maxHeight: 600, alignItems: 'center' as const, justifyContent: 'center' as const },
  previewImage: { width: '100%' as const, height: 560, maxHeight: 600 },
  previewError: { alignItems: 'center' as const, gap: 8, padding: 24 },
};
