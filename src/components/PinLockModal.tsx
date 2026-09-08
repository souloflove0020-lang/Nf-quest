import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, KeyRound, AlertCircle } from 'lucide-react';
import { hashPin, verifyPin, DEFAULT_APP_PIN } from '../lib/crypto';
import { getPinSettings, savePin, setAppLockStatus } from '../lib/storage';

interface PinLockModalProps {
  onUnlock: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({ onUnlock }) => {
  const { isPinSet, pinHash } = getPinSettings();

  // Mode: 'enter' (existing pin), 'setup_first' (set new), 'setup_confirm' (confirm new)
  const [mode, setMode] = useState<'enter' | 'setup_first' | 'setup_confirm'>(
    isPinSet ? 'enter' : 'setup_first'
  );
  const [pin, setPin] = useState<string>('');
  const [firstPin, setFirstPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [shake, setShake] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const triggerShake = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setPin('');
  };

  const handleDigitPress = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const evaluatePin = useCallback(async (candidatePin: string) => {
    if (candidatePin.length !== 6) return;
    setIsLoading(true);
    try {
      if (mode === 'enter') {
        const isValid = await verifyPin(candidatePin, pinHash);
        if (isValid) {
          if (!pinHash || candidatePin === DEFAULT_APP_PIN) {
            const hashed = await hashPin(candidatePin);
            savePin(hashed);
          }
          setAppLockStatus(false);
          onUnlock();
        } else {
          triggerShake('Incorrect PIN');
        }
      } else if (mode === 'setup_first') {
        setFirstPin(candidatePin);
        setPin('');
        setMode('setup_confirm');
        setErrorMsg('');
      } else if (mode === 'setup_confirm') {
        if (candidatePin === firstPin) {
          const hashed = await hashPin(candidatePin);
          savePin(hashed);
          setAppLockStatus(false);
          onUnlock();
        } else {
          triggerShake('PIN mismatch! Please try again from the beginning.');
          setMode('setup_first');
          setFirstPin('');
        }
      }
    } catch {
      triggerShake('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [mode, pinHash, firstPin, onUnlock]);

  useEffect(() => {
    if (pin.length === 6) {
      evaluatePin(pin);
    }
  }, [pin, evaluatePin]);

  // Support physical keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div
      id="pin-lock-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#12160f]/60 backdrop-blur-md p-4 text-[#12160f] select-none animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-sm rounded-[24px] bg-white border border-[#e2e8e3] p-6 sm:p-7 shadow-2xl transition-transform ${
          shake ? 'animate-bounce text-[#a3372c]' : ''
        }`}
      >
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-[14px] bg-[#e5f4ec] border border-[#c9ebd9] text-[#095c3a] flex items-center justify-center mb-2.5 shadow-xs">
            {mode === 'enter' ? (
              <Lock className="w-6 h-6" />
            ) : (
              <KeyRound className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-lg font-bold text-[#12160f] tracking-tight m-0">
            {mode === 'enter' && 'Enter 6-Digit PIN'}
            {mode === 'setup_first' && 'Set New 6-Digit PIN'}
            {mode === 'setup_confirm' && 'Confirm Your PIN'}
          </h2>
        </div>

        {/* 6-Digit Dots Indicator */}
        <div className="flex justify-center items-center gap-3.5 my-6">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                  isFilled
                    ? 'bg-[#0c7a4b] border-[#095c3a] scale-110 shadow-md shadow-[#0c7a4b]/30'
                    : 'bg-[#f6f8f7] border-[#c9d4cc] scale-100'
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#a3372c] font-medium mb-4 text-center">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              id={`keypad-${digit}`}
              type="button"
              disabled={isLoading}
              onClick={() => handleDigitPress(digit)}
              className="h-13 rounded-[12px] bg-[#f6f8f7] hover:bg-[#eef4f0] active:scale-95 text-xl font-bold text-[#12160f] border border-[#e2e8e3] hover:border-[#c9d4cc] shadow-xs transition-all flex items-center justify-center cursor-pointer"
            >
              {digit}
            </button>
          ))}

          {/* Clear Button */}
          <button
            id="keypad-clear"
            type="button"
            onClick={handleClear}
            className="h-13 rounded-[12px] bg-white hover:bg-[#f6f8f7] active:scale-95 text-xs font-semibold text-[#7c8880] hover:text-[#12160f] border border-[#e2e8e3] transition-all flex items-center justify-center cursor-pointer uppercase tracking-wider"
          >
            Clear
          </button>

          {/* 0 Button */}
          <button
            id="keypad-0"
            type="button"
            disabled={isLoading}
            onClick={() => handleDigitPress('0')}
            className="h-13 rounded-[12px] bg-[#f6f8f7] hover:bg-[#eef4f0] active:scale-95 text-xl font-bold text-[#12160f] border border-[#e2e8e3] hover:border-[#c9d4cc] shadow-xs transition-all flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            id="keypad-backspace"
            type="button"
            onClick={handleBackspace}
            className="h-13 rounded-[12px] bg-white hover:bg-[#fbe9e6] active:scale-95 text-[#7c8880] hover:text-[#a3372c] border border-[#e2e8e3] hover:border-[#e8c9c4] transition-all flex items-center justify-center cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
