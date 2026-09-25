import React from 'react';
import { Match, Team, User } from '../types.ts';
import { MatchCard } from './MatchCard.tsx';
import { GitBranch, Trophy, ArrowRight, ShieldCheck, Flame } from 'lucide-react';

interface TournamentBracketViewProps {
  matches: Match[];
  teamsMap: Record<string, Team>;
  user: User | null;
  onSelectResult: (match: Match) => void;
}

export const TournamentBracketView: React.FC<TournamentBracketViewProps> = ({
  matches,
  teamsMap,
  user,
  onSelectResult,
}) => {
  const getMatch = (id: string) => matches.find((m) => m.id === id);

  const m1 = getMatch('M1');
  const m2 = getMatch('M2');
  const m3 = getMatch('M3');
  const m4 = getMatch('M4');

  const m5 = getMatch('M5');
  const m6 = getMatch('M6');
  const m7 = getMatch('M7');
  const m8 = getMatch('M8');

  const m9 = getMatch('M9');
  const m10 = getMatch('M10');

  const sf1 = getMatch('SF1');
  const sf2 = getMatch('SF2');
  const tp = getMatch('TP');
  const final = getMatch('FINAL');

  return (
    <div className="w-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-amber-750 scrollbar-track-zinc-900">
      <div className="min-w-[1080px] p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 shadow-2xl space-y-10">
        
        {/* ============================================================== */}
        {/* PART 1: 2-CONSECUTIVE WINS QUALIFICATION BRACKET (M1 - M10)   */}
        {/* ============================================================== */}
        <div>
          <div className="flex items-center gap-2 pb-3 mb-6 border-b border-amber-900/40">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest font-mono">
              STAGE 1: 2-CONSECUTIVE-WINS QUALIFICATION BRACKET (M1 – M10)
            </h4>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* COLUMN 1: ROUND 1 */}
            <div className="space-y-4">
              <div className="text-center pb-2 border-b border-zinc-800">
                <div className="font-extrabold text-xs text-zinc-300 uppercase tracking-wider font-mono">
                  ROUND 1
                </div>
                <div className="text-[10px] text-zinc-500">Opening Matches</div>
              </div>

              <div className="space-y-4">
                {m1 && <MatchCard match={m1} teamsMap={teamsMap} user={user} onSelectResult={onSelectResult} />}
                {m2 && <MatchCard match={m2} teamsMap={teamsMap} user={user} onSelectResult={onSelectResult} />}
                {m3 && <MatchCard match={m3} teamsMap={teamsMap} user={user} onSelectResult={onSelectResult} />}
                {m4 && <MatchCard match={m4} teamsMap={teamsMap} user={user} onSelectResult={onSelectResult} />}
              </div>
            </div>

            {/* COLUMN 2: ROUND 2 */}
            <div className="space-y-4">
              <div className="text-center pb-2 border-b border-zinc-800">
                <div className="font-extrabold text-xs text-zinc-300 uppercase tracking-wider font-mono">
                  ROUND 2
                </div>
                <div className="text-[10px] text-amber-500/80 font-mono">Q1, Q2 & Survivor</div>
              </div>

              <div className="space-y-4">
                {/* M5 Decides Q1 */}
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 font-mono mb-1 flex items-center gap-1">
                    <span>👑 DECIDES Q1</span>
                    <span className="text-zinc-500">• W(M1) vs W(M2)</span>
                  </div>
                  {m5 && <MatchCard match={m5} teamsMap={teamsMap} user={user} onSelectResult={onSelectResult} />}
                </div>

                {/* M6 Decides Q2 */}
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 font-mono mb-1 flex items-center gap-1">
                    <span>👑 DECIDES Q2</span>
                    <span className="text-zinc-500">• W(M3) vs W(M4)</span>
                  </div>
                  {m6 && <MatchCard match={m6} teamsMap={teamsMap} user={user} onSelectResult={onSelectResult} />}
                </div>

                {/* M7 Loser Eliminated (E1) */}
                <div>
                  <div className="text-[10px] font-bold text-rose-400 font-mono mb-1 flex items-center gap-1">
                    <span>💀 LOSER IS E1</span>
                    <span className="text-zinc-500">• L(M1) vs L(M2)</span>
                  </div>
                  {m7 && <MatchCard match={m7} teamsMap={teamsMap} user={user} onSelectResult={onSelectResult} />}
                </div>

                {/* M8 Loser Eliminated (E2) */}
                <div>
                  <div className="text-[10px] font-bold text-rose-400 font-mono mb-1 flex items-center gap-1">
                    <span>💀 LOSER IS E2</span>
                    <span className="text-zinc-500">• L(M3) vs L(M4)</span>
                  </div>
                  {m8 && <MatchCard match={m8} teamsMap={teamsMap} user={user} onSelectResult={onSelectResult} />}
                </div>
              </div>
            </div>

            {/* COLUMN 3: ROUND 3 */}
            <div className="space-y-4">
              <div className="text-center pb-2 border-b border-zinc-800">
                <div className="font-extrabold text-xs text-zinc-300 uppercase tracking-wider font-mono">
                  ROUND 3
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">Q3 & Q4 Deciders</div>
              </div>

              <div className="space-y-6 pt-4">
                {/* M9 Decides Q3 & E3 */}
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 font-mono mb-1 flex items-center gap-1">
                    <span>👑 DECIDES Q3 & 💀 E3</span>
                    <span className="text-zinc-500">• L(M5) vs W(M8)</span>
                  </div>
                  {m9 && <MatchCard match={m9} teamsMap={teamsMap} user={user} onSelectResult={onSelectResult} />}
                </div>

                {/* M10 Decides Q4 & E4 */}
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 font-mono mb-1 flex items-center gap-1">
                    <span>👑 DECIDES Q4 & 💀 E4</span>
                    <span className="text-zinc-500">• L(M6) vs W(M7)</span>
                  </div>
                  {m10 && <MatchCard match={m10} teamsMap={teamsMap} user={user} onSelectResult={onSelectResult} />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PART 2: CHAMPIONSHIP FINALS (SEMIFINALS, THIRD PLACE & FINAL)  */}
        {/* ============================================================== */}
        <div className="pt-6 border-t border-amber-900/40">
          <div className="flex items-center gap-2 pb-3 mb-6 border-b border-amber-900/40">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest font-mono">
              STAGE 2: SEMIFINALS, BRONZE MATCH & CHAMPIONSHIP FINAL
            </h4>
          </div>

          <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* SEMIFINALS */}
            <div className="space-y-4">
              <div className="text-center pb-2 border-b border-zinc-800">
                <div className="font-extrabold text-xs text-zinc-200 uppercase tracking-wider font-mono">
                  SEMIFINALS
                </div>
                <div className="text-[10px] text-zinc-500">Q1 vs Q4 & Q2 vs Q3</div>
              </div>

              <div className="space-y-4">
                {sf1 && <MatchCard match={sf1} teamsMap={teamsMap} user={user} onSelectResult={onSelectResult} />}
                {sf2 && <MatchCard match={sf2} teamsMap={teamsMap} user={user} onSelectResult={onSelectResult} />}
              </div>
            </div>

            {/* THIRD PLACE (BRONZE) */}
            <div className="space-y-4">
              <div className="text-center pb-2 border-b border-zinc-800">
                <div className="font-extrabold text-xs text-amber-600 uppercase tracking-wider font-mono">
                  THIRD PLACE MATCH
                </div>
                <div className="text-[10px] text-zinc-500">Loser SF1 vs Loser SF2</div>
              </div>

              <div className="pt-10">
                {tp && <MatchCard match={tp} teamsMap={teamsMap} user={user} onSelectResult={onSelectResult} />}
              </div>
            </div>

            {/* GRAND FINAL */}
            <div className="space-y-4">
              <div className="text-center pb-2 border-b border-amber-500/40">
                <div className="font-extrabold text-xs text-amber-400 uppercase tracking-wider font-mono">
                  🏆 CHAMPIONSHIP FINAL
                </div>
                <div className="text-[10px] text-amber-400/80">Winner SF1 vs Winner SF2</div>
              </div>

              <div className="pt-10">
                {final && <MatchCard match={final} teamsMap={teamsMap} user={user} onSelectResult={onSelectResult} />}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
