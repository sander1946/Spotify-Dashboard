import { config } from "./config.js";
import { SpotifyAvailableDeviceObject, SpotifyCurrentlyPlayingTrack, SpotifyPlaybackOptions, SpotifyPlaybackState, SpotifyPlaylistObject, SpotifyPlaylistTrackItem, SpotifyRecentlyPlayedTrack, SpotifyTokenResponse, SpotifyUser, SpotifyUserPlaylists, SpotifyUserQueue, SpotifyUserTopItems } from "./interfaces.js";
export class API {
  // All interfaces remain public and outside the class

  // Spotify OAuth2/PKCE flow
  public static async redirectToSpotifyAuthorize(): Promise<void> {
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

  public static async getToken(code: string): Promise<SpotifyTokenResponse> {
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

  public static async refreshToken(): Promise<SpotifyTokenResponse> {
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

  private static async handleResponseError(response: Response, callback: CallableFunction): Promise<void> {
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
          return callback();
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

  public static async getUserData(): Promise<SpotifyUser | null> {
    const response = await fetch("https://api.spotify.com/v1/me", {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + config.currentToken.access_token },
    });

    if (!response.ok) {
      await this.handleResponseError(response, API.getUserData.bind(API));
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  public static async getPlaybackState(): Promise<SpotifyPlaybackState | null> {
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
      await this.handleResponseError(response, API.getPlaybackState.bind(API));
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  public static async transferPlayback(deviceId: string): Promise<void> {
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
      await this.handleResponseError(response, API.transferPlayback.bind(API, deviceId));
    }
  }

  public static async getAvailableDevices(): Promise<SpotifyAvailableDeviceObject | null> {
    const response = await fetch("https://api.spotify.com/v1/me/player/devices", {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + config.currentToken.access_token },
    });

    if (!response.ok) {
      await this.handleResponseError(response, API.getAvailableDevices.bind(API));
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  public static async getCurrentlyPlayingTrack(): Promise<SpotifyCurrentlyPlayingTrack | null> {
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
      await this.handleResponseError(response, API.getCurrentlyPlayingTrack.bind(API));
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  public static async startResumePlayback(options: SpotifyPlaybackOptions): Promise<void> {
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
      await this.handleResponseError(response, API.startResumePlayback.bind(API, options));
    }
  }

  public static async pausePlayback(device_id: string | null = null): Promise<void> {
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
      await this.handleResponseError(response, API.pausePlayback.bind(API, device_id));
    }
  }

  public static async skipToNext(device_id: string | null = null): Promise<void> {
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
      await this.handleResponseError(response, API.skipToNext.bind(API, device_id));
    }
  }

  public static async skipToPrevious(device_id: string | null = null): Promise<void> {
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
      await this.handleResponseError(response, API.skipToPrevious.bind(API, device_id));
    }
  }

  public static async seekToPosition(position_ms: number, device_id: string | null = null): Promise<void> {
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
      await this.handleResponseError(response, API.seekToPosition.bind(API, position_ms, device_id));
    }
  }

  public static async setRepeatMode(state: string, device_id: string | null = null): Promise<void> {
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
      await this.handleResponseError(response, API.setRepeatMode.bind(API, state, device_id));
    }
  }

  public static async setPlaybackVolume(volume_percent: number, device_id: string | null = null): Promise<void> {
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
      await this.handleResponseError(response, API.setPlaybackVolume.bind(API, volume_percent, device_id));
    }
  }

