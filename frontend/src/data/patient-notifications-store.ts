/**
 * SpeakSteps - Shared Patient (Child Mode) & Parent Notifications Store
 *
 * Uses shared assignment and practice data, with read state across both modes.
 */

import type { ImageSource } from 'expo-image';

import { BuddyStore } from './buddy-store';
import { ChildProfileStore } from './child-profile-store';
import { getLearningAssignments, subscribeLearningWorkflow } from './learning-workflow';
import { getPracticeSubmissions, PARTICIPATION_STARS, subscribePracticeSubmissions } from './practice-submissions';

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
  const activitiesCount = getLearningAssignments().filter((item) => item.studentId === childProfile.id && !item.submittedAt).length;

  return [
    {
      id: 'child-buddy-waiting',
      audience: 'child',
      title: `${buddyName} is waiting!`,
      message: activitiesCount ? `You have ${activitiesCount} assigned ${activitiesCount === 1 ? 'activity' : 'activities'} to try.` : 'Pick an activity in Play.',
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
  const assignments = getLearningAssignments().filter((item) => item.studentId === childProfile.id);
  const pending = assignments.filter((item) => !item.submittedAt);
  const stars = getPracticeSubmissions().length * PARTICIPATION_STARS;
  const feedbackItems = assignments.flatMap((item): PatientNotificationItem[] => {
    if (!item.feedback) return [];
    const id = 'parent-feedback:' + item.id + ':' + item.feedback.date;
    return [{
      id,
      audience: 'parent',
      title: 'Feedback from ' + item.feedback.reviewedBy,
      message: item.title + ' feedback is ready to read.',
      timeLabel: new Date(item.feedback.date).toLocaleDateString(),
      actionHint: 'View feedback',
      badgeImage: require('../../assets/images/therapist_blue.gif'),
      read: readState[id] ?? false,
      targetRoute: '/parent-therapist-feedback',
    }];
  });
  const pendingId = 'parent-pending:' + pending.map((item) => item.id).join('|');
  return [
    ...feedbackItems,
    ...(pending.length ? [{
      id: pendingId,
      audience: 'parent' as const,
      title: 'Activities to practice',
      message: childProfile.displayName + ' has ' + pending.length + (pending.length === 1 ? ' activity to practice.' : ' activities to practice.'),
      actionHint: 'View tasks',
      badgeImage: require('../../assets/images/sheep.png'),
      read: readState[pendingId] ?? false,
      targetRoute: '/parent-tasks',
    }] : []),
    ...(stars ? [{
      id: 'parent-milestone:' + stars,
      audience: 'parent' as const,
      title: childProfile.displayName + ' earned ' + stars + (stars === 1 ? ' star' : ' stars'),
      message: 'See completed practice in Progress & History.',
      actionHint: 'View progress',
      badgeImage: require('../../assets/images/star-3d.png'),
      read: readState['parent-milestone:' + stars] ?? true,
      targetRoute: '/parent-progress',
    }] : []),
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
    const unsubscribeAssignments = subscribeLearningWorkflow(listener);
    const unsubscribePractice = subscribePracticeSubmissions(listener);
    return () => {
      listeners.delete(listener);
      unsubscribeAssignments();
      unsubscribePractice();
    };
  },
};

