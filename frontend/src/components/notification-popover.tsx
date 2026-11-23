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

type NotificationFilter = 'all' | 'unread';

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
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>('all');
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
      .catch(() => { });

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
      setNotificationFilter('all');
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
    notificationFilter === 'unread'
      ? notifications.filter((item) => !item.read)
      : notifications;

  const popoverWidth = Math.min(width - 28, isTablet ? 360 : 330);
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

          <View style={styles.popoverHeader}>
            <Text accessibilityRole="header" style={styles.popoverTitle}>Notifications</Text>
            <View style={styles.filterPillsGroup}>
              {(['all', 'unread'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterPill, notificationFilter === filter && styles.filterPillActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: notificationFilter === filter }}
                  onPress={() => setNotificationFilter(filter)}
                >
                  <Text style={[styles.filterPillText, notificationFilter === filter && styles.filterPillTextActive]}>
                    {filter === 'all' ? 'All' : 'Unread'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close notifications">
              <Ionicons name="close" size={20} color="#0D68AC" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: listMaxHeight }} showsVerticalScrollIndicator={false}>
            {displayedItems.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>You're all caught up!</Text>
                <Text style={styles.emptySubtitle}>No {notificationFilter === 'unread' ? 'unread ' : ''}notifications for {childDisplayName}.</Text>
              </View>
            ) : displayedItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                activeOpacity={0.82}
                onPress={() => handleNotificationPress(item)}
                accessibilityRole="button"
                accessibilityLabel={item.title + '. ' + item.message + (item.read ? '' : '. Unread')}
              >
                <View style={styles.itemTextColumn}>
                  <View style={styles.itemTitleRow}>
                    {!item.read && <View style={styles.itemUnreadDot} />}
                    <Text style={styles.itemTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.itemMessage}>{item.message}</Text>
                </View>
                {item.timeLabel ? <Text style={styles.itemTimeLabel}>{item.timeLabel}</Text> : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.markAllBtn, unreadCount === 0 && styles.markAllDisabled]}
            onPress={() => PatientNotificationsStore.markAllAsRead(audience)}
            accessibilityRole="button"
            disabled={unreadCount === 0}
          >
            <Text style={styles.markAllBtnText}>{unreadCount === 0 ? 'All caught up' : 'Mark All as Read'}</Text>
          </TouchableOpacity>
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
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellInnerCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  popoverTitle: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 21,
    color: '#0D68AC',
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#EDF7FE',
  },
  markAllDisabled: { opacity: 0.65 },
  markAllBtnText: {
    fontFamily: 'SourGummy-Bold',
    fontSize: 11.5,
    color: '#0D68AC',
    includeFontPadding: false,
  },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DCEBF6',
    paddingVertical: 10,
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
  itemTimeLabel: {
    fontFamily: 'SourGummy-Medium',
    fontSize: 11,
    color: '#4E7494',
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
});
