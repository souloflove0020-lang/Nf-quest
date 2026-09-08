import React, { useState, useMemo } from 'react';
import { 
  ListTodo, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Search, 
  Mail, 
  Gamepad2, 
  AlertCircle, 
  Check, 
  X,
  Trophy,
  ArrowRight,
  Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GmailAccount, TaskRecord, AppStats } from '../types';
import { submitDailyTask, formatFullDisplayDate } from '../lib/storage';
import { TabType } from './Navbar';

interface TasksViewProps {
  gmails: GmailAccount[];
  todayTasks: TaskRecord[];
  currentDate: string;
  stats: AppStats;
  onNavigate: (tab: TabType) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  gmails,
  todayTasks,
  currentDate,
  stats,
  onNavigate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'incomplete' | 'complete'>('incomplete');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected account for submission
  const [selectedTaskAccount, setSelectedTaskAccount] = useState<GmailAccount | null>(null);
  const [existingTaskToEdit, setExistingTaskToEdit] = useState<TaskRecord | null>(null);

  // Form State
  const [questChoice, setQuestChoice] = useState<'quest' | 'no_quest'>('quest');
  const [gameName, setGameName] = useState('');
  const [points, setPoints] = useState<string>('50');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Gmails only
  const selectedGmails = useMemo(() => {
    return gmails.filter(g => g.isSelected);
  }, [gmails]);

  // Map today's tasks by gmailId
  const taskMap = useMemo(() => {
    const map = new Map<string, TaskRecord>();
    for (const t of todayTasks) {
      map.set(t.gmailId, t);
    }
    return map;
  }, [todayTasks]);

  // Incomplete list: Selected Gmails that either have no task or have status === 'pending'
  const incompleteList = useMemo(() => {
    return selectedGmails.filter(gm => {
      const t = taskMap.get(gm.id);
      const isPending = !t || t.status === 'pending';
      const matchSearch = gm.gmail.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return isPending && matchSearch;
    });
  }, [selectedGmails, taskMap, searchQuery]);

  // Complete list: Selected Gmails that have status === 'completed' or 'no_quest'
  const completeList = useMemo(() => {
    return selectedGmails
      .map(gm => ({ account: gm, task: taskMap.get(gm.id) }))
      .filter(({ account, task }) => {
        if (!task) return false;
        const isDone = task.status === 'completed' || task.status === 'no_quest';
        const matchSearch = account.gmail.toLowerCase().includes(searchQuery.trim().toLowerCase());
        return isDone && matchSearch;
      });
  }, [selectedGmails, taskMap, searchQuery]);

  // Open Form
  const handleOpenSubmission = (account: GmailAccount, existingTask?: TaskRecord) => {
    setSelectedTaskAccount(account);
    setFormError('');
    if (existingTask && existingTask.status === 'completed') {
      setExistingTaskToEdit(existingTask);
      setQuestChoice('quest');
      setGameName(existingTask.gameName || '');
      setPoints(String(existingTask.points || 50));
    } else if (existingTask && existingTask.status === 'no_quest') {
      setExistingTaskToEdit(existingTask);
      setQuestChoice('no_quest');
      setGameName('');
      setPoints('0');
    } else {
      setExistingTaskToEdit(null);
      setQuestChoice('quest');
      setGameName('');
      setPoints('50');
    }
  };

  const handleCloseSubmission = () => {
    setSelectedTaskAccount(null);
    setExistingTaskToEdit(null);
    setFormError('');
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskAccount) return;
    setFormError('');
    setIsSubmitting(true);

