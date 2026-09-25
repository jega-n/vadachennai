import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import {
  AdminTeamItem,
  AuditLog,
  Match,
  PublicTournamentState,
  SecretMappingItem,
  User,
} from '../types.ts';
import {
  Shield,
  Gift,
  Trophy,
  Swords,
  Users,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Lock,
  Unlock,
  Key,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface AdminDashboardViewProps {
  state: PublicTournamentState;
  user: User;
  onSelectResult: (match: Match) => void;
  onOpenCelebration: () => void;
  onOpenImageModal: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  state,
  user,
  onSelectResult,
  onOpenCelebration,
  onOpenImageModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'matches' | 'secret-mapping' | 'teams' | 'audit' | 'exports' | 'reset'
  >('overview');

  // Secret mapping data
  const [secretMapping, setSecretMapping] = useState<SecretMappingItem[]>([]);
  // Team accounts data
  const [teamsData, setTeamsData] = useState<AdminTeamItem[]>([]);
  // Audit logs data
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Confirmation dialogs
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    actionType: 'OPEN_DRAW' | 'AUTO_DRAW' | 'START_TOURNAMENT' | 'RESET_MYSTERY' | 'RESET_MATCHES' | 'RESET_FULL';
  } | null>(null);

  // Password reset modal
  const [resetPassTeam, setResetPassTeam] = useState<AdminTeamItem | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const fetchAdminDetails = async () => {
    try {
      const [mapRes, teamsRes, logsRes] = await Promise.all([
        api.getAdminSecretMapping(),
        api.getAdminTeams(),
        api.getAuditLogs(),
      ]);
      setSecretMapping(mapRes.mapping);
      setTeamsData(teamsRes.teams);
      setAuditLogs(logsRes.auditLogs);
    } catch (err: any) {
      console.error('Failed fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchAdminDetails();
  }, [state]);

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const showError = (msg: string) => {
    setActionErrorMsg(msg);
    setTimeout(() => setActionErrorMsg(null), 5000);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setIsLoading(true);
    setActionErrorMsg(null);

    try {
      if (confirmAction.actionType === 'OPEN_DRAW') {
        await api.openMysteryDraw();
        showSuccess('Mystery box selection is now OPEN to all teams!');
      } else if (confirmAction.actionType === 'AUTO_DRAW') {
        await api.autoDrawMystery();
        showSuccess('All 8 mystery boxes auto-drawn! M1-M4 fixtures have changed to the secret draw matchups.');
      } else if (confirmAction.actionType === 'START_TOURNAMENT') {
        await api.startTournament();
        showSuccess('Tournament started! Initial matches M1 - M4 are now READY to play.');
      } else if (confirmAction.actionType === 'RESET_MYSTERY') {
        await api.resetTournament('MYSTERY');
        showSuccess('Mystery box claims have been reset.');
      } else if (confirmAction.actionType === 'RESET_MATCHES') {
        await api.resetTournament('MATCHES');
        showSuccess('Match scores and standings have been reset.');
      } else if (confirmAction.actionType === 'RESET_FULL') {
        await api.resetTournament('FULL');
        showSuccess('Entire tournament reset to initial state.');
      }
      setConfirmAction(null);
      fetchAdminDetails();
    } catch (err: any) {
      showError(err.message || 'Action failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTeam = async (teamId: string, currentEnabled: boolean) => {
    try {
      await api.toggleTeamStatus(teamId, !currentEnabled);
      showSuccess(`Team ${teamId} has been ${!currentEnabled ? 'enabled' : 'disabled'}.`);
      fetchAdminDetails();
    } catch (err: any) {
      showError(err.message || 'Failed to update team status.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassTeam || !newPassword) return;
    try {
      await api.resetTeamPassword(resetPassTeam.id, newPassword);
      showSuccess(`Password updated for Team ${resetPassTeam.id} (${resetPassTeam.username}).`);
      setResetPassTeam(null);
      setNewPassword('');
      fetchAdminDetails();
    } catch (err: any) {
      showError(err.message || 'Failed to reset password.');
    }
  };

  // Stats calculation
  const totalClaimed = state.mysteryBoxes.filter((b) => b.claimed || b.isLocked).length;
  const totalQualified = Object.values(state.qualifiers).filter(Boolean).length;
  const totalEliminated = Object.values(state.eliminated).filter(Boolean).length;
  const completedMatches = state.matches.filter((m) => m.status === 'COMPLETED').length;
  const nextReadyMatch = state.matches.find((m) => m.status === 'READY' || m.status === 'LIVE');

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-800/40 p-6 shadow-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-black text-xl shadow-lg shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                PROTECTED ACCESS
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-100 uppercase tracking-wide font-['Cinzel',serif]">
                ADMIN CONTROL CENTER
              </h2>
              <div className="text-xs text-zinc-400">
                Authoritative tournament management, scorekeeping, and security
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {state.podium.champion && (
              <button
                type="button"
                onClick={onOpenCelebration}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trophy className="w-4 h-4" />
                <span>Show Celebration</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Action Messages */}
        {actionSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2 shadow animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {actionErrorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 shadow animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
        )}
      </div>

      {/* DASHBOARD STATS CARDS (Section 8) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* TEAMS */}
        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-center">
          <div className="text-[10px] text-zinc-400 uppercase font-mono font-bold">TEAMS</div>
          <div className="text-xl font-black text-zinc-100 font-mono mt-0.5">8 / 8</div>
        </div>

        {/* MYSTERY DRAW */}
        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-amber-900/40 text-center">
          <div className="text-[10px] text-amber-400 uppercase font-mono font-bold">MYSTERY DRAW</div>
          <div className="text-xl font-black text-amber-400 font-mono mt-0.5">{totalClaimed} / 8</div>
        </div>

        {/* QUALIFIED */}
        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-emerald-900/40 text-center">
          <div className="text-[10px] text-emerald-400 uppercase font-mono font-bold">QUALIFIED</div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">{totalQualified} / 4</div>
        </div>

        {/* ELIMINATED */}
        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-rose-900/40 text-center">
          <div className="text-[10px] text-rose-400 uppercase font-mono font-bold">ELIMINATED</div>
          <div className="text-xl font-black text-rose-400 font-mono mt-0.5">{totalEliminated} / 4</div>
        </div>

        {/* MATCHES COMPLETED */}
        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-center">
          <div className="text-[10px] text-zinc-400 uppercase font-mono font-bold">MATCHES PLAYED</div>
          <div className="text-xl font-black text-zinc-100 font-mono mt-0.5">{completedMatches} / 17</div>
        </div>

        {/* CURRENT STAGE */}
        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-amber-600/40 text-center">
          <div className="text-[10px] text-amber-500 uppercase font-mono font-bold">CURRENT STAGE</div>
          <div className="text-xs font-black text-amber-300 font-mono mt-1 truncate">
            {state.metadata.state}
          </div>
        </div>
      </div>

      {/* NEXT READY MATCH CALLOUT */}
      {nextReadyMatch && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/40 border border-amber-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-amber-500 text-zinc-950 font-black flex items-center justify-center font-mono text-xs">
              {nextReadyMatch.code}
            </span>
            <div>
              <div className="text-[11px] font-mono text-amber-400 uppercase font-bold">
                NEXT LIVE / READY FIXTURE
              </div>
              <div className="text-sm font-bold text-zinc-100">
                {nextReadyMatch.name}:{' '}
                <span className="text-amber-300">
                  {nextReadyMatch.team1Id ? `Team ${nextReadyMatch.team1Id}` : nextReadyMatch.slot1.label}
                </span>{' '}
                vs{' '}
                <span className="text-amber-300">
                  {nextReadyMatch.team2Id ? `Team ${nextReadyMatch.team2Id}` : nextReadyMatch.slot2.label}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectResult(nextReadyMatch)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Swords className="w-4 h-4" />
            <span>Enter Result</span>
          </button>
        </div>
      )}

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800 scrollbar-none">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-amber-500 text-zinc-950'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          Overview & Stage Actions
        </button>

        <button
          onClick={() => setActiveSubTab('matches')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'matches'
              ? 'bg-amber-500 text-zinc-950'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          Match Management ({state.matches.length})
        </button>

        <button
          onClick={() => setActiveSubTab('secret-mapping')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'secret-mapping'
              ? 'bg-amber-500 text-zinc-950'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          🔒 Secret Mystery Mapping
        </button>

        <button
          onClick={() => setActiveSubTab('teams')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'teams'
              ? 'bg-amber-500 text-zinc-950'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          Team Accounts & Passwords
        </button>

        <button
          onClick={() => setActiveSubTab('exports')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'exports'
              ? 'bg-amber-500 text-zinc-950'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          Exports & WhatsApp Poster
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-amber-500 text-zinc-950'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          Audit Logs
        </button>

        <button
          onClick={() => setActiveSubTab('reset')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'reset'
              ? 'bg-rose-600 text-zinc-100'
              : 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/30'
          }`}
        >
          Tournament Reset
        </button>
      </div>

      {/* TAB CONTENT 1: OVERVIEW & STAGE ACTIONS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mystery Selection Control */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/60 flex items-center justify-center text-amber-400">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase text-zinc-100 font-['Cinzel',serif]">
                    MYSTERY DRAW CONTROL
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Control team identity selection access
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Status:</span>
                  <span className="font-bold text-amber-400">{state.metadata.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Boxes Claimed:</span>
                  <span className="font-bold text-zinc-200">{totalClaimed} of 8</span>
                </div>
              </div>

              <div className="space-y-2">
                {state.metadata.state === 'SETUP' || state.metadata.state === 'MYSTERY_DRAW_LOCKED' ? (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction({
                        title: 'OPEN MYSTERY SELECTION',
                        description:
                          'Are you sure you want to open mystery box selection? Authenticated teams will immediately be able to draw their team identity.',
                        actionType: 'OPEN_DRAW',
                      })
                    }
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                  >
                    🔓 OPEN MYSTERY SELECTION
                  </button>
                ) : state.metadata.state === 'MYSTERY_DRAW_OPEN' ? (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-400 text-xs font-semibold text-center">
                    ✅ Mystery selection is currently OPEN to all teams.
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold text-center">
                    Mystery draw phase has concluded.
                  </div>
                )}

                {totalClaimed < 8 && (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction({
                        title: '⚡ AUTO-DRAW ALL MYSTERY BOXES',
                        description:
                          'This will instantly assign all remaining mystery boxes according to the secret draw mapping, automatically updating default Round 1 matches (M1–M4) to the new mystery fixtures. Proceed?',
                        actionType: 'AUTO_DRAW',
                      })
                    }
                    className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-amber-600/50 hover:border-amber-500 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>⚡ Auto-Draw All Boxes ({8 - totalClaimed} Left)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Start Tournament Control */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/60 flex items-center justify-center text-amber-400">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm uppercase text-zinc-100 font-['Cinzel',serif]">
                    START TOURNAMENT
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Activate Qualification Stage & Initial Matches
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Ready to Launch:</span>
                  <span className={`font-bold ${totalClaimed === 8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {totalClaimed === 8 ? 'YES (All 8 Assigned)' : `${8 - totalClaimed} Boxes Remaining`}
                  </span>
                </div>
              </div>

              {state.metadata.state === 'SETUP' ||
              state.metadata.state === 'MYSTERY_DRAW_OPEN' ||
              state.metadata.state === 'MYSTERY_DRAW_COMPLETED' ? (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction({
                      title: 'START CARROM TOURNAMENT',
                      description:
                        'Confirm starting the tournament? This will transition the state to QUALIFICATION_ACTIVE and make Round 1 matches (M1–M4) READY for scorekeeping.',
                      actionType: 'START_TOURNAMENT',
                    })
                  }
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                >
                  🚀 START TOURNAMENT
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-400 text-xs font-semibold text-center">
                  ✅ Tournament is live in stage: {state.metadata.state}
                </div>
              )}
            </div>
          </div>

          {/* Round 1 Fixture Status (Default vs Mystery Draw) */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h4 className="font-extrabold text-sm uppercase text-zinc-100 font-['Cinzel',serif]">
                  ROUND 1 FIXTURES STATUS (M1 – M4)
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {totalClaimed === 8 ? (
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800/80">
                    ✨ MYSTERY DRAW APPLIED (Default teams replaced)
                  </span>
                ) : totalClaimed > 0 ? (
                  <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-700/80">
                    🔄 PARTIAL MYSTERY DRAW ({totalClaimed}/8 Boxes Claimed)
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-bold text-zinc-400 bg-zinc-900 px-2.5 py-0.5 rounded border border-zinc-800">
                    DEFAULT FIXTURES (Awaiting Mystery Draw)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {['M1', 'M2', 'M3', 'M4'].map((mId, idx) => {
                const match = state.matches.find((m) => m.id === mId);
                const t1 = match?.team1Id ? state.teams.find((t) => t.id === match.team1Id) : null;
                const t2 = match?.team2Id ? state.teams.find((t) => t.id === match.team2Id) : null;
                const boxA = idx * 2 + 1;
                const boxB = idx * 2 + 2;

                return (
                  <div key={mId} className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-black text-amber-400">{mId}</span>
                      <span className="text-[10px] font-mono text-zinc-500">Box {boxA} vs Box {boxB}</span>
                    </div>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="p-1.5 rounded bg-zinc-950/80 border border-zinc-850 flex items-center justify-between">
                        <span className="font-bold text-zinc-200">{t1 ? `${t1.id} — ${t1.name}` : match?.slot1.label}</span>
                      </div>
                      <div className="text-center text-[10px] text-zinc-600 font-bold">vs</div>
                      <div className="p-1.5 rounded bg-zinc-950/80 border border-zinc-850 flex items-center justify-between">
                        <span className="font-bold text-zinc-200">{t2 ? `${t2.id} — ${t2.name}` : match?.slot2.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: MATCH MANAGEMENT */}
      {activeSubTab === 'matches' && (
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h4 className="font-extrabold text-sm uppercase text-zinc-100 font-['Cinzel',serif]">
              ALL TOURNAMENT FIXTURES ({state.matches.length})
            </h4>
            <span className="text-xs text-zinc-400 font-mono">Click "Enter Result" on ready matches</span>
          </div>

          <div className="space-y-3">
            {state.matches.map((m) => {
              const team1 = m.team1Id ? state.teams.find((t) => t.id === m.team1Id) : null;
              const team2 = m.team2Id ? state.teams.find((t) => t.id === m.team2Id) : null;
              const isCompleted = m.status === 'COMPLETED';

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                      : m.status === 'READY'
                      ? 'bg-gradient-to-r from-amber-950/30 to-zinc-900 border-amber-600/70 shadow-md'
                      : 'bg-zinc-950 border-zinc-850 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded bg-zinc-800 font-mono font-black text-xs text-amber-400">
                      {m.code}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-zinc-100">
                        {m.name} <span className="text-zinc-500 font-normal">({m.stageLabel})</span>
                      </div>
                      <div className="text-xs text-zinc-300 font-mono mt-0.5">
                        {team1 ? `${team1.id} (${team1.name})` : m.slot1.label} vs{' '}
                        {team2 ? `${team2.id} (${team2.name})` : m.slot2.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <div className="text-right text-xs">
                        <span className="text-emerald-400 font-bold font-mono">
                          WINNER: {m.winnerId}
                        </span>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          Completed: {m.completedAt ? new Date(m.completedAt).toLocaleTimeString() : ''}
                        </div>
                      </div>
                    ) : m.status === 'READY' || m.status === 'LIVE' ? (
                      <button
                        type="button"
                        onClick={() => onSelectResult(m)}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow cursor-pointer flex items-center gap-1.5"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>Update Result</span>
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-zinc-500">Awaiting prior round</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SECRET MYSTERY MAPPING (ADMIN ONLY) */}
      {activeSubTab === 'secret-mapping' && (
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-rose-400 font-bold uppercase bg-rose-950/80 px-2 py-0.5 rounded border border-rose-900/60">
                  TOP SECRET • ADMIN EYES ONLY
                </span>
              </div>
              <h4 className="font-extrabold text-base uppercase text-zinc-100 font-['Cinzel',serif] mt-1">
                SECRET MYSTERY BOX MAPPING
              </h4>
              <p className="text-xs text-zinc-400">
                This table is never exposed to public or team users. Only you as Administrator can view it.
              </p>
            </div>

            <a
              href="/api/admin/export/secret-mapping-csv"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Mapping CSV</span>
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Mystery Box</th>
                  <th className="p-3">Assigned Team ID</th>
                  <th className="p-3">Team Name</th>
                  <th className="p-3">Selection Status</th>
                  <th className="p-3">Claimed Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-200">
                {secretMapping.map((item) => (
                  <tr key={item.boxNumber} className="hover:bg-zinc-900/40">
                    <td className="p-3 font-bold text-amber-400">🎁 Box {item.boxNumber}</td>
                    <td className="p-3 font-black text-sm text-zinc-100">{item.teamId}</td>
                    <td className="p-3 font-bold text-zinc-200">{item.teamName}</td>
                    <td className="p-3">
                      {item.claimed ? (
                        <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900">
                          Claimed
                        </span>
                      ) : (
                        <span className="text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          Unclaimed
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-zinc-400">
                      {item.claimedAt ? new Date(item.claimedAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: TEAM MANAGEMENT & PASSWORDS */}
      {activeSubTab === 'teams' && (
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h4 className="font-extrabold text-sm uppercase text-zinc-100 font-['Cinzel',serif]">
                TEAM ACCOUNTS & CREDENTIALS
              </h4>
              <p className="text-xs text-zinc-400">
                Manage team authentication status, reset passwords, or enable/disable accounts
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Team Name</th>
                  <th className="p-3">Login Username</th>
                  <th className="p-3">Assigned Box</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-200">
                {teamsData.map((team) => (
                  <tr key={team.id} className="hover:bg-zinc-900/40">
                    <td className="p-3 font-black text-amber-400">{team.id}</td>
                    <td className="p-3 font-bold text-zinc-100">{team.name}</td>
                    <td className="p-3 font-mono text-zinc-300">@{team.username}</td>
                    <td className="p-3">
                      {team.assignedBox ? `Box #${team.assignedBox}` : 'None'}
                    </td>
                    <td className="p-3">
                      {team.isEnabled ? (
                        <span className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900 font-bold">
                          Active
                        </span>
                      ) : (
                        <span className="text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-900 font-bold">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleToggleTeam(team.id, team.isEnabled)}
                        className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-sans text-xs cursor-pointer transition-colors"
                      >
                        {team.isEnabled ? 'Disable' : 'Enable'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setResetPassTeam(team);
                          setNewPassword('');
                        }}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-zinc-950 border border-amber-500/40 font-sans text-xs font-bold cursor-pointer transition-colors"
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: EXPORTS & WHATSAPP POSTER */}
      {activeSubTab === 'exports' && (
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-6 shadow-xl">
          <div className="pb-3 border-b border-zinc-800">
            <h4 className="font-extrabold text-sm uppercase text-zinc-100 font-['Cinzel',serif]">
              TOURNAMENT EXPORTS & SHARING
            </h4>
            <p className="text-xs text-zinc-400">
              Generate official reports, download spreadsheets, and render high-resolution 16:9 results graphic
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Team Report CSV */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
              <div>
                <FileSpreadsheet className="w-6 h-6 text-emerald-400 mb-2" />
                <div className="font-bold text-sm text-zinc-100">Team Statistics CSV</div>
                <div className="text-xs text-zinc-400 mt-1">
                  Full team standings, consecutive wins, qualification slots, and final positions.
                </div>
              </div>
              <a
                href="/api/admin/export/teams-csv"
                download
                className="mt-4 w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Teams CSV</span>
              </a>
            </div>

            {/* Match Report CSV */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
              <div>
                <FileSpreadsheet className="w-6 h-6 text-cyan-400 mb-2" />
                <div className="font-bold text-sm text-zinc-100">Match Results CSV</div>
                <div className="text-xs text-zinc-400 mt-1">
                  Chronological records of all matches M1 to Final with winner/loser and timestamps.
                </div>
              </div>
              <a
                href="/api/admin/export/matches-csv"
                download
                className="mt-4 w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Matches CSV</span>
              </a>
            </div>

            {/* Tournament Full JSON */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
              <div>
                <Download className="w-6 h-6 text-amber-400 mb-2" />
                <div className="font-bold text-sm text-zinc-100">Complete Tournament JSON</div>
                <div className="text-xs text-zinc-400 mt-1">
                  Machine-readable backup of tournament metadata, fixtures, scores, and audit trail.
                </div>
              </div>
              <a
                href="/api/admin/export/tournament-json"
                download
                className="mt-4 w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON Backup</span>
              </a>
            </div>

            {/* 16:9 WhatsApp Poster Graphic */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/50 to-zinc-900 border border-amber-500/60 flex flex-col justify-between">
              <div>
                <Sparkles className="w-6 h-6 text-amber-400 mb-2" />
                <div className="font-bold text-sm text-amber-300">16:9 WhatsApp Results Card</div>
                <div className="text-xs text-zinc-400 mt-1">
                  Render a branded landscape graphic with Champion, Runner-Up & 3rd Place for sharing.
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenImageModal}
                className="mt-4 w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Image Studio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h4 className="font-extrabold text-sm uppercase text-zinc-100 font-['Cinzel',serif]">
              AUDIT TRAIL ({auditLogs.length} EVENTS)
            </h4>
            <span className="text-xs text-zinc-400 font-mono">Immutable server logs</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs pr-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-bold mr-2 text-[10px]">
                    {log.eventType}
                  </span>
                  <span className="text-zinc-200">{log.description}</span>
                </div>
                <div className="text-[10px] text-zinc-500 shrink-0">
                  {new Date(log.timestamp).toLocaleString()} • by {log.username}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: RESET OPERATIONS */}
      {activeSubTab === 'reset' && (
        <div className="rounded-2xl bg-rose-950/20 border-2 border-rose-900/60 p-6 space-y-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-extrabold text-base uppercase font-['Cinzel',serif]">
                DANGER ZONE • TOURNAMENT RESET
              </h4>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Reset operations modify tournament state. Each option requires confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Reset Mystery Draw */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="font-bold text-sm text-zinc-100">Reset Mystery Draw</div>
              <p className="text-xs text-zinc-400">
                Clears all team box selections and locks all 8 mystery boxes again. Does not wipe match fixtures.
              </p>
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: 'RESET MYSTERY DRAW',
                    description:
                      'Are you sure you want to wipe all mystery box selections? Teams will need to re-draw.',
                    actionType: 'RESET_MYSTERY',
                  })
                }
                className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-rose-900/60 text-rose-300 font-bold text-xs uppercase border border-rose-900/60 transition-colors cursor-pointer"
              >
                Reset Mystery Draw
              </button>
            </div>

            {/* Reset Match Results */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="font-bold text-sm text-zinc-100">Reset Match Results</div>
              <p className="text-xs text-zinc-400">
                Wipes all recorded match scores, resets consecutive wins and qualifiers, and restores M1–M4.
              </p>
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: 'RESET MATCH SCORES',
                    description:
                      'Are you sure you want to erase all match results? All qualification progress will be reset.',
                    actionType: 'RESET_MATCHES',
                  })
                }
                className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-rose-900/60 text-rose-300 font-bold text-xs uppercase border border-rose-900/60 transition-colors cursor-pointer"
              >
                Reset Match Scores
              </button>
            </div>

            {/* Reset Entire Tournament */}
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 space-y-3">
              <div className="font-black text-sm text-rose-300">Full Tournament Wipe</div>
              <p className="text-xs text-rose-200/80">
                WARNING: Completely resets tournament to SETUP. Wipes mystery assignments, fixtures, and standings.
              </p>
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: 'FULL TOURNAMENT WIPE',
                    description:
                      'CRITICAL WARNING: This will delete ALL mystery assignments, all match results, and return to SETUP phase. This cannot be undone.',
                    actionType: 'RESET_FULL',
                  })
                }
                className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow transition-all cursor-pointer"
              >
                RESET ENTIRE TOURNAMENT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-zinc-950 border border-amber-800/80 rounded-2xl shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-zinc-100 uppercase tracking-wide font-['Cinzel',serif]">
              {confirmAction.title}
            </h3>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {confirmAction.description}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={isLoading}
                className="py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isLoading}
                className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPassTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-zinc-950 border border-amber-800/80 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-2">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-zinc-100 uppercase tracking-wide font-['Cinzel',serif]">
                RESET PASSWORD: TEAM {resetPassTeam.id}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {resetPassTeam.name} (@{resetPassTeam.username})
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  New Password
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 4 chars)"
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPassTeam(null)}
                  className="py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
