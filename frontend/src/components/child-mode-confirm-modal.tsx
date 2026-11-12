import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

export interface ChildModeConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /**
   * 'dashboard' -> switches to /patient-dashboard with dashboard preview chip
   * 'practice'  -> switches to /sentences with activity preview chip
   */
  mode?: 'dashboard' | 'practice';
  childName?: string;
  childAvatar?: any;
  activityTitle?: string;
  activityLevel?: string;
  activityThumbnail?: any;
}

export function ChildModeConfirmModal({
  visible,
  onClose,
  onConfirm,
  mode,
  childName = 'your child',
  childAvatar,
  activityTitle,
  activityLevel,
  activityThumbnail,
}: ChildModeConfirmModalProps) {
  const activeMode: 'dashboard' | 'practice' =
    mode || (activityTitle ? 'practice' : 'dashboard');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Top Illustration / Duo Badge */}
          <View style={styles.badgeWrapper}>
            <Image
              source={require('../../assets/images/parent-mode-icon.png')}
              style={styles.badgeImage}
              contentFit="contain"
            />
          </View>

          {/* Modal Title */}
          <Text style={styles.title}>Switch to Child Mode?</Text>

          {/* Explanation Subtitle */}
          <Text style={styles.subtitle}>
            {activeMode === 'dashboard' ? (
              <>
                Ready to hand over to{' '}
                <Text style={styles.childNameHighlight}>{childName}</Text>? This will
                switch to the child-friendly dashboard.
              </>
            ) : (
              <>
                You are switching into Child Mode so{' '}
                <Text style={styles.childNameHighlight}>{childName}</Text> can practice
                and play this activity.
              </>
            )}
          </Text>

          {/* Target Preview Card */}
          {activeMode === 'dashboard' ? (
            <View style={styles.activityChip}>
              <View style={styles.thumbnailWrapper}>
                {childAvatar ? (
                  <Image
                    source={childAvatar}
                    style={styles.avatarThumbnailImage}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="sparkles" size={22} color="#F5A623" />
                )}
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle} numberOfLines={1}>
                  Child Dashboard
                </Text>
                <Text style={styles.activityLevel} numberOfLines={1}>
                  Games, daily practice & buddy rewards
                </Text>
              </View>
              <View style={styles.dashboardBadge}>
                <Ionicons name="sparkles" size={11} color="#F5A623" />
                <Text style={styles.dashboardBadgeText}>Explore</Text>
              </View>
            </View>
          ) : (
            activityTitle && (
              <View style={styles.activityChip}>
                {activityThumbnail ? (
                  <View style={styles.thumbnailWrapper}>
                    <Image
                      source={activityThumbnail}
                      style={styles.thumbnailImage}
                      contentFit="contain"
                    />
                  </View>
                ) : (
                  <View style={[styles.thumbnailWrapper, styles.thumbnailPlaceholder]}>
                    <Ionicons name="game-controller" size={22} color="#0D68AC" />
                  </View>
                )}
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {activityTitle}
                  </Text>
                  {activityLevel && (
                    <Text style={styles.activityLevel} numberOfLines={1}>
                      {activityLevel}
                    </Text>
                  )}
                </View>
                <View style={styles.readyBadge}>
                  <Ionicons name="play" size={11} color="#0D68AC" />
                  <Text style={styles.readyBadgeText}>Play</Text>
                </View>
              </View>
            )
          )}

          {/* Reassurance Safety Callout */}
          <View style={styles.safetyBox}>
            <Ionicons name="shield-checkmark" size={16} color="#48BB78" />
            <Text style={styles.safetyText}>
              {activeMode === 'dashboard'
                ? 'Parent Mode is protected by your Grown-Up Check PIN. Your child cannot access parent settings without it.'
                : 'You can return to Parent Mode at any time from the top menu.'}
            </Text>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            activeOpacity={0.85}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel={
              activeMode === 'dashboard'
                ? 'Confirm switch to Child Mode and open Child Dashboard'
                : 'Confirm switch to Child Mode and start practice'
            }
          >
            <Text style={styles.confirmButtonText}>
              {activeMode === 'dashboard' ? 'Go to Child Dashboard ▶' : 'Start Practice ▶'}
            </Text>
          </TouchableOpacity>

          {/* Secondary Action: Stay in Parent Mode */}
          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.7}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Stay in Parent Mode"
          >
            <Text style={styles.cancelButtonText}>Stay in Parent Mode</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 104, 172, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#E2F0FA',
    paddingTop: 26,
    paddingBottom: 20,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  badgeWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF6E5',
    borderWidth: 2,
    borderColor: '#FCD888',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  badgeImage: {
    width: 48,
    height: 48,
  },
  title: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 21,
    color: '#0D68AC',
    marginTop: 14,
    textAlign: 'center',
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13.5,
    color: '#4B6780',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
    paddingHorizontal: 6,
    includeFontPadding: false,
  },
  childNameHighlight: {
    fontFamily: 'SourGummy-Bold',
    color: '#0D68AC',
  },

  /* Activity Preview Chip */
  activityChip: {
    backgroundColor: '#F3F9FD',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2F0FA',
    padding: 10,
    width: '100%',
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumbnailWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F4FA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailPlaceholder: {
    backgroundColor: '#E2F0FA',
  },
  thumbnailImage: {
    width: 38,
    height: 38,
  },
  avatarThumbnailImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  activityInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 15,
    color: '#0D68AC',
    includeFontPadding: false,
  },
  activityLevel: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    color: '#7C93A8',
    marginTop: 2,
    includeFontPadding: false,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E2F0FA',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  readyBadgeText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 11,
    color: '#0D68AC',
    includeFontPadding: false,
  },
  dashboardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF4E0',
    borderWidth: 1,
    borderColor: '#FCD888',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dashboardBadgeText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 11,
    color: '#D48806',
    includeFontPadding: false,
  },

  /* Safety Reassurance Note */
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F4FAF6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4EEDF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
    width: '100%',
  },
  safetyText: {
    flex: 1,
    fontFamily: 'SourGummy-Medium',
    fontSize: 11.5,
    color: '#2E6949',
    lineHeight: 15,
    includeFontPadding: false,
  },

  /* Buttons */
  confirmButton: {
    backgroundColor: '#F5A623',
    borderRadius: 22,
    paddingVertical: 13,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#C47B09',
    shadowColor: '#C47B09',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 15.5,
    color: '#FFFFFF',
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
  cancelButton: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  cancelButtonText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 13,
    color: '#7C93A8',
    includeFontPadding: false,
  },
});

