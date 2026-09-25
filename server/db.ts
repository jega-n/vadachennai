import fs from 'fs';
import path from 'path';
import {
  AuditLog,
  Match,
  MysteryBox,
  Team,
  TeamId,
  TournamentMetadata,
  User,
} from './types.ts';
import {
  INITIAL_MATCH_DEFINITIONS,
  INITIAL_TEAMS,
  SECRET_MYSTERY_MAPPING,
} from './constants.ts';
import { hashPassword } from './crypto.ts';

export interface DatabaseSchema {
  metadata: TournamentMetadata;
  users: User[];
  teams: Record<TeamId, Team>;
  mysteryBoxes: MysteryBox[];
  matches: Match[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'tournament_db.json');

class DatabaseService {
  private db: DatabaseSchema | null = null;
  private lockPromise: Promise<void> = Promise.resolve();

  constructor() {
    this.init();
  }

  // Mutex to guarantee serial execution of transactional mutations
  public async transaction<T>(action: (db: DatabaseSchema) => T | Promise<T>): Promise<T> {
    let release: () => void = () => {};
    const waitPromise = new Promise<void>((resolve) => {
      release = resolve;
    });

    const previousLock = this.lockPromise;
    this.lockPromise = (async () => {
      await previousLock;
      await waitPromise;
    })();

    await previousLock;
    try {
      const result = await action(this.db!);
      this.persist();
      return result;
    } finally {
      release();
    }
  }

  public getRawData(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.db));
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.db = JSON.parse(raw);
        return;
      } catch (err) {
        console.error('Failed reading database file, recreating initial state:', err);
      }
    }

    this.db = this.createInitialSchema();
    this.persist();
  }

  public persist() {
    if (!this.db) return;
    const tempFile = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;
    fs.writeFileSync(tempFile, JSON.stringify(this.db, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public createInitialSchema(): DatabaseSchema {
    const adminPasswordHash = hashPassword('admin@carrom2026');

    const users: User[] = [
      {
        id: 'user_admin',
        username: 'admin',
        passwordHash: adminPasswordHash,
        role: 'admin',
        teamId: null,
        teamName: null,
        isEnabled: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const teamIds: TeamId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const teams: Record<TeamId, Team> = {} as Record<TeamId, Team>;

    teamIds.forEach((tId) => {
      const initialInfo = INITIAL_TEAMS[tId];
      teams[tId] = {
        id: tId,
        name: initialInfo.name,
        assignedBox: null,
        claimedByUserId: null,
        totalMatches: 0,
        wins: 0,
        losses: 0,
        consecutiveWins: 0,
        status: 'ACTIVE',
        qualifiedSlot: null,
        eliminatedSlot: null,
        finalPosition: null,
      };

      // Create pre-seeded credentials for all 8 teams
      const lower = tId.toLowerCase();
      users.push({
        id: `user_team_${lower}`,
        username: `team_${lower}`,
        passwordHash: hashPassword(`carrom@${lower}`),
        role: 'team',
        teamId: tId,
        teamName: initialInfo.name,
        isEnabled: true,
        createdAt: new Date().toISOString(),
      });
    });

    const mysteryBoxes: MysteryBox[] = [];
    for (let i = 1; i <= 8; i++) {
      mysteryBoxes.push({
        boxNumber: i,
        isLocked: false,
        claimedByTeamId: null,
        claimedAt: null,
      });
    }

    const matches: Match[] = INITIAL_MATCH_DEFINITIONS.map((def) => {
      let team1Id: TeamId | null = null;
      let team2Id: TeamId | null = null;

      if (def.slot1.type === 'DIRECT' && def.slot1.teamId) {
        team1Id = def.slot1.teamId;
      }
      if (def.slot2.type === 'DIRECT' && def.slot2.teamId) {
        team2Id = def.slot2.teamId;
      }

      return {
        ...def,
        team1Id,
        team2Id,
        winnerId: null,
        loserId: null,
        status: 'LOCKED',
        completedAt: null,
      };
    });

    const metadata: TournamentMetadata = {
      id: 'carrom-tournament-2026',
      name: 'CARROM TOURNAMENT',
      subtitle: '2 CONSECUTIVE WINS TO QUALIFY',
      state: 'SETUP',
      championTeamId: null,
      runnerUpTeamId: null,
      thirdPlaceTeamId: null,
      fourthPlaceTeamId: null,
      mysteryDrawOpenedAt: null,
      startedAt: null,
      completedAt: null,
    };

    const auditLogs: AuditLog[] = [
      {
        id: 'log_init',
        eventType: 'SYSTEM_INITIALIZED',
        description: 'Tournament system initialized with 8 teams and fixtures.',
        userId: 'system',
        username: 'System',
        timestamp: new Date().toISOString(),
      },
    ];

    return {
      metadata,
      users,
      teams,
      mysteryBoxes,
      matches,
      auditLogs,
    };
  }

  public logAudit(eventType: string, description: string, user: { id: string; username: string }) {
    if (!this.db) return;
    this.db.auditLogs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventType,
      description,
      userId: user.id,
      username: user.username,
      timestamp: new Date().toISOString(),
    });
    // Limit audit logs size
    if (this.db.auditLogs.length > 200) {
      this.db.auditLogs.length = 200;
    }
  }

  public getSecretMappingForBox(boxNumber: number): TeamId | null {
    return SECRET_MYSTERY_MAPPING[boxNumber] || null;
  }
}

export const dbService = new DatabaseService();
