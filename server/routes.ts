import { Router, Request, Response, NextFunction } from 'express';
import { dbService } from './db.ts';
import { TournamentEngine } from './tournamentEngine.ts';
import { verifyPassword, hashPassword, generateToken, verifyToken } from './crypto.ts';
import { SECRET_MYSTERY_MAPPING } from './constants.ts';
import { TeamId } from './types.ts';

// SSE Clients Registry
const sseClients: Set<Response> = new Set();

export function broadcastTournamentUpdate() {
  const publicState = TournamentEngine.getPublicState();
  const data = JSON.stringify(publicState);
  for (const client of sseClients) {
    try {
      client.write(`event: tournament_update\ndata: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Keep-alive ping for SSE
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 25000);

export const apiRouter = Router();

// Authentication Middleware
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'admin' | 'team';
    teamId: TeamId | null;
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }

  const raw = dbService.getRawData();
  const dbUser = raw.users.find((u) => u.id === payload.userId);
  if (!dbUser || !dbUser.isEnabled) {
    return res.status(401).json({ error: 'User account disabled or not found' });
  }

  req.user = {
    id: dbUser.id,
    username: dbUser.username,
    role: dbUser.role,
    teamId: dbUser.teamId,
  };
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin authorization required' });
  }
  next();
}

export function requireTeam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'team' || !req.user.teamId) {
    return res.status(403).json({ error: 'Team authorization required' });
  }
  next();
}

// ----------------------------------------------------
// Public Endpoints
// ----------------------------------------------------

// SSE Stream
apiRouter.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send initial state immediately upon connection
  const publicState = TournamentEngine.getPublicState();
  res.write(`event: tournament_update\ndata: ${JSON.stringify(publicState)}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Public tournament state
apiRouter.get('/tournament', (req: Request, res: Response) => {
  res.json(TournamentEngine.getPublicState());
});

// Login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const raw = dbService.getRawData();
  const user = raw.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  if (!user.isEnabled) {
    return res.status(403).json({ error: 'This account has been disabled by the administrator' });
  }

  const valid = verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
    teamId: user.teamId,
  });

  const team = user.teamId ? raw.teams[user.teamId] : null;

  dbService.logAudit('USER_LOGIN', `User ${user.username} logged in successfully.`, {
    id: user.id,
    username: user.username,
  });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      teamId: user.teamId,
      teamName: user.teamName,
    },
    team,
  });
});

// Current User Profile
apiRouter.get('/auth/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const raw = dbService.getRawData();
  const team = req.user?.teamId ? raw.teams[req.user.teamId] : null;
  res.json({
    user: req.user,
    team,
  });
});

// ----------------------------------------------------
// Team Protected Endpoints
// ----------------------------------------------------

// Team selects mystery box
apiRouter.post('/mystery/select', authenticate, requireTeam, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { boxNumber } = req.body;
    if (typeof boxNumber !== 'number' || boxNumber < 1 || boxNumber > 8) {
      return res.status(400).json({ error: 'Invalid box number. Must be between 1 and 8.' });
    }

    const result = await TournamentEngine.claimMysteryBox(boxNumber, {
      id: req.user!.id,
      username: req.user!.username,
      teamId: req.user!.teamId!,
    });

    broadcastTournamentUpdate();
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to claim mystery box' });
  }
});

// Team Dashboard
apiRouter.get('/team/dashboard', authenticate, requireTeam, (req: AuthenticatedRequest, res: Response) => {
  const raw = dbService.getRawData();
  const team = raw.teams[req.user!.teamId!];
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  // Filter matches involving this team
  const myMatches = raw.matches.filter(
    (m) => m.team1Id === team.id || m.team2Id === team.id
  );

  res.json({
    user: req.user,
    team,
    matches: myMatches,
  });
});

// ----------------------------------------------------
// Admin Protected Endpoints
// ----------------------------------------------------

