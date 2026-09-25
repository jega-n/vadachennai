import React, { useEffect } from 'react';
import { PublicTournamentState } from '../types.ts';
import { Trophy, Medal, Sparkles, X, Share2, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CelebrationModalProps {
  isOpen: boolean;
  state: PublicTournamentState;
  onClose: () => void;
  onOpenImageGenerator: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  state,
  onClose,
  onOpenImageGenerator,
}) => {
  const { podium } = state;
  const champ = podium.champion;
  const runner = podium.runnerUp;
  const third = podium.thirdPlace;

  useEffect(() => {
    if (isOpen) {
      // Big celebratory confetti burst
      const end = Date.now() + 3 * 1000;
      const colors = ['#f59e0b', '#fbbf24', '#ef4444', '#10b981', '#ffffff'];

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-zinc-950 border-2 border-amber-500/80 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.3)] p-6 sm:p-10 text-center overflow-hidden">
        {/* Animated Background Highlights */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy Animation */}
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-900 border-2 border-amber-300 shadow-2xl flex items-center justify-center text-zinc-950 transform hover:scale-105 transition-transform animate-bounce">
            <Trophy className="w-14 h-14 sm:w-16 sm:h-16 text-zinc-950 stroke-[2.2]" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-red-600 border-2 border-zinc-950 flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-200" />
          </div>
        </div>

        {/* Titles */}
        <span className="text-xs font-mono font-black text-amber-400 uppercase tracking-widest bg-amber-950/80 px-3.5 py-1 rounded-full border border-amber-600/50">
          OFFICIAL TOURNAMENT CONCLUSION
        </span>

        <h2 className="text-2xl sm:text-4xl font-black text-zinc-100 uppercase tracking-widest mt-2 font-['Cinzel',serif]">
          🏆 CARROM TOURNAMENT COMPLETE
        </h2>

        <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto mt-1 font-medium">
          Congratulations to all 8 teams for an exceptional street carrom showcase!
        </p>

        {/* Podium Standings */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1st Place - Champion */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-500/25 via-zinc-900 to-amber-950/40 border-2 border-amber-400 text-center shadow-xl order-1 sm:order-2 transform sm:-translate-y-2">
            <div className="text-2xl mb-1">🥇</div>
            <div className="text-xs font-black text-amber-400 uppercase font-mono tracking-wider">
              🏆 CHAMPION
            </div>
            <div className="text-xl sm:text-2xl font-black text-zinc-100 uppercase mt-1 font-['Cinzel',serif]">
              {champ ? `${champ.id} — ${champ.name}` : 'TBD'}
            </div>
            <div className="text-xs text-amber-200 font-mono mt-1 font-semibold">
              {champ ? `${champ.wins} Wins • Undefeated Finals` : ''}
            </div>
          </div>

          {/* 2nd Place - Runner-Up */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700 text-center shadow-md order-2 sm:order-1">
            <div className="text-xl mb-1">🥈</div>
            <div className="text-[11px] font-bold text-zinc-300 uppercase font-mono tracking-wider">
              RUNNER-UP
            </div>
            <div className="text-base sm:text-lg font-bold text-zinc-200 uppercase mt-1 font-['Cinzel',serif]">
              {runner ? `${runner.id} — ${runner.name}` : 'TBD'}
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-1">
              Finalist
            </div>
          </div>

          {/* 3rd Place - Bronze */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-amber-800 text-center shadow-md order-3">
            <div className="text-xl mb-1">🥉</div>
            <div className="text-[11px] font-bold text-amber-600 uppercase font-mono tracking-wider">
              THIRD PLACE
            </div>
            <div className="text-base sm:text-lg font-bold text-zinc-200 uppercase mt-1 font-['Cinzel',serif]">
              {third ? `${third.id} — ${third.name}` : 'TBD'}
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-1">
              Bronze Winner
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenImageGenerator();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Generate WhatsApp 16:9 Image</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider border border-zinc-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
