import { SpotifyPlayer } from "./elements/spotify-player";

// config
export const config = {
  clientId: "1bc7010945b249b29d1f15137b05cff8",
  redirectUrl: 'https://dash.sander1946.com/',
  scope: 'ugc-image-upload user-read-playback-state user-modify-playback-state user-read-currently-playing streaming playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-follow-modify user-follow-read user-read-playback-position user-top-read user-read-recently-played user-library-modify user-library-read user-read-email user-read-private',
  defaultAlbumImage: 'https://dash.sander1946.com/img/defaultAlbumImage.png',

  // spotify API endpoints
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
  apiEndpoint: "https://api.spotify.com/v1",

  currentToken: {
    get access_token() { return localStorage.getItem('access_token') || null; },
    get refresh_token() { return localStorage.getItem('refresh_token') || null; },
    get expires_in() { return localStorage.getItem('refresh_in') || null },
    get expires() { return localStorage.getItem('expires') || null },

    save: function (response: { access_token: any; refresh_token: any; expires_in: any; }) {
      const { access_token, refresh_token, expires_in } = response;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('expires_in', expires_in);

      const now = new Date();
      const expiry = new Date(now.getTime() + (expires_in * 1000));
      localStorage.setItem('expires', expiry.getTime().toString());
    }
  }
};