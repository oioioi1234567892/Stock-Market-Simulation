import React, { useState } from 'react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup } from 'firebase/auth';
import { syncUserProfile } from '../services/api.ts';
import { Shield, X, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, googleAuthProvider);
      await syncUserProfile();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err.message || 'Google 登入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="text-blue-500" size={20} />
            <h3 className="font-bold text-slate-100 text-base">登入台股量化操盤室</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          透過 Google 帳號快速登入，享受 Cloud SQL PostgreSQL 雲端同步自選股投資組合與量化回測歷程記錄。
        </p>

        {error && (
          <div className="p-2.5 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-1.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loading ? '正在登入中...' : '使用 Google 帳號登入'}</span>
        </button>

        <span className="text-[10px] text-center text-slate-500">
          安全驗證 · 資料專屬於您的個人帳戶
        </span>
      </div>
    </div>
  );
};
