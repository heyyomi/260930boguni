import React, { useEffect, useState } from 'react';
import { Sparkles, Trophy, Check, X, Award, Flame } from 'lucide-react';
import { ClaimRecord } from '../types';
import { triggerConfetti, playAudioFeedback } from '../utils/effects';

interface SmartboardCelebrationOverlayProps {
  claim: ClaimRecord | null;
  onClose: () => void;
  autoCloseSeconds?: number;
}

export const SmartboardCelebrationOverlay: React.FC<SmartboardCelebrationOverlayProps> = ({
  claim,
  onClose,
  autoCloseSeconds = 5,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(autoCloseSeconds);

  useEffect(() => {
    if (!claim) return;

    // Trigger celebration effects
    const isTopRank = claim.prizeRank <= 2;
    triggerConfetti(true);
    playAudioFeedback(isTopRank ? 'grand' : 'success');

    // Second wave of confetti for top prizes
    let secondTimer: NodeJS.Timeout | null = null;
    if (isTopRank) {
      secondTimer = setTimeout(() => {
        triggerConfetti(true);
      }, 1200);
    }

    setSecondsRemaining(autoCloseSeconds);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      if (secondTimer) clearTimeout(secondTimer);
    };
  }, [claim, autoCloseSeconds, onClose]);

  if (!claim) return null;

  const isFirstPrize = claim.prizeRank === 1;
  const isSecondPrize = claim.prizeRank === 2;
  const isTopRank = claim.prizeRank <= 2;

  const recipientLabel =
    claim.userType === 'student'
      ? `${claim.grade}학년 ${claim.classNum}반`
      : `${claim.role || '교직원'}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full max-w-2xl text-center rounded-3xl p-8 sm:p-12 shadow-2xl border-4 transition-all transform animate-in zoom-in-90 duration-300 ${
          isFirstPrize
            ? 'bg-linear-to-b from-amber-500 via-amber-600 to-amber-700 border-amber-300 text-white shadow-amber-500/50'
            : isSecondPrize
            ? 'bg-linear-to-b from-rose-500 via-rose-600 to-rose-700 border-rose-300 text-white shadow-rose-500/50'
            : 'bg-linear-to-b from-indigo-600 via-indigo-700 to-slate-900 border-indigo-300 text-white shadow-indigo-500/40'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          title="닫기"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Floating Crown / Trophy Icon */}
        <div className="flex justify-center -mt-4 mb-4">
          <div
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shadow-xl ring-8 transition-transform animate-bounce ${
              isFirstPrize
                ? 'bg-amber-100 text-amber-600 ring-amber-300/40'
                : isSecondPrize
                ? 'bg-rose-100 text-rose-600 ring-rose-300/40'
                : 'bg-white text-indigo-600 ring-white/20'
            }`}
          >
            {isFirstPrize ? (
              <Trophy className="w-14 h-14 sm:w-16 sm:h-16 text-amber-500" />
            ) : isSecondPrize ? (
              <Flame className="w-14 h-14 sm:w-16 sm:h-16 text-rose-500" />
            ) : (
              <Sparkles className="w-14 h-14 sm:w-16 sm:h-16 text-indigo-500" />
            )}
          </div>
        </div>

        {/* Sub Header Kicker */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/25 text-white/95 text-sm sm:text-base font-black tracking-wide mb-3 backdrop-blur-xs">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>추억의 뽑기 실시간 당첨!</span>
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
        </div>

        {/* Recipient Details */}
        <div className="space-y-2 mb-6">
          <p className="text-xl sm:text-2xl font-bold text-white/90">
            {recipientLabel}
          </p>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-md">
            {claim.name} {claim.userType === 'student' ? '학생' : '선생님'}
          </h2>
        </div>

        {/* Prize Banner Card */}
        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/30 shadow-inner space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-black shadow-xs">
            <Award className="w-4 h-4 text-amber-500" />
            <span>{claim.prizeRank}등 상품</span>
            {claim.prizeRank === 1 && <span className="text-amber-600">👑 특상</span>}
          </div>

          <div className="text-3xl sm:text-5xl font-black tracking-tight text-amber-300 drop-shadow-lg">
            {claim.prizeName}
          </div>

          <p className="text-sm sm:text-base text-white/80 font-medium">
            축하합니다! 상품이 정상 지급 등록되었습니다.
          </p>
        </div>

        {/* Bottom Bar: Device Info & Auto-close timer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-white/80 pt-2 border-t border-white/20">
          <span className="font-medium">
            접수 기기: {claim.deviceLabel} ({claim.formattedTime})
          </span>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-white/90">
              {secondsRemaining}초 후 자동 닫힘
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 active:scale-95 transition-all shadow-md text-xs sm:text-sm"
            >
              확인
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
