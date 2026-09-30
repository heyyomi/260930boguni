import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  Heart, 
  Wind, 
  Cookie, 
  IceCream, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  User, 
  Briefcase, 
  Tablet, 
  Check, 
  Trash2, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { ClaimRecord, PrizeConfig, PrizeStat, UserType } from '../types';
import { PRIZES } from '../constants/prizes';
import { triggerConfetti, playAudioFeedback } from '../utils/effects';

interface StudentInputFormProps {
  deviceLabel: string;
  onSelectDeviceLabel: (label: string) => void;
  prizeStats: Record<string, PrizeStat>;
  onSubmitClaim: (record: Omit<ClaimRecord, 'id' | 'timestamp' | 'formattedTime'>) => Promise<boolean>;
  recentClaims: ClaimRecord[];
  onDeleteRecentClaim: (id: string) => void;
}

export const StudentInputForm: React.FC<StudentInputFormProps> = ({
  deviceLabel,
  onSelectDeviceLabel,
  prizeStats,
  onSubmitClaim,
  recentClaims,
  onDeleteRecentClaim,
}) => {
  const [userType, setUserType] = useState<UserType>('student');
  const [grade, setGrade] = useState<number>(1);
  const [classNum, setClassNum] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<string>('선생님');
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastSubmitted, setLastSubmitted] = useState<ClaimRecord | null>(null);
  const [autoResetTimer, setAutoResetTimer] = useState<number>(0);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus name field on load or when switching type
  useEffect(() => {
    nameInputRef.current?.focus();
  }, [userType]);

  // Auto-reset timer for the success celebration card
  useEffect(() => {
    if (!lastSubmitted) return;
    setAutoResetTimer(3);
    const interval = setInterval(() => {
      setAutoResetTimer((prev) => {
        if (prev <= 1) {
          setLastSubmitted(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSubmitted]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      playAudioFeedback('warning');
      nameInputRef.current?.focus();
      return;
    }

    if (!selectedPrizeId) {
      playAudioFeedback('warning');
      alert('당첨된 상품을 선택해 주세요!');
      return;
    }

    const targetPrize = PRIZES.find((p) => p.id === selectedPrizeId);
    if (!targetPrize) return;

    // Check stock
    const stat = prizeStats[selectedPrizeId];
    if (stat && stat.remainingCount <= 0) {
      playAudioFeedback('warning');
      alert(`[${targetPrize.name}] 상품은 전량 소진되었습니다.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const isGrand = targetPrize.rank <= 2;
      const success = await onSubmitClaim({
        userType,
        grade: userType === 'student' ? grade : undefined,
        classNum: userType === 'student' ? classNum : undefined,
        name: name.trim(),
        role: userType === 'staff' ? role : undefined,
        prizeId: targetPrize.id,
        prizeName: targetPrize.name,
        prizeRank: targetPrize.rank,
        deviceLabel,
      });

      if (success) {
        // Feedback
        triggerConfetti(isGrand);
        playAudioFeedback(isGrand ? 'grand' : 'success');

        const submittedRecord: ClaimRecord = {
          id: 'temp',
          timestamp: new Date().toISOString(),
          formattedTime: '방금 전',
          userType,
          grade: userType === 'student' ? grade : undefined,
          classNum: userType === 'student' ? classNum : undefined,
          name: name.trim(),
          role: userType === 'staff' ? role : undefined,
          prizeId: targetPrize.id,
          prizeName: targetPrize.name,
          prizeRank: targetPrize.rank,
          deviceLabel,
        };

        setLastSubmitted(submittedRecord);

        // Reset form for fast queue
        setName('');
        setSelectedPrizeId('');
        nameInputRef.current?.focus();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualReset = () => {
    setLastSubmitted(null);
    setName('');
    setSelectedPrizeId('');
    nameInputRef.current?.focus();
  };

  // Helper to render prize icon
  const renderPrizeIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'ShieldAlert':
        return <ShieldAlert className={className} />;
      case 'Heart':
        return <Heart className={className} />;
      case 'Wind':
        return <Wind className={className} />;
      case 'Cookie':
        return <Cookie className={className} />;
      case 'IceCream':
        return <IceCream className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* Booth Header & Device Identifier */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Tablet className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              추억의 뽑기 수령 등록 데스크
            </h2>
            <p className="text-xs text-slate-500">
              동아리 운영 부스 전용 · 학생 정보를 확인 후 상품을 지급해 주세요
            </p>
          </div>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {(['디벗 1호기', '디벗 2호기'] as const).map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                onSelectDeviceLabel(label);
                playAudioFeedback('click');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                deviceLabel === label
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Success Celebration Alert Overlay/Banner */}
      {lastSubmitted && (
        <div className="bg-linear-to-r from-emerald-500 via-teal-500 to-indigo-600 rounded-2xl p-5 text-white shadow-md animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/25 text-white">
                    수령 완료!
                  </span>
                  <span className="text-xs text-white/80">
                    {autoResetTimer}초 후 다음 접수 창으로 전환
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mt-0.5">
                  {lastSubmitted.userType === 'student'
                    ? `${lastSubmitted.grade}학년 ${lastSubmitted.classNum}반 ${lastSubmitted.name}`
                    : `${lastSubmitted.role} ${lastSubmitted.name}`}
                  님의 <span className="underline decoration-amber-300 decoration-2 font-black">{lastSubmitted.prizeName}</span> 지급 등록되었습니다!
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualReset}
              className="shrink-0 px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>다음 학생 접수</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
        
        {/* Step 1: User Type Selector (학생 vs 교직원) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 tracking-wider">
            1단계: 수령자 구분
          </label>
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setUserType('student');
                playAudioFeedback('click');
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                userType === 'student'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>학생 (학년 / 반 / 이름)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUserType('staff');
                playAudioFeedback('click');
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                userType === 'staff'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>교직원 / 선생님</span>
            </button>
          </div>
        </div>

        {/* Step 2: Information Input depending on User Type */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-500 tracking-wider">
            2단계: 기본 정보 입력
          </label>

          {userType === 'student' ? (
            <div className="space-y-4">
              
              {/* Grade Selector */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-600">학년 선택</span>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setGrade(g);
                        playAudioFeedback('click');
                      }}
                      className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                        grade === g
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {g}학년
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Selector (1 ~ 8반) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">반 선택</span>
                  <span className="text-xs font-semibold text-indigo-600">선택: {classNum}반</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setClassNum(c);
                        playAudioFeedback('click');
                      }}
                      className={`h-12 rounded-xl text-sm font-semibold border transition-all ${
                        classNum === c
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {c}반
                    </button>
                  ))}
                </div>
              </div>

              {/* Student Name */}
              <div className="space-y-1.5">
                <label htmlFor="student-name" className="text-xs font-medium text-slate-600">
                  학생 이름
                </label>
                <div className="relative">
                  <input
                    ref={nameInputRef}
                    id="student-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름 입력 (예: 홍길동)"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  {name && (
                    <button
                      type="button"
                      onClick={() => {
                        setName('');
                        nameInputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-md transition-colors"
                    >
                      지우기
                    </button>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* Staff Input Section */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-600">직책 및 소속</span>
                <div className="grid grid-cols-2 gap-3">
                  {['선생님', '교직원'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRole(r);
                        playAudioFeedback('click');
                      }}
                      className={`py-3.5 rounded-xl text-sm font-bold border transition-all ${
                        role === r
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="staff-name" className="text-xs font-medium text-slate-600">
                  선생님 / 교직원 성함
                </label>
                <div className="relative">
                  <input
                    ref={nameInputRef}
                    id="staff-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="성함 입력 (예: 김선생, 박행정)"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  {name && (
                    <button
                      type="button"
                      onClick={() => {
                        setName('');
                        nameInputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-md transition-colors"
                    >
                      지우기
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Prize Selection Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-500 tracking-wider">
              3단계: 당첨된 상품 선택 (총 6종류)
            </label>
            <span className="text-xs text-slate-500">
              터치하여 당첨 상품을 지정하세요
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRIZES.map((prize) => {
              const stat = prizeStats[prize.id];
              const remaining = stat ? stat.remainingCount : prize.quota;
              const isSoldOut = remaining <= 0;
              const isSelected = selectedPrizeId === prize.id;
              const isTopRank = prize.rank <= 2;

              return (
                <button
                  key={prize.id}
                  type="button"
                  disabled={isSoldOut}
                  onClick={() => {
                    if (isSoldOut) {
                      playAudioFeedback('warning');
                      return;
                    }
                    setSelectedPrizeId(prize.id);
                    playAudioFeedback(isTopRank ? 'grand' : 'click');
                  }}
                  className={`group relative text-left p-4 rounded-2xl border transition-all ${
                    isSoldOut
                      ? 'bg-slate-50 border-slate-200 opacity-55 cursor-not-allowed'
                      : isSelected
                      ? 'bg-indigo-50/70 border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Top Badge: Rank & Special */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                        prize.rank === 1
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : prize.rank === 2
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : prize.rank === 3
                          ? 'bg-pink-100 text-pink-800'
                          : prize.rank === 4
                          ? 'bg-teal-100 text-teal-800'
                          : prize.rank === 5
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {prize.rank}등
                      {prize.isSpecialCombo && ' 👑 특상'}
                    </span>

                    {/* Stock Pill */}
                    <span
                      className={`text-xs font-semibold ${
                        isSoldOut
                          ? 'text-rose-600 font-bold'
                          : remaining <= 2
                          ? 'text-amber-600 font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      {isSoldOut ? '마감 (0개)' : `잔여 ${remaining} / ${prize.quota}`}
                    </span>
                  </div>

                  {/* Prize Name & Icon */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                      }`}
                    >
                      {renderPrizeIcon(prize.icon, 'w-5 h-5')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {prize.name}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {prize.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Selected Checkmark indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Stock progress bar */}
                  <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isSoldOut
                          ? 'bg-slate-300'
                          : isSelected
                          ? 'bg-indigo-600'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round(((prize.quota - remaining) / prize.quota) * 100))}%`,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !selectedPrizeId}
            className="w-full sm:flex-1 py-4 px-6 bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.99] text-white font-bold text-base sm:text-lg rounded-2xl shadow-md shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>기록 저장 중...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-indigo-200" />
                <span>상품 수령 등록 완료</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleManualReset}
            className="w-full sm:w-auto px-5 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>초기화</span>
          </button>
        </div>

      </form>

      {/* Recent Claims Drawer (on this booth) */}
      {recentClaims.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-700 tracking-wider">
                최근 접수 내역 (오기입 시 바로 취소 가능)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              최근 {Math.min(recentClaims.length, 5)}건
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {recentClaims.slice(0, 5).map((claim) => (
              <div
                key={claim.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-slate-900 truncate">
                    {claim.userType === 'student'
                      ? `${claim.grade}학년 ${claim.classNum}반 ${claim.name}`
                      : `${claim.role || '교직원'} ${claim.name}`}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="font-bold text-indigo-700 truncate">
                    {claim.prizeName}
                  </span>
                  <span className="text-slate-400 text-xs hidden sm:inline">
                    ({claim.deviceLabel})
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    {claim.formattedTime}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`'${claim.name}' 학생의 기록을 삭제(취소)하시겠습니까?`)) {
                        onDeleteRecentClaim(claim.id);
                      }
                    }}
                    title="기록 취소"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
