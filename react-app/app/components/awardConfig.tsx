export type AwardConfig = {
  icon: string;
  colorClass: string;
  group: 'Hall of Fame' | 'Hall of Shame' | 'Bests and Worsts' | 'Draft Strategy' | 'Curiosities';
};

// This single object is the source of truth for all award presentation.
export const awardConfig: Record<string, AwardConfig> = {
  // --- Hall of Fame (Positive outcomes from skill & value) ---
  'Gold Pick': {
    icon: 'MilitaryTech',
    colorClass: 'text-yellow-400',
    group: 'Hall of Fame',
  },
  'Silver Pick': {
    icon: 'MilitaryTech',
    colorClass: 'text-slate-300',
    group: 'Hall of Fame',
  },
  'Bronze Pick': {
    icon: 'MilitaryTech',
    colorClass: 'text-amber-600',
    group: 'Hall of Fame',
  },
  'Draft Rank Value': {
    icon: 'BanknotesIcon',
    colorClass: 'text-green-500',
    group: 'Hall of Fame',
  },
  'Mid Round Magician': {
    icon: 'SparklesIcon',
    colorClass: 'text-violet-400',
    group: 'Hall of Fame',
  },
  'Sleeper God': {
    icon: 'god',
    colorClass: 'text-yellow-400',
    group: 'Hall of Fame',
  },
  'Deep Sea Fisher': {
    icon: 'Phishing',
    colorClass: 'text-cyan-400',
    group: 'Hall of Fame',
  },
  'The Opportunist': {
    icon: 'GiftIcon',
    colorClass: 'text-pink-500',
    group: 'Hall of Fame',
  },
  'Steady Studs': {
    icon: 'ShieldCheckIcon',
    colorClass: 'text-green-500',
    group: 'Hall of Fame',
  },
  'The Crystal Ball': {
    icon: 'crystalball',
    colorClass: 'text-purple-400',
    group: 'Hall of Fame',
  },
  'My Best Pick': {
    icon: 'HandThumbUpIcon',
    colorClass: 'text-green-500',
    group: 'Bests and Worsts',
  },
  'The Nostradamus': {
    icon: 'AcademicCapIcon',
    colorClass: 'text-yellow-400',
    group: 'Hall of Fame',
  },
  'QB Scout': {
    icon: 'MagnifyingGlassIcon',
    colorClass: 'text-cyan-400',
    group: 'Draft Strategy',
  },
  'RB Scout': {
    icon: 'MagnifyingGlassIcon',
    colorClass: 'text-cyan-400',
    group: 'Draft Strategy',
  },
  'WR Scout': {
    icon: 'MagnifyingGlassIcon',
    colorClass: 'text-cyan-400',
    group: 'Draft Strategy',
  },
  'TE Scout': {
    icon: 'MagnifyingGlassIcon',
    colorClass: 'text-cyan-400',
    group: 'Draft Strategy',
  },
  'K Scout': {
    icon: 'MagnifyingGlassIcon',
    colorClass: 'text-cyan-400',
    group: 'Draft Strategy',
  },

  // --- Hall of Shame (Negative outcomes from mistakes & bad luck) ---
  'The Anchor': {
    icon: 'Anchor',
    colorClass: 'text-slate-500',
    group: 'Hall of Fame',
  },
  'The Reacher': {
    icon: 'ArrowTrendingUpIcon',
    colorClass: 'text-orange-500',
    group: 'Hall of Shame',
  },
  'My Worst Pick': {
    icon: 'TrashIcon',
    colorClass: 'text-red-500',
    group: 'Bests and Worsts',
  },
  'Ryan Leaf Trophy': {
    icon: 'ryanleaf',
    colorClass: 'text-red-500',
    group: 'Hall of Shame',
  },
  'The Mirage': {
    icon: 'spy',
    colorClass: 'text-orange-500',
    group: 'Hall of Shame',
  },
  'Grim Reaper': {
    icon: 'grim',
    colorClass: 'text-red-500',
    group: 'Hall of Shame',
  },
  'The Toilet Award': {
    icon: 'toilet',
    colorClass: 'text-red-500',
    group: 'Hall of Shame',
  },

  // --- Draft Strategy (Neutral observations of drafting style) ---
  'Draft Rank Overall': {
    icon: 'Diamond',
    colorClass: 'text-yellow-400',
    group: 'Hall of Fame',
  },
  'The ADP Slave': {
    icon: 'ClipboardDocumentListIcon',
    colorClass: 'text-blue-400',
    group: 'Draft Strategy',
  },
  'Zero-RB Disciple': {
    icon: 'MinusCircleIcon',
    colorClass: 'text-blue-400',
    group: 'Draft Strategy',
  },
  'QB Hoarder': {
    icon: 'QueueListIcon',
    colorClass: 'text-blue-400',
    group: 'Draft Strategy',
  },

  // --- Curiosities (Interesting facts, observations, and luck-based outcomes) ---
  'The Lottery Winner': {
    icon: 'TicketIcon',
    colorClass: 'text-green-500', // Still positive, but luck-based
    group: 'Curiosities',
  },
  'The Homer': {
    icon: 'HomeIcon',
    colorClass: 'text-blue-400',
    group: 'Curiosities',
  },
  'Cougar Chaser': {
    icon: 'ElderlyWoman',
    colorClass: 'text-orange-500',
    group: 'Curiosities',
  },
  'Cradle Robber': {
    icon: 'ChildFriendly',
    colorClass: 'text-blue-400',
    group: 'Curiosities',
  },
  'Iron Man': {
    icon: 'FitnessCenter',
    colorClass: 'text-green-500', // Still positive, but luck-based
    group: 'Curiosities',
  },
};