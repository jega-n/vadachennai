import { dbService, DatabaseSchema } from './db.ts';
import {
  Match,
  MatchSlotSource,
  MysteryBox,
  PublicTournamentState,
  Team,
  TeamId,
  TournamentState,
} from './types.ts';
import { SECRET_MYSTERY_MAPPING } from './constants.ts';

export class TournamentEngine {
  /**
   * Safe public representation of tournament state for clients
   */
  public static getPublicState(): PublicTournamentState {
    const data = dbService.getRawData();
    const teamsList = Object.values(data.teams).map((team) => {
      // Omit private fields if any
      const { claimedByUserId, ...rest } = team;
      return rest;
    });

    const mysteryBoxes = data.mysteryBoxes.map((box) => ({
      boxNumber: box.boxNumber,
      isLocked: box.isLocked,
      claimed: !!box.claimedByTeamId,
    }));

    const qualifiers = {
      Q1: Object.values(data.teams).find((t) => t.qualifiedSlot === 'Q1') || null,
      Q2: Object.values(data.teams).find((t) => t.qualifiedSlot === 'Q2') || null,
      Q3: Object.values(data.teams).find((t) => t.qualifiedSlot === 'Q3') || null,
      Q4: Object.values(data.teams).find((t) => t.qualifiedSlot === 'Q4') || null,
    };

    const eliminated = {
      E1: Object.values(data.teams).find((t) => t.eliminatedSlot === 'E1') || null,
      E2: Object.values(data.teams).find((t) => t.eliminatedSlot === 'E2') || null,
      E3: Object.values(data.teams).find((t) => t.eliminatedSlot === 'E3') || null,
      E4: Object.values(data.teams).find((t) => t.eliminatedSlot === 'E4') || null,
    };

    const podium = {
      champion: data.metadata.championTeamId ? data.teams[data.metadata.championTeamId] || null : null,
      runnerUp: data.metadata.runnerUpTeamId ? data.teams[data.metadata.runnerUpTeamId] || null : null,
      thirdPlace: data.metadata.thirdPlaceTeamId ? data.teams[data.metadata.thirdPlaceTeamId] || null : null,
      fourthPlace: data.metadata.fourthPlaceTeamId ? data.teams[data.metadata.fourthPlaceTeamId] || null : null,
    };

    return {
      metadata: data.metadata,
      teams: teamsList,
      mysteryBoxes,
      matches: data.matches,
      qualifiers,
      eliminated,
      podium,
    };
  }

  /**
   * Open Mystery Selection by Admin
   */
  public static async openMysterySelection(adminUser: { id: string; username: string }) {
    return dbService.transaction((db) => {
      if (db.metadata.state !== 'SETUP' && db.metadata.state !== 'MYSTERY_DRAW_LOCKED') {
        throw new Error('Mystery draw cannot be opened from current tournament stage.');
      }
      db.metadata.state = 'MYSTERY_DRAW_OPEN';
      db.metadata.mysteryDrawOpenedAt = new Date().toISOString();
      dbService.logAudit('MYSTERY_DRAW_OPENED', 'Admin opened mystery box selection for teams.', adminUser);
      return { success: true, state: db.metadata.state };
    });
  }

