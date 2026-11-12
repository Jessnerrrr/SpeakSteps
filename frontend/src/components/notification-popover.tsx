import React, { useEffect, useState, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type HostInstance,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { BuddyStore } from '@/data/buddy-store';
import { ChildProfileStore } from '@/data/child-profile-store';
import {
  PatientNotificationsStore,
  type NotificationAudience,
  type PatientNotificationItem,
} from '@/data/patient-notifications-store';

export interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type ParentFilter = 'all' | 'unread';

interface NotificationBellIconProps {
  unreadCount: number;
  isActive: boolean;
  audience: NotificationAudience;
}

function NotificationBellVisual({
  unreadCount,
  isActive,
  audience,
}: NotificationBellIconProps) {
  const showCountBadge = audience === 'parent' && unreadCount > 0;
  const showDotBadge = audience === 'child' && unreadCount > 0;

  return (
    <View style={[styles.bellInnerCircle, isActive && styles.bellCircleActive]}>
      <Ionicons name="notifications-outline" size={16} color="#F5A623" />
      {showDotBadge && <View style={styles.childUnreadDot} />}
      {showCountBadge && (
        <View style={styles.parentUnreadBadge}>
          <Text style={styles.parentUnreadBadgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export interface NotificationPopoverProps {
  visible: boolean;
  audience: NotificationAudience;
  anchorRect: AnchorRect | null;
  onClose: () => void;
}

export function NotificationPopover({
  visible,
  audience,
  anchorRect,
  onClose,
}: NotificationPopoverProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const [notifications, setNotifications] = useState<PatientNotificationItem[]>(() =>
    PatientNotificationsStore.getNotifications(audience)
  );
  const [childDisplayName, setChildDisplayName] = useState<string>(
    () => ChildProfileStore.getProfile().displayName
  );
  const [parentFilter, setParentFilter] = useState<ParentFilter>('all');
  const [reduceMotion, setReduceMotion] = useState(false);

  const [entranceAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const sync = () => {
      setNotifications(PatientNotificationsStore.getNotifications(audience));
      setChildDisplayName(ChildProfileStore.getProfile().displayName);
    };

    sync();
    const unsubNotifs = PatientNotificationsStore.subscribe(sync);
    const unsubProfile = ChildProfileStore.subscribe(sync);
    const unsubBuddy = BuddyStore.subscribe(sync);

    return () => {
      unsubNotifs();
      unsubProfile();
      unsubBuddy();
    };
  }, [audience]);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => setReduceMotion(enabled)
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setParentFilter('all');
      entranceAnim.setValue(0);
      return;
    }

    if (reduceMotion) {
      entranceAnim.setValue(1);
      return;
    }

    entranceAnim.setValue(0);
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, reduceMotion, entranceAnim]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  const isChild = audience === 'child';
  const isTablet = width > 600;
  const unreadCount = notifications.filter((item) => !item.read).length;

  const displayedItems =
    !isChild && parentFilter === 'unread'
      ? notifications.filter((item) => !item.read)
      : notifications;

  const popoverWidth = Math.min(width - 28, isTablet ? 430 : 376);
  const bellWidth = anchorRect?.width ?? 32;
  const bellHeight = anchorRect?.height ?? 32;

  const fallbackCardRight = isTablet
    ? (width + Math.min(width - 20, 600)) / 2
    : width - 12;

  const bellCenterX = anchorRect
    ? anchorRect.x + bellWidth / 2
    : fallbackCardRight - 64;

  const desiredRightEdge = Math.min(width - 14, bellCenterX + 74);
  const popoverLeft = Math.max(14, desiredRightEdge - popoverWidth);

  const fallbackTop = Platform.OS === 'android' ? 74 : Math.max(insets.top + 66, 74);
  const minTop = Platform.OS === 'android' ? 48 : Math.max(insets.top + 48, 48);
  const rawTop = anchorRect ? anchorRect.y + bellHeight + 10 : fallbackTop;
  const popoverTop = Math.min(
    Math.max(rawTop, minTop),
    Math.max(minTop, height - 240)
  );

  const caretLeft = Math.max(
    20,
    Math.min(bellCenterX - popoverLeft - 11, popoverWidth - 42)
  );

  const listMaxHeight = Math.max(180, Math.min(height - popoverTop - insets.bottom - 120, 410));

  const surfaceColor = isChild ? '#C5E8FC' : '#EAF5FE';
  const borderColor = isChild ? '#98D0F2' : '#B5D9F2';

  const animatedCardStyle = {
    opacity: entranceAnim,
    transform: [
      {
        translateY: entranceAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-6, 0],
        }),
      },
      {
        scale: entranceAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.97, 1],
        }),
      },
    ],
  };

  const handleNotificationPress = (item: PatientNotificationItem) => {
    PatientNotificationsStore.markAsRead(item.id);
    if (!item.targetRoute) return;

    onClose();
    if (pathname !== item.targetRoute) {
      router.push(item.targetRoute as never);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot} pointerEvents="box-none">
        {/* Scrim Backdrop */}
        <Pressable
          style={[
            styles.backdropScrim,
            isChild ? styles.backdropScrimChild : styles.backdropScrimParent,
          ]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close notifications backdrop"
        />

        {/* Anchored Speech-Bubble Popover */}
        <Animated.View
          style={[
            styles.popoverShell,
            {
              top: popoverTop,
              left: popoverLeft,
              width: popoverWidth,
              backgroundColor: surfaceColor,
              borderColor,
            },
            animatedCardStyle,
          ]}
          accessibilityViewIsModal
        >
          {/* Anchored Upward Caret */}
          <View
            pointerEvents="none"
            style={[styles.caretWrapper, { left: caretLeft }]}
          >
            <Svg width={22} height={12} viewBox="0 0 22 12">
              <Path
                d="M1 12 L10.2 1.8 C10.65 1.3 11.35 1.3 11.8 1.8 L21 12 Z"
                fill={surfaceColor}
              />
              <Path
                d="M1 11.2 L10.2 1.8 C10.65 1.3 11.35 1.3 11.8 1.8 L21 11.2"
                stroke={borderColor}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </View>

          {/* Header Row */}
          <View style={styles.popoverHeader}>
            <View style={styles.popoverTitleGroup}>
              <View style={styles.headerBellGlyph}>
                <Ionicons
                  name="notifications-outline"
                  size={isChild ? 23 : 21}
                  color="#F5A623"
                />
                {unreadCount > 0 && <View style={styles.headerBellDot} />}
              </View>
              <Text style={[styles.popoverTitle, !isChild && styles.popoverTitleParent]}>
                Notifications
              </Text>
              {!isChild && unreadCount > 0 && (
                <View style={styles.newCountPill}>
                  <Text style={styles.newCountPillText}>{unreadCount} new</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              activeOpacity={0.75}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close notifications"
            >
              <Ionicons name="close" size={23} color="#0D68AC" />
            </TouchableOpacity>
          </View>

          {/* Parent Filter & Mark All Read Bar */}
          {!isChild && (
            <View style={styles.parentControlsRow}>
              <View style={styles.filterPillsGroup}>
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    parentFilter === 'all' && styles.filterPillActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setParentFilter('all')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: parentFilter === 'all' }}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      parentFilter === 'all' && styles.filterPillTextActive,
                    ]}
                  >
                    All ({notifications.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    parentFilter === 'unread' && styles.filterPillActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setParentFilter('unread')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: parentFilter === 'unread' }}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      parentFilter === 'unread' && styles.filterPillTextActive,
                    ]}
                  >
                    Unread ({unreadCount})
                  </Text>
                </TouchableOpacity>
              </View>

              {unreadCount > 0 ? (
                <TouchableOpacity
                  style={styles.markAllBtn}
                  activeOpacity={0.75}
                  onPress={() => PatientNotificationsStore.markAllAsRead('parent')}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel="Mark all notifications as read"
                >
                  <Ionicons name="checkmark-done" size={14} color="#0D68AC" />
                  <Text style={styles.markAllBtnText}>Mark all read</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.caughtUpChip}>
                  <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                  <Text style={styles.caughtUpChipText}>All read</Text>
                </View>
              )}
            </View>
          )}

          {/* Notification Items List */}
          <ScrollView
            style={{ maxHeight: listMaxHeight }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {displayedItems.length === 0 ? (
              <View style={styles.emptyCard}>
                <Image
                  source={require('../../assets/images/star-3d.png')}
                  style={styles.emptyImage}
                  contentFit="contain"
                />
                <Text style={styles.emptyTitle}>You&apos;re all caught up!</Text>
                <Text style={styles.emptySubtitle}>
                  No unread notifications for {childDisplayName}&apos;s account.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  activeOpacity={0.85}
                  onPress={() => setParentFilter('all')}
                >
                  <Text style={styles.emptyActionBtnText}>Show all notifications</Text>
                </TouchableOpacity>
              </View>
            ) : (
              displayedItems.map((item) => {
                const isUnread = !item.read;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.itemCard,
                      isUnread
                        ? isChild
                          ? styles.itemCardUnreadChild
                          : styles.itemCardUnreadParent
                        : isChild
                          ? styles.itemCardReadChild
                          : styles.itemCardReadParent,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => handleNotificationPress(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}. ${item.message}${isUnread ? '. Unread' : ''}`}
                  >
                    <View
                      style={[
                        styles.itemAvatarBadge,
                        isChild
                          ? styles.itemAvatarBadgeChild
                          : isUnread
                            ? styles.itemAvatarBadgeParentUnread
                            : styles.itemAvatarBadgeParentRead,
                      ]}
                    >
                      <Image
                        source={item.badgeImage}
                        style={styles.itemBadgeImage}
                        contentFit="contain"
                      />
                    </View>

                    <View style={styles.itemTextColumn}>
                      <View style={styles.itemTitleRow}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        {isUnread && <View style={styles.itemUnreadDot} />}
                      </View>

                      <Text style={styles.itemMessage}>{item.message}</Text>

                      {!isChild && (item.timeLabel || item.actionHint) && (
                        <View style={styles.itemMetaRow}>
                          {item.timeLabel ? (
                            <Text style={styles.itemTimeLabel}>{item.timeLabel}</Text>
                          ) : (
                            <View />
                          )}
                          {item.actionHint && (
                            <View style={styles.itemActionHint}>
                              <Text style={styles.itemActionHintText}>
                                {item.actionHint}
                              </Text>
                              <Ionicons
                                name="chevron-forward"
                                size={12}
                                color="#0D68AC"
                              />
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

export interface NotificationBellButtonProps {
  audience: NotificationAudience;
  onPressOverride?: () => void;
  onBeforeOpen?: () => void;
  buttonStyle?: StyleProp<ViewStyle>;
}

export function NotificationBellButton({
  audience,
  onPressOverride,
  onBeforeOpen,
  buttonStyle,
}: NotificationBellButtonProps) {
  const { width, height } = useWindowDimensions();
  const bellRef = useRef<HostInstance>(null);
  const [visible, setVisible] = useState(false);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);
  const [unreadCount, setUnreadCount] = useState(() =>
    PatientNotificationsStore.getUnreadCount(audience)
  );

  useEffect(() => {
    const sync = () => {
      setUnreadCount(PatientNotificationsStore.getUnreadCount(audience));
    };

    sync();
    const unsubNotifs = PatientNotificationsStore.subscribe(sync);
    const unsubProfile = ChildProfileStore.subscribe(sync);
    const unsubBuddy = BuddyStore.subscribe(sync);

    return () => {
      unsubNotifs();
      unsubProfile();
      unsubBuddy();
    };
  }, [audience]);

  useEffect(() => {
    if (!visible) return;
    const node = bellRef.current;
    if (node && typeof node.measureInWindow === 'function') {
      node.measureInWindow((x: number, y: number, w: number, h: number) => {
        if (w > 0 && h > 0) {
          setAnchorRect({ x, y, width: w, height: h });
        }
      });
    }
  }, [visible, width, height]);

  const handlePress = () => {
    if (onPressOverride) {
      onPressOverride();
      return;
    }

    onBeforeOpen?.();

    const node = bellRef.current;
    if (node && typeof node.measureInWindow === 'function') {
      node.measureInWindow((x: number, y: number, w: number, h: number) => {
        if (w > 0 && h > 0) {
          setAnchorRect({ x, y, width: w, height: h });
        } else {
          setAnchorRect(null);
        }
        setVisible(true);
      });
    } else {
      setAnchorRect(null);
      setVisible(true);
    }
  };

  return (
    <>
      <View ref={bellRef} collapsable={false}>
        <TouchableOpacity
          style={[styles.bellTouchTarget, buttonStyle]}
          activeOpacity={0.75}
          onPress={handlePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'View notifications'
          }
          accessibilityState={{ expanded: visible }}
        >
          <NotificationBellVisual
            unreadCount={unreadCount}
            isActive={visible}
            audience={audience}
          />
        </TouchableOpacity>
      </View>

      {!onPressOverride && (
        <NotificationPopover
          visible={visible}
          audience={audience}
          anchorRect={anchorRect}
          onClose={() => setVisible(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  bellTouchTarget: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellInnerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FBD27C',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.14,
    shadowRadius: 3,
    elevation: 2,
  },
  bellCircleActive: {
    backgroundColor: '#FFF7CE',
    borderColor: '#F5A623',
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 5,
  },
  childUnreadDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F97316',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  parentUnreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E65100',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  parentUnreadBadgeText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 9,
    color: '#FFFFFF',
    includeFontPadding: false,
  },

  modalRoot: {
    flex: 1,
  },
  backdropScrim: {
    ...StyleSheet.absoluteFill,
  },
  backdropScrimChild: {
    backgroundColor: 'rgba(13, 62, 105, 0.26)',
  },
  backdropScrimParent: {
    backgroundColor: 'rgba(11, 52, 89, 0.28)',
  },

  popoverShell: {
    position: 'absolute',
    borderRadius: 24,
    borderWidth: 1.5,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 14,
    shadowColor: '#07487E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 20,
  },
  caretWrapper: {
    position: 'absolute',
    top: -10.5,
    width: 22,
    height: 12,
    zIndex: 2,
  },

  popoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  popoverTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerBellGlyph: {
    position: 'relative',
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBellDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },
  popoverTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 21,
    color: '#0D68AC',
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  popoverTitleParent: {
    fontSize: 20,
  },
  newCountPill: {
    backgroundColor: '#FFF3C4',
    borderWidth: 1,
    borderColor: '#F5A623',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newCountPillText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 11,
    color: '#8D4E00',
    includeFontPadding: false,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  parentControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  filterPillsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#C2DFF4',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#0D68AC',
    borderColor: '#0D68AC',
  },
  filterPillText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12,
    color: '#0D68AC',
    includeFontPadding: false,
  },
  filterPillTextActive: {
    fontFamily: 'SourGummy-Bold',
    color: '#FFFFFF',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C2DFF4',
  },
  markAllBtnText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 11.5,
    color: '#0D68AC',
    includeFontPadding: false,
  },
  caughtUpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  caughtUpChipText: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 11.5,
    color: '#2E7D32',
    includeFontPadding: false,
  },

  listContent: {
    gap: 10,
    paddingBottom: 2,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 12,
    minHeight: 68,
  },
  itemCardUnreadChild: {
    backgroundColor: '#FFF7C8',
    borderWidth: 2,
    borderColor: '#0D68AC',
    borderBottomWidth: 3.5,
  },
  itemCardReadChild: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4B96CC',
    borderBottomWidth: 3,
  },
  itemCardUnreadParent: {
    backgroundColor: '#FFF9DC',
    borderWidth: 1.5,
    borderColor: '#0D68AC',
    borderBottomWidth: 3,
  },
  itemCardReadParent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBE2F4',
    borderBottomWidth: 2.5,
  },

  itemAvatarBadge: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemAvatarBadgeChild: {
    borderRadius: 24,
    backgroundColor: '#FFF2BC',
    borderWidth: 1.5,
    borderColor: '#E1C067',
  },
  itemAvatarBadgeParentUnread: {
    borderRadius: 16,
    backgroundColor: '#FFF1BE',
    borderWidth: 1.2,
    borderColor: '#E7CA78',
  },
  itemAvatarBadgeParentRead: {
    borderRadius: 16,
    backgroundColor: '#EFF7FD',
    borderWidth: 1.2,
    borderColor: '#D2E6F5',
  },
  itemBadgeImage: {
    width: 36,
    height: 36,
  },

  itemTextColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontFamily: 'SourGummy-Bold',
    fontSize: 14.5,
    color: '#0D68AC',
    lineHeight: 19,
  },
  itemUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5A623',
  },
  itemMessage: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12.5,
    color: '#254F73',
    lineHeight: 17,
    marginTop: 1,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  itemTimeLabel: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 11,
    color: '#4E7494',
  },
  itemActionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  itemActionHintText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 11.5,
    color: '#0D68AC',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#CBE2F4',
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyImage: {
    width: 44,
    height: 44,
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 16,
    color: '#0D68AC',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 12.5,
    color: '#254F73',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyActionBtn: {
    backgroundColor: '#0D68AC',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyActionBtnText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 12.5,
    color: '#FFFFFF',
  },
});
