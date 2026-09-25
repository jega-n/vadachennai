import React, { useState, useEffect } from 'react';
import { Gift, Lock, CheckCircle2, Sparkles, AlertCircle, Shield } from 'lucide-react';
import { api } from '../api.ts';
import { User, Team, TournamentMetadata } from '../types.ts';
import confetti from 'canvas-confetti';

interface MysteryBoxViewProps {
  user: User | null;
  currentTeam: Team | null;
  metadata: TournamentMetadata | null;
  boxes: Array<{
    boxNumber: number;
    isLocked: boolean;
    claimed: boolean;
  }>;
  onOpenLogin: () => void;
  onBoxClaimedSuccess?: (teamId: string, teamName: string) => void;
}

export const MysteryBoxView: React.FC<MysteryBoxViewProps> = ({
  user,
  currentTeam,
  metadata,
  boxes,
  onOpenLogin,
  onBoxClaimedSuccess,
}) => {
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 3-2-1 Reveal Animation State
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealCountdown, setRevealCountdown] = useState<number>(3);
  const [revealedTeam, setRevealedTeam] = useState<{ id: string; name: string; box: number } | null>(null);

  const isMysteryOpen = metadata?.state === 'MYSTERY_DRAW_OPEN';
  const hasAlreadyClaimed = currentTeam && currentTeam.assignedBox !== null;

  // Check if current team already has an assigned box from server
  useEffect(() => {
    if (currentTeam && currentTeam.assignedBox !== null && !revealedTeam) {
      setRevealedTeam({
        id: currentTeam.id,
        name: currentTeam.name,
        box: currentTeam.assignedBox,
      });
    }
  }, [currentTeam]);

  const handleSelectBox = async (boxNumber: number) => {
    if (!user) {
      onOpenLogin();
      return;
    }

    if (user.role !== 'team') {
      setErrorMessage('Only authenticated team accounts can draw a mystery box.');
      return;
    }

    if (!isMysteryOpen) {
      setErrorMessage('Mystery team selection is currently closed by the tournament administrator.');
      return;
    }

    if (hasAlreadyClaimed) {
      setErrorMessage('Your team has already selected a mystery box.');
      return;
    }

    const targetBox = boxes.find((b) => b.boxNumber === boxNumber);
    if (!targetBox || targetBox.isLocked || targetBox.claimed) {
      setErrorMessage('This mystery box has already been claimed by another team.');
      return;
    }

    setSelectedBox(boxNumber);
    setIsClaiming(true);
    setErrorMessage(null);

    try {
      const res = await api.claimMysteryBox(boxNumber);

      // Trigger 3-2-1 countdown reveal!
      setIsRevealing(true);
      setRevealCountdown(3);

      const interval = setInterval(() => {
        setRevealCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsRevealing(false);
            setRevealedTeam({
              id: res.assignedTeamId,
              name: res.assignedTeamName,
              box: boxNumber,
            });

            // Trigger celebration confetti
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#f59e0b', '#fbbf24', '#ef4444', '#ffffff'],
            });

            onBoxClaimedSuccess?.(res.assignedTeamId, res.assignedTeamName);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to claim mystery box. Please try another box.');
    } finally {
      setIsClaiming(false);
    }
  };

  const totalClaimed = boxes.filter((b) => b.claimed || b.isLocked).length;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Title & Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-amber-800/40 p-6 sm:p-8 text-center shadow-2xl overflow-hidden">
        {/* Background Carrom Pattern */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full border border-amber-600/10 pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full border border-amber-600/10 pointer-events-none"></div>

        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-800 to-zinc-950 border border-amber-500/50 shadow-lg mb-3">
          <Gift className="w-8 h-8 text-amber-300" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 uppercase tracking-widest font-['Cinzel',serif]">
          🎁 MYSTERY TEAM DRAW
        </h2>
        <p className="text-sm font-semibold text-amber-400 uppercase tracking-wide mt-1">
          CHOOSE ONE MYSTERY BOX
        </p>
        <p className="text-xs text-zinc-400 max-w-lg mx-auto mt-2 leading-relaxed">
          Every mystery box contains a secret team identity for this tournament. Boxes lock in real-time
          across all 8 devices simultaneously upon selection.
        </p>

        {/* Status Pill */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
              isMysteryOpen
                ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isMysteryOpen ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
              }`}
            ></span>
            <span>{isMysteryOpen ? 'MYSTERY DRAW IS OPEN' : 'MYSTERY DRAW LOCKED'}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
            <span>CLAIMED:</span>
            <span className="font-bold text-amber-400">{totalClaimed} / 8</span>
          </div>
        </div>

        {/* Warning / Notification message if not logged in */}
        {!user && (
          <div className="mt-4 inline-block">
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Sign in with your Team Credentials to Select a Box
            </button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 flex items-start gap-3 text-rose-200 text-xs shadow-lg animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-rose-300">Selection Notification</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* REVEAL ANIMATION MODAL */}
      {isRevealing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="text-center space-y-6 max-w-sm w-full p-8 rounded-3xl bg-zinc-950 border-2 border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-in zoom-in-95">
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl font-black text-amber-400 animate-pulse font-mono">
              {revealCountdown}
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-100 uppercase tracking-wider font-['Cinzel',serif]">
                🎁 OPENING MYSTERY BOX {selectedBox}...
              </h3>
              <p className="text-xs text-amber-400/90 font-medium mt-1">
                Decrypting your tournament team assignment...
              </p>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-1000"
                style={{ width: `${((4 - revealCountdown) / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* ALREADY REVEALED IDENTITY CARD */}
      {revealedTeam && !isRevealing && (
        <div className="relative rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/40 border-2 border-amber-500/60 p-6 text-center shadow-xl overflow-hidden">
          <div className="absolute top-2 right-3 flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>CONFIRMED ASSIGNMENT</span>
          </div>

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500 text-zinc-950 shadow-md mb-2">
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="text-xs uppercase font-semibold text-amber-400 tracking-widest font-mono">
            ✨ YOUR TOURNAMENT IDENTITY ✨
          </div>

          <div className="text-2xl sm:text-3xl font-black text-zinc-100 uppercase mt-1 tracking-wide font-['Cinzel',serif]">
            {revealedTeam.id} — {revealedTeam.name}
          </div>

          <div className="text-xs text-zinc-400 mt-2">
            Selected from <span className="font-bold text-amber-300">Mystery Box #{revealedTeam.box}</span>.
            Your fixtures are ready in the tournament bracket!
          </div>
        </div>
      )}

      {/* 8 MYSTERY BOXES GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {boxes.map((box) => {
          const isClaimedOrLocked = box.claimed || box.isLocked;
          const isMyBox = revealedTeam && revealedTeam.box === box.boxNumber;

          return (
            <div
              key={box.boxNumber}
              className={`relative rounded-2xl p-5 border text-center transition-all duration-300 flex flex-col items-center justify-between min-h-[170px] ${
                isMyBox
                  ? 'bg-gradient-to-b from-amber-950/50 to-zinc-900 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : isClaimedOrLocked
                  ? 'bg-zinc-950/80 border-zinc-800/80 opacity-60 cursor-not-allowed'
                  : isMysteryOpen && user?.role === 'team' && !hasAlreadyClaimed
                  ? 'bg-zinc-900 hover:bg-zinc-850 border-amber-600/40 hover:border-amber-500 hover:shadow-xl hover:scale-[1.02] cursor-pointer group'
                  : 'bg-zinc-900/90 border-zinc-800'
              }`}
              onClick={() => {
                if (!isClaimedOrLocked && isMysteryOpen && user?.role === 'team' && !hasAlreadyClaimed) {
                  handleSelectBox(box.boxNumber);
                }
              }}
            >
              {/* Header Badge */}
              <div className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>#0{box.boxNumber}</span>
                {isClaimedOrLocked ? (
                  <span className="flex items-center gap-1 text-rose-400 font-bold bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-900/60">
                    <Lock className="w-3 h-3" />
                    LOCKED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/40">
                    AVAILABLE
                  </span>
                )}
              </div>

              {/* Icon / Emblem */}
              <div className="my-3">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform ${
                    isMyBox
                      ? 'bg-amber-500 text-zinc-950'
                      : isClaimedOrLocked
                      ? 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                      : 'bg-gradient-to-br from-amber-900/40 via-zinc-900 to-zinc-950 border border-amber-600/40 text-amber-400 group-hover:scale-110 shadow-inner'
                  }`}
                >
                  {isMyBox ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : isClaimedOrLocked ? (
                    <Lock className="w-6 h-6" />
                  ) : (
                    <Gift className="w-7 h-7" />
                  )}
                </div>
              </div>

              {/* Box Title */}
              <div>
                <div className="font-extrabold text-sm sm:text-base text-zinc-100 tracking-wider uppercase font-['Cinzel',serif]">
                  🎁 BOX {box.boxNumber}
                </div>
                {isMyBox ? (
                  <div className="text-[11px] font-bold text-amber-400 mt-1">
                    Your Assigned Box
                  </div>
                ) : isClaimedOrLocked ? (
                  <div className="text-[11px] text-zinc-500 font-mono mt-1">
                    Claimed by Team
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-500/80 font-semibold mt-1">
                    Tap to Choose
                  </div>
                )}
              </div>

              {/* Action Button for Mobile */}
              {!isClaimedOrLocked && isMysteryOpen && user?.role === 'team' && !hasAlreadyClaimed && (
                <button
                  type="button"
                  disabled={isClaiming}
                  className="mt-3 w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-zinc-950 font-bold text-xs border border-amber-500/40 transition-all cursor-pointer"
                >
                  {isClaiming && selectedBox === box.boxNumber ? 'Claiming...' : 'Select Box'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