  /**
   * Atomic Claim Mystery Box by authenticated team user
   */
  public static async claimMysteryBox(
    boxNumber: number,
    user: { id: string; username: string; teamId: TeamId }
  ): Promise<{ assignedTeamId: TeamId; assignedTeamName: string }> {
    return dbService.transaction((db) => {
      // 1. Verify tournament state
      if (db.metadata.state !== 'MYSTERY_DRAW_OPEN') {
        throw new Error('Mystery selection is currently closed.');
      }

      // 2. Verify account is an approved team
      const team = db.teams[user.teamId];
      if (!team) {
        throw new Error('Team account not found.');
      }

      // 3. Verify user has not already selected a box
      const alreadyClaimed = Object.values(db.teams).find((t) => t.claimedByUserId === user.id || t.assignedBox !== null && t.id === user.teamId);
      if (alreadyClaimed && alreadyClaimed.assignedBox !== null) {
        throw new Error('You have already claimed a mystery box.');
      }

      // 4. Verify box valid and not already claimed
      const box = db.mysteryBoxes.find((b) => b.boxNumber === boxNumber);
      if (!box) {
        throw new Error('Invalid box number.');
      }
      if (box.isLocked || box.claimedByTeamId) {
        throw new Error('This box was just selected by another team.');
      }

      // 5. Lookup secret assignment
      const assignedTeamId = SECRET_MYSTERY_MAPPING[boxNumber];
      if (!assignedTeamId) {
        throw new Error('Internal mapping error for this box.');
      }

      const assignedTeam = db.teams[assignedTeamId];
      if (!assignedTeam) {
        throw new Error('Assigned team not found in tournament roster.');
      }

      // 6. Lock box atomically
      box.isLocked = true;
      box.claimedByTeamId = assignedTeamId;
      box.claimedAt = new Date().toISOString();

      // 7. Update team assignment
      assignedTeam.assignedBox = boxNumber;
      assignedTeam.claimedByUserId = user.id;

      // Dynamically update M1-M4 fixtures based on claimed mystery boxes
      TournamentEngine.syncRound1FixturesFromMysteryBoxes(db);

      dbService.logAudit(
        'BOX_CLAIMED',
        `User ${user.username} claimed Mystery Box ${boxNumber} (${assignedTeam.id} - ${assignedTeam.name}).`,
        user
      );

      // 8. Check if all 8 boxes are claimed
      const allClaimed = db.mysteryBoxes.every((b) => b.isLocked && b.claimedByTeamId);
      if (allClaimed) {
        db.metadata.state = 'MYSTERY_DRAW_COMPLETED';
        dbService.logAudit(
          'MYSTERY_DRAW_COMPLETED',
          'All 8 mystery boxes have been successfully claimed. M1-M4 fixtures updated.',
          { id: 'system', username: 'System' }
        );
      }

      // 9. RETURN ONLY this participant's assignment
      return {
        assignedTeamId: assignedTeam.id,
        assignedTeamName: assignedTeam.name,
      };
    });
  }

  /**
   * Start Qualification Tournament by Admin
   */
  public static async startTournament(adminUser: { id: string; username: string }) {
    return dbService.transaction((db) => {
      // Must be at MYSTERY_DRAW_COMPLETED (or SETUP if admin overrides for testing with default fixtures)
      const allClaimed = db.mysteryBoxes.every((b) => b.isLocked && b.claimedByTeamId);
      if (!allClaimed && db.metadata.state !== 'MYSTERY_DRAW_COMPLETED' && db.metadata.state !== 'SETUP') {
        throw new Error('All 8 mystery boxes must be claimed before starting the tournament.');
      }

      db.metadata.state = 'QUALIFICATION_ACTIVE';
      db.metadata.startedAt = new Date().toISOString();

      // Set initial matches M1 - M4 to READY
      ['M1', 'M2', 'M3', 'M4'].forEach((matchId) => {
        const m = db.matches.find((match) => match.id === matchId);
        if (m) {
          m.status = 'READY';
        }
      });

      dbService.logAudit('TOURNAMENT_STARTED', 'Tournament started. M1-M4 are ready.', adminUser);
      return { success: true, state: db.metadata.state };
    });
  }

