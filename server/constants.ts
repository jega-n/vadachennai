import { Team, TeamId, Match } from './types.ts';

export const INITIAL_TEAMS: Record<TeamId, Omit<Team, 'assignedBox' | 'claimedByUserId' | 'totalMatches' | 'wins' | 'losses' | 'consecutiveWins' | 'status' | 'qualifiedSlot' | 'eliminatedSlot' | 'finalPosition'>> = {
  A: { id: 'A', name: 'Duo Devils' },
  B: { id: 'B', name: 'RCC' },
  C: { id: 'C', name: 'Super Strikers' },
  D: { id: 'D', name: 'Ayan' },
  E: { id: 'E', name: 'Idi Minnal' },
  F: { id: 'F', name: 'Anbu Vagaira' },
  G: { id: 'G', name: '2-Peru Modhi Paaru' },
  H: { id: 'H', name: 'Nanga 4 La Pathi Peru' },
};

/**
 * STRICTLY CONFIDENTIAL SERVER-SIDE MAPPING
 * MUST NEVER BE EXPOSED TO CLIENTS IN BULK
 */
export const SECRET_MYSTERY_MAPPING: Record<number, TeamId> = {
  1: 'F', // Anbu Vagaira
  2: 'C', // Super Strikers
  3: 'H', // Nanga 4 La Pathi Peru
  4: 'A', // Duo Devils
  5: 'G', // 2-Peru Modhi Paaru
  6: 'D', // Ayan
  7: 'B', // RCC
  8: 'E', // Idi Minnal
};

