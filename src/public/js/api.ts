import { config } from "./config.js";
import { SpotifyAvailableDeviceObject, SpotifyCurrentlyPlayingTrack, SpotifyPlaybackOptions, SpotifyPlaybackState, SpotifyRecentlyPlayedTrack, SpotifyTokenResponse, SpotifyUser, SpotifyUserQueue, SpotifyUserTopItems } from "./interfaces.js";
export class API {
  // All interfaces remain public and outside the class

  // Spotify OAuth2/PKCE flow
  static async redirectToSpotifyAuthorize(): Promise<void> {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomValues = crypto.getRandomValues(new Uint8Array(64));
    const randomString = Array.from(randomValues).reduce((acc, x) => acc + possible[x % possible.length], "");

    const code_verifier = randomString;
    const data = new TextEncoder().encode(code_verifier);
    const hashed = await crypto.subtle.digest('SHA-256', data);

    const code_challenge_base64 = btoa(String.fromCharCode(...new Uint8Array(hashed)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    window.localStorage.setItem('code_verifier', code_verifier);

    const authUrl = new URL(config.authorizationEndpoint);
    const params = {
      response_type: 'code',
      client_id: config.clientId,
      scope: config.scope,
      code_challenge_method: 'S256',
      code_challenge: code_challenge_base64,
      redirect_uri: config.redirectUrl,
    };

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
  }

  static async getToken(code: string): Promise<SpotifyTokenResponse> {
    const code_verifier = localStorage.getItem('code_verifier') || '';

    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.redirectUrl,
        code_verifier: code_verifier,
      }),
    });

    return await response.json();
  }

  static async refreshToken(): Promise<SpotifyTokenResponse> {
    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        grant_type: 'refresh_token',
        refresh_token: config.currentToken.refresh_token || ''
      }),
    });

    return await response.json();
  }

  static async getUserData(): Promise<SpotifyUser | null> {
    const response = await fetch("https://api.spotify.com/v1/me", {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + config.currentToken.access_token },
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          // Token might be expired, handle re-authentication
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          // Retry the request with the new token
          return API.getUserData();
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  static async getPlaybackState(): Promise<SpotifyPlaybackState | null> {
    const URLParams = new URLSearchParams({
      market: 'NL',
      additional_types: 'track,episode',
    });

    const url = `https://api.spotify.com/v1/me/player?${URLParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + config.currentToken.access_token },
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.getPlaybackState();
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  static async transferPlayback(deviceId: string): Promise<void> {
    const body = JSON.stringify({
      device_ids: [deviceId],
      play: true
    });

    const response = await fetch("https://api.spotify.com/v1/me/player", {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + config.currentToken.access_token,
        'Content-Type': 'application/json'
      },
      body: body
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.transferPlayback(deviceId);
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
  }

  static async getAvailableDevices(): Promise<SpotifyAvailableDeviceObject | null> {
    const response = await fetch("https://api.spotify.com/v1/me/player/devices", {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + config.currentToken.access_token },
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.getAvailableDevices();
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  static async getCurrentlyPlayingTrack(): Promise<SpotifyCurrentlyPlayingTrack | null> {
    const URLParams = new URLSearchParams({
      market: 'NL',
      additional_types: 'track,episode',
    });

    const url = `https://api.spotify.com/v1/me/player?${URLParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + config.currentToken.access_token },
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.getCurrentlyPlayingTrack();
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  static async startResumePlayback(options: SpotifyPlaybackOptions): Promise<void> {
    const body = JSON.stringify({
      context_uri: options.context_uri,
      uris: options.uris,
      offset: options.offset,
      position_ms: options.position_ms,
    });

    let url = "https://api.spotify.com/v1/me/player/play";
    const URLParams = new URLSearchParams({});

    if (options.device_id) {
      URLParams.append('device_id', options.device_id);
      url += `?${URLParams.toString()}`;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + config.currentToken.access_token,
        'Content-Type': 'application/json'
      },
      body: body
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.startResumePlayback(options);
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
  }

  static async pausePlayback(device_id: string | null = null): Promise<void> {
    let url = "https://api.spotify.com/v1/me/player/pause";
    const URLParams = new URLSearchParams({});

    if (device_id) {
      URLParams.append('device_id', device_id);
      url += `?${URLParams.toString()}`;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + config.currentToken.access_token,
      },
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.pausePlayback(device_id);
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
  }

  static async skipToNext(device_id: string | null = null): Promise<void> {
    let url = "https://api.spotify.com/v1/me/player/next";
    const URLParams = new URLSearchParams({});

    if (device_id) {
      URLParams.append('device_id', device_id);
      url += `?${URLParams.toString()}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + config.currentToken.access_token,
      },
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.skipToNext(device_id);
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
  }

  static async skipToPrevious(device_id: string | null = null): Promise<void> {
    let url = "https://api.spotify.com/v1/me/player/previous";
    const URLParams = new URLSearchParams({});

    if (device_id) {
      URLParams.append('device_id', device_id);
      url += `?${URLParams.toString()}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + config.currentToken.access_token,
      },
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.skipToPrevious(device_id);
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
  }

  static async seekToPosition(position_ms: number, device_id: string | null = null): Promise<void> {
    let url = "https://api.spotify.com/v1/me/player/seek";
    const URLParams = new URLSearchParams({});
    if (position_ms < 0) {
      throw new Error("Position in milliseconds must be a non-negative integer.");
    }
    URLParams.append('position_ms', position_ms.toString());

    if (device_id) {
      URLParams.append('device_id', device_id);
    }

    url += `?${URLParams.toString()}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + config.currentToken.access_token,
      },
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.seekToPosition(position_ms, device_id);
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
  }

  static async setRepeatMode(state: string, device_id: string | null = null): Promise<void> {
    let url = "https://api.spotify.com/v1/me/player/repeat";
    const URLParams = new URLSearchParams({});
    URLParams.append('state', state);

    if (device_id) {
      URLParams.append('device_id', device_id);
    }

    url += `?${URLParams.toString()}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + config.currentToken.access_token,
      },
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.setRepeatMode(state, device_id);
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
  }

  static async setPlaybackVolume(volume_percent: number, device_id: string | null = null): Promise<void> {
    let url = "https://api.spotify.com/v1/me/player/volume";
    const URLParams = new URLSearchParams({});
    URLParams.append('volume_percent', volume_percent.toString());

    if (device_id) {
      URLParams.append('device_id', device_id);
    }

    url += `?${URLParams.toString()}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + config.currentToken.access_token,
      },
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.setPlaybackVolume(volume_percent, device_id);
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
  }

  static async setShuffle(state: boolean, device_id: string | null = null): Promise<void> {
    let url = "https://api.spotify.com/v1/me/player/shuffle";
    const URLParams = new URLSearchParams({});
    URLParams.append('state', state.toString());

    if (device_id) {
      URLParams.append('device_id', device_id);
    }

    url += `?${URLParams.toString()}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + config.currentToken.access_token,
      },
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.setShuffle(state, device_id);
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
  }

  static async getRecentlyPlayedTracks(limit: string = "50"): Promise<SpotifyRecentlyPlayedTrack | null> {
    let url = "https://api.spotify.com/v1/me/player/recently-played";
    const URLParams = new URLSearchParams({
      limit: limit,
    });

    url += `?${URLParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + config.currentToken.access_token },
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.getRecentlyPlayedTracks();
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  static async getUserQueue(): Promise<SpotifyUserQueue | null> {
    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + config.currentToken.access_token },
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.getUserQueue();
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  static async addItemToPlaybackQueue(uri: string, device_id: string | null = null): Promise<void> {
    let url = "https://api.spotify.com/v1/me/player/queue";
    const URLParams = new URLSearchParams({});
    URLParams.append('uri', uri);

    if (device_id) {
      URLParams.append('device_id', device_id);
    }

    url += `?${URLParams.toString()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + config.currentToken.access_token,
      },
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.addItemToPlaybackQueue(uri, device_id);
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
  }

  static async getUsersTopItems(type: string, timeRange: string, limit: number, offset: number): Promise<SpotifyUserTopItems | null> {
    let url = "https://api.spotify.com/v1/me/top/" + type;
    if (!['artists', 'tracks'].includes(type)) {
      throw new Error("Invalid type specified. Must be 'artists' or 'tracks'.");
    }

    const URLParams = new URLSearchParams({});
    if (timeRange) {
      URLParams.append('timeRange', timeRange);
    }

    if (limit) {
      URLParams.append('limit', limit.toString());
    }

    if (offset) {
      URLParams.append('offset', offset.toString());
    }

    url += `?${URLParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + config.currentToken.access_token,
      },
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error("Bad request: The request was invalid or cannot be otherwise served.");
        case 401:
          const newToken = await API.refreshToken();
          if (!newToken.access_token) {
            throw new Error("Failed to refresh token");
          }
          config.currentToken.save(newToken);
          return API.getUsersTopItems(type, timeRange, limit, offset);
        case 403:
          throw new Error("Bad request: Bad OAuth request, re-authenticateing won't help.");
        case 404:
          throw new Error("Not found: The requested resource could not be found.");
        case 429:
          throw new Error("Rate limit exceeded: Too many requests made to the API.");
        case 500:
          throw new Error("Internal server error: An error occurred on the server.");
        default:
          throw new Error(`Unexpected error: ${response.statusText}`);
      }
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }
}