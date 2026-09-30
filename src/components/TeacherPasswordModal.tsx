import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, X, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { DEFAULT_TEACHER_PASSWORD } from '../constants/prizes';
import { playAudioFeedback } from '../utils/effects';

interface TeacherPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeacherPasswordModal: React.FC<TeacherPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMsg('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (password === DEFAULT_TEACHER_PASSWORD) {
      playAudioFeedback('success');
      onSuccess();
      onClose();
    } else {
      playAudioFeedback('warning');
      setErrorMsg('비밀번호가 일치하지 않습니다. 다시 입력해 주세요.');
      setPassword('');
      inputRef.current?.focus();
    }
  };

  const handleKeypadPress = (val: string) => {
    playAudioFeedback('click');
    if (val === 'clear') {
      setPassword('');
      setErrorMsg('');
    } else if (val === 'backspace') {
      setPassword((prev) => prev.slice(0, -1));
      setErrorMsg('');
    } else {
      if (password.length < 12) {
        const next = password + val;
        setPassword(next);
        setErrorMsg('');
        if (next === DEFAULT_TEACHER_PASSWORD) {
          playAudioFeedback('success');
          onSuccess();
          onClose();
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">교사용 모드 잠금 해제</h3>
              <p className="text-xs text-slate-500">교사 전용 대시보드 접근 인증</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg('');
              }}
              placeholder="비밀번호 8자리 입력"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono tracking-widest text-slate-900 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-semibold text-center flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </p>
          )}

          {/* Quick Keypad for Tablet Smartboard Touch */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(String(num))}
                className="h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-lg rounded-xl border border-slate-200 transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKeypadPress('clear')}
              className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl border border-slate-200 transition-colors"
            >
              전체삭제
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-lg rounded-xl border border-slate-200 transition-colors"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('backspace')}
              className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl border border-slate-200 transition-colors"
            >
              지우기
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 mt-2"
          >
            <span>확인 후 대시보드 열기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
