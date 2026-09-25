import React, { useState } from 'react';
import { Match, PublicTournamentState, Team, User } from '../types.ts';
import { MatchCard } from './MatchCard.tsx';
import { TournamentBracketView } from './TournamentBracketView.tsx';
import {
  Trophy,
  Medal,
  CheckCircle2,
  XCircle,
  Flame,
  LayoutGrid,
  GitBranch,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

interface TournamentLiveViewProps {
  state: PublicTournamentState;
  user: User | null;
  onSelectResult: (match: Match) => void;
  onOpenMysteryTab: () => void;
  onOpenCelebration: () => void;
}

export const TournamentLiveView: React.FC<TournamentLiveViewProps> = ({
  state,
  user,
  onSelectResult,
  onOpenMysteryTab,
  onOpenCelebration,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'bracket'>('bracket');

  const { metadata, matches, qualifiers, eliminated, podium } = state;
  const teamsMap = state.teams.reduce((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {} as Record<string, Team>);

  const round1 = matches.filter((m) => m.stage === 'ROUND_1');
  const round2 = matches.filter((m) => m.stage === 'ROUND_2');
  const round3 = matches.filter((m) => m.stage === 'ROUND_3');
  const semifinals = matches.filter((m) => m.stage === 'SEMIFINAL');
  const thirdPlace = matches.filter((m) => m.stage === 'THIRD_PLACE');
  const final = matches.filter((m) => m.stage === 'FINAL');

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-8">
      {/* Top Tournament Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-800/40 p-5 sm:p-7 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                OFFICIAL CARROM TOURNAMENT
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400 font-mono">8 TEAMS DOUBLE-CHANCE</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-zinc-100 uppercase tracking-widest mt-1 font-['Cinzel',serif]">
              CARROM TOURNAMENT
            </h2>

            <p className="text-xs sm:text-sm font-bold text-amber-500 tracking-wider uppercase mt-1">
              2 CONSECUTIVE WINS TO QUALIFY
            </p>
          </div>

          {/* View Mode Toggle + Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-zinc-900 border border-zinc-800 p-1">
              <button
                type="button"
                onClick={() => setViewMode('bracket')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'bracket'
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Visual Bracket</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Round Cards</span>
              </button>
            </div>

            {podium.champion && (
              <button
                type="button"
                onClick={onOpenCelebration}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-amber-500/25 transition-all cursor-pointer animate-pulse"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>View Celebration</span>
              </button>
            )}
          </div>
        </div>

        {/* Tournament Phase Banner Notice if Setup / Mystery */}
        {metadata.state === 'SETUP' || metadata.state === 'MYSTERY_DRAW_LOCKED' || metadata.state === 'MYSTERY_DRAW_OPEN' ? (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-950/40 border border-amber-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Tournament is currently in <strong>Mystery Draw phase</strong>. Teams must claim their secret mystery box before fixtures can begin.
              </span>
            </div>
            <button
              onClick={onOpenMysteryTab}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shrink-0 cursor-pointer shadow-sm transition-all"
            >
              <span>Go to Mystery Draw</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      {/* QUALIFIED & ELIMINATED HUD (Sections 30 & 31) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* QUALIFIED TEAMS */}
        <div className="rounded-2xl bg-zinc-950 border border-emerald-800/40 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-100 uppercase tracking-wider font-['Cinzel',serif]">
                QUALIFIED TEAMS (Q1 – Q4)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60 font-bold">
              2 CONSECUTIVE WINS
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((slotKey) => {
              const qTeam = qualifiers[slotKey];
              return (
                <div
                  key={slotKey}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    qTeam
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                      : 'bg-zinc-900/60 border-zinc-800/80 opacity-60'
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold text-emerald-400 mb-1">
                    🟢 {slotKey}
                  </div>
                  {qTeam ? (
                    <div>
                      <div className="font-extrabold text-sm text-zinc-100 truncate">
                        {qTeam.id} — {qTeam.name}
                      </div>
                      <div className="text-[10px] text-emerald-300 font-mono mt-0.5">
                        Qualified!
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic py-1">
                      Awaiting decider
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ELIMINATED TEAMS */}
        <div className="rounded-2xl bg-zinc-950 border border-rose-900/40 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-100 uppercase tracking-wider font-['Cinzel',serif]">
                ELIMINATED TEAMS (E1 – E4)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-900/60 font-bold">
              2 LOSSES
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(['E1', 'E2', 'E3', 'E4'] as const).map((slotKey) => {
              const eTeam = eliminated[slotKey];
              return (
                <div
                  key={slotKey}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    eTeam
                      ? 'bg-rose-950/40 border-rose-600/60 shadow-sm'
                      : 'bg-zinc-900/60 border-zinc-800/80 opacity-60'
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold text-rose-400 mb-1">
                    ❌ {slotKey}
                  </div>
                  {eTeam ? (
                    <div>
                      <div className="font-bold text-sm text-zinc-300 truncate line-through">
                        {eTeam.id} — {eTeam.name}
                      </div>
                      <div className="text-[10px] text-rose-400 font-mono mt-0.5">
                        Eliminated
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic py-1">
                      In Contention
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CHAMPIONSHIP PODIUM (If finished) */}
      {(podium.champion || podium.runnerUp || podium.thirdPlace) && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-950/50 via-zinc-900 to-amber-950/50 border-2 border-amber-500/70 p-5 shadow-2xl">
          <div className="text-center mb-4">
            <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest">
              OFFICIAL PODIUM STANDINGS
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-zinc-100 uppercase tracking-wider font-['Cinzel',serif]">
              TOURNAMENT RESULTS
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1st Place */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-amber-500/20 to-zinc-900 border border-amber-400 text-center shadow-lg order-1 sm:order-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-black text-xl shadow-md mb-2">
                🥇
              </div>
              <div className="text-xs font-black text-amber-400 uppercase font-mono">
                CHAMPION
              </div>
              <div className="text-lg font-black text-zinc-100 uppercase mt-0.5">
                {podium.champion ? `${podium.champion.id} — ${podium.champion.name}` : 'TBD'}
              </div>
            </div>

            {/* 2nd Place */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-zinc-700/20 to-zinc-900 border border-zinc-600 text-center shadow-md order-2 sm:order-1">
              <div className="w-10 h-10 mx-auto rounded-full bg-zinc-300 text-zinc-950 flex items-center justify-center font-black text-lg shadow-md mb-2">
                🥈
              </div>
              <div className="text-xs font-bold text-zinc-300 uppercase font-mono">
                RUNNER-UP
              </div>
              <div className="text-base font-bold text-zinc-200 uppercase mt-0.5">
                {podium.runnerUp ? `${podium.runnerUp.id} — ${podium.runnerUp.name}` : 'TBD'}
              </div>
            </div>

            {/* 3rd Place */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-amber-900/20 to-zinc-900 border border-amber-800 text-center shadow-md order-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-amber-700 text-zinc-100 flex items-center justify-center font-black text-lg shadow-md mb-2">
                🥉
              </div>
              <div className="text-xs font-bold text-amber-600 uppercase font-mono">
                THIRD PLACE
              </div>
              <div className="text-base font-bold text-zinc-200 uppercase mt-0.5">
                {podium.thirdPlace ? `${podium.thirdPlace.id} — ${podium.thirdPlace.name}` : 'TBD'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SWITCH: Visual Bracket vs Cards View */}
      {viewMode === 'bracket' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-zinc-100 uppercase tracking-wider font-['Cinzel',serif]">
              TOURNAMENT BRACKET & PROGRESSION
            </h3>
            <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
              Swipe horizontally to view all stages
            </span>
          </div>
          <TournamentBracketView
            matches={matches}
            teamsMap={teamsMap}
            user={user}
            onSelectResult={onSelectResult}
          />
        </div>
      ) : (
        /* ROUND-BY-ROUND CARDS VIEW (Section 27) */
        <div className="space-y-8">
          {/* SECTION 1: INITIAL MATCHES (M1 - M4) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs font-mono">
                R1
              </span>
              <h3 className="font-extrabold text-base text-zinc-100 uppercase tracking-wider font-['Cinzel',serif]">
                INITIAL MATCHES (ROUND 1)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {round1.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  teamsMap={teamsMap}
                  user={user}
                  onSelectResult={onSelectResult}
                />
              ))}
            </div>
          </section>

          {/* SECTION 2: ROUND 2 (M5 - M8) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs font-mono">
                R2
              </span>
              <h3 className="font-extrabold text-base text-zinc-100 uppercase tracking-wider font-['Cinzel',serif]">
                ROUND 2 (DECIDERS & ELIMINATIONS)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {round2.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  teamsMap={teamsMap}
                  user={user}
                  onSelectResult={onSelectResult}
                />
              ))}
            </div>
          </section>

          {/* SECTION 3: ROUND 3 (M9 - M10) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs font-mono">
                R3
              </span>
              <h3 className="font-extrabold text-base text-zinc-100 uppercase tracking-wider font-['Cinzel',serif]">
                ROUND 3 (QUALIFIER 3 & 4 DECIDERS / ELIMINATIONS)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {round3.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  teamsMap={teamsMap}
                  user={user}
                  onSelectResult={onSelectResult}
                />
              ))}
            </div>
          </section>

          {/* SECTION 4: SEMIFINALS (SF1 & SF2) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs font-mono">
                SF
              </span>
              <h3 className="font-extrabold text-base text-zinc-100 uppercase tracking-wider font-['Cinzel',serif]">
                SEMIFINALS (Q1 vs Q4 & Q2 vs Q3)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {semifinals.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  teamsMap={teamsMap}
                  user={user}
                  onSelectResult={onSelectResult}
                />
              ))}
            </div>
          </section>

          {/* SECTION 9 & 10: THIRD PLACE & CHAMPIONSHIP FINAL */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs font-mono">
                FIN
              </span>
              <h3 className="font-extrabold text-base text-zinc-100 uppercase tracking-wider font-['Cinzel',serif]">
                FINALS (THIRD PLACE & CHAMPIONSHIP)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {thirdPlace.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  teamsMap={teamsMap}
                  user={user}
                  onSelectResult={onSelectResult}
                />
              ))}
              {final.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  teamsMap={teamsMap}
                  user={user}
                  onSelectResult={onSelectResult}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
