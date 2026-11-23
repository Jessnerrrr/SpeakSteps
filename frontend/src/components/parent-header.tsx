import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ChildProfile, ChildProfileStore } from '@/data/child-profile-store';
import { ChildModeConfirmModal } from '@/components/child-mode-confirm-modal';
import { NotificationBellButton } from '@/components/notification-popover';
import { SignOutConfirmModal } from '@/components/sign-out-confirm-modal';

export interface ParentHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showBell?: boolean;
  onBellPress?: () => void;
  containerStyle?: ViewStyle;
  customLeftContent?: React.ReactNode;
}

export function ParentHeader({
  title = '',
  showBack = true,
  onBack,
  showBell = true,
  onBellPress,
  containerStyle,
  customLeftContent,
}: ParentHeaderProps) {
  const [childProfile, setChildProfile] = useState<ChildProfile>(
    ChildProfileStore.getProfile()
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChildConfirmModalVisible, setIsChildConfirmModalVisible] = useState(false);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);

  // Subscribe to live child profile updates
  useEffect(() => {
    const unsubscribe = ChildProfileStore.subscribe((updated) => {
      setChildProfile(updated);
    });
    return unsubscribe;
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/parent-dashboard' as any);
    }
  };

  const handleSwitchToChildMode = () => {
    setIsMenuOpen(false);
    setIsChildConfirmModalVisible(true);
  };

  const handleConfirmSwitchToChild = () => {
    setIsChildConfirmModalVisible(false);
    router.replace('/patient-dashboard' as any);
  };

  const handleLogOut = () => {
    setIsMenuOpen(false);
    setIsSignOutModalVisible(true);
  };

  const handleConfirmSignOut = () => {
    setIsSignOutModalVisible(false);
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace('/patient-login' as any);
  };

  return (
    <>
      <View style={[styles.topHeader, containerStyle]}>
        {/* Left Side: Back button (if enabled) + Title on the left */}
        <View style={styles.headerLeftGroup}>
          {showBack && (
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={22} color="#0D68AC" />
            </TouchableOpacity>
          )}

          {customLeftContent}

          <Text
            style={styles.headerTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
        </View>

        {/* Right Actions: Notification Bell + Hamburger Menu */}
        <View style={styles.headerRightActions}>
          {showBell && (
            <NotificationBellButton
              audience="parent"
              onPressOverride={onBellPress}
              onBeforeOpen={() => setIsMenuOpen(false)}
            />
          )}

          <TouchableOpacity
            style={styles.menuButton}
            activeOpacity={0.7}
            onPress={() => setIsMenuOpen((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={isMenuOpen ? 'Close menu' : 'Open menu'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isMenuOpen ? 'close' : 'menu'}
              size={22}
              color="#0D68AC"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* =========================================================================
          PARENT DROPDOWN MENU
          ========================================================================= */}
      {isMenuOpen && (
        <>
          {/* Backdrop to dismiss when tapping outside */}
          <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
            <View style={styles.menuBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.menuDropdownCard}>
            {/* Row 1: Switch to child mode (Directs to Child Dashboard) */}
            <TouchableOpacity
              style={styles.menuItemRow}
              activeOpacity={0.8}
              onPress={handleSwitchToChildMode}
              accessibilityRole="button"
              accessibilityLabel="Switch to child mode"
            >
              <Image
                source={childProfile.avatar}
                style={styles.menuChildAvatar}
                contentFit="cover"
              />
              <Text style={styles.menuItemText}>Switch to child mode</Text>
              <Ionicons name="chevron-forward" size={16} color="#F5A623" />
            </TouchableOpacity>

            {/* Soft Divider */}
            <View style={styles.menuDivider} />

            {/* Row 2: Log out (Protected by SignOutConfirmModal) */}
            <TouchableOpacity
              style={styles.menuItemRow}
              activeOpacity={0.8}
              onPress={handleLogOut}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <View style={styles.logoutIconBadge}>
                <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.menuItemText, styles.menuLogoutText]}>
                Log out
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#F5A623" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* =========================================================================
          PROTECTED PARENT MODALS (Standardized Across All Modules)
          ========================================================================= */}
      <ChildModeConfirmModal
        visible={isChildConfirmModalVisible}
        mode="dashboard"
        childName={childProfile.displayName}
        childAvatar={childProfile.avatar}
        onClose={() => setIsChildConfirmModalVisible(false)}
        onConfirm={handleConfirmSwitchToChild}
      />

      <SignOutConfirmModal
        visible={isSignOutModalVisible}
        onConfirm={handleConfirmSignOut}
        onClose={() => setIsSignOutModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    zIndex: 50,
  },
  headerLeftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 10,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'SourGummy-Bold',
    fontSize: 26,
    color: '#0D68AC',
    textAlign: 'left',
    includeFontPadding: false,
    letterSpacing: -0.3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D2E6F5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    flexShrink: 0,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D2E6F5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  /* Dropdown Backdrop & Floating Card */
  menuBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    zIndex: 90,
  },
  menuDropdownCard: {
    position: 'absolute',
    top: 66,
    right: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D2E6F5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 205,
    shadowColor: '#0D68AC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 10,
  },
  menuChildAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2F0FA',
  },
  logoutIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    fontFamily: 'SourGummy-Medium',
    fontSize: 13.5,
    color: '#0D68AC',
    includeFontPadding: false,
  },
  menuLogoutText: {
    color: '#FF6B6B',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#EDF4F9',
    marginVertical: 4,
  },
});