  /**
   * Record Result for a Match
   */
  public static async recordMatchResult(
    matchId: string,
    winnerId: TeamId,
    adminUser: { id: string; username: string }
  ) {
    return dbService.transaction((db) => {
      const match = db.matches.find((m) => m.id === matchId);
      if (!match) {
        throw new Error('Match not found.');
      }

      // Concurrency check
      if (match.status === 'COMPLETED') {
        throw new Error('This match has already been completed.');
      }
      if (match.status !== 'READY' && match.status !== 'LIVE') {
        throw new Error('Match is not ready to be played.');
      }

      if (!match.team1Id || !match.team2Id) {
        throw new Error('Match does not have both teams determined yet.');
      }

      if (winnerId !== match.team1Id && winnerId !== match.team2Id) {
        throw new Error('Selected winner is not a participant in this match.');
      }

      const loserId = winnerId === match.team1Id ? match.team2Id : match.team1Id;
      const winner = db.teams[winnerId];
      const loser = db.teams[loserId];

      if (!winner || !loser) {
        throw new Error('Participating teams not found.');
      }

      // Verify eligibility before processing:
      // Neither team should have been already eliminated or already qualified before this match!
      if (match.stage !== 'SEMIFINAL' && match.stage !== 'THIRD_PLACE' && match.stage !== 'FINAL') {
        if (winner.status === 'ELIMINATED' || loser.status === 'ELIMINATED') {
          throw new Error('Cannot record match for an eliminated team.');
        }
        if (winner.status === 'QUALIFIED' || loser.status === 'QUALIFIED') {
          throw new Error('Cannot record match for an already qualified team.');
        }
      }

      // Update match
      match.winnerId = winnerId;
      match.loserId = loserId;
      match.status = 'COMPLETED';
      match.completedAt = new Date().toISOString();

      // Update statistics
      winner.totalMatches += 1;
      winner.wins += 1;
      winner.consecutiveWins += 1;

      loser.totalMatches += 1;
      loser.losses += 1;
      loser.consecutiveWins = 0; // Consec win resets on loss!

      // Stage-specific qualification / elimination rules
      TournamentEngine.processQualificationRules(db, match, winner, loser);

      // Resolve dependent matches
      TournamentEngine.resolveDependencies(db);

      // Check stage progression
      TournamentEngine.updateTournamentStage(db);

      dbService.logAudit(
        'RESULT_ENTERED',
        `Result recorded for ${match.id} (${match.name}): Winner ${winner.id} (${winner.name}), Loser ${loser.id} (${loser.name}).`,
        adminUser
      );

      return {
        success: true,
        matchId: match.id,
        winnerId,
        loserId,
        state: db.metadata.state,
      };
    });
  }

  /**
   * Qualification & Elimination logic per prompt Section 20 & 21
   */
  private static processQualificationRules(
    db: DatabaseSchema,
    match: Match,
    winner: Team,
    loser: Team
  ) {
    switch (match.id) {
      case 'M5':
        // Winner has 2 consecutive wins (M1, M5) -> Q1
        winner.status = 'QUALIFIED';
        winner.qualifiedSlot = 'Q1';
        break;

      case 'M6':
        // Winner has 2 consecutive wins (M3/4, M6) -> Q2
        winner.status = 'QUALIFIED';
        winner.qualifiedSlot = 'Q2';
        break;

      case 'M7':
        // Loser has 2 losses (lost M1/2, lost M7) -> E1
        loser.status = 'ELIMINATED';
        loser.eliminatedSlot = 'E1';
        break;

      case 'M8':
        // Loser has 2 losses (lost M3/4, lost M8) -> E2
        loser.status = 'ELIMINATED';
        loser.eliminatedSlot = 'E2';
        break;

      case 'M9':
        // Winner qualifies as Q3
        winner.status = 'QUALIFIED';
        winner.qualifiedSlot = 'Q3';
        // Loser is eliminated as E3
        loser.status = 'ELIMINATED';
        loser.eliminatedSlot = 'E3';
        break;

      case 'M10':
        // Winner qualifies as Q4
        winner.status = 'QUALIFIED';
        winner.qualifiedSlot = 'Q4';
        // Loser is eliminated as E4
        loser.status = 'ELIMINATED';
        loser.eliminatedSlot = 'E4';
        break;

      case 'SF1':
      case 'SF2':
        // Semifinals determine finalists and third-place contenders
        break;

      case 'TP':
        // Third place decider
        winner.finalPosition = 3;
        loser.finalPosition = 4;
        db.metadata.thirdPlaceTeamId = winner.id;
        db.metadata.fourthPlaceTeamId = loser.id;
        break;

      case 'FINAL':
        // Championship Final
        winner.finalPosition = 1;
        loser.finalPosition = 2;
        db.metadata.championTeamId = winner.id;
        db.metadata.runnerUpTeamId = loser.id;
        break;
    }
  }

