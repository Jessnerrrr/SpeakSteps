/**
 * SpeakSteps - Shared Patient (Child Mode) & Parent Notifications Store
 *
 * Syncs live with ChildProfileStore, BuddyStore, TaskStore, and Parent Progress
 * feedback data using existing local assets, preserving read/unread state across
 * Child Mode and Parent Mode navigation.
 */

import type { ImageSource } from 'expo-image';

import { BuddyStore } from './buddy-store';
import { ChildProfileStore } from './child-profile-store';
import { MOCK_FEEDBACK_ITEMS } from './parent-progress-mock';
import { TaskStore } from './parent-tasks-mock';
import { MOCK_PATIENT_DASHBOARD } from './patient-dashboard-mock';

export type NotificationAudience = 'child' | 'parent';

export interface PatientNotificationItem {
  id: string;
  audience: NotificationAudience;
  title: string;
  message: string;
  timeLabel?: string;
  actionHint?: string;
  badgeImage: ImageSource;
  read: boolean;
  targetRoute?: string;
}

const initialReadState: Record<string, boolean> = {
  // Child Mode notifications
  'child-buddy-waiting': false,
  'child-great-job': true,
  'child-welcome': true,
  // Parent Mode notifications
  'parent-therapist-feedback': false,
  'parent-pending-tasks': false,
  'parent-milestone': true,
  'parent-daily-tip': true,
};

let readState: Record<string, boolean> = { ...initialReadState };
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function formatBuddyDisplayName(name: string): string {
  if (!name) return 'Chirpy';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function buildChildNotifications(): PatientNotificationItem[] {
  const childProfile = ChildProfileStore.getProfile();
  const activeBuddy = BuddyStore.getActiveBuddy();
  const buddyName = formatBuddyDisplayName(activeBuddy.name);
  const activitiesCount = MOCK_PATIENT_DASHBOARD.quickActions.activitiesCount;

  return [
    {
      id: 'child-buddy-waiting',
      audience: 'child',
      title: `${buddyName} is waiting!`,
      message: `You have ${activitiesCount} ${activitiesCount === 1 ? 'activity' : 'activities'} to play today.`,
      badgeImage: activeBuddy.image,
      read: readState['child-buddy-waiting'] ?? false,
      targetRoute: '/sentences',
    },
    {
      id: 'child-great-job',
      audience: 'child',
      title: `Great job, ${childProfile.displayName}!`,
      message: 'Every sound makes you stronger.',
      badgeImage: require('../../assets/images/trophy.png'),
      read: readState['child-great-job'] ?? true,
      targetRoute: '/patient-stars',
    },
    {
      id: 'child-welcome',
      audience: 'child',
      title: 'Welcome to SpeakSteps',
      message: "Let's make sounds together!",
      badgeImage: require('../../assets/images/medal.png'),
      read: readState['child-welcome'] ?? true,
    },
  ];
}

function buildParentNotifications(): PatientNotificationItem[] {
  const childProfile = ChildProfileStore.getProfile();
  const activities = TaskStore.getActivities();
  const pendingCount = activities.filter((item) => item.status === 'pending').length;
  const completedCount = activities.filter((item) => item.status === 'completed').length;
  const latestFeedback = MOCK_FEEDBACK_ITEMS[0];

  return [
    {
      id: 'parent-therapist-feedback',
      audience: 'parent',
      title: `New Feedback from ${latestFeedback?.therapistName ?? 'Teacher Jadey'}`,
      message: `${childProfile.displayName}'s ${latestFeedback?.title ?? 'practice'} note is ready to review.`,
      timeLabel: 'Today • 10:30 AM',
      actionHint: 'View feedback',
      badgeImage: require('../../assets/images/therapist_blue.gif'),
      read: readState['parent-therapist-feedback'] ?? false,
      targetRoute: '/parent-therapist-feedback',
    },
    {
      id: 'parent-pending-tasks',
      audience: 'parent',
      title: 'Pending Activities Waiting',
      message: `${pendingCount} assigned ${pendingCount === 1 ? 'activity is' : 'activities are'} ready for ${childProfile.displayName}.`,
      timeLabel: 'Today • 8:00 AM',
      actionHint: 'View tasks',
      badgeImage: require('../../assets/images/sheep.png'),
      read: readState['parent-pending-tasks'] ?? false,
      targetRoute: '/parent-tasks',
    },
    {
      id: 'parent-milestone',
      audience: 'parent',
      title: `${childProfile.displayName} Earned ${completedCount} Stars!`,
      message: 'Sounds & Words accuracy is improving. Check the latest progress report.',
      timeLabel: 'Yesterday',
      actionHint: 'View progress',
      badgeImage: require('../../assets/images/star-3d.png'),
      read: readState['parent-milestone'] ?? true,
      targetRoute: '/parent-progress',
    },
    {
      id: 'parent-daily-tip',
      audience: 'parent',
      title: 'Home Tip from Teacher Anna',
      message: 'Short 5-minute playful sessions help reinforce daily speech milestones.',
      timeLabel: 'Nov 4',
      actionHint: 'Open tasks',
      badgeImage: require('../../assets/images/teacher-icon.gif'),
      read: readState['parent-daily-tip'] ?? true,
      targetRoute: '/parent-tasks',
    },
  ];
}

export const PatientNotificationsStore = {
  getNotifications(audience: NotificationAudience): PatientNotificationItem[] {
    return audience === 'child'
      ? buildChildNotifications()
      : buildParentNotifications();
  },

  getUnreadCount(audience: NotificationAudience): number {
    return this.getNotifications(audience).filter((item) => !item.read).length;
  },

  markAsRead(id: string) {
    if (readState[id]) return;
    readState = { ...readState, [id]: true };
    notifyListeners();
  },

  markAllAsRead(audience: NotificationAudience) {
    const items = this.getNotifications(audience);
    const hasUnread = items.some((item) => !item.read);
    if (!hasUnread) return;

    const next = { ...readState };
    items.forEach((item) => {
      next[item.id] = true;
    });
    readState = next;
    notifyListeners();
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

