import React, { useState, useMemo } from 'react';
import { 
  Mail, 
  Search, 
  PlusCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle,
  ChevronRight,
  Trophy,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { GmailAccount, TaskRecord } from '../types';
import { updateGmailCheckboxes, addGmail } from '../lib/storage';
import { GmailDetailView } from './GmailDetailView';

interface GmailListViewProps {
  gmails: GmailAccount[];
  allTasks: TaskRecord[];
  currentDate: string;
}

export const GmailListView: React.FC<GmailListViewProps> = ({
  gmails,
  allTasks,
  currentDate,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'selected' | 'not_selected'>('all');

  // Add Gmail Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGmail, setNewGmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoSelectNew, setAutoSelectNew] = useState(true);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter gmails
  const filteredGmails = useMemo(() => {
    return gmails.filter((account) => {
      const matchSearch = account.gmail.toLowerCase().includes(searchQuery.trim().toLowerCase());
      if (!matchSearch) return false;
      if (filterType === 'selected') return account.isSelected;
      if (filterType === 'not_selected') return !account.isSelected;
      return true;
    });
  }, [gmails, searchQuery, filterType]);

  // If an account is currently selected, find it
  const currentSelectedAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return gmails.find(g => g.id === selectedAccountId) || null;
  }, [gmails, selectedAccountId]);

  const selectedCount = useMemo(() => {
    return gmails.filter(g => g.isSelected).length;
  }, [gmails]);

  // Render detail view if an account is selected (AFTER all hooks)
  if (currentSelectedAccount) {
    return (
      <GmailDetailView
        account={currentSelectedAccount}
        allTasks={allTasks}
        currentDate={currentDate}
        onBack={() => setSelectedAccountId(null)}
        onDeleted={() => setSelectedAccountId(null)}
      />
    );
  }

  const handleOpenAddModal = () => {
    setNewGmail('');
    setNewPassword('');
    setShowPassword(false);
    setAutoSelectNew(true);
    setAddError('');
    setAddSuccess('');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    if (!newGmail.trim()) {
      setAddError('Please enter a valid Gmail address.');
      return;
    }
    if (!newPassword.trim()) {
      setAddError('Please enter a password.');
      return;
    }
    setIsSubmitting(true);
    const result = addGmail(newGmail, newPassword);
    setIsSubmitting(false);
    if (result.success && result.account) {
      if (autoSelectNew) {
        updateGmailCheckboxes(result.account.id, true, true);
      }
      setAddSuccess(result.message);
      setTimeout(() => {
        setIsAddModalOpen(false);
        setNewGmail('');
        setNewPassword('');
      }, 700);
    } else {
      setAddError(result.message);
    }
  };

  return (
    <div id="gmail-list-view" className="flex flex-col gap-4 animate-in fade-in duration-150">
      {/* 1. Header Card */}
      <div className="bg-white border border-[#e2e8e3] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(18,22,15,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-lg font-bold text-[#12160f] tracking-tight m-0">
                Gmail Accounts
              </h2>
              <span className="px-2 py-0.5 rounded-[5px] text-[10.5px] font-bold bg-[#f6f8f7] text-[#4b564d] border border-[#e2e8e3]">
                {gmails.length} Total
              </span>
            </div>
            <p className="text-xs text-[#7c8880] m-0">
              Selected: <strong className="text-[#095c3a] font-bold">{selectedCount}</strong> accounts ready for tasks
            </p>
          </div>
          <button
            id="btn-add-gmail-from-list"
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#0c7a4b] hover:bg-[#095c3a] text-white text-xs font-semibold shadow-md shadow-[#0c7a4b]/20 active:scale-95 transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Gmail</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7c8880]">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-search-gmail"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Gmail accounts..."
            className="w-full pl-9 pr-3.5 py-2 rounded-[10px] bg-[#f6f8f7] border border-[#e2e8e3] text-[#12160f] placeholder-[#7c8880] text-xs focus:outline-none focus:ring-2 focus:ring-[#0c7a4b]/20 focus:border-[#0c7a4b] transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#14171a] text-white'
                : 'bg-[#f6f8f7] text-[#4b564d] border border-[#e2e8e3] hover:bg-[#eef4f0]'
            }`}
          >
            All ({gmails.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('selected')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterType === 'selected'
                ? 'bg-[#0c7a4b] text-white'
                : 'bg-[#f6f8f7] text-[#4b564d] border border-[#e2e8e3] hover:bg-[#eef4f0]'
            }`}
          >
            Selected ({selectedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('not_selected')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterType === 'not_selected'
                ? 'bg-[#96751f] text-white'
                : 'bg-[#f6f8f7] text-[#4b564d] border border-[#e2e8e3] hover:bg-[#eef4f0]'
            }`}
          >
            Not Selected ({gmails.length - selectedCount})
          </button>
        </div>
      </div>

      {/* 3. Redesigned Minimal Gmail List (No inline checkboxes or delete) */}
      {filteredGmails.length === 0 ? (
        <div className="bg-white border border-[#e2e8e3] rounded-[18px] p-8 text-center text-[#7c8880] shadow-[0_1px_2px_rgba(18,22,15,0.03)]">
          <Mail className="w-10 h-10 mx-auto mb-2 opacity-40 text-[#4b564d]" />
          <p className="text-sm font-semibold text-[#12160f] m-0">No Gmail accounts found</p>
          <p className="text-xs text-[#7c8880] mt-1">
            {searchQuery ? 'Try matching another search query' : 'Click "Add Gmail" to add your first account'}
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#0c7a4b] text-white text-xs font-semibold hover:bg-[#095c3a] transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Account Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredGmails.map((account) => {
            const accountTasks = allTasks.filter(t => t.gmailId === account.id);
            const totalPoints = accountTasks.reduce((sum, t) => sum + (t.points || 0), 0);
            const completedTasksCount = accountTasks.filter(t => t.status === 'completed').length;

            return (
              <div
                key={account.id}
                id={`gmail-card-${account.id}`}
                onClick={() => setSelectedAccountId(account.id)}
                className={`group bg-white border rounded-[16px] p-3.5 sm:p-4 transition-all duration-150 shadow-2xs hover:shadow-md cursor-pointer ${
                  account.isSelected
                    ? 'border-[#c9ebd9] hover:border-[#0c7a4b] bg-linear-to-r from-white via-white to-[#f4faf6]'
                    : 'border-[#e2e8e3] hover:border-[#c9d4cc]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Icon and Details */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 font-bold transition mt-0.5 ${
                        account.isSelected
                          ? 'bg-[#e5f4ec] text-[#095c3a] border border-[#c9ebd9]'
                          : 'bg-[#f6f8f7] text-[#7c8880] border border-[#e2e8e3]'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* FULL GMAIL DISPLAY: break-all ensures full address is always readable */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-xs sm:text-sm text-[#12160f] break-all leading-snug m-0 group-hover:text-[#0c7a4b] transition-colors">
                          {account.gmail}
                        </h3>
                      </div>

                      {/* Status & Metrics Line */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Selected Tag */}
                        {account.isSelected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-[#e5f4ec] text-[#095c3a] border border-[#c9ebd9] text-[10.5px] font-bold">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Selected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] bg-[#f6f8f7] text-[#7c8880] border border-[#e2e8e3] text-[10px] font-medium">
                            Not Selected
                          </span>
                        )}

                        {/* Points Earned */}
                        <div className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#095c3a] bg-[#f4faf6] px-2 py-0.5 rounded-[5px] border border-[#d6ede0]">
                          <Trophy className="w-3 h-3 text-[#0c7a4b]" />
                          <span>+{totalPoints.toLocaleString()} pts</span>
                        </div>

                        {/* Total Tasks Done */}
                        <div className="inline-flex items-center gap-1 text-[11px] text-[#4b564d] bg-[#f6f8f7] px-2 py-0.5 rounded-[5px] border border-[#e2e8e3] font-medium">
                          <CheckCircle2 className="w-3 h-3 text-[#7c8880]" />
                          <span>{completedTasksCount} tasks</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Clean chevron indicator to open details */}
                  <div className="self-center pl-1 text-[#7c8880] group-hover:text-[#0c7a4b] group-hover:translate-x-0.5 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Add Gmail Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#12160f]/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-[20px] bg-white border border-[#e2e8e3] p-5 sm:p-6 shadow-2xl text-[#12160f]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8e3]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-[#e5f4ec] text-[#095c3a] border border-[#c9ebd9] flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#12160f] m-0">Add Gmail Account</h3>
                  <p className="text-[11px] text-[#7c8880] m-0">Save account to track work</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-[7px] bg-[#f6f8f7] hover:bg-[#eef4f0] text-[#7c8880] hover:text-[#12160f] border border-[#e2e8e3] flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              {/* Gmail Address */}
              <div>
                <label className="block text-[11px] font-semibold text-[#4b564d] uppercase tracking-wider mb-1">
                  Gmail Address <span className="text-[#a3372c]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7c8880]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={newGmail}
                    onChange={(e) => setNewGmail(e.target.value)}
                    placeholder="user@gmail.com"
                    className="w-full pl-9 pr-3 py-2 rounded-[10px] bg-[#f6f8f7] border border-[#e2e8e3] text-xs text-[#12160f] placeholder-[#7c8880] focus:outline-none focus:ring-2 focus:ring-[#0c7a4b]/20 focus:border-[#0c7a4b] transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold text-[#4b564d] uppercase tracking-wider mb-1">
                  Password <span className="text-[#a3372c]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7c8880]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-[10px] bg-[#f6f8f7] border border-[#e2e8e3] text-xs text-[#12160f] placeholder-[#7c8880] focus:outline-none focus:ring-2 focus:ring-[#0c7a4b]/20 focus:border-[#0c7a4b] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7c8880] hover:text-[#12160f] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Auto-select checkbox (Card Added & Points Start) */}
              <label className="flex items-center gap-2 p-2.5 rounded-[10px] bg-[#f6f8f7] border border-[#e2e8e3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSelectNew}
                  onChange={(e) => setAutoSelectNew(e.target.checked)}
                  className="rounded text-[#0c7a4b] focus:ring-[#0c7a4b]"
                />
                <span className="text-xs font-semibold text-[#12160f]">
                  Mark as Selected (Card Added &amp; Points Start)
                </span>
              </label>

              {/* Feedback messages */}
              {addError && (
                <div className="rounded-[8px] bg-[#fbe9e6] border border-[#e8c9c4] p-2.5 flex items-center gap-2 text-xs text-[#a3372c]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {addSuccess && (
                <div className="rounded-[8px] bg-[#e5f4ec] border border-[#c9ebd9] p-2.5 flex items-center gap-2 text-xs text-[#095c3a]">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{addSuccess}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 rounded-[10px] bg-[#f6f8f7] hover:bg-[#eef4f0] text-[#4b564d] text-xs font-semibold border border-[#e2e8e3] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-[10px] bg-[#0c7a4b] hover:bg-[#095c3a] text-white text-xs font-semibold shadow-md shadow-[#0c7a4b]/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