  /**
   * Resolves all match dependencies according to section 19 & 21
   */
  public static resolveDependencies(db: DatabaseSchema) {
    const getResolvedTeam = (slot: MatchSlotSource): TeamId | null => {
      if (slot.type === 'DIRECT') {
        return slot.teamId || null;
      }
      if (slot.type === 'WINNER_OF' && slot.referenceId) {
        const ref = db.matches.find((m) => m.id === slot.referenceId);
        return ref && ref.status === 'COMPLETED' ? ref.winnerId : null;
      }
      if (slot.type === 'LOSER_OF' && slot.referenceId) {
        const ref = db.matches.find((m) => m.id === slot.referenceId);
        return ref && ref.status === 'COMPLETED' ? ref.loserId : null;
      }
      if (slot.type === 'QUALIFIER' && slot.referenceId) {
        const qSlot = slot.referenceId as 'Q1' | 'Q2' | 'Q3' | 'Q4';
        const team = Object.values(db.teams).find((t) => t.qualifiedSlot === qSlot);
        return team ? team.id : null;
      }
      if (slot.type === 'SF_WINNER' && slot.referenceId) {
        const ref = db.matches.find((m) => m.id === slot.referenceId);
        return ref && ref.status === 'COMPLETED' ? ref.winnerId : null;
      }
      if (slot.type === 'SF_LOSER' && slot.referenceId) {
        const ref = db.matches.find((m) => m.id === slot.referenceId);
        return ref && ref.status === 'COMPLETED' ? ref.loserId : null;
      }
      return null;
    };

    db.matches.forEach((match) => {
      // If already completed, do not modify teams
      if (match.status === 'COMPLETED') return;

      const t1 = getResolvedTeam(match.slot1);
      const t2 = getResolvedTeam(match.slot2);

      match.team1Id = t1;
      match.team2Id = t2;

      // If both teams resolved and match is locked, make it READY!
      if (t1 && t2) {
        if (match.status === 'LOCKED') {
          match.status = 'READY';
        }
      } else {
        match.status = 'LOCKED';
      }
    });
  }

  /**
   * Update Tournament State based on completion of stages
   */
  private static updateTournamentStage(db: DatabaseSchema) {
    const q1 = Object.values(db.teams).find((t) => t.qualifiedSlot === 'Q1');
    const q2 = Object.values(db.teams).find((t) => t.qualifiedSlot === 'Q2');
    const q3 = Object.values(db.teams).find((t) => t.qualifiedSlot === 'Q3');
    const q4 = Object.values(db.teams).find((t) => t.qualifiedSlot === 'Q4');

    const m9 = db.matches.find((m) => m.id === 'M9');
    const m10 = db.matches.find((m) => m.id === 'M10');
    const sf1 = db.matches.find((m) => m.id === 'SF1');
    const sf2 = db.matches.find((m) => m.id === 'SF2');
    const tp = db.matches.find((m) => m.id === 'TP');
    const final = db.matches.find((m) => m.id === 'FINAL');

    // Qualification stage ends when all 4 qualifiers exist (M9 & M10 completed)
    if (q1 && q2 && q3 && q4 && m9 && m9.status === 'COMPLETED' && m10 && m10.status === 'COMPLETED') {
      if (db.metadata.state === 'QUALIFICATION_ACTIVE') {
        db.metadata.state = 'QUALIFICATION_COMPLETED';
        dbService.logAudit(
          'QUALIFICATION_COMPLETED',
          `All 4 qualifiers determined: Q1=${q1.name}, Q2=${q2.name}, Q3=${q3.name}, Q4=${q4.name}. Semifinals ready.`,
          { id: 'system', username: 'System' }
        );
      }
    }

    // Check if semifinals are active
    if (sf1 && sf2) {
      if (sf1.status === 'COMPLETED' && sf2.status === 'COMPLETED') {
        if (final && final.status === 'COMPLETED' && tp && tp.status === 'COMPLETED') {
          db.metadata.state = 'COMPLETED';
          db.metadata.completedAt = new Date().toISOString();
          dbService.logAudit(
            'TOURNAMENT_COMPLETED',
            `Tournament completed! Champion: ${db.teams[db.metadata.championTeamId!]?.name}`,
            { id: 'system', username: 'System' }
          );
        } else if (final && final.status === 'COMPLETED') {
          db.metadata.state = 'THIRD_PLACE';
        } else if (tp && tp.status === 'COMPLETED') {
          db.metadata.state = 'FINAL';
        } else {
          db.metadata.state = 'FINAL';
        }
      } else if (sf1.team1Id && sf1.team2Id && sf2.team1Id && sf2.team2Id) {
        if (db.metadata.state === 'QUALIFICATION_COMPLETED' || db.metadata.state === 'QUALIFICATION_ACTIVE') {
          db.metadata.state = 'SEMIFINALS';
        }
      }
    }
  }

