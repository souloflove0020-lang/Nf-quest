import { GmailAccount, TaskRecord, AppStats } from '../types';
import { encryptPassword, hashPin, DEFAULT_APP_PIN } from './crypto';
import {
  syncGmailToSupabase,
  deleteGmailFromSupabase,
  syncTaskToSupabase,
  syncTasksBatchToSupabase,
  clearAllSupabaseData,
} from './supabase';

const STORAGE_KEYS = {
  GMAILS: 'qpt_gmails_v1',
  TASKS: 'qpt_tasks_v1',
  PIN_HASH: 'qpt_pin_hash_v1',
  IS_PIN_SET: 'qpt_is_pin_set_v1',
  IS_LOCKED: 'qpt_is_locked_v1',
  DARK_MODE: 'qpt_dark_mode_v1',
  INITIALIZED: 'qpt_initialized_v1',
};

// Date utilities
export function getBangladeshTodayDateString(): string {
  try {
    const d = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    // fallback
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return getBangladeshTodayDateString();
}

export function getDaysInMonth(year: number, monthNumber: number): string[] {
  // monthNumber: 1 to 12
  const daysCount = new Date(year, monthNumber, 0).getDate();
  const result: string[] = [];
  const monthStr = String(monthNumber).padStart(2, '0');
  for (let d = 1; d <= daysCount; d++) {
    const dayStr = String(d).padStart(2, '0');
    result.push(`${year}-${monthStr}-${dayStr}`);
  }
  return result;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

export function formatFullDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getDayOfWeekAbbr(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  } catch {
    return dateStr;
  }
}

export function getLastNDays(currentDateStr: string, daysCount: number = 7): string[] {
  const result: string[] = [];
  const base = new Date(currentDateStr);
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    result.push(`${year}-${month}-${day}`);
  }
  return result;
}

// Gmail Accounts Storage
export function getGmails(): GmailAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GMAILS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGmails(gmails: GmailAccount[]): void {
  localStorage.setItem(STORAGE_KEYS.GMAILS, JSON.stringify(gmails));
  window.dispatchEvent(new Event('qpt_data_updated'));
}

export function saveGmailsFromCloud(gmails: GmailAccount[]): void {
  localStorage.setItem(STORAGE_KEYS.GMAILS, JSON.stringify(gmails));
}

export function addGmail(address: string, password: string): { success: boolean; message: string; account?: GmailAccount } {
  const cleaned = address.trim().toLowerCase();
  // Validation: format
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
  if (!gmailRegex.test(cleaned)) {
    return { success: false, message: 'Please enter a valid Gmail address (e.g. user@gmail.com).' };
  }
  const list = getGmails();
  // Validation: duplicate check
  if (list.some(g => g.gmail.toLowerCase() === cleaned)) {
    return { success: false, message: 'This Gmail account has already been added.' };
  }
  const newAccount: GmailAccount = {
    id: 'gm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    gmail: cleaned,
    encryptedPassword: encryptPassword(password),
    cardAdded: false,
    pointsAdded: false,
    isSelected: false,
    createdAt: new Date().toISOString(),
  };
  list.push(newAccount);
  saveGmails(list);
  // Live sync to Supabase
  syncGmailToSupabase(newAccount);
  return { success: true, message: 'Gmail account added successfully!', account: newAccount };
}

export function updateGmailCheckboxes(id: string, cardAdded: boolean, pointsAdded: boolean): GmailAccount | null {
  const list = getGmails();
  const index = list.findIndex(g => g.id === id);
  if (index === -1) return null;
  const current = list[index];
  // Rule: Once a checkbox is checked or account is selected, it CANNOT be unticked/deselected
  const finalCardAdded = current.cardAdded ? true : Boolean(cardAdded);
  const finalPointsAdded = current.pointsAdded ? true : Boolean(pointsAdded);
  const isSelected = finalCardAdded && finalPointsAdded;
  list[index] = {
    ...current,
    cardAdded: finalCardAdded,
    pointsAdded: finalPointsAdded,
    isSelected,
  };
  saveGmails(list);
  // Live sync to Supabase
  syncGmailToSupabase(list[index]);
  return list[index];
}

export function deleteGmail(id: string): boolean {
  const list = getGmails();
  const filtered = list.filter(g => g.id !== id);
  if (filtered.length !== list.length) {
    saveGmails(filtered);
    // Live delete from Supabase
    deleteGmailFromSupabase(id);
    return true;
  }
  return false;
}

// Tasks Storage
export function getTasks(): TaskRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: TaskRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  window.dispatchEvent(new Event('qpt_data_updated'));
}

