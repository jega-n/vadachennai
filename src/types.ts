export type TournamentState =
  | 'SETUP'
  | 'MYSTERY_DRAW_LOCKED'
  | 'MYSTERY_DRAW_OPEN'
  | 'MYSTERY_DRAW_COMPLETED'
  | 'QUALIFICATION_ACTIVE'
  | 'QUALIFICATION_COMPLETED'
  | 'SEMIFINALS'
  | 'THIRD_PLACE'
  | 'FINAL'
  | 'COMPLETED';

export type TeamId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export interface Team {
  id: TeamId;
  name: string;
  assignedBox: number | null;
  totalMatches: number;
  wins: number;
  losses: number;
  consecutiveWins: number;
  status: 'ACTIVE' | 'QUALIFIED' | 'ELIMINATED';
  qualifiedSlot: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;
  eliminatedSlot: 'E1' | 'E2' | 'E3' | 'E4' | null;
  finalPosition: 1 | 2 | 3 | 4 | null;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'team';
  teamId: TeamId | null;
  teamName: string | null;
}

export type MatchStatus = 'LOCKED' | 'READY' | 'LIVE' | 'COMPLETED';

export type MatchStage =
  | 'ROUND_1'
  | 'ROUND_2'
  | 'ROUND_3'
  | 'SEMIFINAL'
  | 'THIRD_PLACE'
  | 'FINAL';

export interface MatchSlotSource {
  type: 'DIRECT' | 'WINNER_OF' | 'LOSER_OF' | 'QUALIFIER' | 'SF_WINNER' | 'SF_LOSER';
  referenceId?: string;
  teamId?: TeamId;
  label: string;
}

export interface Match {
  id: string;
  code: string;
  name: string;
  stage: MatchStage;
  stageLabel: string;
  slot1: MatchSlotSource;
  slot2: MatchSlotSource;
  team1Id: TeamId | null;
  team2Id: TeamId | null;
  winnerId: TeamId | null;
  loserId: TeamId | null;
  status: MatchStatus;
  notes?: string;
  completedAt: string | null;
}

export interface TournamentMetadata {
  id: string;
  name: string;
  subtitle: string;
  state: TournamentState;
  championTeamId: TeamId | null;
  runnerUpTeamId: TeamId | null;
  thirdPlaceTeamId: TeamId | null;
  fourthPlaceTeamId: TeamId | null;
  mysteryDrawOpenedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface PublicTournamentState {
  metadata: TournamentMetadata;
  teams: Team[];
  mysteryBoxes: Array<{
    boxNumber: number;
    isLocked: boolean;
    claimed: boolean;
  }>;
  matches: Match[];
  qualifiers: {
    Q1: Team | null;
    Q2: Team | null;
    Q3: Team | null;
    Q4: Team | null;
  };
  eliminated: {
    E1: Team | null;
    E2: Team | null;
    E3: Team | null;
    E4: Team | null;
  };
  podium: {
    champion: Team | null;
    runnerUp: Team | null;
    thirdPlace: Team | null;
    fourthPlace: Team | null;
  };
}

export interface SecretMappingItem {
  boxNumber: number;
  teamId: TeamId;
  teamName: string;
  claimed: boolean;
  claimedByTeamId: TeamId | null;
  claimedAt: string | null;
}

export interface AuditLog {
  id: string;
  eventType: string;
  description: string;
  userId: string;
  username: string;
  timestamp: string;
}

export interface AdminTeamItem extends Team {
  username: string | null;
  isEnabled: boolean;
  userId: string | null;
}
