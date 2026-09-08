import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Trash2, 
  Lock, 
  Calendar, 
  Trophy, 
  CheckCircle2, 
  Gamepad2, 
  Clock, 
  AlertTriangle,
  ToggleLeft,
  ShieldCheck,
  CheckSquare,
  Square
} from 'lucide-react';
import { GmailAccount, TaskRecord } from '../types';
import { 
  formatFullDisplayDate, 
  getLastNDays, 
  updateGmailCheckboxes, 
  deleteGmail 
} from '../lib/storage';
import { decryptPassword } from '../lib/crypto';

interface GmailDetailViewProps {
  account: GmailAccount;
  allTasks: TaskRecord[];
  currentDate: string;
  onBack: () => void;
  onDeleted: () => void;
}

type DateFilterType = 'all' | 'today' | 'last7' | 'this_month';

export const GmailDetailView: React.FC<GmailDetailViewProps> = ({
  account,
  allTasks,
  currentDate,
  onBack,
  onDeleted,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filter, setFilter] = useState<DateFilterType>('all');

  // Decrypt password
  const plainPassword = useMemo(() => {
    return decryptPassword(account.encryptedPassword);
  }, [account.encryptedPassword]);

  // Handle toggles (Once checked, items CANNOT be unchecked)
  const handleToggleCardAdded = () => {
    if (account.cardAdded || account.isSelected) return;
    updateGmailCheckboxes(account.id, true, account.pointsAdded);
  };

  const handleTogglePointsStart = () => {
    if (account.pointsAdded || account.isSelected) return;
    updateGmailCheckboxes(account.id, account.cardAdded, true);
  };

  const handleQuickSelectBoth = () => {
    if (account.isSelected) return;
    updateGmailCheckboxes(account.id, true, true);
  };

  const handleDelete = () => {
    deleteGmail(account.id);
    setIsDeleteModalOpen(false);
    onDeleted();
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(account.gmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPassword = () => {
    if (plainPassword) {
      navigator.clipboard.writeText(plainPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  // Quests history for this account
  const questHistory = useMemo(() => {
    return allTasks
      .filter(t => t.gmailId === account.id && t.status === 'completed' && t.points > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allTasks, account.id]);

  const totalPoints = useMemo(() => {
    return questHistory.reduce((acc, curr) => acc + curr.points, 0);
  }, [questHistory]);

  const totalQuestCount = questHistory.length;
  const lastQuestDate = questHistory.length > 0 ? questHistory[0].date : null;

  // Filter history
  const filteredHistory = useMemo(() => {
    if (filter === 'today') {
      return questHistory.filter(t => t.date === currentDate);
    }
    if (filter === 'last7') {
      const daysSet = new Set(getLastNDays(currentDate, 7));
      return questHistory.filter(t => daysSet.has(t.date));
    }
    if (filter === 'this_month') {
      const currentMonthPrefix = currentDate.slice(0, 7);
      return questHistory.filter(t => t.date.startsWith(currentMonthPrefix));
    }
    return questHistory;
  }, [questHistory, filter, currentDate]);

  const filteredPointsTotal = useMemo(() => {
    return filteredHistory.reduce((acc, curr) => acc + curr.points, 0);
  }, [filteredHistory]);

  return (
    <div id="gmail-detail-page" className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* 1. Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-to-gmail-list"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-white hover:bg-[#f6f8f7] text-[#12160f] text-xs font-bold border border-[#e2e8e3] shadow-2xs transition cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-[#0c7a4b]" />
          <span>Back to Gmail List</span>
        </button>
        <div className="flex items-center gap-2">
          {account.isSelected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-bold bg-[#e5f4ec] text-[#095c3a] border border-[#c9ebd9]">
              <span className="w-2 h-2 rounded-full bg-[#0c7a4b]" />
              Selected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-semibold bg-[#f6f8f7] text-[#7c8880] border border-[#e2e8e3]">
              <span className="w-2 h-2 rounded-full bg-[#a1aca4]" />
              Not Selected
            </span>
          )}
        </div>
      </div>

      {/* 2. Account Profile Header Card (Full Gmail display, no cutoffs) */}
      <div className="bg-white border border-[#e2e8e3] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(18,22,15,0.04)]">
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className={`w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 font-bold ${
              account.isSelected
                ? 'bg-[#e5f4ec] text-[#095c3a] border border-[#c9ebd9]'
                : 'bg-[#f6f8f7] text-[#7c8880] border border-[#e2e8e3]'
            }`}
          >
            <Mail className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10.5px] font-bold text-[#7c8880] uppercase tracking-wider block mb-1">
              Gmail Account
            </span>
            {/* FULL GMAIL DISPLAY: break-all and leading-snug ensures the entire email is clearly visible */}
            <h2 className="text-base sm:text-lg font-extrabold text-[#12160f] tracking-tight break-all leading-snug m-0 select-all">
              {account.gmail}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#f6f8f7] hover:bg-[#eef4f0] text-[#4b564d] text-[11px] font-semibold border border-[#e2e8e3] transition cursor-pointer"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#0c7a4b]" />
                    <span className="text-[#095c3a]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#7c8880]" />
                    <span>Copy Gmail</span>
                  </>
                )}
              </button>
              {account.createdAt && (
                <span className="text-[11px] text-[#7c8880] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#7c8880]" />
                  <span>Added {formatFullDisplayDate(account.createdAt.slice(0, 10))}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Work Status & Configuration (Card Added & Points Start) */}
      <div className="bg-white border border-[#e2e8e3] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(18,22,15,0.04)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0c7a4b]" />
            <h3 className="text-sm font-bold text-[#12160f] m-0">
              Work Status &amp; Configuration
            </h3>
          </div>
          {/* Select Status Badge or Button */}
          {account.isSelected ? (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-[6px] bg-[#e5f4ec] text-[#095c3a] border border-[#c9ebd9]">
              <Lock className="w-3 h-3" />
              <span>Selected &amp; Locked</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleQuickSelectBoth}
              className="text-[11px] font-bold px-2.5 py-1 rounded-[6px] transition cursor-pointer bg-[#e5f4ec] hover:bg-[#d6f0e1] text-[#095c3a] border border-[#c9ebd9]"
            >
              Select Account (Both)
            </button>
          )}
        </div>
        <p className="text-xs text-[#7c8880] m-0 mb-3.5 leading-relaxed">
          {account.isSelected
            ? 'This account is confirmed and permanently locked. Once selected, checkboxes cannot be removed.'
            : 'Enable both Card Added and Points Start to confirm this account for daily quest tasks and the work spreadsheet.'}
        </p>

        {/* The Two Main Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option 1: Card Added */}
          <div
            onClick={handleToggleCardAdded}
            className={`p-3.5 rounded-[14px] border transition flex items-center justify-between ${
              account.cardAdded
                ? 'bg-[#e5f4ec]/70 border-[#c9ebd9] cursor-default'
                : 'bg-[#f6f8f7] border-[#e2e8e3] hover:bg-[#eef4f0] cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-[8px] flex items-center justify-center ${
                  account.cardAdded ? 'bg-[#0c7a4b] text-white' : 'bg-[#e2e8e3] text-[#7c8880]'
                }`}
              >
                {account.cardAdded ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold text-[#12160f] block">
                  Card Added {account.cardAdded ? '✓' : ''}
                </span>
                <span className="text-[11px] text-[#7c8880]">
                  {account.cardAdded ? 'Confirmed & Locked' : 'Click to confirm card'}
                </span>
              </div>
            </div>
            <div className="text-[#0c7a4b]">
              {account.cardAdded ? (
                <Lock className="w-4 h-4 text-[#0c7a4b]" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-[#a1aca4]" />
              )}
            </div>
          </div>

          {/* Option 2: Points Start */}
          <div
            onClick={handleTogglePointsStart}
            className={`p-3.5 rounded-[14px] border transition flex items-center justify-between ${
              account.pointsAdded
                ? 'bg-[#e5f4ec]/70 border-[#c9ebd9] cursor-default'
                : 'bg-[#f6f8f7] border-[#e2e8e3] hover:bg-[#eef4f0] cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-[8px] flex items-center justify-center ${
                  account.pointsAdded ? 'bg-[#0c7a4b] text-white' : 'bg-[#e2e8e3] text-[#7c8880]'
                }`}
              >
                {account.pointsAdded ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold text-[#12160f] block">
                  Points Start {account.pointsAdded ? '✓' : ''}
                </span>
                <span className="text-[11px] text-[#7c8880]">
                  {account.pointsAdded ? 'Confirmed & Locked' : 'Click to start points'}
                </span>
              </div>
            </div>
            <div className="text-[#0c7a4b]">
              {account.pointsAdded ? (
                <Lock className="w-4 h-4 text-[#0c7a4b]" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-[#a1aca4]" />
              )}
            </div>
          </div>
        </div>

        {/* Selected Status Explanation Banner */}
        <div
          className={`mt-3.5 p-3 rounded-[12px] flex items-center gap-2.5 text-xs ${
            account.isSelected
              ? 'bg-[#e5f4ec] text-[#095c3a] border border-[#c9ebd9]'
              : 'bg-[#fef7ea] text-[#96751f] border border-[#fae2b8]'
          }`}
        >
          {account.isSelected ? (
            <>
              <Lock className="w-4 h-4 text-[#0c7a4b] flex-shrink-0" />
              <p className="m-0 font-medium leading-relaxed">
                <strong className="font-bold text-[#095c3a]">Account is Selected &amp; Locked:</strong> Active in Daily Tasks and recorded in the My Work Sheet. Selection cannot be undone.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-[#96751f] flex-shrink-0" />
              <p className="m-0 font-medium leading-relaxed">
                Turn on both <strong>Card Added</strong> and <strong>Points Start</strong> above to include this account in daily work.
              </p>
            </>
          )}
        </div>
      </div>

      {/* 4. Password & Credentials Card */}
      <div className="bg-white border border-[#e2e8e3] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(18,22,15,0.04)]">
        <div className="flex items-center gap-2 mb-2.5">
          <Lock className="w-4 h-4 text-[#0c7a4b]" />
          <h3 className="text-sm font-bold text-[#12160f] m-0">Account Password</h3>
        </div>
        <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#f6f8f7] border border-[#e2e8e3]">
          <div className="font-mono text-xs sm:text-sm font-bold text-[#12160f] select-all">
            {showPassword ? (plainPassword || '(No password stored)') : '••••••••••••'}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
              className="p-1.5 rounded-[6px] bg-white border border-[#e2e8e3] text-[#7c8880] hover:text-[#12160f] transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleCopyPassword}
              title="Copy password"
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-[6px] bg-white border border-[#e2e8e3] text-[#4b564d] hover:text-[#12160f] text-[11px] font-semibold transition cursor-pointer"
            >
              {copiedPassword ? (
                <>
                  <Check className="w-3 h-3 text-[#0c7a4b]" />
                  <span className="text-[#095c3a]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-[#7c8880]" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Metrics Overview */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white border border-[#e2e8e3] rounded-[14px] p-3 shadow-2xs">
          <div className="flex items-center justify-between text-[#7c8880] mb-1">
            <span className="text-[10.5px] font-bold">Total Points</span>
            <Trophy className="w-3.5 h-3.5 text-[#0c7a4b]" />
          </div>
          <div className="text-lg font-extrabold text-[#095c3a] font-mono">
            +{totalPoints.toLocaleString()}
          </div>
          <div className="text-[9.5px] text-[#7c8880]">all-time earned</div>
        </div>

        <div className="bg-white border border-[#e2e8e3] rounded-[14px] p-3 shadow-2xs">
          <div className="flex items-center justify-between text-[#7c8880] mb-1">
            <span className="text-[10.5px] font-bold">Quests Done</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0c7a4b]" />
          </div>
          <div className="text-lg font-extrabold text-[#12160f] font-mono">
            {totalQuestCount}
          </div>
          <div className="text-[9.5px] text-[#7c8880]">completed tasks</div>
        </div>

        <div className="bg-white border border-[#e2e8e3] rounded-[14px] p-3 shadow-2xs">
          <div className="flex items-center justify-between text-[#7c8880] mb-1">
            <span className="text-[10.5px] font-bold">Last Quest</span>
            <Clock className="w-3.5 h-3.5 text-[#96751f]" />
          </div>
          <div className="text-[11.5px] font-bold text-[#12160f] truncate mt-1">
            {lastQuestDate ? lastQuestDate : 'None'}
          </div>
          <div className="text-[9.5px] text-[#7c8880]">recent activity</div>
        </div>
      </div>

      {/* 6. Quest History & Point Records */}
      <div className="bg-white border border-[#e2e8e3] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(18,22,15,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#12160f] flex items-center gap-1.5 m-0">
              <Trophy className="w-4 h-4 text-[#0c7a4b]" />
              <span>Point Earning History</span>
            </h3>
            <p className="text-[11px] text-[#7c8880] m-0">
              Quests completed for this Gmail account
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {(['all', 'today', 'last7', 'this_month'] as DateFilterType[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                  filter === f
                    ? 'bg-[#0c7a4b] text-white shadow-2xs'
                    : 'bg-[#f6f8f7] text-[#4b564d] hover:bg-[#eef4f0] border border-[#e2e8e3]'
                }`}
              >
                {f === 'all' && 'All Time'}
                {f === 'today' && 'Today'}
                {f === 'last7' && '7 Days'}
                {f === 'this_month' && 'Month'}
              </button>
            ))}
          </div>
        </div>

        {filter !== 'all' && (
          <div className="mb-3 px-3 py-1.5 rounded-[8px] bg-[#e5f4ec] border border-[#c9ebd9] text-xs text-[#095c3a] flex items-center justify-between font-medium">
            <span>Filtered Total:</span>
            <span className="font-extrabold">+{filteredPointsTotal} Points</span>
          </div>
        )}

        {filteredHistory.length === 0 ? (
          <div className="rounded-[14px] bg-[#f6f8f7] border border-dashed border-[#e2e8e3] p-6 text-center">
            <Clock className="w-7 h-7 text-[#7c8880] mx-auto mb-1.5 opacity-50" />
            <p className="text-xs font-bold text-[#12160f] m-0">No points recorded for this period</p>
            <p className="text-[11px] text-[#7c8880] mt-0.5 m-0">Complete tasks from the Tasks tab to log points</p>
          </div>
        ) : (
          <div className="rounded-[12px] border border-[#e2e8e3] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f8f7] text-[#4b564d] uppercase tracking-wider font-semibold border-b border-[#e2e8e3]">
                <tr>
                  <th className="py-2.5 px-3 text-[10.5px]">Date</th>
                  <th className="py-2.5 px-3 text-[10.5px]">Game / Quest</th>
                  <th className="py-2.5 px-3 text-[10.5px] text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8e3]">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f6f8f7]/60 transition">
                    <td className="py-2 px-3 font-mono font-medium text-[#12160f] whitespace-nowrap text-[11px]">
                      {formatFullDisplayDate(item.date)}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <Gamepad2 className="w-3.5 h-3.5 text-[#0c7a4b] flex-shrink-0" />
                        <span className="font-semibold text-[#12160f]">{item.gameName || 'Quest'}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="inline-block px-2 py-0.5 rounded-[5px] bg-[#e5f4ec] text-[#095c3a] font-bold border border-[#c9ebd9] text-[11px] font-mono">
                        +{item.points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. Danger Zone: Delete Account */}
      <div className="bg-white border border-[#fbe9e6] rounded-[18px] p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-bold text-[#a3372c] uppercase tracking-wider m-0">
              Delete Account
            </h3>
            <p className="text-[11px] text-[#7c8880] m-0 mt-0.5">
              Permanently remove this Gmail account from active tracking
            </p>
          </div>
          <button
            id="btn-delete-gmail-from-detail"
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#fbe9e6] hover:bg-[#a3372c] text-[#a3372c] hover:text-white border border-[#e8c9c4] text-xs font-bold transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#12160f]/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-[20px] bg-white border border-[#e2e8e3] p-6 shadow-2xl text-[#12160f]">
            <div className="w-12 h-12 rounded-[14px] bg-[#fbe9e6] text-[#a3372c] border border-[#e8c9c4] flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#12160f] m-0">Delete Gmail Account?</h3>
            <p className="text-xs text-[#7c8880] mt-1.5 leading-relaxed break-all">
              <strong className="text-[#12160f]">{account.gmail}</strong> will be removed from your accounts. Past records in the spreadsheet will be preserved.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2 rounded-[10px] bg-[#f6f8f7] hover:bg-[#eef4f0] text-[#4b564d] text-xs font-semibold border border-[#e2e8e3] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2 rounded-[10px] bg-[#a3372c] hover:bg-[#852a20] text-white text-xs font-semibold shadow-md shadow-[#a3372c]/20 transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
