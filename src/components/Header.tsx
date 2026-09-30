import React from 'react';
import { 
  Sparkles, 
  Monitor, 
  Tablet, 
  Settings, 
  Lock, 
  Unlock, 
  Cloud, 
  CloudOff, 
  RefreshCw,
  QrCode
} from 'lucide-react';
import { GoogleSheetsConfig } from '../types';

interface HeaderProps {
  currentMode: 'student' | 'teacher';
  onSwitchMode: (mode: 'student' | 'teacher') => void;
  isTeacherAuthenticated: boolean;
  onOpenTeacherAuth: () => void;
  onOpenGasSettings: () => void;
  onOpenQrModal: () => void;
  gasConfig: GoogleSheetsConfig;
  isSyncing: boolean;
  onManualSync: () => void;
  deviceLabel: string;
  onSelectDeviceLabel: (label: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSwitchMode,
  isTeacherAuthenticated,
  onOpenTeacherAuth,
  onOpenGasSettings,
  onOpenQrModal,
  gasConfig,
  isSyncing,
  onManualSync,
  deviceLabel,
  onSelectDeviceLabel,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-100">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  추억의 뽑기 수령 관리
                </h1>
                <span className="hidden sm:inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  학교 축제·학급용
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {currentMode === 'student' ? '디벗 실시간 당첨 상품 접수 데스크' : '교실 메인 전자칠판 실시간 대시보드'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Mode Switcher Tabs */}
            <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 text-xs font-medium">
              <button
                type="button"
                onClick={() => onSwitchMode('student')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  currentMode === 'student'
                    ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>부스 접수 (디벗)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isTeacherAuthenticated) {
                    onSwitchMode('teacher');
                  } else {
                    onOpenTeacherAuth();
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  currentMode === 'teacher'
                    ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>전자칠판 (교사용)</span>
                {!isTeacherAuthenticated && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
              </button>
            </div>

            {/* D-but Booth Device Selector (visible when in student mode) */}
            {currentMode === 'student' && (
              <div className="hidden md:flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => onSelectDeviceLabel('디벗 1호기')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    deviceLabel === '디벗 1호기'
                      ? 'bg-indigo-600 text-white font-medium shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1호기
                </button>
                <button
                  type="button"
                  onClick={() => onSelectDeviceLabel('디벗 2호기')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    deviceLabel === '디벗 2호기'
                      ? 'bg-indigo-600 text-white font-medium shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2호기
                </button>
              </div>
            )}

            {/* Google Sheets Sync Pill / Action */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenGasSettings}
                title={gasConfig.isConnected ? '구글 시트 실시간 연동 중 (설정 열기)' : '로컬 모드 (구글 시트 연동하기)'}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  gasConfig.isConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {gasConfig.isConnected ? (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">구글 시트 연동됨</span>
                    <span className="sm:hidden">시트</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">시트 연동</span>
                    <span className="sm:hidden">연동</span>
                  </>
                )}
              </button>

              {/* Manual Sync Icon */}
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSyncing}
                title="데이터 새로고침"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
              </button>

              {/* QR Code Share Button */}
              <button
                type="button"
                onClick={onOpenQrModal}
                title="웹앱 공유 QR 코드 열기"
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">QR 공유</span>
              </button>

              {/* Settings / Discreet Teacher Unlock icon */}
              <button
                type="button"
                onClick={isTeacherAuthenticated ? onOpenGasSettings : onOpenTeacherAuth}
                title={isTeacherAuthenticated ? '환경 설정' : '교사용 관리자 인증'}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="관리자 메뉴"
              >
                {isTeacherAuthenticated ? (
                  <Settings className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4 opacity-70 hover:opacity-100" />
                )}
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
