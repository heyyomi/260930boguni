/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { StudentInputForm } from './components/StudentInputForm';
import { TeacherDashboard } from './components/TeacherDashboard';
import { GasSettingsModal } from './components/GasSettingsModal';
import { TeacherPasswordModal } from './components/TeacherPasswordModal';
import { SmartboardCelebrationOverlay } from './components/SmartboardCelebrationOverlay';
import { ClaimRecord, GoogleSheetsConfig, PrizeStat } from './types';
import { PRIZES, STORAGE_KEYS } from './constants/prizes';
import { 
  saveRecordToGas, 
  fetchRecordsFromGas, 
  deleteRecordFromGas 
} from './services/gasService';
import { generateSampleRecords } from './utils/sampleData';

const SYNC_CHANNEL_NAME = 'school_lucky_draw_sync_channel';

export default function App() {
  // Mode: student (디벗 부스 접수) | teacher (전자칠판 대시보드)
  const [currentMode, setCurrentMode] = useState<'student' | 'teacher'>('student');
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(STORAGE_KEYS.TEACHER_AUTH) === 'true';
  });

  // Modals
  const [isGasModalOpen, setIsGasModalOpen] = useState<boolean>(false);
  const [isTeacherAuthModalOpen, setIsTeacherAuthModalOpen] = useState<boolean>(false);

  // Real-time Celebratory Overlay for Classroom Smartboard
  const [celebrationClaim, setCelebrationClaim] = useState<ClaimRecord | null>(null);

  // Tablet Device Identity (디벗 1호기 / 디벗 2호기)
  const [deviceLabel, setDeviceLabel] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.DEVICE_LABEL) || '디벗 1호기';
  });

  // Google Sheets Config
  const [gasConfig, setGasConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GAS_CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      webAppUrl: '',
      isConnected: false,
      lastSyncAt: null,
      autoSync: true,
      syncInterval: 6,
    };
  });

  // Claims state
  const [claims, setClaims] = useState<ClaimRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLAIMS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Keep track of already seen claim IDs to avoid duplicate celebratory pops during polling
  const seenClaimIdsRef = useRef<Set<string>>(new Set(claims.map((c) => c.id)));

  // Save device label change
  const handleSelectDeviceLabel = (label: string) => {
    setDeviceLabel(label);
    localStorage.setItem(STORAGE_KEYS.DEVICE_LABEL, label);
  };

  // BroadcastChannel for instant local multi-tab sync
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (!event.data) return;

        if (event.data.type === 'SYNC_CLAIMS' && Array.isArray(event.data.claims)) {
          setClaims(event.data.claims);
        } else if (event.data.type === 'NEW_CLAIM' && event.data.claim) {
          // If this window is in teacher mode, pop the celebration overlay!
          if (currentMode === 'teacher') {
            setCelebrationClaim(event.data.claim);
          }
        }
      };
    } catch (e) {
      // BroadcastChannel might not be supported in older browsers
    }

    return () => {
      channel?.close();
    };
  }, [currentMode]);

  // Save claims to localStorage whenever updated & notify broadcast
  const updateClaims = useCallback((newClaimsOrUpdater: ClaimRecord[] | ((prev: ClaimRecord[]) => ClaimRecord[])) => {
    setClaims((prev) => {
      const next = typeof newClaimsOrUpdater === 'function' ? newClaimsOrUpdater(prev) : newClaimsOrUpdater;
      localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(next));
      
      try {
        const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        channel.postMessage({ type: 'SYNC_CLAIMS', claims: next });
        channel.close();
      } catch (e) {
        // ignore
      }

      return next;
    });
  }, []);

  // Sync with Google Sheets
  const syncWithGas = useCallback(async (isSilent = false) => {
    if (!gasConfig.isConnected || !gasConfig.webAppUrl) return;

    if (!isSilent) setIsSyncing(true);
    try {
      const remoteRecords = await fetchRecordsFromGas(gasConfig.webAppUrl);
      if (remoteRecords && Array.isArray(remoteRecords)) {
        // Detect newly arrived records that haven't been seen yet
        const newUnseen = remoteRecords.filter((r) => !seenClaimIdsRef.current.has(r.id));
        remoteRecords.forEach((r) => seenClaimIdsRef.current.add(r.id));

        // If in teacher mode and new winners just entered on another device, celebrate!
        if (newUnseen.length > 0 && currentMode === 'teacher') {
          setCelebrationClaim(newUnseen[0]);
        }

        setClaims(() => {
          localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(remoteRecords));
          return remoteRecords;
        });

        const updatedConfig = {
          ...gasConfig,
          lastSyncAt: new Date().toISOString(),
        };
        setGasConfig(updatedConfig);
        localStorage.setItem(STORAGE_KEYS.GAS_CONFIG, JSON.stringify(updatedConfig));
      }
    } catch (error) {
      console.warn('Sync failed:', error);
    } finally {
      if (!isSilent) setIsSyncing(false);
    }
  }, [gasConfig, currentMode]);

  // Periodic polling when connected to Google Sheets (every 6 seconds)
  useEffect(() => {
    if (!gasConfig.isConnected || !gasConfig.webAppUrl) return;

    // Initial sync
    syncWithGas(true);

    const interval = setInterval(() => {
      syncWithGas(true);
    }, (gasConfig.syncInterval || 6) * 1000);

    return () => clearInterval(interval);
  }, [gasConfig.isConnected, gasConfig.webAppUrl, gasConfig.syncInterval, syncWithGas]);

  // Handle Add Claim
  const handleAddClaim = async (
    recordData: Omit<ClaimRecord, 'id' | 'timestamp' | 'formattedTime'>
  ): Promise<boolean> => {
    const now = new Date();
    const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newRecord: ClaimRecord = {
      ...recordData,
      id: newId,
      timestamp: now.toISOString(),
      formattedTime,
      syncedToGoogleSheet: false,
    };

    seenClaimIdsRef.current.add(newId);

    // 1. Immediately update local state & localStorage (zero latency for student queue)
    updateClaims((prev) => [newRecord, ...prev]);

    // 2. Broadcast new claim for other tabs in teacher mode to trigger celebration
    try {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channel.postMessage({ type: 'NEW_CLAIM', claim: newRecord });
      channel.close();
    } catch (e) {
      // ignore
    }

    // 3. If currently in teacher mode on this screen as well, celebrate directly
    if (currentMode === 'teacher') {
      setCelebrationClaim(newRecord);
    }

    // 4. Post to Google Sheets if connected
    if (gasConfig.isConnected && gasConfig.webAppUrl) {
      saveRecordToGas(gasConfig.webAppUrl, newRecord).then((success) => {
        if (success) {
          updateClaims((prev) =>
            prev.map((c) => (c.id === newId ? { ...c, syncedToGoogleSheet: true } : c))
          );
        }
      });
    }

    return true;
  };

  // Handle Delete Claim
  const handleDeleteClaim = async (id: string) => {
    updateClaims((prev) => prev.filter((c) => c.id !== id));

    if (gasConfig.isConnected && gasConfig.webAppUrl) {
      deleteRecordFromGas(gasConfig.webAppUrl, id);
    }
  };

  // Clear all claims
  const handleClearAllClaims = () => {
    updateClaims([]);
    seenClaimIdsRef.current.clear();
  };

  // Generate Sample Data for Demo
  const handleGenerateSampleData = () => {
    const samples = generateSampleRecords();
    samples.forEach((s) => seenClaimIdsRef.current.add(s.id));
    updateClaims(samples);
  };

  // Trigger preview celebration on smartboard
  const handleTriggerCelebrationTest = () => {
    const testClaim: ClaimRecord = {
      id: `test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      formattedTime: '방금 전',
      userType: 'student',
      grade: 2,
      classNum: 3,
      name: '홍길동',
      prizeId: PRIZES[0].id,
      prizeName: PRIZES[0].name,
      prizeRank: 1,
      deviceLabel: '디벗 1호기',
      syncedToGoogleSheet: false,
    };
    setCelebrationClaim(testClaim);
  };

  // Save GAS Config
  const handleSaveGasConfig = (newConfig: GoogleSheetsConfig) => {
    setGasConfig(newConfig);
    localStorage.setItem(STORAGE_KEYS.GAS_CONFIG, JSON.stringify(newConfig));
    syncWithGas();
  };

  // Reset GAS Config
  const handleResetToLocalOnly = () => {
    const newConfig: GoogleSheetsConfig = {
      webAppUrl: '',
      isConnected: false,
      lastSyncAt: null,
      autoSync: true,
      syncInterval: 6,
    };
    setGasConfig(newConfig);
    localStorage.setItem(STORAGE_KEYS.GAS_CONFIG, JSON.stringify(newConfig));
  };

  // Teacher Authentication
  const handleTeacherAuthSuccess = () => {
    setIsTeacherAuthenticated(true);
    sessionStorage.setItem(STORAGE_KEYS.TEACHER_AUTH, 'true');
    setCurrentMode('teacher');
  };

  const handleLockTeacherMode = () => {
    setIsTeacherAuthenticated(false);
    sessionStorage.removeItem(STORAGE_KEYS.TEACHER_AUTH);
    setCurrentMode('student');
  };

  // Derived Prize Stats
  const prizeStats = useMemo<Record<string, PrizeStat>>(() => {
    const stats: Record<string, PrizeStat> = {};

    PRIZES.forEach((prize) => {
      const claimedCount = claims.filter((c) => c.prizeId === prize.id).length;
      const remainingCount = Math.max(0, prize.quota - claimedCount);
      const percentage = Math.min(100, Math.round((claimedCount / prize.quota) * 100));
      const isSoldOut = remainingCount <= 0;

      stats[prize.id] = {
        prize,
        claimedCount,
        remainingCount,
        percentage,
        isSoldOut,
      };
    });

    return stats;
  }, [claims]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation Bar */}
      <Header
        currentMode={currentMode}
        onSwitchMode={(mode) => {
          if (mode === 'teacher' && !isTeacherAuthenticated) {
            setIsTeacherAuthModalOpen(true);
          } else {
            setCurrentMode(mode);
          }
        }}
        isTeacherAuthenticated={isTeacherAuthenticated}
        onOpenTeacherAuth={() => setIsTeacherAuthModalOpen(true)}
        onOpenGasSettings={() => setIsGasModalOpen(true)}
        gasConfig={gasConfig}
        isSyncing={isSyncing}
        onManualSync={() => syncWithGas()}
        deviceLabel={deviceLabel}
        onSelectDeviceLabel={handleSelectDeviceLabel}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentMode === 'student' ? (
          <StudentInputForm
            deviceLabel={deviceLabel}
            onSelectDeviceLabel={handleSelectDeviceLabel}
            prizeStats={prizeStats}
            onSubmitClaim={handleAddClaim}
            recentClaims={claims.filter((c) => c.deviceLabel === deviceLabel || !c.deviceLabel)}
            onDeleteRecentClaim={handleDeleteClaim}
          />
        ) : (
          <TeacherDashboard
            claims={claims}
            prizeStats={prizeStats}
            onDeleteClaim={handleDeleteClaim}
            onClearAllClaims={handleClearAllClaims}
            onGenerateSampleData={handleGenerateSampleData}
            gasConfig={gasConfig}
            onOpenGasSettings={() => setIsGasModalOpen(true)}
            isSyncing={isSyncing}
            onManualSync={() => syncWithGas()}
            onLockTeacherMode={handleLockTeacherMode}
            onTriggerCelebrationTest={handleTriggerCelebrationTest}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/60 py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            추억의 뽑기 수령 관리 시스템 · 학교 축제 및 학급 행사 지원
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsGasModalOpen(true)}
              className="hover:text-slate-600 transition-colors"
            >
              구글 시트 연동 설정
            </button>
            <span>·</span>
            {!isTeacherAuthenticated ? (
              <button
                type="button"
                onClick={() => setIsTeacherAuthModalOpen(true)}
                className="hover:text-slate-600 transition-colors"
              >
                교사용 로그인
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLockTeacherMode}
                className="hover:text-slate-600 transition-colors"
              >
                교사 인증 해제
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GasSettingsModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        config={gasConfig}
        onSaveConfig={handleSaveGasConfig}
        onResetToLocalOnly={handleResetToLocalOnly}
      />

      <TeacherPasswordModal
        isOpen={isTeacherAuthModalOpen}
        onClose={() => setIsTeacherAuthModalOpen(false)}
        onSuccess={handleTeacherAuthSuccess}
      />

      {/* Smartboard Real-time Winner Celebration Popup with Confetti */}
      <SmartboardCelebrationOverlay
        claim={celebrationClaim}
        onClose={() => setCelebrationClaim(null)}
        autoCloseSeconds={5}
      />

    </div>
  );
}
