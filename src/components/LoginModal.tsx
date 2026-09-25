import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User as UserIcon, X, AlertCircle } from 'lucide-react';
import { api } from '../api.ts';
import { User, Team } from '../types.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, team: Team | null) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.login(username, password);
      onLoginSuccess(res.user, res.team);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border border-amber-800/40 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Decorative Carrom Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-600/60 rounded-tl-xl pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-600/60 rounded-tr-xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-600/60 rounded-bl-xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-600/60 rounded-br-xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-zinc-950 border border-amber-500/50 shadow-inner mb-3">
            <Lock className="w-6 h-6 text-amber-300" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-100 uppercase tracking-wider font-['Cinzel',serif]">
            CARROM TOURNAMENT
          </h2>
          <p className="text-xs font-semibold text-amber-500/90 tracking-wide mt-1">
            2 CONSECUTIVE WINS TO QUALIFY
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Secure login for Tournament Admin and Registered Teams
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or team_a"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-11 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-zinc-950 font-black tracking-wider uppercase text-sm shadow-lg hover:shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'VERIFYING...' : 'LOGIN'}
          </button>
        </form>

        {/* Quick Testing helper */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-center mb-2.5">
            Quick Credentials (Default Demo Setup)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin@carrom2026')}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-amber-900/40 text-left transition-colors"
            >
              <div className="font-bold text-amber-400">🛡️ Admin Account</div>
              <div className="text-[10px] text-zinc-400 font-mono">admin / admin@carrom2026</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('team_a', 'carrom@a')}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-colors"
            >
              <div className="font-bold text-zinc-200">🎯 Team A (Duo Devils)</div>
              <div className="text-[10px] text-zinc-400 font-mono">team_a / carrom@a</div>
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 text-center mt-2">
            Teams B through H use <code className="text-amber-400/90 font-mono">team_b</code> to <code className="text-amber-400/90 font-mono">team_h</code> with <code className="text-amber-400/90 font-mono">carrom@b..h</code>
          </p>
        </div>
      </div>
    </div>
  );
};