  /**
   * Synchronizes Round 1 fixtures (M1 - M4) based on mystery box claims.
   * If Box N is claimed, its team replaces the default team slot in Round 1:
   *   M1: Box 1 (Default Team A) vs Box 2 (Default Team B)
   *   M2: Box 3 (Default Team C) vs Box 4 (Default Team D)
   *   M3: Box 5 (Default Team E) vs Box 6 (Default Team F)
   *   M4: Box 7 (Default Team G) vs Box 8 (Default Team H)
   */
  public static syncRound1FixturesFromMysteryBoxes(db: DatabaseSchema) {
    const box1 = db.mysteryBoxes.find((b) => b.boxNumber === 1);
    const box2 = db.mysteryBoxes.find((b) => b.boxNumber === 2);
    const box3 = db.mysteryBoxes.find((b) => b.boxNumber === 3);
    const box4 = db.mysteryBoxes.find((b) => b.boxNumber === 4);
    const box5 = db.mysteryBoxes.find((b) => b.boxNumber === 5);
    const box6 = db.mysteryBoxes.find((b) => b.boxNumber === 6);
    const box7 = db.mysteryBoxes.find((b) => b.boxNumber === 7);
    const box8 = db.mysteryBoxes.find((b) => b.boxNumber === 8);

    const updateMatch = (
      matchId: string,
      boxA?: MysteryBox,
      boxB?: MysteryBox,
      defaultTeam1: TeamId = 'A',
      defaultTeam2: TeamId = 'B'
    ) => {
      const match = db.matches.find((m) => m.id === matchId);
      if (!match) return;

      const t1Id = boxA && boxA.isLocked && boxA.claimedByTeamId ? boxA.claimedByTeamId : defaultTeam1;
      const t2Id = boxB && boxB.isLocked && boxB.claimedByTeamId ? boxB.claimedByTeamId : defaultTeam2;

      match.team1Id = t1Id;
      match.team2Id = t2Id;
      match.slot1 = {
        type: 'DIRECT',
        teamId: t1Id,
        label: `${t1Id} — ${db.teams[t1Id]?.name || t1Id}`,
      };
      match.slot2 = {
        type: 'DIRECT',
        teamId: t2Id,
        label: `${t2Id} — ${db.teams[t2Id]?.name || t2Id}`,
      };
    };

    updateMatch('M1', box1, box2, 'A', 'B');
    updateMatch('M2', box3, box4, 'C', 'D');
    updateMatch('M3', box5, box6, 'E', 'F');
    updateMatch('M4', box7, box8, 'G', 'H');
  }

