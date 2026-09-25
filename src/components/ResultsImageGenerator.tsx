import React, { useRef, useEffect, useState } from 'react';
import { PublicTournamentState } from '../types.ts';
import { Download, X, Sparkles, Share2 } from 'lucide-react';

interface ResultsImageGeneratorProps {
  state: PublicTournamentState;
  onClose: () => void;
}

export const ResultsImageGenerator: React.FC<ResultsImageGeneratorProps> = ({
  state,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const { podium, matches } = state;
  const champ = podium.champion;
  const runner = podium.runnerUp;
  const third = podium.thirdPlace;
  const fourth = podium.fourthPlace;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 16:9 Landscape dimensions (1280 x 720)
    canvas.width = 1280;
    canvas.height = 720;

    // Background: Deep Obsidian & Dark Wood Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 1280, 720);
    bgGradient.addColorStop(0, '#09090b');
    bgGradient.addColorStop(0.5, '#18181b');
    bgGradient.addColorStop(1, '#09090b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1280, 720);

    // Carrom Board Outer Border
    ctx.strokeStyle = '#d97706'; // Amber 600
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, 1240, 680);

    // Inner Accent Border
    ctx.strokeStyle = '#f59e0b44';
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, 1210, 650);

    // Corner Carrom Pocket Accents
    const pockets = [
      [50, 50],
      [1230, 50],
      [50, 670],
      [1230, 670],
    ];
    pockets.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    // Center Carrom Circle Glow
    ctx.beginPath();
    ctx.arc(640, 360, 260, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b15';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tournament Header Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('STREET CARROM TOURNAMENT 2026', 640, 85);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px serif';
    ctx.fillText('CARROM TOURNAMENT', 640, 140);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('2 CONSECUTIVE WINS TO QUALIFY • FINAL RESULTS', 640, 180);

    // Divider Line
    ctx.strokeStyle = '#d9770666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(340, 205);
    ctx.lineTo(940, 205);
    ctx.stroke();

    // 🥇 CHAMPION CARD (Center)
    const champX = 640;
    const champY = 240;

    // Card background
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.roundRect(400, 230, 480, 175, 16);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('🏆 TOURNAMENT CHAMPION 🏆', champX, 275);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px serif';
    const champText = champ ? `${champ.id} — ${champ.name}` : 'TBD';
    ctx.fillText(champText, champX, 330);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(champ ? `Record: ${champ.wins}W - ${champ.losses}L • Undefeated Streak` : '', champX, 370);

    // 🥈 RUNNER-UP CARD (Left)
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.roundRect(140, 435, 460, 145, 14);
    ctx.fill();
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#e4e4e7';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('🥈 RUNNER-UP (2ND PLACE)', 370, 475);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 28px serif';
    const runnerText = runner ? `${runner.id} — ${runner.name}` : 'TBD';
    ctx.fillText(runnerText, 370, 520);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '14px sans-serif';
    ctx.fillText(runner ? `Record: ${runner.wins}W - ${runner.losses}L` : '', 370, 555);

    // 🥉 THIRD PLACE CARD (Right)
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.roundRect(680, 435, 460, 145, 14);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('🥉 THIRD PLACE (BRONZE)', 910, 475);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 28px serif';
    const thirdText = third ? `${third.id} — ${third.name}` : 'TBD';
    ctx.fillText(thirdText, 910, 520);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '14px sans-serif';
    ctx.fillText(third ? `Record: ${third.wins}W - ${third.losses}L` : '', 910, 555);

    // Footer & Watermark
    ctx.fillStyle = '#71717a';
    ctx.font = '14px monospace';
    ctx.fillText(
      `Generated on ${new Date().toLocaleDateString()} • Official 8-Team Carrom Tournament Record`,
      640,
      640
    );

    // Convert to Image URL
    setDataUrl(canvas.toDataURL('image/png'));
  }, [state]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `carrom_tournament_final_results_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-amber-800/60 rounded-2xl shadow-2xl p-6 overflow-hidden space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base text-zinc-100 uppercase tracking-wider font-['Cinzel',serif]">
              16:9 WHATSAPP SHAREABLE RESULTS CARD
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Canvas for Generation */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Preview of Generated Image */}
        <div className="rounded-xl overflow-hidden border border-amber-700/50 shadow-2xl bg-zinc-900">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="Carrom Tournament Final Results"
              className="w-full h-auto object-contain max-h-[60vh] mx-auto"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-zinc-500">
              Generating high-resolution poster...
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <p className="text-xs text-zinc-400">
            Formatted in landscape 16:9 (1280x720) optimized for WhatsApp status & tournament groups.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Image (PNG)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
