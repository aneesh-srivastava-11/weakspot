import { PatternType } from './types';

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