export function saveTasksFromCloud(tasks: TaskRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

/**
 * Ensures daily task entries exist for the current date for all selected Gmails.
 * Also scans past dates: any Selected Gmail task that was pending or missing on a past date is marked 'absent'.
 */
export function synchronizeDailyTasks(currentDateStr: string): void {
  const gmails = getGmails();
  const tasks = getTasks();
  let tasksModified = false;

  // Selected Gmails
  const selectedGmails = gmails.filter(g => g.isSelected);

  // 1. Check existing pending tasks on past dates and mark as absent
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].date < currentDateStr && tasks[i].status === 'pending') {
      tasks[i].status = 'absent';
      tasks[i].points = 0;
      tasksModified = true;
    }
  }

  // 2. Ensure today's tasks exist for all currently selected Gmails
  for (const gm of selectedGmails) {
    const existing = tasks.find(t => t.gmailId === gm.id && t.date === currentDateStr);
    if (!existing) {
      tasks.push({
        id: 'tsk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        gmailId: gm.id,
        gmailAddress: gm.gmail,
        date: currentDateStr,
        status: 'pending',
        questType: 'none',
        points: 0,
      });
      tasksModified = true;
    }
  }

  // 3. Clean up: ensure no pending task exists for unselected accounts
  const selectedIdSet = new Set(selectedGmails.map(g => g.id));
  const filteredTasks = tasks.filter(t => {
    if (t.status === 'pending' && !selectedIdSet.has(t.gmailId)) {
      tasksModified = true;
      return false;
    }
    return true;
  });

  if (tasksModified) {
    saveTasks(filteredTasks);
    // Sync batch of today's tasks to Supabase
    syncTasksBatchToSupabase(filteredTasks);
  }
}

export function submitDailyTask(params: {
  gmailId: string;
  date: string;
  hasQuest: boolean;
  gameName?: string;
  points?: number;
}): { success: boolean; task?: TaskRecord } {
  const { gmailId, date, hasQuest, gameName, points } = params;
  const tasks = getTasks();
  const gmails = getGmails();
  const gm = gmails.find(g => g.id === gmailId);
  // Security guard: Only selected accounts can submit tasks
  if (!gm || !gm.isSelected) {
    return { success: false };
  }
  const gmailAddress = gm.gmail;
  const existingIndex = tasks.findIndex(t => t.gmailId === gmailId && t.date === date);

  let updatedTask: TaskRecord;
  if (hasQuest) {
    const cleanPoints = Math.max(0, Number(points) || 0);
    const cleanGame = (gameName || '').trim() || 'Quest';
    updatedTask = {
      id: existingIndex >= 0 ? tasks[existingIndex].id : 'tsk_' + Date.now(),
      gmailId,
      gmailAddress,
      date,
      status: 'completed',
      questType: 'quest',
      gameName: cleanGame,
      points: cleanPoints,
      completedAt: new Date().toISOString(),
    };
  } else {
    updatedTask = {
      id: existingIndex >= 0 ? tasks[existingIndex].id : 'tsk_' + Date.now(),
      gmailId,
      gmailAddress,
      date,
      status: 'no_quest',
      questType: 'no_quest',
      gameName: '',
      points: 0,
      completedAt: new Date().toISOString(),
    };
  }

  if (existingIndex >= 0) {
    tasks[existingIndex] = updatedTask;
  } else {
    tasks.push(updatedTask);
  }
  saveTasks(tasks);
  // Live sync task completion to Supabase
  syncTaskToSupabase(updatedTask);
  return { success: true, task: updatedTask };
}

// Calculate Dashboard and Global Stats
export function calculateAppStats(currentDateStr: string): AppStats {
  const gmails = getGmails();
  const tasks = getTasks();
  const totalGmailCount = gmails.length;
  const selectedGmailCount = gmails.filter(g => g.isSelected).length;

  let totalPoints = 0;
  let todayPoints = 0;
  let last7DaysPoints = 0;
  let totalCompletedTasks = 0;
  let todayCompletedTasks = 0;
  let totalQuestCompletedCount = 0;
  let totalNoQuestDaysCount = 0;

  const last7Days = new Set(getLastNDays(currentDateStr, 7));

  for (const t of tasks) {
    if (t.status === 'completed' && t.points > 0) {
      totalPoints += t.points;
      totalQuestCompletedCount++;
      if (t.date === currentDateStr) {
        todayPoints += t.points;
      }
      if (last7Days.has(t.date)) {
        last7DaysPoints += t.points;
      }
    }
    if (t.status === 'completed' || t.status === 'no_quest') {
      totalCompletedTasks++;
      if (t.date === currentDateStr) {
        todayCompletedTasks++;
      }
    }
    if (t.status === 'no_quest') {
      totalNoQuestDaysCount++;
    }
  }

  // Today Incomplete = Selected Gmails - Today's completed tasks
  const todayIncompleteTasks = Math.max(0, selectedGmailCount - todayCompletedTasks);

  return {
    totalPoints,
    todayPoints,
    last7DaysPoints,
    totalGmailCount,
    selectedGmailCount,
    totalCompletedTasks,
    todayCompletedTasks,
    todayIncompleteTasks,
    totalQuestCompletedCount,
    totalNoQuestDaysCount,
  };
}

