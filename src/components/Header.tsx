import React from 'react';
import { User, TournamentMetadata } from '../types.ts';
import { Trophy, Gift, Shield, Settings, LogIn, LogOut, Radio, CircleDot } from 'lucide-react';

interface HeaderProps {
  currentTab: 'tournament' | 'mystery' | 'team' | 'admin';
  setCurrentTab: (tab: 'tournament' | 'mystery' | 'team' | 'admin') => void;
  user: User | null;
  metadata: TournamentMetadata | null;
  isConnected: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  user,
  metadata,
  isConnected,
  onOpenLogin,
  onLogout,
}) => {
  const getStageLabel = (state?: string) => {
    switch (state) {
      case 'SETUP':
        return 'Setup Phase';
      case 'MYSTERY_DRAW_LOCKED':
        return 'Mystery Draw Locked';
      case 'MYSTERY_DRAW_OPEN':
        return 'Mystery Selection Open';
      case 'MYSTERY_DRAW_COMPLETED':
        return 'All Teams Assigned';
      case 'QUALIFICATION_ACTIVE':
        return 'Qualification Stage Live';
      case 'QUALIFICATION_COMPLETED':
        return 'Qualification Finished';
      case 'SEMIFINALS':
        return 'Semifinals Live';
      case 'THIRD_PLACE':
        return 'Bronze Decider Live';
      case 'FINAL':
        return 'Championship Final Live';
      case 'COMPLETED':
        return 'Tournament Concluded';
      default:
        return 'Street Carrom 2026';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-amber-900/30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Brand & Stage */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-700 via-amber-900 to-zinc-950 border border-amber-600/40 shadow-inner group">
              {/* Carrom board coin representation */}
              <div className="w-5 h-5 rounded-full border-2 border-red-500 bg-red-600/80 flex items-center justify-center shadow-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-200"></div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                <CircleDot className="w-2.5 h-2.5 text-amber-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold tracking-wider text-base sm:text-lg text-zinc-100 uppercase font-['Cinzel',serif]">
                  Carrom Tournament
                </h1>
                {/* Realtime Live Pulse */}
                <div
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                    isConnected
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                  }`}
                  title={isConnected ? 'Realtime sync active' : 'Reconnecting to tournament stream...'}
                >
                  <Radio className={`w-2.5 h-2.5 ${isConnected ? 'animate-pulse' : ''}`} />
                  <span className="hidden sm:inline">{isConnected ? 'LIVE' : 'SYNCING'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-amber-500/90 font-medium tracking-wide text-[11px]">
                  2 CONSECUTIVE WINS TO QUALIFY
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 font-mono text-[11px] truncate max-w-[140px] sm:max-w-none">
                  {getStageLabel(metadata?.state)}
                </span>
              </div>
            </div>
          </div>

          {/* User Status / Login Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end text-xs">
                  <span className="font-semibold text-zinc-200">
                    {user.role === 'admin' ? '🛡️ Tournament Admin' : `🎯 Team ${user.teamId}`}
                  </span>
                  <span className="text-zinc-400 text-[10px] truncate max-w-[120px]">
                    {user.teamName || user.username}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-zinc-800 text-xs font-medium transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-bold text-xs tracking-wide shadow-md hover:shadow-amber-500/20 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-zinc-950" />
                <span>LOGIN</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCurrentTab('tournament')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              currentTab === 'tournament'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Tournament & Bracket</span>
          </button>

          <button
            onClick={() => setCurrentTab('mystery')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              currentTab === 'mystery'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Mystery Team Draw</span>
            {metadata?.state === 'MYSTERY_DRAW_OPEN' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </button>

          {user && user.role === 'team' && (
            <button
              onClick={() => setCurrentTab('team')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                currentTab === 'team'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>My Team Dashboard</span>
            </button>
          )}

          {user && user.role === 'admin' && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                currentTab === 'admin'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-800/40'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin Control Center</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
