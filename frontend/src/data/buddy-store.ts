/**
 * SpeakSteps - Shared Buddy Store
 * 
 * Manages the active buddy selection across the app (Pick My Buddy <-> Patient Dashboard).
 * Provides a lightweight reactive state store without requiring heavy external dependencies.
 */

export interface Buddy {
  id: 'chirpy' | 'leo' | 'mimi' | 'lily' | 'bubbles' | 'freddy';
  name: string;
  species: string;
  spotlightGreeting: string;
  spotlightCta: string;
  dashboardSpeech: string;
  cardBgColor: string;
  cardBorderColor: string;
  cardDepthColor: string;
  image: any;
}

export const BUDDY_ROSTER: Record<string, Buddy> = {
  chirpy: {
    id: 'chirpy',
    name: 'CHIRPY',
    species: 'the chick',
    spotlightGreeting: "Hi I'm Chirpy the Chick!",
    spotlightCta: "Let's Chirp together!",
    dashboardSpeech: "Hi Mia! Let's play with Chirpy! 🎉",
    cardBgColor: '#FCECC4',
    cardBorderColor: '#F0D597',
    cardDepthColor: '#E4C075',
    image: require('@/assets/images/bird-logo.gif'),
  },
  leo: {
    id: 'leo',
    name: 'LEO',
    species: 'the lion',
    spotlightGreeting: "Hi I'm Leo the Lion!",
    spotlightCta: "Let's Roar together!",
    dashboardSpeech: "Hi Mia! Leo is ready to practice! 🦁",
    cardBgColor: '#FCE3DF',
    cardBorderColor: '#F5C7C0',
    cardDepthColor: '#E6ABA2',
    image: require('@/assets/images/buddies/leo.gif'),
  },
  mimi: {
    id: 'mimi',
    name: 'MIMI',
    species: 'the kitten',
    spotlightGreeting: "Hi I'm Mimi the Kitten!",
    spotlightCta: "Let's Purr together!",
    dashboardSpeech: "Hi Mia! Mimi wants to practice words! 🐱",
    cardBgColor: '#FCE6D2',
    cardBorderColor: '#F2CEB0',
    cardDepthColor: '#E5B690',
    image: require('@/assets/images/buddies/mimi.gif'),
  },
  lily: {
    id: 'lily',
    name: 'LILY',
    species: 'the bunny',
    spotlightGreeting: "Hi I'm Lily the Bunny!",
    spotlightCta: "Let's Hop together!",
    dashboardSpeech: "Hi Mia! Lily is hopping for joy! 🐰",
    cardBgColor: '#E0F7F6',
    cardBorderColor: '#C1ECE9',
    cardDepthColor: '#A1DCD8',
    image: require('@/assets/images/buddies/lily.gif'),
  },
  bubbles: {
    id: 'bubbles',
    name: 'BUBBLES',
    species: 'the whale',
    spotlightGreeting: "Hi I'm Bubbles the Whale!",
    spotlightCta: "Let's Splash together!",
    dashboardSpeech: "Hi Mia! Ready to make some big sounds? 🐳",
    cardBgColor: '#D4F7F9',
    cardBorderColor: '#B5EEF2',
    cardDepthColor: '#96DFE4',
    image: require('@/assets/images/buddies/bubbles.gif'),
  },
  freddy: {
    id: 'freddy',
    name: 'FREDDY',
    species: 'the frog',
    spotlightGreeting: "Hi I'm Freddy the Frog!",
    spotlightCta: "Let's Ribbit together!",
    dashboardSpeech: "Hi Mia! Freddy is ready to leap! 🐸",
    cardBgColor: '#DCF8D4',
    cardBorderColor: '#BDEEAF',
    cardDepthColor: '#9DDB8E',
    image: require('@/assets/images/buddies/freddy.gif'),
  },
};

// Global active buddy state with subscriber pattern
let currentActiveBuddyId: keyof typeof BUDDY_ROSTER = 'chirpy';
const listeners = new Set<(buddy: Buddy) => void>();

export const BuddyStore = {
  getActiveBuddy(): Buddy {
    return BUDDY_ROSTER[currentActiveBuddyId] || BUDDY_ROSTER.chirpy;
  },
  setActiveBuddy(id: keyof typeof BUDDY_ROSTER) {
    if (BUDDY_ROSTER[id]) {
      currentActiveBuddyId = id;
      const buddy = BUDDY_ROSTER[id];
      listeners.forEach((listener) => listener(buddy));
    }
  },
  subscribe(listener: (buddy: Buddy) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