    if (questChoice === 'quest') {
      if (!gameName.trim()) {
        setFormError('Please provide Game Name.');
        setIsSubmitting(false);
        return;
      }
      const numPoints = parseInt(points, 10);
      if (isNaN(numPoints) || numPoints <= 0) {
        setFormError('Please enter valid points (> 0).');
        setIsSubmitting(false);
        return;
      }
      submitDailyTask({
        gmailId: selectedTaskAccount.id,
        date: currentDate,
        hasQuest: true,
        gameName: gameName.trim(),
        points: numPoints,
      });
      // Joyful confetti for earning points
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#0c7a4b', '#12160f', '#fae2b8'],
        });
      } catch {
        // ignore
      }
    } else {
      // No quest
      submitDailyTask({
        gmailId: selectedTaskAccount.id,
        date: currentDate,
        hasQuest: false,
      });
    }

    setIsSubmitting(false);
    handleCloseSubmission();
  };

  return (
    <div id="tasks-view" className="flex flex-col gap-4">
      {/* Today's Task Summary Banner */}
      <div className="bg-white border border-[#e2e8e3] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(18,22,15,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#12160f] tracking-tight m-0">
                Daily Tasks
              </h2>
              <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-[#e5f4ec] text-[#095c3a] border border-[#c9ebd9]">
                {formatFullDisplayDate(currentDate)}
              </span>
            </div>
            <p className="text-xs text-[#7c8880] mt-0.5 m-0">
              Record daily quest progress and points for selected Gmail accounts
            </p>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Today Completed */}
          <div className="rounded-[12px] bg-[#e5f4ec] border border-[#c9ebd9] p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#095c3a] mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0c7a4b]" />
              <span>Completed</span>
            </div>
            <div className="text-xl font-extrabold text-[#095c3a]">
              {stats.todayCompletedTasks}
            </div>
            <span className="text-[10px] text-[#264a37]">accounts finished</span>
          </div>

          {/* Today Incomplete */}
          <div className="rounded-[12px] bg-[#fef7ea] border border-[#fae2b8] p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#96751f] mb-1">
              <Clock className="w-3.5 h-3.5 text-[#96751f]" />
              <span>Incomplete</span>
            </div>
            <div className="text-xl font-extrabold text-[#96751f]">
              {stats.todayIncompleteTasks}
            </div>
            <span className="text-[10px] text-[#745814]">pending today</span>
          </div>

          {/* Today's Points */}
          <div className="rounded-[12px] bg-[#f6f8f7] border border-[#e2e8e3] p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4b564d] mb-1">
              <Flame className="w-3.5 h-3.5 text-[#0c7a4b]" />
              <span>Today&apos;s Pts</span>
            </div>
            <div className="text-xl font-extrabold text-[#0c7a4b]">
              +{stats.todayPoints}
            </div>
            <span className="text-[10px] text-[#7c8880]">points earned</span>
          </div>

          {/* Selected Gmail */}
          <div className="rounded-[12px] bg-[#f6f8f7] border border-[#e2e8e3] p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4b564d] mb-1">
              <Mail className="w-3.5 h-3.5 text-[#7c8880]" />
              <span>Selected</span>
            </div>
            <div className="text-xl font-extrabold text-[#12160f]">
              {selectedGmails.length}
            </div>
            <span className="text-[10px] text-[#7c8880]">active accounts</span>
          </div>
        </div>
      </div>

      {/* If No Gmail is Selected */}
      {selectedGmails.length === 0 && (
        <div className="rounded-[14px] bg-[#fef7ea] border border-[#fae2b8] p-3.5 text-xs text-[#745814] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#96751f]" />
            <span>
              No Gmail accounts are currently <strong>Selected</strong>. Go to <strong>Gmail List</strong> to enable them.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('gmail_list')}
            className="px-3 py-1.5 rounded-[8px] bg-[#96751f] text-white font-bold text-xs hover:bg-[#745814] transition cursor-pointer flex-shrink-0"
          >
            Go to List
          </button>
        </div>
      )}

      {/* Sub Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Tabs: Incomplete vs Complete */}
        <div className="flex p-1 rounded-[10px] bg-[#f6f8f7] border border-[#e2e8e3]">
          <button
            id="tab-incomplete"
            type="button"
            onClick={() => setActiveSubTab('incomplete')}
            className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'incomplete'
                ? 'bg-[#fae2b8] text-[#745814] shadow-xs'
                : 'text-[#7c8880] hover:text-[#12160f]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Incomplete ({incompleteList.length})</span>
          </button>
          <button
            id="tab-complete"
            type="button"
            onClick={() => setActiveSubTab('complete')}
            className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'complete'
                ? 'bg-[#c9ebd9] text-[#095c3a] shadow-xs'
                : 'text-[#7c8880] hover:text-[#12160f]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete ({completeList.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-56">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7c8880]">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            id="input-search-tasks"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Gmail..."
            className="w-full pl-8 pr-3 py-1.5 rounded-[8px] bg-[#f6f8f7] border border-[#e2e8e3] text-[#12160f] placeholder-[#7c8880] text-xs focus:outline-none focus:ring-2 focus:ring-[#0c7a4b]/20 focus:border-[#0c7a4b] transition"
          />
        </div>
      </div>

      {/* Tab 1: INCOMPLETE TASK LIST */}
      {activeSubTab === 'incomplete' && (
        <div className="flex flex-col gap-2.5">
          {incompleteList.length === 0 ? (
            <div className="rounded-[18px] bg-white border border-[#e2e8e3] p-8 text-center shadow-[0_1px_2px_rgba(18,22,15,0.03)]">
              <CheckCircle2 className="w-10 h-10 text-[#0c7a4b] mx-auto mb-2" />
              <h3 className="text-sm font-bold text-[#12160f] m-0">All Tasks Completed!</h3>
              <p className="text-xs text-[#7c8880] mt-1 max-w-sm mx-auto">
                {selectedGmails.length > 0
                  ? 'All selected Gmail accounts have recorded their quests for today.'
                  : 'No selected Gmail accounts available.'}
              </p>
              {selectedGmails.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveSubTab('complete')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#0c7a4b] text-white text-xs font-semibold hover:bg-[#095c3a] transition cursor-pointer"
                >
                  View Completed List
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold text-[#7c8880] px-1 flex items-center justify-between">
                <span>Tap on account to submit task:</span>
                <span>{incompleteList.length} remaining</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {incompleteList.map((account) => (
                  <div
                    key={account.id}
                    id={`incomplete-card-${account.id}`}
                    onClick={() => handleOpenSubmission(account)}
                    className="rounded-[14px] bg-white border border-[#e2e8e3] hover:border-[#c9d4cc] p-3 sm:p-3.5 transition-all cursor-pointer group shadow-[0_1px_2px_rgba(18,22,15,0.03)] hover:shadow-md flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <div className="w-9 h-9 rounded-[10px] bg-[#fef7ea] text-[#96751f] border border-[#fae2b8] flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-bold text-[#12160f] group-hover:text-[#0c7a4b] transition break-all leading-tight block">
                          {account.gmail}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#96751f] bg-[#fef7ea] px-1.5 py-0.5 rounded-[4px] border border-[#fae2b8]">
                            Pending
                          </span>
                          <span className="text-[10px] text-[#7c8880]">
                            Tap to enter points
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-[#0c7a4b] group-hover:text-[#095c3a] transition flex-shrink-0">
                      <span className="hidden sm:inline">Submit</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: COMPLETE TASK LIST */}
      {activeSubTab === 'complete' && (
        <div className="flex flex-col gap-2.5">
          {completeList.length === 0 ? (
            <div className="rounded-[18px] bg-white border border-[#e2e8e3] p-8 text-center shadow-[0_1px_2px_rgba(18,22,15,0.03)]">
              <Clock className="w-10 h-10 text-[#7c8880] mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-bold text-[#12160f] m-0">No completed tasks yet</h3>
              <p className="text-xs text-[#7c8880] mt-1 max-w-sm mx-auto">
                Submit tasks from the Incomplete tab to view them here.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('incomplete')}
                className="mt-3 px-3.5 py-1.5 rounded-[8px] bg-[#0c7a4b] text-white text-xs font-semibold hover:bg-[#095c3a] transition cursor-pointer"
              >
                Go to Incomplete Tasks
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold text-[#7c8880] px-1">
                Completed accounts today:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {completeList.map(({ account, task }) => {
                  if (!task) return null;
                  const isQuest = task.status === 'completed';
                  return (
                    <div
                      key={account.id}
                      id={`complete-card-${account.id}`}
                      className="rounded-[14px] bg-white border border-[#e2e8e3] p-3 sm:p-3.5 shadow-[0_1px_2px_rgba(18,22,15,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                            isQuest
                              ? 'bg-[#e5f4ec] text-[#095c3a] border border-[#c9ebd9]'
                              : 'bg-[#fef7ea] text-[#96751f] border border-[#fae2b8]'
                          }`}
                        >
                          {isQuest ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-[#12160f] break-all leading-tight">
                              {account.gmail}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded-[4px] text-[9.5px] font-bold border ${
                                isQuest
                                  ? 'bg-[#e5f4ec] text-[#095c3a] border-[#c9ebd9]'
                                  : 'bg-[#fef7ea] text-[#96751f] border-[#fae2b8]'
                              }`}
                            >
                              {isQuest ? 'Completed' : 'No Quest'}
                            </span>
                          </div>
                          {/* Details */}
                          <div className="flex items-center gap-2 mt-1 text-xs">
                            {isQuest ? (
                              <>
                                <span className="flex items-center gap-1 text-[#095c3a] font-bold text-[11px]">
                                  <Trophy className="w-3 h-3 text-[#0c7a4b]" />
                                  <span>+{task.points} pts</span>
                                </span>
                                <span className="text-[#c9d4cc]"> </span>
                                <span className="flex items-center gap-1 text-[#4b564d] text-[11px]">
                                  <Gamepad2 className="w-3 h-3 text-[#7c8880]" />
                                  <span>{task.gameName || 'Quest'}</span>
                                </span>
                              </>
                            ) : (
                              <span className="text-[#96751f] font-medium text-[11px]">
                                0 pts (No Quest)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => handleOpenSubmission(account, task)}
                        className="self-end sm:self-center inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-[#f6f8f7] hover:bg-[#eef4f0] text-[#4b564d] hover:text-[#12160f] text-[11px] font-semibold border border-[#e2e8e3] transition cursor-pointer flex-shrink-0"
                      >
                        <Edit3 className="w-3 h-3 text-[#0c7a4b]" />
                        <span>Edit</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TASK SUBMISSION MODAL */}
      {selectedTaskAccount && (
        <div
          id="task-submission-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#12160f]/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-md rounded-[20px] bg-white border border-[#e2e8e3] p-5 sm:p-6 shadow-2xl text-[#12160f]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#e2e8e3]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-[#e5f4ec] text-[#095c3a] border border-[#c9ebd9] flex items-center justify-center">
                  <ListTodo className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#12160f] m-0">
                    {existingTaskToEdit ? 'Edit Task' : 'Task Submission'}
                  </h3>
                  <p className="text-[11px] text-[#7c8880] m-0 break-all">{selectedTaskAccount.gmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseSubmission}
                className="w-8 h-8 rounded-[8px] bg-[#f6f8f7] hover:bg-[#eef4f0] text-[#7c8880] hover:text-[#12160f] border border-[#e2e8e3] flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitTask} className="mt-4 space-y-3.5">
              {/* Dropdown / Quest Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#4b564d] uppercase tracking-wider mb-1.5">
                  Quest Status <span className="text-[#a3372c]">*</span>
                </label>
                <select
                  id="select-quest-type"
                  value={questChoice}
                  onChange={(e) => setQuestChoice(e.target.value as 'quest' | 'no_quest')}
                  className="w-full px-3 py-2.5 rounded-[10px] bg-[#f6f8f7] border border-[#e2e8e3] text-[#12160f] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0c7a4b]/20 focus:border-[#0c7a4b] transition cursor-pointer"
                >
                  <option value="quest">Quest Available</option>
                  <option value="no_quest">No Quest</option>
                </select>
              </div>

              {/* OPTION 1: Quest Available */}
              {questChoice === 'quest' ? (
                <div className="space-y-3 p-3.5 rounded-[12px] bg-[#f6f8f7] border border-[#e2e8e3] animate-in fade-in duration-150">
                  {/* Field 1: Game Name */}
                  <div>
                    <label className="block text-xs font-semibold text-[#4b564d] mb-1">
                      Game Name <span className="text-[#a3372c]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7c8880]">
                        <Gamepad2 className="w-4 h-4" />
                      </div>
                      <input
                        id="input-game-name"
                        type="text"
                        required
                        value={gameName}
                        onChange={(e) => setGameName(e.target.value)}
                        placeholder="Example: Hippi, XYZ Game"
                        className="w-full pl-9 pr-3 py-2 rounded-[8px] bg-white border border-[#e2e8e3] text-[#12160f] placeholder-[#7c8880] text-xs focus:outline-none focus:ring-2 focus:ring-[#0c7a4b]/20 focus:border-[#0c7a4b] transition"
                      />
                    </div>
                  </div>

                  {/* Field 2: Points */}
                  <div>
                    <label className="block text-xs font-semibold text-[#4b564d] mb-1">
                      Points <span className="text-[#a3372c]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7c8880]">
                        <Trophy className="w-4 h-4 text-[#96751f]" />
                      </div>
                      <input
                        id="input-points"
                        type="number"
                        min="1"
                        required
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        placeholder="50"
                        className="w-full pl-9 pr-3 py-2 rounded-[8px] bg-white border border-[#e2e8e3] text-[#12160f] placeholder-[#7c8880] text-xs focus:outline-none focus:ring-2 focus:ring-[#0c7a4b]/20 focus:border-[#0c7a4b] transition font-mono font-bold"
                      />
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {[30, 50, 70, 100, 150].map((quickPt) => (
                        <button
                          key={quickPt}
                          type="button"
                          onClick={() => setPoints(String(quickPt))}
                          className="px-2 py-1 rounded-[6px] bg-white hover:bg-[#e5f4ec] text-[10px] font-bold text-[#095c3a] border border-[#e2e8e3] hover:border-[#c9ebd9] transition cursor-pointer"
                        >
                          +{quickPt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* OPTION 2: No Quest */
                <div className="p-3.5 rounded-[12px] bg-[#fef7ea] border border-[#fae2b8] text-xs text-[#745814] space-y-1 animate-in fade-in duration-150">
                  <div className="font-bold flex items-center gap-1 text-[#96751f]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>No Quest Mode</span>
                  </div>
                  <p className="m-0 leading-relaxed text-[11.5px]">
                    Zero points recorded. The cell in My Work Sheet will be highlighted in yellow with &apos;No Quest&apos;.
                  </p>
                </div>
              )}

              {/* Error display */}
              {formError && (
                <div className="p-2.5 rounded-[8px] bg-[#fbe9e6] border border-[#e8c9c4] text-xs text-[#a3372c] flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseSubmission}
                  className="flex-1 py-2 rounded-[10px] bg-[#f6f8f7] hover:bg-[#eef4f0] text-[#4b564d] text-xs font-semibold border border-[#e2e8e3] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-task-action"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-[10px] bg-[#0c7a4b] hover:bg-[#095c3a] text-white text-xs font-bold shadow-md shadow-[#0c7a4b]/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Submit Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