export const INITIAL_MATCH_DEFINITIONS: Omit<Match, 'team1Id' | 'team2Id' | 'winnerId' | 'loserId' | 'status' | 'completedAt'>[] = [
  // ROUND 1 (M1 - M4)
  {
    id: 'M1',
    code: 'M1',
    name: 'Qualification Match 1',
    stage: 'ROUND_1',
    stageLabel: 'Round 1',
    slot1: { type: 'DIRECT', teamId: 'A', label: 'A — Duo Devils' },
    slot2: { type: 'DIRECT', teamId: 'B', label: 'B — RCC' },
    notes: 'Winner advances to M5, Loser drops to M7',
  },
  {
    id: 'M2',
    code: 'M2',
    name: 'Qualification Match 2',
    stage: 'ROUND_1',
    stageLabel: 'Round 1',
    slot1: { type: 'DIRECT', teamId: 'C', label: 'C — Super Strikers' },
    slot2: { type: 'DIRECT', teamId: 'D', label: 'D — Ayan' },
    notes: 'Winner advances to M5, Loser drops to M7',
  },
  {
    id: 'M3',
    code: 'M3',
    name: 'Qualification Match 3',
    stage: 'ROUND_1',
    stageLabel: 'Round 1',
    slot1: { type: 'DIRECT', teamId: 'E', label: 'E — Idi Minnal' },
    slot2: { type: 'DIRECT', teamId: 'F', label: 'F — Anbu Vagaira' },
    notes: 'Winner advances to M6, Loser drops to M8',
  },
  {
    id: 'M4',
    code: 'M4',
    name: 'Qualification Match 4',
    stage: 'ROUND_1',
    stageLabel: 'Round 1',
    slot1: { type: 'DIRECT', teamId: 'G', label: 'G — 2-Peru Modhi Paaru' },
    slot2: { type: 'DIRECT', teamId: 'H', label: 'H — Nanga 4 La Pathi Peru' },
    notes: 'Winner advances to M6, Loser drops to M8',
  },

  // ROUND 2 (M5 - M8)
  {
    id: 'M5',
    code: 'M5',
    name: 'Qualifier 1 Decider',
    stage: 'ROUND_2',
    stageLabel: 'Round 2',
    slot1: { type: 'WINNER_OF', referenceId: 'M1', label: 'W(M1)' },
    slot2: { type: 'WINNER_OF', referenceId: 'M2', label: 'W(M2)' },
    notes: 'Winner qualifies as Q1 (2 consecutive wins!). Loser drops to Round 3 (L(M5))',
  },
  {
    id: 'M6',
    code: 'M6',
    name: 'Qualifier 2 Decider',
    stage: 'ROUND_2',
    stageLabel: 'Round 2',
    slot1: { type: 'WINNER_OF', referenceId: 'M3', label: 'W(M3)' },
    slot2: { type: 'WINNER_OF', referenceId: 'M4', label: 'W(M4)' },
    notes: 'Winner qualifies as Q2 (2 consecutive wins!). Loser drops to Round 3 (L(M6))',
  },
  {
    id: 'M7',
    code: 'M7',
    name: 'Elimination Round Match 1',
    stage: 'ROUND_2',
    stageLabel: 'Round 2',
    slot1: { type: 'LOSER_OF', referenceId: 'M1', label: 'L(M1)' },
    slot2: { type: 'LOSER_OF', referenceId: 'M2', label: 'L(M2)' },
    notes: 'Winner advances to Round 3 (W(M7)). Loser is Eliminated (E1)',
  },
  {
    id: 'M8',
    code: 'M8',
    name: 'Elimination Round Match 2',
    stage: 'ROUND_2',
    stageLabel: 'Round 2',
    slot1: { type: 'LOSER_OF', referenceId: 'M3', label: 'L(M3)' },
    slot2: { type: 'LOSER_OF', referenceId: 'M4', label: 'L(M4)' },
    notes: 'Winner advances to Round 3 (W(M8)). Loser is Eliminated (E2)',
  },

  // ROUND 3 (M9 - M10)
  {
    id: 'M9',
    code: 'M9',
    name: 'Qualifier 3 Decider & Elimination',
    stage: 'ROUND_3',
    stageLabel: 'Round 3',
    slot1: { type: 'LOSER_OF', referenceId: 'M5', label: 'L(M5)' },
    slot2: { type: 'WINNER_OF', referenceId: 'M8', label: 'W(M8)' },
    notes: 'Winner qualifies as Q3 (2 consecutive wins!). Loser is Eliminated (E3)',
  },
  {
    id: 'M10',
    code: 'M10',
    name: 'Qualifier 4 Decider & Elimination',
    stage: 'ROUND_3',
    stageLabel: 'Round 3',
    slot1: { type: 'LOSER_OF', referenceId: 'M6', label: 'L(M6)' },
    slot2: { type: 'WINNER_OF', referenceId: 'M7', label: 'W(M7)' },
    notes: 'Winner qualifies as Q4 (2 consecutive wins!). Loser is Eliminated (E4)',
  },

  // SEMIFINALS
  {
    id: 'SF1',
    code: 'SF1',
    name: 'Semifinal 1',
    stage: 'SEMIFINAL',
    stageLabel: 'Semifinals',
    slot1: { type: 'QUALIFIER', referenceId: 'Q1', label: 'Q1 Qualifier' },
    slot2: { type: 'QUALIFIER', referenceId: 'Q4', label: 'Q4 Qualifier' },
    notes: 'Winner advances to Final. Loser plays Third Place Match',
  },
  {
    id: 'SF2',
    code: 'SF2',
    name: 'Semifinal 2',
    stage: 'SEMIFINAL',
    stageLabel: 'Semifinals',
    slot1: { type: 'QUALIFIER', referenceId: 'Q2', label: 'Q2 Qualifier' },
    slot2: { type: 'QUALIFIER', referenceId: 'Q3', label: 'Q3 Qualifier' },
    notes: 'Winner advances to Final. Loser plays Third Place Match',
  },

  // THIRD PLACE
  {
    id: 'TP',
    code: 'TP',
    name: 'Third Place Match',
    stage: 'THIRD_PLACE',
    stageLabel: 'Bronze Final',
    slot1: { type: 'SF_LOSER', referenceId: 'SF1', label: 'Loser SF1' },
    slot2: { type: 'SF_LOSER', referenceId: 'SF2', label: 'Loser SF2' },
    notes: 'Winner secures 3rd Place 🥉. Loser takes 4th Place',
  },

  // FINAL
  {
    id: 'FINAL',
    code: 'FINAL',
    name: 'Championship Final',
    stage: 'FINAL',
    stageLabel: 'Grand Final',
    slot1: { type: 'SF_WINNER', referenceId: 'SF1', label: 'Winner SF1' },
    slot2: { type: 'SF_WINNER', referenceId: 'SF2', label: 'Winner SF2' },
    notes: 'Winner is crowned CARROM CHAMPION 🏆. Loser is Runner-Up 🥈',
  },
];
