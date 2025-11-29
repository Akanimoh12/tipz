const APP_URL = (import.meta.env.VITE_APP_URL || 'http://localhost:5173').replace(/\/$/, '');
const X_API_CLIENT_ID = import.meta.env.VITE_X_API_CLIENT_ID || '';
const X_API_REDIRECT_URI = `${APP_URL}/register`;
const X_OAUTH_STATE_KEY = 'tipz_x_oauth_state';
const X_USER_DATA_KEY = 'tipz_x_user_data';
const X_ACCESS_TOKEN_KEY = 'tipz_x_access_token';

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
    const base64 = btoa(String.fromCodePoint(...new Uint8Array(hash)));
    return base64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
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
      redirectUri: X_API_REDIRECT_URI,
    };

    sessionStorage.setItem(X_OAUTH_STATE_KEY, JSON.stringify(oauthState));

    // Use the correct X OAuth 2.0 authorization endpoint
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: X_API_CLIENT_ID,
      redirect_uri: X_API_REDIRECT_URI,
      scope: 'tweet.read users.read follows.read offline.access',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    // OAuth 2.0 authorization URL (not the old /i/oauth2/authorize)
    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * Note: In production, this should be handled by a backend server due to CORS restrictions.
   * For now, we'll simulate a successful OAuth flow after authorization.
   */
  private async exchangeCodeForToken(_code: string, _codeVerifier: string): Promise<string> {
    if (!X_API_CLIENT_ID) {
      throw new Error('X API Client ID is not configured');
    }

    // Simulate token exchange - in production this would be a backend API call
    // X API doesn't allow direct browser calls due to CORS
    console.log('OAuth authorization successful - using mock data for development');
    
    // Generate a mock token for development
    // In production, your backend would:
    // 1. Receive the code and codeVerifier
    // 2. Call X API's /oauth2/token endpoint
    // 3. Return the access_token to frontend
    const mockToken = `mock_access_token_${Date.now()}`;
    return mockToken;
  }

  /**
   * Fetch user data from X API v2
   * Note: In production, this should be handled by a backend server.
   * For now, we'll return mock data after successful authorization.
   */
  private async fetchUserData(_accessToken: string): Promise<XUserStats> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return mock user data
    // In production, your backend would call X API with the access token
    const mockUserData: XUserStats = {
      username: 'demo_user',
      name: 'Demo X User',
      followers: Math.floor(Math.random() * 10000) + 1000,
      posts: Math.floor(Math.random() * 5000) + 500,
      replies: Math.floor(Math.random() * 2000) + 100,
      profileImageUrl: '',
      verified: Math.random() > 0.5,
    };

    console.log('X authorization successful - Connected as @' + mockUserData.username);
    
    return mockUserData;
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
      // Exchange code for access token
      const accessToken = await this.exchangeCodeForToken(code, storedState.codeVerifier);
      
      // Store access token for future use
      sessionStorage.setItem(X_ACCESS_TOKEN_KEY, accessToken);

      // Fetch user data from X API
      const userData = await this.fetchUserData(accessToken);

      // Cache user data
      localStorage.setItem(X_USER_DATA_KEY, JSON.stringify(userData));
      
      // Clean up OAuth state
      sessionStorage.removeItem(X_OAUTH_STATE_KEY);

      return userData;
    } catch (error) {
      // Clean up on error
      sessionStorage.removeItem(X_OAUTH_STATE_KEY);
      sessionStorage.removeItem(X_ACCESS_TOKEN_KEY);

      if (error instanceof Error) {
        throw new Error(`Failed to complete X authentication: ${error.message}`);
      }
      throw new Error('Failed to complete X authentication with an unknown error');
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
    sessionStorage.removeItem(X_ACCESS_TOKEN_KEY);
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return sessionStorage.getItem(X_ACCESS_TOKEN_KEY);
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

  /**
   * Refresh user stats from X API
   */
  async refreshUserStats(username: string): Promise<XUserStats> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('Not authenticated. Please reconnect your X account.');
    }

    const cached = this.getCachedUserData();
    if (cached?.username !== username) {
      throw new Error('Username mismatch. Please reconnect your X account.');
    }

    try {
      // Fetch fresh data from X API
      const userData = await this.fetchUserData(accessToken);
      
      // Update cache
      localStorage.setItem(X_USER_DATA_KEY, JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      console.error('Error refreshing user stats:', error);
      
      // If API call fails, return cached data
      if (cached) {
        return cached;
      }
      
      throw new Error('Failed to refresh user stats. Please reconnect your X account.');
    }
  }

  isAuthenticated(): boolean {
    return this.getCachedUserData() !== null;
  }

  /**
   * Check if there's an OAuth error in URL params
   */
  checkOAuthError(searchParams: URLSearchParams): string | null {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      const errorMessages: Record<string, string> = {
        'access_denied': 'You denied access to your X account. Please try again and authorize the application.',
        'invalid_request': 'Invalid OAuth request. Please try connecting again.',
        'unauthorized_client': 'This app is not authorized. Please contact support.',
        'unsupported_response_type': 'OAuth configuration error. Please contact support.',
        'invalid_scope': 'Invalid permissions requested. Please contact support.',
        'server_error': 'X server error. Please try again later.',
        'temporarily_unavailable': 'X service is temporarily unavailable. Please try again later.',
      };

      return errorMessages[error] || errorDescription || 'An unknown OAuth error occurred. Please try again.';
    }

    return null;
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; message?: string } {
    if (!X_API_CLIENT_ID) {
      return {
        valid: false,
        message: 'X API is not configured. Please add VITE_X_API_CLIENT_ID to your environment variables.',
      };
    }

    if (!import.meta.env.VITE_APP_URL) {
      return {
        valid: false,
        message: 'VITE_APP_URL is not configured. Set it to your site URL (e.g. https://tipz-rosy.vercel.app).',
      };
    }

    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const isLocalhost = APP_URL.includes('localhost');

    if (currentOrigin && !currentOrigin.startsWith(APP_URL)) {
      return {
        valid: false,
        message: `VITE_APP_URL (${APP_URL}) does not match the current site origin (${currentOrigin}). Update VITE_APP_URL and your X OAuth redirect to ${currentOrigin}/register.`,
      };
    }

    if (!isLocalhost && APP_URL.startsWith('http://')) {
      return {
        valid: false,
        message: 'Production VITE_APP_URL must use HTTPS. Update it in your environment settings.',
      };
    }

    return { valid: true };
  }
}

export const xapiService = new XAPIService();

export type { XOAuthState };
