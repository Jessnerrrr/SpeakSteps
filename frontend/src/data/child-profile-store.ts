/**
 * SpeakSteps - Shared Child Profile Store
 * 
 * Manages the active child profile across the application.
 * Enables live synchronization between Parent Mode and Child Dashboard.
 */

export interface ChildProfile {
  id: string;
  fullName: string;
  displayName: string;
  age: number;
  avatar: any;
}

export const PRESET_CHILD_AVATARS = [
  { id: 'mia', label: 'Default Mia', image: require('../../assets/images/child-avatar.png') },
  { id: 'kid_yellow', label: 'Active Kid', image: require('../../assets/images/kid_yellow.gif') },
  { id: 'parent_mode', label: 'Parent & Child', image: require('../../assets/images/parent-mode-icon.png') },
  { id: 'chirpy', label: 'Chirpy Chick', image: require('../../assets/images/bird-logo.gif') },
  { id: 'leo', label: 'Leo the Lion', image: require('../../assets/images/buddies/leo.gif') },
  { id: 'lily', label: 'Lily the Bunny', image: require('../../assets/images/buddies/lily.gif') },
  { id: 'bubbles', label: 'Bubbles Whale', image: require('../../assets/images/buddies/bubbles.gif') },
  { id: 'freddy', label: 'Freddy Frog', image: require('../../assets/images/buddies/freddy.gif') },
  { id: 'mimi', label: 'Mimi Kitten', image: require('../../assets/images/buddies/mimi.gif') },
];

const DEFAULT_CHILD_PROFILE: ChildProfile = {
  id: 'child-1',
  fullName: 'Mia Santos',
  displayName: 'Mia',
  age: 5,
  avatar: require('../../assets/images/child-avatar.png'),
};

let currentProfile: ChildProfile = { ...DEFAULT_CHILD_PROFILE };
const listeners = new Set<(profile: ChildProfile) => void>();

export const ChildProfileStore = {
  getProfile(): ChildProfile {
    return { ...currentProfile };
  },
  updateProfile(updates: Partial<ChildProfile>) {
    let displayName = updates.displayName || currentProfile.displayName;
    if (updates.fullName && !updates.displayName) {
      const parts = updates.fullName.trim().split(/\s+/);
      displayName = parts[0] || currentProfile.displayName;
    }

    currentProfile = {
      ...currentProfile,
      ...updates,
      displayName,
    };

    listeners.forEach((listener) => listener({ ...currentProfile }));
  },
  subscribe(listener: (profile: ChildProfile) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
