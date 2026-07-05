import { PracticeLog, TerminalLog, PatternType } from './types';

export const PATTERNS: PatternType[] = [
  'Sliding Window',
  'Two Pointers',
  'Dynamic Programming',
  'Graphs / Trees',
  'Backtracking',
  'Binary Search',
  'Greedy Algorithms',
  'Heaps / Queues'
];

export const INITIAL_LOGS: PracticeLog[] = [
  {
    id: 'log-1',
    problemTitle: 'Minimum Window Substring',
    pattern: 'Sliding Window',
    difficulty: 'Hard',
    result: 'Failed',
    mistakeNote: 'Slipped on window contraction boundary check. Decremented characters frequency hash too early, resulting in an off-by-one window expansion.',
    timestamp: new Date(Date.now() - 3600000 * 24 * 3) // 3 days ago
  },
  {
    id: 'log-2',
    problemTitle: 'Longest Common Subsequence',
    pattern: 'Dynamic Programming',
    difficulty: 'Medium',
    result: 'Solved with Hints',
    mistakeNote: 'Struggled with the state transition logic. Accidentally swapped row and column index states, causing incorrect memoized calculations.',
    timestamp: new Date(Date.now() - 3600000 * 24 * 2) // 2 days ago
  },
  {
    id: 'log-3',
    problemTitle: 'Course Schedule II',
    pattern: 'Graphs / Trees',
    difficulty: 'Medium',
    result: 'Failed',
    mistakeNote: 'Cycle detection failed because I tried to use a simple visited set instead of a three-state coloring recursive DFS (White/Grey/Black).',
    timestamp: new Date(Date.now() - 3600000 * 20) // 20 hours ago
  },
  {
    id: 'log-4',
    problemTitle: 'Unbounded Knapsack problem',
    pattern: 'Dynamic Programming',
    difficulty: 'Medium',
    result: 'Failed',
    mistakeNote: 'Failed to properly initialize the base cases inside the 1D state array. DP values were overwritten by default array elements.',
    timestamp: new Date(Date.now() - 3600000 * 12) // 12 hours ago
  },
  {
    id: 'log-5',
    problemTitle: 'Merge k Sorted Lists',
    pattern: 'Heaps / Queues',
    difficulty: 'Hard',
    result: 'Solved with Hints',
    mistakeNote: 'Overlooked the comparison operator logic on Custom Nodes. Heap sorted with standard references instead of actual node val values.',
    timestamp: new Date(Date.now() - 3600000 * 4) // 4 hours ago
  }
];

export const INITIAL_TERMINAL_LOGS: TerminalLog[] = [
  {
    id: 'term-1',
    timestamp: new Date(Date.now() - 3600000 * 24 * 3),
    method: 'remember',
    message: 'remember(): Pattern "Sliding Window" flagged. Added weak spot "Minimum Window Substring" (failureCount: 1).'
  },
  {
    id: 'term-2',
    timestamp: new Date(Date.now() - 3600000 * 24 * 2),
    method: 'remember',
    message: 'remember(): Pattern "Dynamic Programming" flagged. Added weak spot "Longest Common Subsequence" (failureCount: 1).'
  },
  {
    id: 'term-3',
    timestamp: new Date(Date.now() - 3600000 * 20),
    method: 'remember',
    message: 'remember(): Pattern "Graphs / Trees" flagged. Added weak spot "Course Schedule II" (failureCount: 1).'
  },
  {
    id: 'term-4',
    timestamp: new Date(Date.now() - 3600000 * 12),
    method: 'improve',
    message: 'improve(): Pattern "Dynamic Programming" failure density increased (failureCount: 2). Node size expanded.'
  },
  {
    id: 'term-5',
    timestamp: new Date(Date.now() - 3600000 * 4),
    method: 'remember',
    message: 'remember(): Pattern "Heaps / Queues" flagged. Added weak spot "Merge k Sorted Lists" (failureCount: 1).'
  },
  {
    id: 'term-6',
    timestamp: new Date(),
    method: 'system',
    message: 'system(): Initialized WeakSpot compiler. 4 weak spots active, 4 patterns clear. Ready for next query.'
  }
];

export interface NodePosition {
  pattern: PatternType;
  x: number; // percentage
  y: number; // percentage
}

export const NODE_POSITIONS: NodePosition[] = [
  { pattern: 'Sliding Window', x: 22, y: 35 },
  { pattern: 'Two Pointers', x: 34, y: 65 },
  { pattern: 'Dynamic Programming', x: 50, y: 25 },
  { pattern: 'Graphs / Trees', x: 72, y: 30 },
  { pattern: 'Backtracking', x: 55, y: 70 },
  { pattern: 'Binary Search', x: 85, y: 55 },
  { pattern: 'Greedy Algorithms', x: 76, y: 80 },
  { pattern: 'Heaps / Queues', x: 15, y: 75 }
];

export const NODE_CONNECTIONS: [PatternType, PatternType][] = [
  ['Two Pointers', 'Sliding Window'],
  ['Sliding Window', 'Heaps / Queues'],
  ['Two Pointers', 'Backtracking'],
  ['Backtracking', 'Dynamic Programming'],
  ['Graphs / Trees', 'Dynamic Programming'],
  ['Graphs / Trees', 'Binary Search'],
  ['Binary Search', 'Greedy Algorithms'],
  ['Heaps / Queues', 'Graphs / Trees']
];