  /**
   * Auto-draw all remaining mystery boxes (Admin capability)
   * Reveals all 8 boxes according to secret mapping and updates M1-M4 fixtures.
   */
  public static async autoDrawAllMysteryBoxes(adminUser: { id: string; username: string }) {
    return dbService.transaction((db) => {
      if (
        db.metadata.state !== 'SETUP' &&
        db.metadata.state !== 'MYSTERY_DRAW_OPEN' &&
        db.metadata.state !== 'MYSTERY_DRAW_LOCKED'
      ) {
        throw new Error('Mystery draw cannot be auto-drawn in current stage.');
      }

      for (let boxNum = 1; boxNum <= 8; boxNum++) {
        const box = db.mysteryBoxes.find((b) => b.boxNumber === boxNum);
        if (!box) continue;

        const assignedTeamId = SECRET_MYSTERY_MAPPING[boxNum];
        if (!assignedTeamId) continue;
        const assignedTeam = db.teams[assignedTeamId];
        if (!assignedTeam) continue;

        box.isLocked = true;
        box.claimedByTeamId = assignedTeamId;
        box.claimedAt = new Date().toISOString();

        assignedTeam.assignedBox = boxNum;
        if (!assignedTeam.claimedByUserId) {
          const userForTeam = db.users.find((u) => u.teamId === assignedTeamId);
          assignedTeam.claimedByUserId = userForTeam ? userForTeam.id : adminUser.id;
        }
      }

      TournamentEngine.syncRound1FixturesFromMysteryBoxes(db);
      db.metadata.state = 'MYSTERY_DRAW_COMPLETED';
      dbService.logAudit(
        'MYSTERY_AUTO_DRAW',
        'Admin triggered auto-draw for all 8 mystery boxes. M1-M4 fixtures updated.',
        adminUser
      );
      return { success: true, state: db.metadata.state };
    });
  }

  /**
   * Reset operations
   */
  public static async resetMysteryDraw(adminUser: { id: string; username: string }) {
    return dbService.transaction((db) => {
      // Reset all boxes and team claims
      db.mysteryBoxes.forEach((b) => {
        b.isLocked = false;
        b.claimedByTeamId = null;
        b.claimedAt = null;
      });
      Object.values(db.teams).forEach((t) => {
        t.assignedBox = null;
        t.claimedByUserId = null;
      });
      // Revert M1-M4 fixtures back to default teams
      TournamentEngine.syncRound1FixturesFromMysteryBoxes(db);
      db.metadata.state = 'MYSTERY_DRAW_LOCKED';
      db.metadata.mysteryDrawOpenedAt = null;
      dbService.logAudit('MYSTERY_DRAW_RESET', 'Admin reset all mystery box assignments and reverted M1-M4 to default teams.', adminUser);
      return { success: true };
    });
  }

  public static async resetMatchResults(adminUser: { id: string; username: string }) {
    return dbService.transaction((db) => {
      // Reset matches
      db.matches.forEach((m) => {
        m.winnerId = null;
        m.loserId = null;
        m.completedAt = null;
        if (m.id === 'M1' || m.id === 'M2' || m.id === 'M3' || m.id === 'M4') {
          m.status = 'READY';
        } else {
          m.status = 'LOCKED';
          if (m.slot1.type !== 'DIRECT') m.team1Id = null;
          if (m.slot2.type !== 'DIRECT') m.team2Id = null;
        }
      });

      // Reset team statistics
      Object.values(db.teams).forEach((t) => {
        t.totalMatches = 0;
        t.wins = 0;
        t.losses = 0;
        t.consecutiveWins = 0;
        t.status = 'ACTIVE';
        t.qualifiedSlot = null;
        t.eliminatedSlot = null;
        t.finalPosition = null;
      });

      db.metadata.state = 'QUALIFICATION_ACTIVE';
      db.metadata.championTeamId = null;
      db.metadata.runnerUpTeamId = null;
      db.metadata.thirdPlaceTeamId = null;
      db.metadata.fourthPlaceTeamId = null;
      db.metadata.completedAt = null;

      dbService.logAudit('MATCHES_RESET', 'Admin reset all match results and scores.', adminUser);
      return { success: true };
    });
  }

  public static async resetEntireTournament(adminUser: { id: string; username: string }) {
    return dbService.transaction((db) => {
      const fresh = dbService.createInitialSchema();
      // Keep admin credentials if modified or retain users
      db.metadata = fresh.metadata;
      db.teams = fresh.teams;
      db.mysteryBoxes = fresh.mysteryBoxes;
      db.matches = fresh.matches;
      dbService.logAudit('FULL_RESET', 'Admin performed full tournament reset.', adminUser);
      return { success: true };
    });
  }
}
