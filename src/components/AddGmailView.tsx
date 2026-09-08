import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Save, CheckCircle, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { addGmail } from '../lib/storage';
import { TabType } from './Navbar';

interface AddGmailViewProps {
  onSuccessNavigate: (tab: TabType) => void;
}

export const AddGmailView: React.FC<AddGmailViewProps> = ({ onSuccessNavigate }) => {
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!gmail.trim()) {
      setErrorMsg('Please enter a valid Gmail Address.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter a Password.');
      return;
    }

    setIsSubmitting(true);
    const result = addGmail(gmail, password);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg(result.message);
      setGmail('');
      setPassword('');
      setTimeout(() => {
        onSuccessNavigate('gmail_list');
      }, 900);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div id="add-gmail-view" className="flex flex-col gap-4">
      {/* Header Card */}
      <div className="bg-white border border-[#e2e8e3] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(18,22,15,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[11px] bg-[#e5f4ec] text-[#095c3a] border border-[#c9ebd9] flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#12160f] tracking-tight m-0">
              Add New Gmail Account
            </h2>
            <p className="text-xs text-[#7c8880] mt-0.5">
              Connect accounts to track quests, daily tasks, and points
            </p>
          </div>
        </div>
        {/* Security Assurance */}
        <div className="mt-3.5 rounded-[12px] bg-[#e5f4ec] border border-[#c9ebd9] p-3 flex items-start gap-2.5 text-xs text-[#264a37]">
          <ShieldAlert className="w-4 h-4 text-[#0c7a4b] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#095c3a]">Encrypted Storage:</span> Passwords are never stored in plain text. They are safely hashed and stored locally on your device.
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-[#e2e8e3] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(18,22,15,0.04)]">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Gmail Address Field */}
          <div>
            <label className="block text-xs font-semibold text-[#4b564d] uppercase tracking-wider mb-1.5">
              Gmail Address <span className="text-[#a3372c]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7c8880]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="input-gmail-address"
                type="email"
                required
                value={gmail}
                onChange={(e) => setGmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-[10px] bg-[#f6f8f7] border border-[#e2e8e3] text-[#12160f] placeholder-[#7c8880] text-sm focus:outline-none focus:ring-2 focus:ring-[#0c7a4b]/20 focus:border-[#0c7a4b] transition"
              />
            </div>
            <p className="text-[11px] text-[#7c8880] mt-1">
              Example: user@gmail.com (must be a valid email address)
            </p>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-[#4b564d] uppercase tracking-wider mb-1.5">
              Password <span className="text-[#a3372c]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7c8880]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="input-gmail-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-[10px] bg-[#f6f8f7] border border-[#e2e8e3] text-[#12160f] placeholder-[#7c8880] text-sm focus:outline-none focus:ring-2 focus:ring-[#0c7a4b]/20 focus:border-[#0c7a4b] transition"
              />
              <button
                type="button"
                id="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7c8880] hover:text-[#12160f] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#7c8880] mt-1">
              Encrypted and kept securely in your local browser sandbox
            </p>
          </div>

          {/* Error / Success Feedback */}
          {errorMsg && (
            <div className="rounded-[10px] bg-[#fbe9e6] border border-[#e8c9c4] p-3 flex items-center gap-2 text-xs text-[#a3372c]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-[10px] bg-[#e5f4ec] border border-[#c9ebd9] p-3 flex items-center gap-2 text-xs text-[#095c3a]">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="btn-save-gmail"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-[10px] bg-[#0c7a4b] hover:bg-[#095c3a] active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-[#0c7a4b]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Save Gmail</span>
          </button>
        </form>
      </div>

      {/* Helpful Hint Card */}
      <div className="rounded-[14px] bg-[#f6f8f7] border border-[#e2e8e3] p-3.5 text-xs text-[#4b564d] space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-[#12160f]">
          <Sparkles className="w-3.5 h-3.5 text-[#0c7a4b]" />
          <span>Next Step:</span>
        </div>
        <p className="m-0 leading-relaxed">
          After saving, open <strong>Gmail List</strong> and ensure both <strong>Card Added</strong> and <strong>Points Added</strong> are ticked. This selects the account for Daily Tasks and the My Work spreadsheet.
        </p>
      </div>
    </div>
  );
};
