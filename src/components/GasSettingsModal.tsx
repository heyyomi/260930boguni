import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Cloud, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { GoogleSheetsConfig } from '../types';
import { CODE_GS_SCRIPT, testGasConnection } from '../services/gasService';

interface GasSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (newConfig: GoogleSheetsConfig) => void;
  onResetToLocalOnly: () => void;
}

export const GasSettingsModal: React.FC<GasSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetToLocalOnly,
}) => {
  const [url, setUrl] = useState<string>(config.webAppUrl || '');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(CODE_GS_SCRIPT);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      alert('클립보드 복사에 실패했습니다. 코드 영역을 직접 복사해 주세요.');
    }
  };

  const handleTestAndSave = async () => {
    if (!url.trim()) {
      setTestResult({
        success: false,
        message: '구글 앱스 스크립트 웹 앱 URL을 입력해 주세요.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testGasConnection(url.trim());
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      onSaveConfig({
        ...config,
        webAppUrl: url.trim(),
        isConnected: true,
        lastSyncAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                구글 시트 (GAS) 실시간 연동 설정
              </h3>
              <p className="text-xs text-slate-500">
                별도 서버 없이 구글 스프레드시트에 실시간으로 기록을 자동 저장합니다
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm">
          
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 ${
              config.isConnected
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            {config.isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h4 className="font-bold text-xs sm:text-sm">
                {config.isConnected ? '구글 시트와 실시간 연동 활성화 상태' : '현재 로컬 임시 저장 모드 (기본 작동)'}
              </h4>
              <p className="text-xs opacity-90 leading-relaxed">
                {config.isConnected
                  ? '디벗 1호기와 2호기, 그리고 교실 전자칠판이 같은 구글 시트를 통해 실시간으로 동기화됩니다.'
                  : '구글 시트 연동 전에도 브라우저 로컬 저장소(localStorage)를 통해 뽑기 접수와 통계가 정상 작동합니다.'}
              </p>
            </div>
          </div>

          {/* Step by Step Guide */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span>연동 4단계 가이드</span>
              <span className="text-xs font-normal text-slate-400">(약 1분 소요)</span>
            </h4>

            <ol className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <span>
                  구글 드라이브에서 <strong>새 구글 스프레드시트</strong>를 만듭니다.{' '}
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    sheets.new 새 시트 열기 <ExternalLink className="w-3 h-3" />
                  </a>
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <span>
                  상단 메뉴의 <strong>[확장 프로그램] → [Apps Script]</strong>를 클릭합니다.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <span>
                  기존 코드를 모두 지우고, 아래의 <strong>Code.gs 스크립트 코드</strong>를 복사하여 붙여넣고 저장(Ctrl+S)합니다.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  4
                </span>
                <span>
                  우측 상단 <strong>[배포] → [새 배포]</strong> 클릭 → 유형 <strong>[웹 앱]</strong> 선택 → 다음 사용자로 실행: <strong>나</strong>, 액세스 권한: <strong>모든 사용자(Anyone)</strong>로 설정 후 배포하여 생성된 <strong>웹 앱 URL</strong>을 아래에 등록합니다.
                </span>
              </li>
            </ol>
          </div>

          {/* Copyable Code.gs Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Code.gs 스크립트 소스코드</span>
                <span className="text-slate-400 font-normal">GET/POST 자동 시트 기록 지원</span>
              </label>

              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs rounded-xl transition-all shadow-xs"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>클릭하여 복사 (Click to Copy)</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs p-4 max-h-48 overflow-y-auto border border-slate-800">
              <pre className="whitespace-pre">{CODE_GS_SCRIPT}</pre>
            </div>
          </div>

          {/* Web App URL Input and Test */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block">
              배포받은 구글 웹 앱 URL (Web App URL)
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="button"
                onClick={handleTestAndSave}
                disabled={isTesting || !url.trim()}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 shrink-0"
              >
                {isTesting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>연동 테스트 중...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>연동 테스트 및 저장</span>
                  </>
                )}
              </button>
            </div>

            {/* Test result message */}
            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-slate-50/60 flex items-center justify-between">
          {config.isConnected ? (
            <button
              type="button"
              onClick={() => {
                if (confirm('구글 시트 연동을 해제하고 로컬 모드로 전환하시겠습니까?')) {
                  onResetToLocalOnly();
                  setUrl('');
                  setTestResult(null);
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>연동 해제 (로컬 모드로 전환)</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400">
              * 연동하지 않아도 이 태블릿에 안전하게 보관됩니다
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
