import React from 'react';
import { 
  Trophy, 
  Flame, 
  CalendarRange, 
  Mail, 
  CheckCircle2, 
  Clock, 
  Award, 
  Sparkles, 
  AlertCircle,
  PlusCircle,
  TrendingUp,
  BarChart3,
  Layers
} from 'lucide-react';
import { AppStats, TaskRecord } from '../types';
import { formatFullDisplayDate, getLastNDays, getDayOfWeekAbbr } from '../lib/storage';
import { TabType } from './Navbar';

interface DashboardViewProps {
  stats: AppStats;
  currentDate: string;
  allTasks: TaskRecord[];
  onNavigate: (tab: TabType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  currentDate,
  allTasks,
  onNavigate,
}) => {
  // Calculate completion percentage
  const totalDailyTarget = stats.selectedGmailCount;
  const progressPercent = totalDailyTarget > 0 
    ? Math.min(100, Math.round((stats.todayCompletedTasks / totalDailyTarget) * 100)) 
    : 0;

  // Build 7-day points data for weekly chart
  const last7Days = getLastNDays(currentDate, 7);
  const chartData = last7Days.map((d) => {
    const dayTasks = allTasks.filter(t => t.date === d && t.status === 'completed');
    const dayPoints = dayTasks.reduce((acc, curr) => acc + (curr.points || 0), 0);
    const isToday = d === currentDate;
    const dayLabel = isToday ? 'Today' : getDayOfWeekAbbr(d);
    return {
      date: d,
      day: dayLabel,
      points: dayPoints,
      isToday,
    };
  });
  const maxPoints = Math.max(...chartData.map(d => d.points), 100);

  const fullDateFormatted = formatFullDisplayDate(currentDate);

  return (
    <div id="dashboard-view" className="flex flex-col gap-4">
      {/* 1. Hero / Welcome Card */}
      <section
        id="dashboard-hero"
        className="relative bg-[#14171a] rounded-[18px] p-5 sm:p-6 overflow-hidden before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#0c7a4b] after:content-[''] after:absolute after:-right-10 after:-top-10 after:w-36 after:h-36 after:rounded-full after:bg-[radial-gradient(circle,rgba(12,122,75,0.35),transparent_70%)] after:pointer-events-none"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8fe0b6] mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome back</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
            Daily Quest &amp; Points Overview
          </h2>
          <p className="text-xs sm:text-sm text-[#c7d1cb] mt-2 leading-relaxed max-w-xl">
            Today is <strong className="text-[#9fe6c1] font-semibold">{fullDateFormatted}</strong>. Track tasks and points across your selected Gmail accounts in real time.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-1">
            <button
              id="btn-hero-add-gmail"
              type="button"
              onClick={() => onNavigate('gmail_list')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#0c7a4b] hover:bg-[#095c3a] text-white text-xs font-semibold shadow-md shadow-[#0c7a4b]/30 active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Gmail List</span>
            </button>
            <button
              id="btn-hero-open-tasks"
              type="button"
              onClick={() => onNavigate('tasks')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-white/10 hover:bg-white/15 text-[#e7ece9] border border-white/15 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-[#e7ece9]" />
              <span>Open Tasks ({stats.todayIncompleteTasks})</span>
            </button>
            <button
              id="btn-hero-view-work"
              type="button"
              onClick={() => onNavigate('my_work')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-white/10 hover:bg-white/15 text-[#e7ece9] border border-white/15 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#e7ece9]" />
              <span>View My Work</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Today's Progress Card */}
      <section
        id="dashboard-progress-card"
        className="bg-white border border-[#e2e8e3] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(18,22,15,0.04),0_1px_0_rgba(18,22,15,0.03)]"
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#12160f]">
            <TrendingUp className="w-4 h-4 text-[#0c7a4b]" />
            <span>Today&apos;s Progress</span>
          </div>
          <div className="text-xs font-mono font-semibold text-[#7c8880]">
            {stats.todayCompletedTasks} / {totalDailyTarget}
          </div>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#eef4f0] border border-[#e2e8e3] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#095c3a] to-[#0c7a4b] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-[#7c8880] mt-2">
          <span>{progressPercent}% of tasks completed</span>
          {stats.todayIncompleteTasks > 0 ? (
            <span className="text-[#96751f] font-semibold">
              {stats.todayIncompleteTasks} accounts remaining
            </span>
          ) : totalDailyTarget > 0 ? (
            <span className="text-[#0c7a4b] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All tasks completed</span>
            </span>
          ) : (
            <span className="text-[#7c8880]">No active accounts</span>
          )}
        </div>
      </section>

      {/* 3. Key Metrics (Grid 3) */}
      <section id="dashboard-key-metrics" className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* Total Points */}
        <div className="bg-white border border-[#e2e8e3] rounded-[14px] p-3.5 border-t-[3px] border-t-[#96751f] flex flex-col justify-between gap-2 shadow-[0_1px_2px_rgba(18,22,15,0.03)]">
          <div className="flex items-center justify-between text-[#7c8880]">
            <span className="text-xs font-semibold">Total Points</span>
            <Trophy className="w-4 h-4 text-[#96751f]" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#12160f] tracking-tight">
              {stats.totalPoints.toLocaleString()}
            </div>
            <div className="text-[10.5px] text-[#7c8880] mt-0.5">All-time points earned</div>
          </div>
        </div>

        {/* Today's Points */}
        <div className="bg-white border border-[#e2e8e3] rounded-[14px] p-3.5 border-t-[3px] border-t-[#0c7a4b] flex flex-col justify-between gap-2 shadow-[0_1px_2px_rgba(18,22,15,0.03)]">
          <div className="flex items-center justify-between text-[#7c8880]">
            <span className="text-xs font-semibold">Today&apos;s Points</span>
            <Flame className="w-4 h-4 text-[#0c7a4b]" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#095c3a] tracking-tight">
              +{stats.todayPoints.toLocaleString()}
            </div>
            <div className="text-[10.5px] text-[#7c8880] mt-0.5">Points earned today</div>
          </div>
        </div>

        {/* Last 7 Days */}
        <div className="bg-white border border-[#e2e8e3] rounded-[14px] p-3.5 border-t-[3px] border-t-[#14171a] flex flex-col justify-between gap-2 col-span-2 sm:col-span-1 shadow-[0_1px_2px_rgba(18,22,15,0.03)]">
          <div className="flex items-center justify-between text-[#7c8880]">
            <span className="text-xs font-semibold">Last 7 Days</span>
            <CalendarRange className="w-4 h-4 text-[#14171a]" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#12160f] tracking-tight">
              {stats.last7DaysPoints.toLocaleString()}
            </div>
            <div className="text-[10.5px] text-[#7c8880] mt-0.5">Total points, last 7 days</div>
          </div>
        </div>
      </section>

      {/* 4. Account & Task Stats (Grid 4) */}
      <section id="dashboard-account-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Gmail */}
        <div className="bg-[#f6f8f7] border border-[#e2e8e3] rounded-[10px] p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[#4b564d] text-xs font-medium">
            <Mail className="w-3.5 h-3.5 text-[#0c7a4b]" />
            <span>Total Gmail</span>
          </div>
          <div className="text-lg font-bold text-[#12160f]">
            {stats.totalGmailCount}
          </div>
          <div className="text-[10px] text-[#7c8880]">Accounts connected</div>
        </div>

        {/* Selected Gmail */}
        <div className="bg-[#f6f8f7] border border-[#e2e8e3] rounded-[10px] p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[#4b564d] text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0c7a4b]" />
            <span>Selected Gmail</span>
          </div>
          <div className="text-lg font-bold text-[#12160f]">
            {stats.selectedGmailCount}
          </div>
          <div className="text-[10px] text-[#7c8880]">Card &amp; points confirmed</div>
        </div>

        {/* Completed Today */}
        <div className="bg-[#f6f8f7] border border-[#e2e8e3] rounded-[10px] p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[#4b564d] text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0c7a4b]" />
            <span>Completed Today</span>
          </div>
          <div className="text-lg font-bold text-[#12160f]">
            {stats.todayCompletedTasks}
          </div>
          <div className="text-[10px] text-[#7c8880]">Finished today</div>
        </div>

        {/* Incomplete Today */}
        <div className="bg-[#f6f8f7] border border-[#e2e8e3] rounded-[10px] p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[#4b564d] text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-[#0c7a4b]" />
            <span>Incomplete Today</span>
          </div>
          <div className="text-lg font-bold text-[#96751f]">
            {stats.todayIncompleteTasks}
          </div>
          <div className="text-[10px] text-[#7c8880]">Still remaining</div>
        </div>
      </section>

      {/* 5. Additional Stats (Grid 3b) */}
      <section id="dashboard-additional-stats" className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-[#f6f8f7] border border-[#e2e8e3] rounded-[10px] p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[#4b564d] text-xs font-medium">
            <Award className="w-3.5 h-3.5 text-[#0c7a4b]" />
            <span>Total Completed</span>
          </div>
          <div className="text-lg font-bold text-[#12160f]">
            {stats.totalCompletedTasks.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#7c8880]">Total completed tasks</div>
        </div>

        <div className="bg-[#f6f8f7] border border-[#e2e8e3] rounded-[10px] p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[#4b564d] text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#0c7a4b]" />
            <span>Quests Completed</span>
          </div>
          <div className="text-lg font-bold text-[#12160f]">
            {stats.totalQuestCompletedCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#7c8880]">Quests with points</div>
        </div>

        <div className="bg-[#f6f8f7] border border-[#e2e8e3] rounded-[10px] p-3 flex flex-col gap-1.5 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-[#4b564d] text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-[#0c7a4b]" />
            <span>No-Quest Days</span>
          </div>
          <div className="text-lg font-bold text-[#96751f]">
            {stats.totalNoQuestDaysCount}
          </div>
          <div className="text-[10px] text-[#7c8880]">Days with no quests</div>
        </div>
      </section>

      {/* 6. Weekly Points Chart */}
      <section
        id="dashboard-weekly-chart"
        className="bg-white border border-[#e2e8e3] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(18,22,15,0.04),0_1px_0_rgba(18,22,15,0.03)]"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#12160f]">
            <BarChart3 className="w-4 h-4 text-[#0c7a4b]" />
            <span>Weekly Points Chart</span>
          </div>
          <div className="text-xs text-[#7c8880] font-mono">
            Max: {maxPoints} pts
          </div>
        </div>

        {/* 7 Columns Chart */}
        <div className="grid grid-cols-7 items-end gap-1.5 h-32 border-b border-[#e2e8e3] pb-1 pt-3">
          {chartData.map((d, index) => {
            const heightPct = d.points > 0 ? Math.max(10, Math.round((d.points / maxPoints) * 100)) : 8;
            return (
              <div key={index} className="flex flex-col items-center justify-end h-full">
                {/* Points number */}
                <span
                  className={`text-[9.5px] font-mono mb-1 transition-colors ${
                    d.points > 0 ? 'text-[#095c3a] font-semibold' : 'text-[#7c8880]'
                  }`}
                >
                  {d.points > 0 ? d.points : '0'}
                </span>
                {/* Bar Track & Bar */}
                <div className="w-full max-w-[24px] h-full flex items-end mx-auto">
                  <div
                    className={`w-full rounded-t-[5px] transition-all duration-300 ${
                      d.isToday
                        ? 'bg-gradient-to-b from-[#0c7a4b] to-[#095c3a]'
                        : d.points > 0
                        ? 'bg-[#9fd8ba]'
                        : 'bg-[#eef4f0]'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                {/* Day label */}
                <span
                  className={`text-[9.5px] mt-2 whitespace-nowrap ${
                    d.isToday ? 'text-[#095c3a] font-bold' : 'text-[#7c8880]'
                  }`}
                >
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
