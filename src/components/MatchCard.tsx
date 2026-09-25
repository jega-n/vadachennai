import React from 'react';
import { Match, Team, User } from '../types.ts';
import { CheckCircle2, Trophy, Clock, Lock, Swords, CircleDot } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  teamsMap: Record<string, Team>;
  user: User | null;
  onSelectResult?: (match: Match) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  teamsMap,
  user,
  onSelectResult,
}) => {
  const team1 = match.team1Id ? teamsMap[match.team1Id] : null;
  const team2 = match.team2Id ? teamsMap[match.team2Id] : null;

  const isCompleted = match.status === 'COMPLETED';
  const isReady = match.status === 'READY';
  const isLive = match.status === 'LIVE';
  const isLocked = match.status === 'LOCKED';

  const isT1Winner = isCompleted && match.winnerId === match.team1Id;
  const isT2Winner = isCompleted && match.winnerId === match.team2Id;

  return (
    <div
      className={`relative rounded-xl border p-3.5 transition-all duration-200 flex flex-col justify-between ${
        isCompleted
          ? 'bg-zinc-900/90 border-emerald-900/50 shadow-sm'
          : isReady
          ? 'bg-gradient-to-b from-amber-950/40 to-zinc-900 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
          : isLive
          ? 'bg-gradient-to-b from-cyan-950/40 to-zinc-900 border-cyan-500/80 ring-1 ring-cyan-500/40'
          : 'bg-zinc-950/70 border-zinc-800/80 opacity-75'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-amber-400 font-mono text-sm tracking-wide">
            {match.code}
          </span>
          <span className="text-[11px] text-zinc-400 font-medium truncate max-w-[130px]">
            {match.name}
          </span>
        </div>

        {/* Status Badge */}
        <div>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              <CheckCircle2 className="w-3 h-3" />
              COMPLETED
            </span>
          )}
          {isReady && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60 animate-pulse">
              <Swords className="w-3 h-3" />
              READY
            </span>
          )}
          {isLive && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700/60 animate-pulse">
              <CircleDot className="w-3 h-3" />
              LIVE
            </span>
          )}
          {isLocked && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              <Lock className="w-2.5 h-2.5" />
              LOCKED
            </span>
          )}
        </div>
      </div>

      {/* Teams Slots */}
      <div className="space-y-2 my-1">
        {/* Slot 1 */}
        <div
          className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
            isT1Winner
              ? 'bg-emerald-950/50 border-emerald-600/70 text-zinc-100 font-bold'
              : isCompleted && !isT1Winner
              ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-500 opacity-60'
              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {team1 ? (
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono shrink-0 shadow-sm ${
                  isT1Winner
                    ? 'bg-emerald-500 text-zinc-950 ring-2 ring-emerald-300'
                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                }`}
              >
                {team1.id}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center text-[10px] text-zinc-500 font-mono shrink-0">
                ?
              </div>
            )}

            <div className="truncate">
              {team1 ? (
                <div className="text-xs font-semibold truncate leading-tight">
                  {team1.name}
                </div>
              ) : (
                <div className="text-xs text-zinc-500 italic truncate font-mono">
                  {match.slot1.label}
                </div>
              )}
            </div>
          </div>

          {isT1Winner && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 font-mono bg-emerald-900/40 px-1.5 py-0.5 rounded shrink-0">
              <Trophy className="w-3 h-3" />
              <span>WON</span>
            </div>
          )}
        </div>

        {/* VS Divider */}
        <div className="relative flex items-center justify-center my-0.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800/60"></div>
          </div>
          <span className="relative px-2 bg-zinc-900/90 text-[10px] font-extrabold text-amber-500/80 font-mono uppercase tracking-wider">
            VS
          </span>
        </div>

        {/* Slot 2 */}
        <div
          className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
            isT2Winner
              ? 'bg-emerald-950/50 border-emerald-600/70 text-zinc-100 font-bold'
              : isCompleted && !isT2Winner
              ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-500 opacity-60'
              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {team2 ? (
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono shrink-0 shadow-sm ${
                  isT2Winner
                    ? 'bg-emerald-500 text-zinc-950 ring-2 ring-emerald-300'
                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                }`}
              >
                {team2.id}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center text-[10px] text-zinc-500 font-mono shrink-0">
                ?
              </div>
            )}

            <div className="truncate">
              {team2 ? (
                <div className="text-xs font-semibold truncate leading-tight">
                  {team2.name}
                </div>
              ) : (
                <div className="text-xs text-zinc-500 italic truncate font-mono">
                  {match.slot2.label}
                </div>
              )}
            </div>
          </div>

          {isT2Winner && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 font-mono bg-emerald-900/40 px-1.5 py-0.5 rounded shrink-0">
              <Trophy className="w-3 h-3" />
              <span>WON</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes / Pathway guidance */}
      {match.notes && (
        <div className="mt-2 text-[10px] text-zinc-400 bg-zinc-950/50 p-1.5 rounded border border-zinc-850 font-mono leading-tight">
          💡 {match.notes}
        </div>
      )}

      {/* Admin Action Button */}
      {user?.role === 'admin' && (isReady || isLive) && onSelectResult && (
        <button
          type="button"
          onClick={() => onSelectResult(match)}
          className="mt-2.5 w-full py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Swords className="w-3.5 h-3.5" />
          <span>ENTER RESULT</span>
        </button>
      )}
    </div>
  );
};
