import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  Heart, 
  Wind, 
  Cookie, 
  IceCream, 
  Maximize2, 
  Minimize2, 
  Download, 
  Printer, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  Users, 
  Award, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  Settings, 
  AlertTriangle,
  RotateCcw,
  Plus,
  QrCode
} from 'lucide-react';
import { ClaimRecord, FilterState, PrizeStat, GoogleSheetsConfig } from '../types';
import { PRIZES, TOTAL_PRIZES_QUOTA } from '../constants/prizes';

interface TeacherDashboardProps {
  claims: ClaimRecord[];
  prizeStats: Record<string, PrizeStat>;
  onDeleteClaim: (id: string) => void;
  onClearAllClaims: () => void;
  onGenerateSampleData: () => void;
  gasConfig: GoogleSheetsConfig;
  onOpenGasSettings: () => void;
  isSyncing: boolean;
  onManualSync: () => void;
  onLockTeacherMode: () => void;
  onTriggerCelebrationTest?: () => void;
  onOpenQrModal?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  claims,
  prizeStats,
  onDeleteClaim,
  onClearAllClaims,
  onGenerateSampleData,
  gasConfig,
  onOpenGasSettings,
  isSyncing,
  onManualSync,
  onLockTeacherMode,
  onTriggerCelebrationTest,
  onOpenQrModal,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    userType: 'all',
    grade: 'all',
    classNum: 'all',
    prizeId: 'all',
    searchQuery: '',
  });

  // Toggle Fullscreen for Classroom Smartboard
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Filter Claims
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      // User type filter
      if (filters.userType !== 'all' && claim.userType !== filters.userType) {
        return false;
      }
      // Grade filter
      if (filters.grade !== 'all' && claim.grade !== filters.grade) {
        return false;
      }
      // Class filter
      if (filters.classNum !== 'all' && claim.classNum !== filters.classNum) {
        return false;
      }
      // Prize filter
      if (filters.prizeId !== 'all' && claim.prizeId !== filters.prizeId) {
        return false;
      }
      // Search query (name or role)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.trim().toLowerCase();
        const matchesName = claim.name.toLowerCase().includes(query);
        const matchesRole = claim.role ? claim.role.toLowerCase().includes(query) : false;
        const matchesPrize = claim.prizeName.toLowerCase().includes(query);
        if (!matchesName && !matchesRole && !matchesPrize) return false;
      }
      return true;
    });
  }, [claims, filters]);

  // Overall Stats
  const totalClaimed = claims.length;
  const remainingTotal = Math.max(0, TOTAL_PRIZES_QUOTA - totalClaimed);
  const overallPercentage = Math.min(100, Math.round((totalClaimed / TOTAL_PRIZES_QUOTA) * 100));

  // Export CSV
  const handleExportCSV = () => {
    if (claims.length === 0) {
      alert('내보낼 수령 기록이 없습니다.');
      return;
    }

    const headers = ['등록일시', '고유ID', '구분', '학년', '반', '이름', '직책', '당첨상품', '등수', '접수기기'];
    const rows = claims.map((c) => [
      `"${c.formattedTime}"`,
      `"${c.id}"`,
      `"${c.userType === 'student' ? '학생' : '교직원'}"`,
      `"${c.grade || ''}"`,
      `"${c.classNum || ''}"`,
      `"${c.name}"`,
      `"${c.role || ''}"`,
      `"${c.prizeName}"`,
      `"${c.prizeRank}"`,
      `"${c.deviceLabel}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.setAttribute('href', url);
    link.setAttribute('download', `추억의뽑기_수령현황_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print View
  const handlePrint = () => {
    window.print();
  };

  // Helper for Prize Icon
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Smartboard Top Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              실시간 전자칠판 모니터링
            </span>
            {gasConfig.isConnected && (
              <span className="text-xs text-slate-500 hidden sm:inline">
                · 구글 시트 양방향 연동 중
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            추억의 뽑기 실시간 상품 수령 현황
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            양쪽 디벗 태블릿에서 접수되는 내역이 실시간으로 집계 및 반영됩니다
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? '창 모드' : '칠판 전체화면'}</span>
          </button>

          {onTriggerCelebrationTest && (
            <button
              type="button"
              onClick={onTriggerCelebrationTest}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs rounded-xl transition-colors border border-amber-200"
              title="새 당첨자 발생 시 전자칠판에 뜨는 대형 축하 팝업을 미리 테스트합니다"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>당첨 연출 테스트</span>
            </button>
          )}

          <button
            type="button"
            onClick={onManualSync}
            disabled={isSyncing}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>엑셀(CSV)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>인쇄</span>
          </button>

          {onOpenQrModal && (
            <button
              type="button"
              onClick={onOpenQrModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              title="디벗 및 스마트폰 접속용 QR 코드 띄우기"
            >
              <QrCode className="w-4 h-4 text-indigo-600" />
              <span>QR 공유</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLockTeacherMode}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition-colors"
            title="교사 모드 잠금"
          >
            <span>교사 모드 종료</span>
          </button>
        </div>
      </div>

      {/* Primary Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Quota */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">총 준비 상품</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {TOTAL_PRIZES_QUOTA}
            </span>
            <span className="text-xs font-bold text-slate-400">명</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">6종류 당첨 품목</p>
        </div>

        {/* Claimed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">현재 수령 완료</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">
              {totalClaimed}
            </span>
            <span className="text-xs font-bold text-slate-400">명</span>
          </div>
          <p className="text-xs text-emerald-600/80 font-medium mt-1">
            소진율 {overallPercentage}%
          </p>
        </div>

        {/* Remaining */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">잔여 상품</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">
              {remainingTotal}
            </span>
            <span className="text-xs font-bold text-slate-400">명</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">남은 수량 합계</p>
        </div>

        {/* Total Progress Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">전체 배부 진행도</span>
              <span className="text-xs font-bold text-indigo-600">{overallPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mt-2">
              <div
                className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {remainingTotal === 0 ? '🎉 모든 상품이 소진되었습니다!' : `${remainingTotal}개 남음`}
          </p>
        </div>

      </div>

      {/* 6 Prize Inventory Detail Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>품목별 잔여 재고 현황</span>
            <span className="text-xs font-medium text-slate-400">(총 6종류)</span>
          </h3>
          <span className="text-xs text-slate-500 hidden sm:inline">
            실시간 2대 디벗 자동 동기화
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRIZES.map((prize) => {
            const stat = prizeStats[prize.id];
            const claimed = stat ? stat.claimedCount : 0;
            const remaining = stat ? stat.remainingCount : prize.quota;
            const percentage = stat ? stat.percentage : 0;
            const isSoldOut = remaining <= 0;
            const isTopRank = prize.rank <= 2;

            return (
              <div
                key={prize.id}
                className={`bg-white rounded-2xl p-4 border transition-all ${
                  isTopRank
                    ? 'border-amber-200/80 shadow-xs ring-1 ring-amber-100'
                    : 'border-slate-200/80 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      prize.rank === 1
                        ? 'bg-amber-100 text-amber-800'
                        : prize.rank === 2
                        ? 'bg-rose-100 text-rose-800'
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
                  </span>

                  <span
                    className={`text-xs font-bold ${
                      isSoldOut
                        ? 'text-rose-600'
                        : remaining <= 2
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {isSoldOut ? '소진' : `${remaining}개 남음`}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    {renderPrizeIcon(prize.icon, 'w-4 h-4')}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={prize.name}>
                    {prize.name}
                  </h4>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>수령 {claimed}</span>
                    <span>정원 {prize.quota}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isSoldOut ? 'bg-rose-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              반별 · 학생별 상세 조회 필터
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              검색결과: {filteredClaims.length}건
            </span>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="학생 이름 / 선생님 검색..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          
          {/* User Type */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400">구분:</span>
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, userType: 'all' }))}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filters.userType === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, userType: 'student' }))}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filters.userType === 'student' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                학생
              </button>
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, userType: 'staff' }))}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filters.userType === 'staff' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                교직원
              </button>
            </div>
          </div>

          {/* Grade Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400">학년:</span>
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, grade: 'all' }))}
                className={`px-2 py-1 rounded-md transition-colors ${
                  filters.grade === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                전체
              </button>
              {[1, 2, 3].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, grade: g as any }))}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    filters.grade === g ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {g}학년
                </button>
              ))}
            </div>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400">반:</span>
            <select
              value={filters.classNum}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  classNum: e.target.value === 'all' ? 'all' : Number(e.target.value),
                }))
              }
              className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="all">전체 반 (1~8반)</option>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((c) => (
                <option key={c} value={c}>
                  {c}반
                </option>
              ))}
            </select>
          </div>

          {/* Prize Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400">상품:</span>
            <select
              value={filters.prizeId}
              onChange={(e) => setFilters((prev) => ({ ...prev, prizeId: e.target.value }))}
              className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden max-w-[150px] truncate"
            >
              <option value="all">전체 상품</option>
              {PRIZES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.rank}등: {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(filters.userType !== 'all' ||
            filters.grade !== 'all' ||
            filters.classNum !== 'all' ||
            filters.prizeId !== 'all' ||
            filters.searchQuery) && (
            <button
              type="button"
              onClick={() =>
                setFilters({
                  userType: 'all',
                  grade: 'all',
                  classNum: 'all',
                  prizeId: 'all',
                  searchQuery: '',
                })
              }
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>필터 초기화</span>
            </button>
          )}

        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              수령 등록 명단 리스트
            </h3>
            <span className="text-xs text-slate-400">
              (최신 등록순 자동 정렬)
            </span>
          </div>

          {claims.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('정말로 모든 수령 기록을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                  onClearAllClaims();
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 hover:bg-rose-50 rounded-md transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>전체 기록 삭제</span>
            </button>
          )}
        </div>

        {filteredClaims.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">
                {claims.length === 0 ? '아직 등록된 상품 수령자가 없습니다.' : '일치하는 검색 결과가 없습니다.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {claims.length === 0
                  ? '부스(디벗)에서 학생들의 당첨 상품을 등록하면 실시간으로 표시됩니다.'
                  : '필터 조건을 변경하거나 검색어를 초기화해 보세요.'}
              </p>
            </div>
            {claims.length === 0 && (
              <button
                type="button"
                onClick={onGenerateSampleData}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>테스트용 샘플 데이터 10건 채우기</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">번호</th>
                  <th className="py-3 px-4">등록 시각</th>
                  <th className="py-3 px-4">구분</th>
                  <th className="py-3 px-4">소속 (학년/반 또는 직책)</th>
                  <th className="py-3 px-4">수령자 이름</th>
                  <th className="py-3 px-4">당첨 상품</th>
                  <th className="py-3 px-4 hidden md:table-cell">접수 기기</th>
                  <th className="py-3 px-4 text-center w-16">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClaims.map((claim, idx) => {
                  const isTopRank = claim.prizeRank <= 2;
                  return (
                    <tr
                      key={claim.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isTopRank ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                        {filteredClaims.length - idx}
                      </td>

                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-xs font-mono">
                        {claim.formattedTime}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold ${
                            claim.userType === 'student'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {claim.userType === 'student' ? '학생' : '교직원'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {claim.userType === 'student'
                          ? `${claim.grade}학년 ${claim.classNum}반`
                          : claim.role || '교직원'}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {claim.name}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                              claim.prizeRank === 1
                                ? 'bg-amber-100 text-amber-900 font-black'
                                : claim.prizeRank === 2
                                ? 'bg-rose-100 text-rose-900 font-black'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {claim.prizeRank}등
                          </span>
                          <span className="font-bold text-indigo-900">
                            {claim.prizeName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 hidden md:table-cell text-xs text-slate-400">
                        {claim.deviceLabel}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`'${claim.name}' 수령자의 기록을 삭제하시겠습니까?`)) {
                              onDeleteClaim(claim.id);
                            }
                          }}
                          title="기록 삭제"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