  public static async setShuffle(state: boolean, device_id: string | null = null): Promise<void> {
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
      await this.handleResponseError(response, API.setShuffle.bind(API, state, device_id));
    }
  }

  public static async getRecentlyPlayedTracks(limit: string = "50"): Promise<SpotifyRecentlyPlayedTrack | null> {
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
      await this.handleResponseError(response, API.getRecentlyPlayedTracks.bind(API, limit));
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  public static async getUserQueue(): Promise<SpotifyUserQueue | null> {
    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + config.currentToken.access_token },
    });

    if (!response.ok) {
      await this.handleResponseError(response, API.getUserQueue.bind(API));
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  public static async addItemToPlaybackQueue(uri: string, device_id: string | null = null): Promise<void> {
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
      await this.handleResponseError(response, API.addItemToPlaybackQueue.bind(API, uri, device_id));
    }
  }

  public static async getUsersTopItems(type: string, timeRange: string, limit: number, offset: number): Promise<SpotifyUserTopItems | null> {
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
      await this.handleResponseError(response, API.getUsersTopItems.bind(null, type, timeRange, limit, offset));
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  public static async getUsersPlaylist(user_id: string, limit: number, offset: number): Promise<SpotifyUserPlaylists | null> {
    let url = "https://api.spotify.com/v1/users/" + user_id + "/playlists";

    const URLParams = new URLSearchParams({});
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
      await this.handleResponseError(response, API.getUsersPlaylist.bind(null, user_id, limit, offset));
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  public static async getCurrentUsersPlaylist(limit: number, offset: number): Promise<SpotifyUserPlaylists | null> {
    let url = "https://api.spotify.com/v1/me/playlists";

    const URLParams = new URLSearchParams({});
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
      await this.handleResponseError(response, API.getCurrentUsersPlaylist.bind(null, limit, offset));
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  public static async getPlaylist(playlist_id: string, market: string, fields: string, additional_types: string): Promise<SpotifyPlaylistObject | null> {
    let url = "https://api.spotify.com/v1/playlists/" + playlist_id;

    const URLParams = new URLSearchParams({});
    if (market) {
      URLParams.append('market', market);
    }

    if (fields) {
      URLParams.append('fields', fields);
    }

    if (additional_types) {
      URLParams.append('additional_types', additional_types);
    }


    url += `?${URLParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + config.currentToken.access_token,
      },
    });

    if (!response.ok) {
      await this.handleResponseError(response, API.getPlaylist.bind(null, playlist_id, market, fields, additional_types));
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  public static async changePlaylistDetails(playlist_id: string, name: string, is_public: boolean, collaborative: boolean, description: string): Promise<void> {
    let url = "https://api.spotify.com/v1/playlists/" + playlist_id;

    const body = JSON.stringify({
      name: name,
      public: is_public,
      collaborative: collaborative, // !! Works only on a non-public playlist
      description: description
    });

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + config.currentToken.access_token,
      },
      body: body
    });

    if (!response.ok) {
      await this.handleResponseError(response, API.changePlaylistDetails.bind(null, playlist_id, name, is_public, collaborative, description));
    }
    return;
  }

  public static async getPlaylistItems(playlist_id: string, market: string, fields: string, limit: number, offset: number, additional_types: string): Promise<SpotifyPlaylistTrackItem | null> {
    let url = "https://api.spotify.com/v1/playlists/" + playlist_id + "/tracks";

    const URLParams = new URLSearchParams({});
    if (market) {
      URLParams.append('market', market);
    }

    if (limit) {
      URLParams.append('limit', limit.toString());
    }

    if (offset) {
      URLParams.append('offset', offset.toString());
    }

    if (fields) {
      URLParams.append('fields', fields);
    }

    if (additional_types) {
      URLParams.append('additional_types', additional_types);
    }


    url += `?${URLParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + config.currentToken.access_token,
      },
    });

    if (!response.ok) {
      await this.handleResponseError(response, API.getPlaylistItems.bind(null, playlist_id, market, fields, limit, offset, additional_types));
    }
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  }

  public static async changePlaylistItems(playlist_id: string, uris: string, range_start: number, insert_before: number, range_length: number, snapshot_id: string): Promise<void> {
    let url = "https://api.spotify.com/v1/playlists/" + playlist_id;

    const body = JSON.stringify({
      uris: uris.split(','),
      range_start: range_start,
      insert_before: insert_before,
      range_length: range_length,
      snapshot_id: snapshot_id
    });

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + config.currentToken.access_token,
      },
      body: body
    });

    if (!response.ok) {
      await this.handleResponseError(response, API.changePlaylistItems.bind(null, playlist_id, uris, range_start, insert_before, range_length, snapshot_id));
    }
    return;
  }
}