// History for a specific Gmail (strictly showing quest completions with points)
export function getGmailQuestHistory(gmailId: string): TaskRecord[] {
  const tasks = getTasks();
  return tasks
    .filter(t => t.gmailId === gmailId && t.status === 'completed' && t.points > 0)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// Spreadsheet Matrix Data Builder
export interface SheetRow {
  gmail: GmailAccount;
  cells: Record<string, TaskRecord | undefined>;
}

export function getWorkSheetData(dateList: string[]): {
  rows: SheetRow[];
  dates: string[];
} {
  const gmails = getGmails();
  const tasks = getTasks();
  // Selected gmails or gmails that have historical tasks in these dates
  const selectedGmails = gmails.filter(g => g.isSelected);

  // Group tasks by gmailId and date
  const taskMap = new Map<string, TaskRecord>();
  for (const t of tasks) {
    taskMap.set(`${t.gmailId}_${t.date}`, t);
  }

  const rows: SheetRow[] = selectedGmails.map(gm => {
    const cells: Record<string, TaskRecord | undefined> = {};
    for (const d of dateList) {
      cells[d] = taskMap.get(`${gm.id}_${d}`);
    }
    return {
      gmail: gm,
      cells,
    };
  });

  return {
    rows,
    dates: dateList,
  };
}

// PIN and Security Storage
export function getPinSettings(): { isPinSet: boolean; pinHash: string | null; isLocked: boolean } {
  const storedIsSet = localStorage.getItem(STORAGE_KEYS.IS_PIN_SET);
  const isPinSet = storedIsSet !== null ? storedIsSet === 'true' : true; // Default to true (PIN: 147258)
  const pinHash = localStorage.getItem(STORAGE_KEYS.PIN_HASH);
  const isLocked = localStorage.getItem(STORAGE_KEYS.IS_LOCKED) !== 'false'; // default to locked
  return { isPinSet, pinHash, isLocked };
}

export function savePin(pinHash: string): void {
  localStorage.setItem(STORAGE_KEYS.PIN_HASH, pinHash);
  localStorage.setItem(STORAGE_KEYS.IS_PIN_SET, 'true');
  localStorage.setItem(STORAGE_KEYS.IS_LOCKED, 'false');
  window.dispatchEvent(new Event('qpt_pin_changed'));
}

export function setAppLockStatus(locked: boolean): void {
  localStorage.setItem(STORAGE_KEYS.IS_LOCKED, locked ? 'true' : 'false');
  window.dispatchEvent(new Event('qpt_pin_changed'));
}

// Initialize storage for a brand new, empty installation (no demo data)
export function initializeSampleDataIfEmpty(): void {
  const hasInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (hasInitialized) return;

  // Clean empty start: no demo Gmails, no demo Tasks
  localStorage.setItem(STORAGE_KEYS.GMAILS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  localStorage.setItem(STORAGE_KEYS.IS_PIN_SET, 'true');
  hashPin(DEFAULT_APP_PIN).then((h) => {
    if (!localStorage.getItem(STORAGE_KEYS.PIN_HASH)) {
      localStorage.setItem(STORAGE_KEYS.PIN_HASH, h);
    }
  });
}

/**
 * Wipes ALL data from both LocalStorage and Supabase Cloud Database
 */
export async function purgeAllDataAndResetStorage(): Promise<void> {
  // 1. Wipe local state
  localStorage.setItem(STORAGE_KEYS.GMAILS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
  // 2. Wipe Supabase tables
  await clearAllSupabaseData();
  // 3. Notify listeners
  window.dispatchEvent(new Event('qpt_data_updated'));
}

// Backup & Restore
export function exportAllData(): string {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    gmails: getGmails(),
    tasks: getTasks(),
    isPinSet: localStorage.getItem(STORAGE_KEYS.IS_PIN_SET) === 'true',
    pinHash: localStorage.getItem(STORAGE_KEYS.PIN_HASH),
    darkMode: localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true',
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonStr: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed.gmails) || !Array.isArray(parsed.tasks)) {
      return { success: false, message: 'Invalid backup format. Missing gmails or tasks array.' };
    }
    localStorage.setItem(STORAGE_KEYS.GMAILS, JSON.stringify(parsed.gmails));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(parsed.tasks));
    if (parsed.pinHash) {
      localStorage.setItem(STORAGE_KEYS.PIN_HASH, parsed.pinHash);
      localStorage.setItem(STORAGE_KEYS.IS_PIN_SET, 'true');
    }
    window.dispatchEvent(new Event('qpt_data_updated'));
    window.dispatchEvent(new Event('qpt_pin_changed'));
    return { success: true, message: 'Data restored successfully!' };
  } catch (err: unknown) {
    return { success: false, message: 'Failed to import data: ' + (err instanceof Error ? err.message : String(err)) };
  }
}
