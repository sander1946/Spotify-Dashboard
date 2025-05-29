import { config } from "./config";

export interface SpotifyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface SpotifyUser {
  display_name?: string;
  id: string;
  email: string;
  country: string;
}

export async function redirectToSpotifyAuthorize(): Promise<void> {
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

export async function getToken(code: string): Promise<SpotifyTokenResponse> {
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

export async function refreshToken(): Promise<SpotifyTokenResponse> {
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

export async function getUserData(): Promise<SpotifyUser> {
  const response = await fetch("https://api.spotify.com/v1/me", {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + config.currentToken.access_token },
  });

  return await response.json();
}