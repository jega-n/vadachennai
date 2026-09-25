/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { api } from './api.ts';
import { Match, PublicTournamentState, Team, User } from './types.ts';
import { Header } from './components/Header.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { TournamentLiveView } from './components/TournamentLiveView.tsx';
import { MysteryBoxView } from './components/MysteryBoxView.tsx';
import { TeamDashboardView } from './components/TeamDashboardView.tsx';
import { AdminDashboardView } from './components/AdminDashboardView.tsx';
import { ResultModal } from './components/ResultModal.tsx';
import { CelebrationModal } from './components/CelebrationModal.tsx';
import { ResultsImageGenerator } from './components/ResultsImageGenerator.tsx';
import { Radio, AlertCircle } from 'lucide-react';

export default function App() {
  const [tournamentState, setTournamentState] = useState<PublicTournamentState | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<'tournament' | 'mystery' | 'team' | 'admin'>('tournament');

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedMatchForResult, setSelectedMatchForResult] = useState<Match | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Initialize data
  const loadInitialData = useCallback(async (retryCount = 0) => {
    try {
      const state = await api.getTournamentState();
      setTournamentState(state);

      const me = await api.getMe();
      if (me.user) {
        setUser(me.user);
        setCurrentTeam(me.team);
      }
    } catch (err: any) {
      if (retryCount < 3) {
        setTimeout(() => loadInitialData(retryCount + 1), 1000);
      } else {
        console.error('Initial data load error:', err?.message || err);
      }
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    // Subscribe to SSE updates
    const unsubscribe = api.subscribeToEvents(
      (updatedState) => {
        setTournamentState(updatedState);

        // Check if tournament just completed and trigger celebration
        if (
          updatedState.metadata.state === 'COMPLETED' &&
          updatedState.podium.champion &&
          !hasCelebrated
        ) {
          setIsCelebrationOpen(true);
          setHasCelebrated(true);
        }
      },
      (connected) => {
        setIsConnected(connected);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [loadInitialData, hasCelebrated]);

  const handleLoginSuccess = (loggedInUser: User, loggedInTeam: Team | null) => {
    setUser(loggedInUser);
    setCurrentTeam(loggedInTeam);
    if (loggedInUser.role === 'admin') {
      setCurrentTab('admin');
    } else if (loggedInUser.role === 'team') {
      setCurrentTab('mystery');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCurrentTeam(null);
    setCurrentTab('tournament');
  };

  const teamsMap = (tournamentState?.teams || []).reduce((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {} as Record<string, Team>);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        metadata={tournamentState?.metadata || null}
        isConnected={isConnected}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {!isConnected && (
          <div className="bg-amber-950/70 border-b border-amber-800/80 px-4 py-2 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>Reconnecting to tournament server stream... Authoritative state will sync automatically.</span>
          </div>
        )}

        {tournamentState ? (
          <>
            {currentTab === 'tournament' && (
              <TournamentLiveView
                state={tournamentState}
                user={user}
                onSelectResult={(match) => setSelectedMatchForResult(match)}
                onOpenMysteryTab={() => setCurrentTab('mystery')}
                onOpenCelebration={() => setIsCelebrationOpen(true)}
              />
            )}

            {currentTab === 'mystery' && (
              <MysteryBoxView
                user={user}
                currentTeam={currentTeam}
                metadata={tournamentState.metadata}
                boxes={tournamentState.mysteryBoxes}
                onOpenLogin={() => setIsLoginOpen(true)}
                onBoxClaimedSuccess={(teamId, teamName) => {
                  loadInitialData();
                }}
              />
            )}

            {currentTab === 'team' && user && user.role === 'team' && (
              <TeamDashboardView
                user={user}
                onOpenMysteryTab={() => setCurrentTab('mystery')}
              />
            )}

            {currentTab === 'admin' && user && user.role === 'admin' && (
              <AdminDashboardView
                state={tournamentState}
                user={user}
                onSelectResult={(match) => setSelectedMatchForResult(match)}
                onOpenCelebration={() => setIsCelebrationOpen(true)}
                onOpenImageModal={() => setIsImageModalOpen(true)}
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-10 h-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
            <p className="text-xs text-zinc-400 font-mono">Connecting to Carrom Tournament Core...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/90 py-6 text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            CARROM TOURNAMENT • 2 CONSECUTIVE WINS TO QUALIFY
          </div>
          <div className="text-[11px] text-zinc-600">
            Realtime 8-Device Street Carrom Engine • 100% Free Tier Architecture
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <ResultModal
        match={selectedMatchForResult}
        teamsMap={teamsMap}
        onClose={() => setSelectedMatchForResult(null)}
        onSuccess={() => {
          loadInitialData();
        }}
      />

      {tournamentState && (
        <CelebrationModal
          isOpen={isCelebrationOpen}
          state={tournamentState}
          onClose={() => setIsCelebrationOpen(false)}
          onOpenImageGenerator={() => setIsImageModalOpen(true)}
        />
      )}

      {tournamentState && isImageModalOpen && (
        <ResultsImageGenerator
          state={tournamentState}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
    </div>
  );
}
