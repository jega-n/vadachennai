import React, { useState } from 'react';
import { Match, Team } from '../types.ts';
import { X, Trophy, AlertTriangle, Swords } from 'lucide-react';
import { api } from '../api.ts';

interface ResultModalProps {
  match: Match | null;
  teamsMap: Record<string, Team>;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  match,
  teamsMap,
  onClose,
  onSuccess,
}) => {
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [isConfirmStep, setIsConfirmStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!match) return null;

  const team1 = match.team1Id ? teamsMap[match.team1Id] : null;
  const team2 = match.team2Id ? teamsMap[match.team2Id] : null;

  const handleSelectTeam = (teamId: string) => {
    setSelectedWinnerId(teamId);
    setIsConfirmStep(true);
    setError(null);
  };

  const handleConfirmResult = async () => {
    if (!match || !selectedWinnerId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.recordMatchResult(match.id, selectedWinnerId);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit match result.');
      setIsConfirmStep(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const winningTeam = selectedWinnerId ? teamsMap[selectedWinnerId] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border border-amber-800/50 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isConfirmStep ? (
          /* Step 1: Select Winner */
          <div>
            <div className="text-center mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/80 border border-amber-700/60 text-amber-400 mb-2">
                <Swords className="w-3.5 h-3.5" />
                {match.code} — {match.name}
              </span>
              <h3 className="text-xl font-black text-zinc-100 uppercase tracking-wide font-['Cinzel',serif]">
                SELECT MATCH WINNER
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Choose the team that won this carrom match
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {team1 && (
                <button
                  type="button"
                  onClick={() => handleSelectTeam(team1.id)}
                  className="w-full p-4 rounded-xl bg-zinc-900 hover:bg-emerald-950/40 border border-zinc-800 hover:border-emerald-500/80 flex items-center justify-between transition-all group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 group-hover:bg-emerald-500 group-hover:text-zinc-950 font-black text-sm flex items-center justify-center font-mono transition-colors">
                      {team1.id}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-zinc-100 group-hover:text-emerald-300">
                        {team1.name}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {team1.wins}W - {team1.losses}L • {team1.consecutiveWins} consec.
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 group-hover:bg-emerald-600 group-hover:text-zinc-950 text-xs font-bold transition-colors">
                    {team1.id} WON
                  </div>
                </button>
              )}

              <div className="text-center font-mono text-xs font-bold text-zinc-600">VS</div>

              {team2 && (
                <button
                  type="button"
                  onClick={() => handleSelectTeam(team2.id)}
                  className="w-full p-4 rounded-xl bg-zinc-900 hover:bg-emerald-950/40 border border-zinc-800 hover:border-emerald-500/80 flex items-center justify-between transition-all group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 group-hover:bg-emerald-500 group-hover:text-zinc-950 font-black text-sm flex items-center justify-center font-mono transition-colors">
                      {team2.id}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-zinc-100 group-hover:text-emerald-300">
                        {team2.name}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {team2.wins}W - {team2.losses}L • {team2.consecutiveWins} consec.
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 group-hover:bg-emerald-600 group-hover:text-zinc-950 text-xs font-bold transition-colors">
                    {team2.id} WON
                  </div>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Step 2: Confirmation Dialog (Section 24 Requirement) */
          <div className="text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Trophy className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                CONFIRM RESULT
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-zinc-100 uppercase tracking-wide mt-1 font-['Cinzel',serif]">
                {match.code}
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/90 border border-amber-600/40 text-center">
              <div className="text-lg font-black text-emerald-400">
                {winningTeam?.id} — {winningTeam?.name}
              </div>
              <div className="text-sm font-bold text-zinc-300 mt-1 uppercase tracking-wider font-mono">
                WINNER?
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Submitting will update consecutive win standings and resolve next fixtures.</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmStep(false)}
                disabled={isSubmitting}
                className="py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider border border-zinc-800 transition-colors cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleConfirmResult}
                disabled={isSubmitting}
                className="py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'CONFIRMING...' : 'CONFIRM WINNER'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
