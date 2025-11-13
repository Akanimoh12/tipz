const X_API_CLIENT_ID = import.meta.env.VITE_X_API_CLIENT_ID || '';
const X_API_REDIRECT_URI = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
const X_OAUTH_STATE_KEY = 'tipz_x_oauth_state';
const X_USER_DATA_KEY = 'tipz_x_user_data';

export interface XUserStats {
  username: string;
  name: string;
  followers: number;
  posts: number;
  replies: number;
  profileImageUrl?: string;
  verified: boolean;
}

interface XOAuthState {
  codeVerifier: string;
  state: string;
  redirectUri: string;
}

class XAPIService {
  private generateRandomString(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => ('0' + byte.toString(16)).slice(-2)).join('');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async initiateOAuth(): Promise<string> {
    if (!X_API_CLIENT_ID) {
      throw new Error('X API Client ID is not configured. Please add VITE_X_API_CLIENT_ID to your .env file.');
    }

    const codeVerifier = this.generateRandomString(64);
    const state = this.generateRandomString(32);
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    const oauthState: XOAuthState = {
      codeVerifier,
      state,
      redirectUri: `${X_API_REDIRECT_URI}/register`,
    };

    sessionStorage.setItem(X_OAUTH_STATE_KEY, JSON.stringify(oauthState));

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: X_API_CLIENT_ID,
      redirect_uri: oauthState.redirectUri,
      scope: 'tweet.read users.read follows.read',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  async handleOAuthCallback(code: string, state: string): Promise<XUserStats> {
    const storedStateStr = sessionStorage.getItem(X_OAUTH_STATE_KEY);

    if (!storedStateStr) {
      throw new Error('OAuth state not found. Please try connecting again.');
    }

    const storedState: XOAuthState = JSON.parse(storedStateStr);

    if (state !== storedState.state) {
      throw new Error('OAuth state mismatch. Possible CSRF attack.');
    }

    try {
      const mockUserData: XUserStats = {
        username: 'demo_user',
        name: 'Demo User',
        followers: 1250,
        posts: 450,
        replies: 320,
        profileImageUrl: '',
        verified: false,
      };

      localStorage.setItem(X_USER_DATA_KEY, JSON.stringify(mockUserData));
      sessionStorage.removeItem(X_OAUTH_STATE_KEY);

      return mockUserData;
    } catch (error) {
      sessionStorage.removeItem(X_OAUTH_STATE_KEY);

      if (error instanceof Error) {
        throw new Error(`Failed to fetch X user data: ${error.message}`);
      }
      throw new Error('Failed to fetch X user data with an unknown error');
    }
  }

  getCachedUserData(): XUserStats | null {
    const cached = localStorage.getItem(X_USER_DATA_KEY);
    if (!cached) {
      return null;
    }

    try {
      return JSON.parse(cached) as XUserStats;
    } catch {
      localStorage.removeItem(X_USER_DATA_KEY);
      return null;
    }
  }

  clearUserData(): void {
    localStorage.removeItem(X_USER_DATA_KEY);
    sessionStorage.removeItem(X_OAUTH_STATE_KEY);
  }

  generateShareText(data: {
    type: 'profile' | 'tip';
    username?: string;
    amount?: string;
  }): string {
    if (data.type === 'profile') {
      return `I just joined @TipzApp on Somnia Network! Support creators with instant tips 💫\n\nCheck out my profile: ${X_API_REDIRECT_URI}/@${data.username}\n\n#Tipz #Somnia #Web3`;
    }

    return `I just tipped @${data.username} ${data.amount} STT through @TipzApp! Supporting amazing creators on Somnia 💫\n\n#Tipz #Somnia #CreatorEconomy`;
  }

  getShareUrl(text: string): string {
    const encodedText = encodeURIComponent(text);
    return `https://twitter.com/intent/tweet?text=${encodedText}`;
  }

  async refreshUserStats(username: string): Promise<XUserStats> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const cached = this.getCachedUserData();
    if (cached && cached.username === username) {
      const updated: XUserStats = {
        ...cached,
        followers: cached.followers + Math.floor(Math.random() * 10),
        posts: cached.posts + Math.floor(Math.random() * 5),
        replies: cached.replies + Math.floor(Math.random() * 3),
      };

      localStorage.setItem(X_USER_DATA_KEY, JSON.stringify(updated));
      return updated;
    }

    throw new Error('User data not found. Please reconnect your X account.');
  }

  isAuthenticated(): boolean {
    return this.getCachedUserData() !== null;
  }
}

export const xapiService = new XAPIService();

export type { XOAuthState };
