import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  Download, 
  Copy, 
  Check, 
  Printer, 
  Tablet, 
  Monitor, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface QrCodeShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeShareModal: React.FC<QrCodeShareModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [targetType, setTargetType] = useState<'student' | 'teacher'>('student');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize URL based on current window location
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin + window.location.pathname;
      setCustomUrl(baseUrl);
    }
  }, [isOpen]);

  // Construct target URL with mode param if needed
  const activeUrl = React.useMemo(() => {
    if (!customUrl) return '';
    try {
      const url = new URL(customUrl);
      if (targetType === 'teacher') {
        url.searchParams.set('mode', 'teacher');
      } else {
        url.searchParams.delete('mode');
      }
      return url.toString();
    } catch (e) {
      return customUrl;
    }
  }, [customUrl, targetType]);

  // Render QR Code onto canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !activeUrl) return;

    QRCode.toCanvas(
      canvasRef.current,
      activeUrl,
      {
        width: 280,
        margin: 2,
        color: {
          dark: '#1e1b4b', // deep indigo
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      },
      (error) => {
        if (error) console.error('Failed to generate QR Code:', error);
      }
    );
  }, [isOpen, activeUrl]);

  if (!isOpen) return null;

  // Copy link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(activeUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      alert('링크 복사에 실패했습니다.');
    }
  };

  // Download QR Code as PNG
  const handleDownloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `추억의뽑기_${targetType === 'student' ? '디벗접수용' : '전자칠판용'}_QR.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Print poster
  const handlePrintPoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !canvasRef.current) {
      window.print();
      return;
    }

    const qrDataUrl = canvasRef.current.toDataURL('image/png');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>추억의 뽑기 QR 코드 부스 안내장</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: sans-serif; text-align: center; padding: 40px; margin: 0; }
          .poster { border: 4px solid #4f46e5; border-radius: 24px; padding: 40px 20px; max-width: 500px; margin: 0 auto; }
          h1 { color: #1e1b4b; font-size: 26px; margin: 0 0 10px; }
          p.desc { color: #475569; font-size: 16px; margin: 0 0 30px; }
          .qr-img { width: 280px; height: 280px; margin-bottom: 20px; }
          .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 6px 16px; border-radius: 999px; font-weight: bold; font-size: 14px; margin-bottom: 20px; }
          .footer { font-size: 13px; color: #94a3b8; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="poster">
          <div class="badge">🎁 학교 축제 · 학급 이벤트</div>
          <h1>추억의 뽑기 상품 수령 데스크</h1>
          <p class="desc">카메라나 디벗(태블릿)으로 QR 코드를 스캔하여<br>당첨된 상품을 등록하세요!</p>
          <img src="${qrDataUrl}" class="qr-img" />
          <div style="font-size: 14px; font-weight: bold; color: #4f46e5;">스마트폰 카메라로 비추면 바로 열립니다</div>
          <div class="footer">추억의 뽑기 상품 수령 관리 시스템</div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 overflow-hidden space-y-6"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                웹앱 공유 QR 코드
              </h3>
              <p className="text-xs text-slate-500">
                디벗(태블릿)이나 스마트폰으로 스캔하여 바로 접속하세요
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Destination Switcher */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500">
            접속 화면 대상 선택
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTargetType('student')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all ${
                targetType === 'student'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>부스 접수용 (디벗 1·2호기)</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetType('teacher')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all ${
                targetType === 'teacher'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>전자칠판 모니터링용</span>
            </button>
          </div>
        </div>

        {/* Center QR Code Display */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
            <canvas ref={canvasRef} className="rounded-lg w-56 h-56" />
          </div>

          <p className="text-xs font-bold text-slate-700 mt-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>디벗 카메라 앱으로 비추면 즉시 실행됩니다</span>
          </p>
        </div>

        {/* URL Input & Quick Actions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={activeUrl}
              className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 truncate focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? '복사됨!' : '주소 복사'}</span>
            </button>
          </div>

          {/* Download & Print Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleDownloadImage}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>QR 이미지 저장</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPoster}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>A4 안내장 인쇄</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
