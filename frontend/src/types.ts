export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type PatternType =
  | 'Sliding Window'
  | 'Two Pointers'
  | 'Dynamic Programming'
  | 'Graphs / Trees'
  | 'Backtracking'
  | 'Binary Search'
  | 'Greedy Algorithms'
  | 'Heaps / Queues';

export type PracticeResult = 'Solved' | 'Solved with Hints' | 'Failed';

export interface PracticeLog {
  id: string;
  problemTitle: string;
  pattern: PatternType;
  difficulty: Difficulty;
  result: PracticeResult;
  mistakeNote: string;
  timestamp: string | Date;
  status?: string; // "active_weak_spot" | "mastered_forgotten"
}

export interface WeakSpotState {
  pattern: PatternType;
  failureCount: number;
  isMastered: boolean;
  lastUpdated: string | Date;
}

export interface TerminalLog {
  id: string;
  timestamp: string | Date;
  method: 'remember' | 'recall' | 'improve' | 'forget' | 'system';
  message: string;
}

export type ActiveScreen = 'Dashboard' | 'Pricing' | 'Billing' | 'Login' | 'Onboarding';

export interface UserState {
  email: string | null;
  tier: 'Free' | 'Pro';
  geminiApiKey: string | null;
  logsCountToday: number;
}
