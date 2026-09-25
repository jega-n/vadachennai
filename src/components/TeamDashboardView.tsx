import React, { useEffect, useState } from 'react';
import { api } from '../api.ts';
import { Match, Team, User } from '../types.ts';
import {
  Shield,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Swords,
  Gift,
  Flame,
  AlertCircle,
} from 'lucide-react';

interface TeamDashboardViewProps {
  user: User;
  onOpenMysteryTab: () => void;
}

export const TeamDashboardView: React.FC<TeamDashboardViewProps> = ({
  user,
  onOpenMysteryTab,
}) => {
  const [data, setData] = useState<{ user: User; team: Team; matches: Match[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.getTeamDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load team dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center text-rose-300">
        <AlertCircle className="w-8 h-8 mx-auto text-rose-400 mb-2" />
        <p>{error || 'Unable to load your team details.'}</p>
      </div>
    );
  }

  const { team, matches } = data;

  const getStatusBadge = () => {
    if (team.finalPosition === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-zinc-950 font-black text-xs shadow-md">
          🏆 TOURNAMENT CHAMPION
        </span>
      );
    }
    if (team.finalPosition === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-300 text-zinc-950 font-black text-xs shadow-md">
          🥈 RUNNER-UP
        </span>
      );
    }
    if (team.finalPosition === 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700 text-zinc-100 font-black text-xs shadow-md">
          🥉 THIRD PLACE
        </span>
      );
    }
    if (team.status === 'QUALIFIED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black text-xs">
          🟢 QUALIFIED {team.qualifiedSlot}
        </span>
      );
    }
    if (team.status === 'ELIMINATED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-black text-xs">
          🔴 ELIMINATED ({team.eliminatedSlot || '2 Losses'})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-black text-xs">
        🔵 ACTIVE IN TOURNAMENT
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Team Profile Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-800/40 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-zinc-950 border border-amber-500/60 flex items-center justify-center font-black text-2xl font-mono text-zinc-100 shadow-xl shrink-0">
              {team.id}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                  TEAM ROSTER
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs text-zinc-400 font-mono">User: @{user.username}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 uppercase tracking-wide font-['Cinzel',serif]">
                {team.id} — {team.name}
              </h2>

              <div className="mt-2 flex items-center gap-2">
                {getStatusBadge()}
                {team.assignedBox ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
                    <Gift className="w-3 h-3 text-amber-400" />
                    <span>Box #{team.assignedBox}</span>
                  </span>
                ) : (
                  <button
                    onClick={onOpenMysteryTab}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-bold text-xs"
                  >
                    <Gift className="w-3 h-3" />
                    <span>Draw Mystery Box</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Consecutive Wins Spotlight */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/60 to-zinc-900 border border-amber-500/40 text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-end gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Consecutive Streak</span>
            </div>
            <div className="text-3xl font-black text-zinc-100 font-mono mt-0.5">
              {team.consecutiveWins} <span className="text-xs font-normal text-zinc-400">/ 2 to qualify</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${Math.min((team.consecutiveWins / 2) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-center">
          <div className="text-xs text-zinc-400 font-mono uppercase">Matches Played</div>
          <div className="text-2xl font-black text-zinc-100 font-mono mt-1">
            {team.totalMatches}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/90 border border-emerald-900/40 text-center">
          <div className="text-xs text-emerald-400 font-mono uppercase">Total Wins</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {team.wins}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/90 border border-rose-900/40 text-center">
          <div className="text-xs text-rose-400 font-mono uppercase">Total Losses</div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">
            {team.losses}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/90 border border-amber-900/40 text-center">
          <div className="text-xs text-amber-400 font-mono uppercase">Consecutive Wins</div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {team.consecutiveWins}
          </div>
        </div>
      </div>

      {/* MATCH HISTORY */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base text-zinc-100 uppercase tracking-wider font-['Cinzel',serif]">
              MATCH HISTORY & FIXTURES
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {matches.length} Scheduled / Completed
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs italic">
            No matches scheduled yet. Fixtures will be generated when the tournament begins.
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => {
              const isWinner = m.status === 'COMPLETED' && m.winnerId === team.id;
              const isLoser = m.status === 'COMPLETED' && m.loserId === team.id;
              const opponentId = m.team1Id === team.id ? m.team2Id : m.team1Id;

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isWinner
                      ? 'bg-emerald-950/30 border-emerald-700/50'
                      : isLoser
                      ? 'bg-rose-950/20 border-rose-900/40'
                      : m.status === 'READY'
                      ? 'bg-amber-950/30 border-amber-600/60'
                      : 'bg-zinc-900/60 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded bg-zinc-800 font-mono font-black text-xs text-amber-400">
                      {m.code}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-zinc-100">
                        {m.name}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono">
                        Stage: {m.stageLabel} • Opponent: {opponentId ? `Team ${opponentId}` : 'TBD'}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isWinner && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-900/60 text-emerald-300 font-bold text-xs border border-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        WON
                      </span>
                    )}
                    {isLoser && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-900/50 text-rose-300 font-bold text-xs border border-rose-800">
                        <XCircle className="w-3.5 h-3.5" />
                        LOST
                      </span>
                    )}
                    {m.status === 'READY' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-950 text-amber-300 font-bold text-xs border border-amber-700 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        UPCOMING / READY
                      </span>
                    )}
                    {m.status === 'LOCKED' && (
                      <span className="text-xs text-zinc-500 font-mono">
                        Locked / Pending dependencies
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
