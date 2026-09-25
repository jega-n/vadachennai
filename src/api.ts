import {
  AdminTeamItem,
  AuditLog,
  Match,
  PublicTournamentState,
  SecretMappingItem,
  Team,
  User,
} from './types.ts';

const TOKEN_KEY = 'carrom_auth_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        let errorMsg = 'An error occurred. Please try again.';
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errorMsg = errData.error;
          }
        } catch {
          // fallback error text
          errorMsg = `Server error (${res.status})`;
        }
        throw new Error(errorMsg);
      }

      return await res.json();
    } catch (err: any) {
      if (err.message && !err.message.toLowerCase().includes('failed to fetch') && !err.message.includes('fetch')) {
        throw err;
      }
      throw new Error('Connection lost. Please check your internet connection.');
    }
  },

  // Auth
  async login(username: string, password: string): Promise<{ token: string; user: User; team: Team | null }> {
    const data = await this.request<{ token: string; user: User; team: Team | null }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data;
  },

  async getMe(): Promise<{ user: User | null; team: Team | null }> {
    const token = this.getToken();
    if (!token) return { user: null, team: null };
    try {
      return await this.request<{ user: User; team: Team | null }>('/auth/me');
    } catch {
      this.clearToken();
      return { user: null, team: null };
    }
  },

  logout() {
    this.clearToken();
  },

  // Public State
  async getTournamentState(retries = 3): Promise<PublicTournamentState> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await this.request<PublicTournamentState>('/tournament');
      } catch (err) {
        if (attempt === retries - 1) throw err;
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
    return this.request<PublicTournamentState>('/tournament');
  },

  // Team Action: Claim Box
  async claimMysteryBox(boxNumber: number): Promise<{ assignedTeamId: string; assignedTeamName: string }> {
    return this.request<{ assignedTeamId: string; assignedTeamName: string }>('/mystery/select', {
      method: 'POST',
      body: JSON.stringify({ boxNumber }),
    });
  },

  // Team Dashboard
  async getTeamDashboard(): Promise<{ user: User; team: Team; matches: Match[] }> {
    return this.request<{ user: User; team: Team; matches: Match[] }>('/team/dashboard');
  },

  // Admin Actions
  async openMysteryDraw(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/admin/open-mystery-draw', {
      method: 'POST',
    });
  },

  async autoDrawMystery(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/admin/auto-draw-mystery', {
      method: 'POST',
    });
  },

  async startTournament(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/admin/start-tournament', {
      method: 'POST',
    });
  },

  async recordMatchResult(matchId: string, winnerId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/admin/record-result', {
      method: 'POST',
      body: JSON.stringify({ matchId, winnerId }),
    });
  },

  async resetTournament(resetType: 'MYSTERY' | 'MATCHES' | 'FULL'): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/admin/reset', {
      method: 'POST',
      body: JSON.stringify({ resetType }),
    });
  },

  async getAdminSecretMapping(): Promise<{ mapping: SecretMappingItem[] }> {
    return this.request<{ mapping: SecretMappingItem[] }>('/admin/secret-mapping');
  },

  async getAdminTeams(): Promise<{ teams: AdminTeamItem[] }> {
    return this.request<{ teams: AdminTeamItem[] }>('/admin/teams');
  },

  async toggleTeamStatus(teamId: string, isEnabled: boolean): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/admin/teams/toggle-status', {
      method: 'POST',
      body: JSON.stringify({ teamId, isEnabled }),
    });
  },

  async resetTeamPassword(teamId: string, newPassword: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/admin/teams/reset-password', {
      method: 'POST',
      body: JSON.stringify({ teamId, newPassword }),
    });
  },

  async getAuditLogs(): Promise<{ auditLogs: AuditLog[] }> {
    return this.request<{ auditLogs: AuditLog[] }>('/admin/audit-logs');
  },

  // Realtime SSE Subscription
  subscribeToEvents(
    onUpdate: (state: PublicTournamentState) => void,
    onStatusChange?: (connected: boolean) => void
  ): () => void {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;
    let isClosed = false;

    const connect = () => {
      if (isClosed) return;
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          onStatusChange?.(true);
        };

        eventSource.addEventListener('tournament_update', (event) => {
          try {
            const data = JSON.parse(event.data);
            onUpdate(data);
          } catch (err) {
            console.error('Failed to parse SSE payload:', err);
          }
        });

        eventSource.onerror = () => {
          onStatusChange?.(false);
          eventSource?.close();
          eventSource = null;
          if (!isClosed) {
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };
      } catch (err) {
        onStatusChange?.(false);
        if (!isClosed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      isClosed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      onStatusChange?.(false);
    };
  },
};
