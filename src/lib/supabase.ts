import { createClient } from '@supabase/supabase-js';
import type { GmailAccount, TaskRecord } from '../types';

// Supabase project credentials provided by user
export const SUPABASE_PROJECT_ID = 'dhbkgvlnvutusgtbxbjh';
export const SUPABASE_URL =
  ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL as string) ||
  `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY =
  ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY as string) ||
  'sb_publishable_ZQmuchmsOocsGxd_oHhbFA_8okSZ-Fn';

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database record mapper utilities (handles snake_case and camelCase column formats)
export function mapDbToGmail(row: Record<string, unknown>): GmailAccount {
  return {
    id: String(row.id || ''),
    gmail: String(row.gmail || ''),
    encryptedPassword: String(
      row.encrypted_password ?? row.encryptedPassword ?? row.encryptedpassword ?? ''
    ),
    cardAdded: Boolean(row.card_added ?? row.cardAdded ?? row.cardadded ?? false),
    pointsAdded: Boolean(row.points_added ?? row.pointsAdded ?? row.pointsadded ?? false),
    isSelected: Boolean(row.is_selected ?? row.isSelected ?? row.isselected ?? false),
    createdAt: String(row.created_at ?? row.createdAt ?? row.createdat ?? new Date().toISOString()),
  };
}

export function mapDbToTask(row: Record<string, unknown>): TaskRecord {
  return {
    id: String(row.id || ''),
    gmailId: String(row.gmail_id ?? row.gmailId ?? row.gmailid ?? ''),
    gmailAddress: String(row.gmail_address ?? row.gmailAddress ?? row.gmailaddress ?? ''),
    date: String(row.date || ''),
    status: (row.status || 'pending') as TaskRecord['status'],
    questType: (row.quest_type ?? row.questType ?? row.questtype ?? 'none') as TaskRecord['questType'],
    gameName: String(row.game_name ?? row.gameName ?? row.gamename ?? ''),
    points: Number(row.points) || 0,
    completedAt: (row.completed_at ?? row.completedAt ?? undefined) as string | undefined,
    notes: (row.notes ?? undefined) as string | undefined,
  };
}

/**
 * Test connectivity with Supabase project
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('gmails').select('id').limit(1);
    if (error) {
      // If table doesn't exist yet (relation "gmails" does not exist), Supabase connection & auth are still active
      if (error.code === '42P01' || error.message.toLowerCase().includes('does not exist')) {
        return true;
      }
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase connection test error:', err);
    return false;
  }
}

/**
 * Save or update a single Gmail account in Supabase
 */
export async function syncGmailToSupabase(account: GmailAccount): Promise<void> {
  try {
    const snakePayload = {
      id: account.id,
      gmail: account.gmail,
      encrypted_password: account.encryptedPassword,
      card_added: account.cardAdded,
      points_added: account.pointsAdded,
      is_selected: account.isSelected,
      created_at: account.createdAt,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('gmails').upsert(snakePayload, { onConflict: 'id' });
    if (error && error.message.includes('column')) {
      // Fallback for camelCase schema
      const camelPayload = {
        id: account.id,
        gmail: account.gmail,
        encryptedPassword: account.encryptedPassword,
        cardAdded: account.cardAdded,
        pointsAdded: account.pointsAdded,
        isSelected: account.isSelected,
        createdAt: account.createdAt,
        updatedAt: new Date().toISOString(),
      };
      await supabase.from('gmails').upsert(camelPayload, { onConflict: 'id' });
    }
  } catch (error) {
    console.warn('Failed to sync Gmail to Supabase:', error);
  }
}

/**
 * Delete a Gmail account from Supabase
 */
export async function deleteGmailFromSupabase(id: string): Promise<void> {
  try {
    // Delete associated tasks first
    await supabase.from('tasks').delete().eq('gmail_id', id);
    await supabase.from('tasks').delete().eq('gmailId', id);
    // Delete account
    await supabase.from('gmails').delete().eq('id', id);
  } catch (error) {
    console.warn('Failed to delete Gmail from Supabase:', error);
  }
}

/**
 * Save or update a single Task in Supabase
 */
export async function syncTaskToSupabase(task: TaskRecord): Promise<void> {
  try {
    const snakePayload = {
      id: task.id,
      gmail_id: task.gmailId,
      gmail_address: task.gmailAddress,
      date: task.date,
      status: task.status,
      quest_type: task.questType,
      game_name: task.gameName || '',
      points: task.points || 0,
      completed_at: task.completedAt || null,
      notes: task.notes || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('tasks').upsert(snakePayload, { onConflict: 'id' });
    if (error && error.message.includes('column')) {
      const camelPayload = {
        id: task.id,
        gmailId: task.gmailId,
        gmailAddress: task.gmailAddress,
        date: task.date,
        status: task.status,
        questType: task.questType,
        gameName: task.gameName || '',
        points: task.points || 0,
        completedAt: task.completedAt || null,
        notes: task.notes || null,
        updatedAt: new Date().toISOString(),
      };
      await supabase.from('tasks').upsert(camelPayload, { onConflict: 'id' });
    }
  } catch (error) {
    console.warn('Failed to sync Task to Supabase:', error);
  }
}

/**
 * Save multiple tasks to Supabase in batch
 */
export async function syncTasksBatchToSupabase(tasks: TaskRecord[]): Promise<void> {
  if (tasks.length === 0) return;
  try {
    const snakePayloads = tasks.map((t) => ({
      id: t.id,
      gmail_id: t.gmailId,
      gmail_address: t.gmailAddress,
      date: t.date,
      status: t.status,
      quest_type: t.questType,
      game_name: t.gameName || '',
      points: t.points || 0,
      completed_at: t.completedAt || null,
      notes: t.notes || null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('tasks').upsert(snakePayloads, { onConflict: 'id' });
    if (error && error.message.includes('column')) {
      const camelPayloads = tasks.map((t) => ({
        id: t.id,
        gmailId: t.gmailId,
        gmailAddress: t.gmailAddress,
        date: t.date,
        status: t.status,
        questType: t.questType,
        gameName: t.gameName || '',
        points: t.points || 0,
        completedAt: t.completedAt || null,
        notes: t.notes || null,
        updatedAt: new Date().toISOString(),
      }));
      await supabase.from('tasks').upsert(camelPayloads, { onConflict: 'id' });
    }
  } catch (error) {
    console.warn('Failed to batch sync tasks to Supabase:', error);
  }
}

/**
 * Subscribe to real-time updates of Gmail accounts from Supabase
 */
export function subscribeToSupabaseGmails(
  onUpdate: (gmails: GmailAccount[]) => void,
  onError?: (error: Error) => void
): () => void {
  // Initial fetch
  supabase
    .from('gmails')
    .select('*')
    .then(({ data, error }) => {
      if (error) {
        console.warn('Initial gmails fetch warning:', error.message);
        if (onError) onError(new Error(error.message));
      } else if (data && data.length > 0) {
        const items = data.map((r) => mapDbToGmail(r as Record<string, unknown>));
        items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onUpdate(items);
      }
    });

  // Real-time changes subscription
  const channel = supabase
    .channel('realtime:public:gmails')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'gmails' },
      async () => {
        const { data } = await supabase.from('gmails').select('*');
        if (data) {
          const items = data.map((r) => mapDbToGmail(r as Record<string, unknown>));
          items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          onUpdate(items);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to real-time updates of Tasks from Supabase
 */
export function subscribeToSupabaseTasks(
  onUpdate: (tasks: TaskRecord[]) => void,
  onError?: (error: Error) => void
): () => void {
  // Initial fetch
  supabase
    .from('tasks')
    .select('*')
    .then(({ data, error }) => {
      if (error) {
        console.warn('Initial tasks fetch warning:', error.message);
        if (onError) onError(new Error(error.message));
      } else if (data && data.length > 0) {
        const items = data.map((r) => mapDbToTask(r as Record<string, unknown>));
        onUpdate(items);
      }
    });

  // Real-time changes subscription
  const channel = supabase
    .channel('realtime:public:tasks')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      async () => {
        const { data } = await supabase.from('tasks').select('*');
        if (data) {
          const items = data.map((r) => mapDbToTask(r as Record<string, unknown>));
          onUpdate(items);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Wipes all records from Supabase tables (gmails & tasks)
 */
export async function clearAllSupabaseData(): Promise<boolean> {
  try {
    await supabase.from('tasks').delete().neq('id', '___safe_delete_all___');
    await supabase.from('gmails').delete().neq('id', '___safe_delete_all___');
    return true;
  } catch (error) {
    console.warn('Failed to clear Supabase data:', error);
    return false;
  }
}
