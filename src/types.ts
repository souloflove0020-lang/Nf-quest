export type TaskStatus = 'pending' | 'completed' | 'no_quest' | 'absent';

export type QuestType = 'quest' | 'no_quest' | 'none';

export interface GmailAccount {
  id: string;
  gmail: string;
  encryptedPassword: string; // obfuscated / encoded
  cardAdded: boolean;
  pointsAdded: boolean;
  isSelected: boolean; // true if cardAdded && pointsAdded
  createdAt: string; // ISO string
}

export interface TaskRecord {
  id: string;
  gmailId: string;
  gmailAddress: string; // denormalized for historical integrity
  date: string; // YYYY-MM-DD format
  status: TaskStatus;
  questType: QuestType;
  gameName?: string;
  points: number; // 0 if no_quest or absent
  completedAt?: string; // ISO string
  notes?: string;
}

export interface AppSettings {
  pinHash: string | null;
  isPinSet: boolean;
  isLocked: boolean;
  darkMode: boolean;
}

export interface AppStats {
  totalPoints: number;
  todayPoints: number;
  last7DaysPoints: number;
  totalGmailCount: number;
  selectedGmailCount: number;
  totalCompletedTasks: number;
  todayCompletedTasks: number;
  todayIncompleteTasks: number;
  totalQuestCompletedCount: number;
  totalNoQuestDaysCount: number;
}
