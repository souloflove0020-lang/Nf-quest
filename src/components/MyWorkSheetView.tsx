import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  Download, 
  AlertCircle, 
  X,
  ChevronLeft,
  ChevronRight,
  Trophy,
  CheckCircle2,
  AlertOctagon,
  Clock
} from 'lucide-react';
import { GmailAccount, TaskRecord } from '../types';
import { 
  formatFullDisplayDate, 
  getDaysInMonth, 
  MONTH_NAMES, 
  getDayOfWeekAbbr 
} from '../lib/storage';

interface MyWorkSheetViewProps {
  gmails: GmailAccount[];
  tasks: TaskRecord[];
  currentDate: string;
}

export const MyWorkSheetView: React.FC<MyWorkSheetViewProps> = ({
  gmails,
  tasks,
  currentDate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract year and month from currentDate (YYYY-MM-DD)
  const currentParts = useMemo(() => {
    const p = currentDate.split('-');
    return {
      year: parseInt(p[0], 10) || new Date().getFullYear(),
      month: parseInt(p[1], 10) || (new Date().getMonth() + 1),
    };
  }, [currentDate]);

  const [selectedYear, setSelectedYear] = useState<number>(currentParts.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentParts.month); // 1 to 12
  const [selectedCellInfo, setSelectedCellInfo] = useState<{
    gmail: string;
    date: string;
    task?: TaskRecord;
  } | null>(null);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleJumpToCurrentMonth = () => {
    setSelectedYear(currentParts.year);
    setSelectedMonth(currentParts.month);
  };

  const isCurrentMonth = selectedYear === currentParts.year && selectedMonth === currentParts.month;

  // Generate all dates in the selected month
  const monthDates = useMemo(() => {
    return getDaysInMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Selected Gmails only
  const selectedGmails = useMemo(() => {
    return gmails
      .filter(g => g.isSelected)
      .filter(g => g.gmail.toLowerCase().includes(searchQuery.trim().toLowerCase()));
  }, [gmails, searchQuery]);

  // Quick lookup map: key = `${gmailId}_${date}`
  const taskMap = useMemo(() => {
    const map = new Map<string, TaskRecord>();
    for (const t of tasks) {
      map.set(`${t.gmailId}_${t.date}`, t);
    }
    return map;
  }, [tasks]);

  // Monthly summary stats for the selected month
  const monthStats = useMemo(() => {
    let totalPoints = 0;
    let completedQuests = 0;
    let noQuestCount = 0;
    let absentCount = 0;

    for (const d of monthDates) {
      if (d > currentDate) continue; // skip future days
      for (const gm of selectedGmails) {
        const task = taskMap.get(`${gm.id}_${d}`);
        if (!task || task.status === 'absent' || (d < currentDate && task.status === 'pending')) {
          absentCount++;
        } else if (task.status === 'completed') {
          totalPoints += (task.points || 0);
          completedQuests++;
        } else if (task.status === 'no_quest') {
          noQuestCount++;
        }
      }
    }

    return {
      totalPoints,
      completedQuests,
      noQuestCount,
      absentCount,
    };
  }, [monthDates, currentDate, selectedGmails, taskMap]);

  // Export full month to CSV
  const handleExportCSV = () => {
    const monthName = MONTH_NAMES[selectedMonth - 1] || `Month-${selectedMonth}`;
    const headers = ['Gmail', ...monthDates.map(d => `${d} (${getDayOfWeekAbbr(d)})`)];
    const rows = selectedGmails.map(gm => {
      const row = [gm.gmail];
      for (const d of monthDates) {
        if (d > currentDate) {
          row.push('-');
          continue;
        }
        const t = taskMap.get(`${gm.id}_${d}`);
        if (!t) {
          row.push(d === currentDate ? 'Pending' : 'Absent');
        } else if (t.status === 'completed') {
          row.push(`${t.points} (${t.gameName || 'Quest'})`);
        } else if (t.status === 'no_quest') {
          row.push('No Quest');
        } else if (t.status === 'absent') {
          row.push('Absent');
        } else {
          row.push(d === currentDate ? 'Pending' : 'Absent');
        }
      }
      return row;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quest_Work_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentMonthName = MONTH_NAMES[selectedMonth - 1];

  return (
    <div id="my-work-sheet-view" className="flex flex-col gap-4">
      {/* 1. Header Card with Month & Year Controls */}
      <div className="bg-white border border-[#e2e8e3] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(18,22,15,0.04)]">
        <div className="flex flex-col gap-3">
          {/* Top Row: Title & CSV */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-[11px] bg-[#e5f4ec] text-[#095c3a] border border-[#c9ebd9] flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#12160f] tracking-tight m-0">
                  My Work Sheet
                </h2>
                <p className="text-xs text-[#7c8880] m-0 mt-0.5">
                  Monthly work &amp; points record for selected accounts
                </p>
              </div>
            </div>
            <button
              id="btn-export-csv"
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#0c7a4b] hover:bg-[#095c3a] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Month & Year Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#e2e8e3]">
            {/* Prev / Next buttons and Month Selector */}
            <div className="flex items-center gap-1.5">
              <button
                id="btn-prev-month"
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="w-8 h-8 rounded-[8px] border border-[#e2e8e3] bg-[#f6f8f7] hover:bg-[#eef4f0] text-[#4b564d] flex items-center justify-center transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {/* Month Dropdown */}
              <select
                id="select-work-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 rounded-[8px] bg-[#f6f8f7] border border-[#e2e8e3] text-[#12160f] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0c7a4b]/20 cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              {/* Year Dropdown */}
              <select
                id="select-work-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-[8px] bg-[#f6f8f7] border border-[#e2e8e3] text-[#12160f] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0c7a4b]/20 cursor-pointer"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                id="btn-next-month"
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="w-8 h-8 rounded-[8px] border border-[#e2e8e3] bg-[#f6f8f7] hover:bg-[#eef4f0] text-[#4b564d] flex items-center justify-center transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Current Month Tag / Reset Button */}
            {!isCurrentMonth ? (
              <button
                type="button"
                onClick={handleJumpToCurrentMonth}
                className="px-2.5 py-1 rounded-[6px] text-[11px] font-semibold bg-[#eef4f0] text-[#095c3a] hover:bg-[#e5f4ec] border border-[#c9ebd9] transition cursor-pointer"
              >
                Go to This Month
              </button>
            ) : (
              <span className="px-2.5 py-1 rounded-[6px] text-[11px] font-bold bg-[#e5f4ec] text-[#095c3a] border border-[#c9ebd9]">
                Current Month ({monthDates.length} days)
              </span>
            )}
          </div>
        </div>

        {/* Status Badges Legend */}
        <div className="mt-3.5 pt-3 border-t border-[#e2e8e3] flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-[#4b564d]">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-[#e5f4ec] border border-[#c9ebd9] text-[#095c3a] text-[9px] font-bold flex items-center justify-center">
              ✓
            </span>
            <span>
              <strong className="text-[#095c3a] font-bold">Green:</strong> Quest Done
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-[#fef7ea] border border-[#fae2b8] text-[#96751f] text-[9px] font-bold flex items-center justify-center">
              •
            </span>
            <span>
              <strong className="text-[#96751f] font-bold">Yellow:</strong> No Quest
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-[#fbe9e6] border border-[#e8c9c4] text-[#a3372c] text-[9px] font-bold flex items-center justify-center">
              ✕
            </span>
            <span>
              <strong className="text-[#a3372c] font-bold">Red:</strong> Absent
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-[#f6f8f7] border border-[#e2e8e3] text-[#7c8880] text-[9px] font-bold flex items-center justify-center">
              -
            </span>
            <span>
              <strong className="text-[#7c8880] font-bold">Gray:</strong> Upcoming / Future
            </span>
          </div>
        </div>
      </div>

      {/* 2. Monthly Summary Metrics (Grid 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white border border-[#e2e8e3] rounded-[12px] p-3 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[#7c8880] mb-1">
            <span className="text-[11px] font-semibold">{currentMonthName} Pts</span>
            <Trophy className="w-3.5 h-3.5 text-[#0c7a4b]" />
          </div>
          <div className="text-xl font-extrabold text-[#095c3a]">
            +{monthStats.totalPoints.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#7c8880]">Total points in month</div>
        </div>

        <div className="bg-white border border-[#e2e8e3] rounded-[12px] p-3 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[#7c8880] mb-1">
            <span className="text-[11px] font-semibold">Quests Done</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0c7a4b]" />
          </div>
          <div className="text-xl font-extrabold text-[#12160f]">
            {monthStats.completedQuests}
          </div>
          <div className="text-[10px] text-[#7c8880]">Points rewarded</div>
        </div>

        <div className="bg-white border border-[#e2e8e3] rounded-[12px] p-3 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[#7c8880] mb-1">
            <span className="text-[11px] font-semibold">No-Quest Days</span>
            <Clock className="w-3.5 h-3.5 text-[#96751f]" />
          </div>
          <div className="text-xl font-extrabold text-[#96751f]">
            {monthStats.noQuestCount}
          </div>
          <div className="text-[10px] text-[#7c8880]">Zero points days</div>
        </div>

        <div className="bg-white border border-[#e2e8e3] rounded-[12px] p-3 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-[#7c8880] mb-1">
            <span className="text-[11px] font-semibold">Absents</span>
            <AlertOctagon className="w-3.5 h-3.5 text-[#a3372c]" />
          </div>
          <div className="text-xl font-extrabold text-[#a3372c]">
            {monthStats.absentCount}
          </div>
          <div className="text-[10px] text-[#7c8880]">Missed tasks</div>
        </div>
      </div>

      {/* 3. Search and Quick Info Bar */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7c8880]">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            id="input-search-sheet"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Gmail in sheet..."
            className="w-full pl-8 pr-3 py-1.5 rounded-[8px] bg-[#f6f8f7] border border-[#e2e8e3] text-[#12160f] placeholder-[#7c8880] text-xs focus:outline-none focus:ring-2 focus:ring-[#0c7a4b]/20 transition"
          />
        </div>
        <div className="text-[11px] text-[#7c8880] font-medium">
          {selectedGmails.length} Accounts • Click cell for details
        </div>
      </div>

      {/* 4. Full Month Activity Spreadsheet Matrix */}
      {selectedGmails.length === 0 ? (
        <div className="rounded-[18px] bg-white border border-[#e2e8e3] p-10 text-center shadow-[0_1px_2px_rgba(18,22,15,0.03)]">
          <AlertCircle className="w-10 h-10 text-[#96751f] mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-bold text-[#12160f] m-0">No Selected Gmail accounts</h3>
          <p className="text-xs text-[#7c8880] mt-1 max-w-md mx-auto">
            To view accounts in this sheet, go to <strong>Gmail List</strong> and ensure both <strong>Card Added</strong> and <strong>Points Added</strong> are enabled.
          </p>
        </div>
      ) : (
        <div className="rounded-[18px] bg-white border border-[#e2e8e3] shadow-[0_1px_2px_rgba(18,22,15,0.04)] overflow-hidden">
          {/* Scrollable Container */}
          <div className="overflow-x-auto overflow-y-auto max-h-[550px] relative scrollbar-thin">
            <table className="w-full border-collapse text-left text-xs">
              {/* Table Header: Gmail + Days of Month */}
              <thead className="sticky top-0 z-20 bg-[#f6f8f7] border-b border-[#e2e8e3]">
                <tr>
                  {/* Sticky First Column: Gmail Account */}
                  <th className="sticky left-0 z-30 bg-[#f6f8f7] py-2.5 px-3.5 font-bold text-[#12160f] text-[11px] uppercase tracking-wider border-r border-[#e2e8e3] min-w-[170px] shadow-xs">
                    Gmail Account
                  </th>
                  {/* Date Columns for Full Month */}
                  {monthDates.map((dateStr) => {
                    const isToday = dateStr === currentDate;
                    const dayNum = dateStr.split('-')[2];
                    const dayName = getDayOfWeekAbbr(dateStr);
                    return (
                      <th
                        key={dateStr}
                        className={`py-2 px-1.5 font-mono font-bold text-center border-r border-[#e2e8e3] min-w-[70px] whitespace-nowrap text-[11px] ${
                          isToday
                            ? 'bg-[#e5f4ec] text-[#095c3a] border-b-2 border-b-[#0c7a4b]'
                            : 'text-[#4b564d]'
                        }`}
                      >
                        <div className="text-[12px] font-extrabold">{dayNum}</div>
                        <div className="text-[9px] text-[#7c8880] font-sans font-medium">{dayName}</div>
                        {isToday && (
                          <span className="text-[8.5px] font-sans font-bold text-[#0c7a4b] block leading-tight">
                            (Today)
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              {/* Table Body */}
              <tbody className="divide-y divide-[#e2e8e3]">
                {selectedGmails.map((account) => (
                  <tr key={account.id} className="hover:bg-[#f6f8f7]/50 transition">
                    {/* Sticky Gmail Account Cell */}
                    <td className="sticky left-0 z-10 bg-white py-2.5 px-3.5 font-semibold text-[#12160f] border-r border-[#e2e8e3] truncate max-w-[190px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#0c7a4b] flex-shrink-0" />
                        <span className="truncate text-xs font-bold" title={account.gmail}>
                          {account.gmail}
                        </span>
                      </div>
                    </td>
                    {/* Date Cells */}
                    {monthDates.map((dateStr) => {
                      const task = taskMap.get(`${account.id}_${dateStr}`);
                      const isToday = dateStr === currentDate;
                      const isFuture = dateStr > currentDate;
                      let cellText = 'Absent';
                      let cellClass = 'bg-[#fbe9e6] text-[#a3372c] border border-[#e8c9c4] hover:bg-[#f8dcd8]';

                      if (isFuture) {
                        cellText = '-';
                        cellClass = 'bg-[#fafbfa] text-[#a1aca4] border border-[#eef2ef]';
                      } else if (task) {
                        if (task.status === 'completed') {
                          cellText = `+${task.points}`;
                          cellClass = 'bg-[#e5f4ec] text-[#095c3a] border border-[#c9ebd9] font-mono font-bold hover:bg-[#d6f0e1]';
                        } else if (task.status === 'no_quest') {
                          cellText = 'No';
                          cellClass = 'bg-[#fef7ea] text-[#96751f] border border-[#fae2b8] font-semibold hover:bg-[#fdeece]';
                        } else if (task.status === 'absent') {
                          cellText = 'Abs';
                          cellClass = 'bg-[#fbe9e6] text-[#a3372c] border border-[#e8c9c4] hover:bg-[#f8dcd8]';
                        } else if (task.status === 'pending') {
                          if (isToday) {
                            cellText = 'Pend';
                            cellClass = 'bg-[#f6f8f7] text-[#7c8880] border border-[#e2e8e3] hover:bg-[#eef4f0]';
                          } else {
                            cellText = 'Abs';
                            cellClass = 'bg-[#fbe9e6] text-[#a3372c] border border-[#e8c9c4] hover:bg-[#f8dcd8]';
                          }
                        }
                      } else {
                        if (isToday) {
                          cellText = 'Pend';
                          cellClass = 'bg-[#f6f8f7] text-[#7c8880] border border-[#e2e8e3] hover:bg-[#eef4f0]';
                        } else {
                          cellText = 'Abs';
                          cellClass = 'bg-[#fbe9e6] text-[#a3372c] border border-[#e8c9c4] hover:bg-[#f8dcd8]';
                        }
                      }

                      return (
                        <td
                          key={dateStr}
                          onClick={() => {
                            if (!isFuture) {
                              setSelectedCellInfo({
                                gmail: account.gmail,
                                date: dateStr,
                                task,
                              });
                            }
                          }}
                          className={`p-1 text-center border-r border-[#e2e8e3] ${isFuture ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <div
                            className={`py-1.5 px-0.5 rounded-[5px] text-[10px] transition-all flex items-center justify-center ${cellClass}`}
                            title={isFuture ? `${dateStr} (Upcoming)` : `Click for ${dateStr} details`}
                          >
                            <span>{cellText}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Cell Details Modal */}
      {selectedCellInfo && (
        <div
          id="cell-details-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#12160f]/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-[20px] bg-white border border-[#e2e8e3] p-5 shadow-2xl text-[#12160f]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8e3]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0c7a4b]" />
                <h3 className="text-sm font-bold text-[#12160f] m-0">
                  {formatFullDisplayDate(selectedCellInfo.date)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCellInfo(null)}
                className="w-7 h-7 rounded-[7px] bg-[#f6f8f7] hover:bg-[#eef4f0] text-[#7c8880] hover:text-[#12160f] border border-[#e2e8e3] flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5">
              <div>
                <span className="text-[10px] text-[#7c8880] uppercase tracking-wider font-semibold block">Gmail Account</span>
                <span className="text-xs font-bold text-[#12160f] break-all">{selectedCellInfo.gmail}</span>
              </div>

              {selectedCellInfo.task ? (
                <div className="p-3 rounded-[12px] bg-[#f6f8f7] border border-[#e2e8e3] space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#7c8880]">Status:</span>
                    <span className={`font-bold uppercase ${
                      selectedCellInfo.task.status === 'completed'
                        ? 'text-[#095c3a]'
                        : selectedCellInfo.task.status === 'no_quest'
                        ? 'text-[#96751f]'
                        : 'text-[#a3372c]'
                    }`}>
                      {selectedCellInfo.task.status === 'completed'
                        ? 'Quest Completed'
                        : selectedCellInfo.task.status === 'no_quest'
                        ? 'No Quest'
                        : 'Absent'}
                    </span>
                  </div>
                  {selectedCellInfo.task.status === 'completed' && (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#7c8880]">Points Earned:</span>
                        <span className="font-extrabold text-[#095c3a] text-sm">
                          +{selectedCellInfo.task.points} pts
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#7c8880]">Game Name:</span>
                        <span className="font-semibold text-[#12160f]">
                          {selectedCellInfo.task.gameName || 'Quest'}
                        </span>
                      </div>
                    </>
                  )}
                  {selectedCellInfo.task.status === 'no_quest' && (
                    <div className="text-xs text-[#96751f] pt-1">
                      No quest on this date. 0 points recorded.
                    </div>
                  )}
                  {selectedCellInfo.task.status === 'absent' && (
                    <div className="text-xs text-[#a3372c] pt-1">
                      No activity recorded for this day (Absent).
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-[12px] bg-[#f6f8f7] border border-[#e2e8e3] text-xs text-[#7c8880]">
                  {selectedCellInfo.date === currentDate
                    ? 'Pending for today. Submit via the Tasks tab.'
                    : 'No submission found for this date (marked as Absent).'}
                </div>
              )}
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#e2e8e3] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCellInfo(null)}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#0c7a4b] hover:bg-[#095c3a] text-white text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