// Open Mystery Draw
apiRouter.post('/admin/open-mystery-draw', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await TournamentEngine.openMysterySelection({
      id: req.user!.id,
      username: req.user!.username,
    });
    broadcastTournamentUpdate();
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Auto-Draw All Mystery Boxes by Admin
apiRouter.post('/admin/auto-draw-mystery', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await TournamentEngine.autoDrawAllMysteryBoxes({
      id: req.user!.id,
      username: req.user!.username,
    });
    broadcastTournamentUpdate();
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Start Tournament
apiRouter.post('/admin/start-tournament', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await TournamentEngine.startTournament({
      id: req.user!.id,
      username: req.user!.username,
    });
    broadcastTournamentUpdate();
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Record Match Result
apiRouter.post('/admin/record-result', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { matchId, winnerId } = req.body;
    if (!matchId || !winnerId) {
      return res.status(400).json({ error: 'matchId and winnerId are required' });
    }

    const result = await TournamentEngine.recordMatchResult(matchId, winnerId, {
      id: req.user!.id,
      username: req.user!.username,
    });

    broadcastTournamentUpdate();
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Reset Operations
apiRouter.post('/admin/reset', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resetType } = req.body;
    const adminUser = { id: req.user!.id, username: req.user!.username };

    if (resetType === 'MYSTERY') {
      await TournamentEngine.resetMysteryDraw(adminUser);
    } else if (resetType === 'MATCHES') {
      await TournamentEngine.resetMatchResults(adminUser);
    } else if (resetType === 'FULL') {
      await TournamentEngine.resetEntireTournament(adminUser);
    } else {
      return res.status(400).json({ error: 'Invalid resetType' });
    }

    broadcastTournamentUpdate();
    res.json({ success: true, resetType });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Admin-only Secret Mystery Mapping view
apiRouter.get('/admin/secret-mapping', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const raw = dbService.getRawData();
  const mapping = Object.entries(SECRET_MYSTERY_MAPPING).map(([boxStr, teamId]) => {
    const boxNum = Number(boxStr);
    const box = raw.mysteryBoxes.find((b) => b.boxNumber === boxNum);
    return {
      boxNumber: boxNum,
      teamId,
      teamName: raw.teams[teamId]?.name || '',
      claimed: !!box?.claimedByTeamId,
      claimedByTeamId: box?.claimedByTeamId || null,
      claimedAt: box?.claimedAt || null,
    };
  });
  res.json({ mapping });
});

// Admin Team Management List
apiRouter.get('/admin/teams', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const raw = dbService.getRawData();
  const teamsData = Object.values(raw.teams).map((team) => {
    const user = raw.users.find((u) => u.teamId === team.id);
    return {
      ...team,
      username: user ? user.username : null,
      isEnabled: user ? user.isEnabled : false,
      userId: user ? user.id : null,
    };
  });
  res.json({ teams: teamsData });
});

// Admin Toggle Team Enabled/Disabled
apiRouter.post('/admin/teams/toggle-status', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamId, isEnabled } = req.body;
    await dbService.transaction((db) => {
      const user = db.users.find((u) => u.teamId === teamId);
      if (!user) throw new Error('User for team not found');
      user.isEnabled = !!isEnabled;
      dbService.logAudit(
        'TEAM_STATUS_CHANGED',
        `Admin ${isEnabled ? 'enabled' : 'disabled'} team ${teamId}.`,
        req.user!
      );
    });
    res.json({ success: true, teamId, isEnabled });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Admin Reset Team Password
apiRouter.post('/admin/teams/reset-password', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamId, newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      throw new Error('Password must be at least 4 characters');
    }
    await dbService.transaction((db) => {
      const user = db.users.find((u) => u.teamId === teamId);
      if (!user) throw new Error('User for team not found');
      user.passwordHash = hashPassword(newPassword);
      dbService.logAudit(
        'TEAM_PASSWORD_RESET',
        `Admin reset password for team ${teamId} (${user.username}).`,
        req.user!
      );
    });
    res.json({ success: true, teamId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Audit Logs
apiRouter.get('/admin/audit-logs', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const raw = dbService.getRawData();
  res.json({ auditLogs: raw.auditLogs });
});

// CSV Exports
apiRouter.get('/admin/export/teams-csv', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const raw = dbService.getRawData();
  const headers = ['Team ID', 'Team Name', 'Mystery Box', 'Matches Played', 'Wins', 'Losses', 'Consecutive Wins', 'Status', 'Qualification', 'Final Position'];
  const rows = Object.values(raw.teams).map((t) => [
    t.id,
    `"${t.name.replace(/"/g, '""')}"`,
    t.assignedBox || 'Unassigned',
    t.totalMatches,
    t.wins,
    t.losses,
    t.consecutiveWins,
    t.status,
    t.qualifiedSlot || t.eliminatedSlot || 'In Progress',
    t.finalPosition ? `${t.finalPosition} Place` : 'N/A',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="carrom_tournament_teams.csv"');
  res.send(csv);
});

apiRouter.get('/admin/export/matches-csv', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const raw = dbService.getRawData();
  const headers = ['Match Code', 'Match Name', 'Stage', 'Team 1', 'Team 2', 'Winner', 'Loser', 'Status', 'Completed At'];
  const rows = raw.matches.map((m) => {
    const t1 = m.team1Id ? `${m.team1Id} (${raw.teams[m.team1Id]?.name})` : m.slot1.label;
    const t2 = m.team2Id ? `${m.team2Id} (${raw.teams[m.team2Id]?.name})` : m.slot2.label;
    const win = m.winnerId ? `${m.winnerId} (${raw.teams[m.winnerId]?.name})` : '-';
    const lose = m.loserId ? `${m.loserId} (${raw.teams[m.loserId]?.name})` : '-';
    return [
      m.id,
      `"${m.name.replace(/"/g, '""')}"`,
      m.stageLabel,
      `"${t1.replace(/"/g, '""')}"`,
      `"${t2.replace(/"/g, '""')}"`,
      `"${win.replace(/"/g, '""')}"`,
      `"${lose.replace(/"/g, '""')}"`,
      m.status,
      m.completedAt || '-',
    ];
  });

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="carrom_tournament_matches.csv"');
  res.send(csv);
});

apiRouter.get('/admin/export/secret-mapping-csv', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const raw = dbService.getRawData();
  const headers = ['Mystery Box', 'Assigned Team ID', 'Team Name', 'Claim Status', 'Claimed At'];
  const rows = Object.entries(SECRET_MYSTERY_MAPPING).map(([boxStr, teamId]) => {
    const boxNum = Number(boxStr);
    const box = raw.mysteryBoxes.find((b) => b.boxNumber === boxNum);
    return [
      `Box ${boxNum}`,
      teamId,
      `"${raw.teams[teamId]?.name.replace(/"/g, '""')}"`,
      box?.claimedByTeamId ? 'Claimed' : 'Unclaimed',
      box?.claimedAt || '-',
    ];
  });

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="carrom_secret_mystery_mapping.csv"');
  res.send(csv);
});

apiRouter.get('/admin/export/tournament-json', authenticate, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const raw = dbService.getRawData();
  // Safe export omitting password hashes
  const safeData = {
    ...raw,
    users: raw.users.map(({ passwordHash, ...u }) => u),
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="carrom_tournament_complete.json"');
  res.send(JSON.stringify(safeData, null, 2));
});
