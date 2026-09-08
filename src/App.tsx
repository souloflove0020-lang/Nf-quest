import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getGmails, 
  getTasks, 
  calculateAppStats, 
  getTodayDateString, 
  synchronizeDailyTasks, 
  initializeSampleDataIfEmpty,
  setAppLockStatus,
  saveGmailsFromCloud,
  saveTasksFromCloud,
} from './lib/storage';
import { 
  subscribeToSupabaseGmails, 
  subscribeToSupabaseTasks, 
  testSupabaseConnection,
} from './lib/supabase';
import { GmailAccount, TaskRecord, AppStats } from './types';
import { Navbar, TabType } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { GmailListView } from './components/GmailListView';
import { TasksView } from './components/TasksView';
import { MyWorkSheetView } from './components/MyWorkSheetView';

export default function App() {
  // Automatic date tracking (Bangladesh Time)
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayDateString());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [gmails, setGmails] = useState<GmailAccount[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [, setIsCloudConnected] = useState<boolean>(false);
  const [stats, setStats] = useState<AppStats>({
    totalPoints: 0,
    todayPoints: 0,
    last7DaysPoints: 0,
    totalGmailCount: 0,
    selectedGmailCount: 0,
    totalCompletedTasks: 0,
    todayCompletedTasks: 0,
    todayIncompleteTasks: 0,
    totalQuestCompletedCount: 0,
    totalNoQuestDaysCount: 0,
  });

  // Load and sync data
  const refreshData = useCallback(() => {
    initializeSampleDataIfEmpty();
    const activeDate = getTodayDateString();
    setCurrentDate(activeDate);
    synchronizeDailyTasks(activeDate);
    const loadedGmails = getGmails();
    const loadedTasks = getTasks();
    const calculatedStats = calculateAppStats(activeDate);
    setGmails(loadedGmails);
    setTasks(loadedTasks);
    setStats(calculatedStats);
  }, []);

  useEffect(() => {
    // Ensure app is never locked
    setAppLockStatus(false);
    refreshData();

    const handleDataUpdate = () => {
      refreshData();
    };
    window.addEventListener('qpt_data_updated', handleDataUpdate);

    // Initial Supabase connectivity test
    testSupabaseConnection().then((connected) => {
      setIsCloudConnected(connected);
    });

    // Real-time Supabase sync listeners
    const unsubGmails = subscribeToSupabaseGmails((cloudGmails) => {
      const list = cloudGmails || [];
      if (list.length > 0) {
        saveGmailsFromCloud(list);
        setGmails(list);
        const activeDate = getTodayDateString();
        setStats(calculateAppStats(activeDate));
      }
      setIsCloudConnected(true);
    });

    const unsubTasks = subscribeToSupabaseTasks((cloudTasks) => {
      const list = cloudTasks || [];
      if (list.length > 0) {
        saveTasksFromCloud(list);
        setTasks(list);
        const activeDate = getTodayDateString();
        setStats(calculateAppStats(activeDate));
      }
      setIsCloudConnected(true);
    });

    // Automatic date update: check every 30 seconds if Bangladesh date has transitioned to a new day
    const dateInterval = setInterval(() => {
      const liveToday = getTodayDateString();
      if (liveToday !== currentDate) {
        setCurrentDate(liveToday);
        synchronizeDailyTasks(liveToday);
        refreshData();
      }
    }, 30000);

    return () => {
      window.removeEventListener('qpt_data_updated', handleDataUpdate);
      clearInterval(dateInterval);
      unsubGmails();
      unsubTasks();
    };
  }, [refreshData, currentDate]);

  // Today's tasks
  const todayTasks = useMemo(() => {
    return tasks.filter(t => t.date === currentDate);
  }, [tasks, currentDate]);

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#12160f] flex flex-col font-sans selection:bg-[#0c7a4b] selection:text-white">
      {/* Top Header & Bottom Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentDate={currentDate}
        selectedCount={stats.selectedGmailCount}
        pendingCount={stats.todayIncompleteTasks}
      />

      {/* Main Container - Responsive layout adapting to screen size */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            currentDate={currentDate}
            allTasks={tasks}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'gmail_list' && (
          <GmailListView
            gmails={gmails}
            allTasks={tasks}
            currentDate={currentDate}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            gmails={gmails}
            todayTasks={todayTasks}
            currentDate={currentDate}
            stats={stats}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'my_work' && (
          <MyWorkSheetView
            gmails={gmails}
            tasks={tasks}
            currentDate={currentDate}
          />
        )}
      </main>
    </div>
  );
}
