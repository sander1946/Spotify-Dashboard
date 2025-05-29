import { config } from "./config.js";

// TODO: check if this file is still needed, as spotify does not work offline yet
// /**
//  * Register the service worker for the app.
//  * This will allow the app to work offline and cache assets.
//  */
// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", function() {
//     navigator.serviceWorker
//       .register("/public/js/serviceWorker.js")
//       .then(res => console.log("service worker registered"))
//       .catch(err => console.log("service worker not registered", err));
//   });
// }

interface SpotifyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface SpotifyUser {
  display_name?: string;
  id: string;
  email: string;
  country: string;
}

const args = new URLSearchParams(window.location.search);
const code = args.get('code');

// If we find a code, we're in a callback, do a token exchange
if (code) {
  (async () => {
    const token = await getToken(code);
    config.currentToken.save(token);

    // Remove code from URL so we can refresh correctly.
    const url = new URL(window.location.href);
    url.searchParams.delete("code");

    const updatedUrl = url.search ? url.href : url.href.replace('?', '');
    window.history.replaceState({}, document.title, updatedUrl);

    // After token exchange, fetch user data and display
    if (config.currentToken.access_token) {
      const userData = await getUserData();
      displayUserData(userData);
      displayTokenData(config.currentToken);
    }
  })();
} else if (config.currentToken.access_token) {
  (async () => {
    const userData = await getUserData();
    displayUserData(userData);
    displayTokenData(config.currentToken);
  })();
} else {
  displayLogin();
}

async function redirectToSpotifyAuthorize(): Promise<void> {
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

async function getToken(code: string): Promise<SpotifyTokenResponse> {
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

async function refreshToken(): Promise<SpotifyTokenResponse> {
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

async function getUserData(): Promise<SpotifyUser> {
  const response = await fetch("https://api.spotify.com/v1/me", {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + config.currentToken.access_token },
  });

  return await response.json();
}

// Click handlers
async function loginWithSpotifyClick(): Promise<void> {
  await redirectToSpotifyAuthorize();
}

async function logoutClick(): Promise<void> {
  localStorage.clear();
  window.location.href = config.redirectUrl;
}

async function refreshTokenClick(): Promise<void> {
  const token = await refreshToken();
  config.currentToken.save(token);
  displayTokenData(config.currentToken);
}

// --- Static display functions ---

function displayLogin(): void {
  const main = document.getElementById("main") as HTMLElement;
  main.innerHTML = `
    <h2>Login with Spotify</h2>
    <button id="login-btn">Login</button>
  `;
  const loginBtn = document.getElementById("login-btn") as HTMLButtonElement;
  loginBtn.onclick = loginWithSpotifyClick;
  const oauth = document.getElementById("oauth");
  if (oauth) oauth.innerHTML = "";
}

function displayUserData(user: SpotifyUser): void {
  const main = document.getElementById("main") as HTMLElement;
  main.innerHTML = `
    <h2>Logged in as ${user.display_name || user.id}</h2>
    <p>Email: ${user.email}</p>
    <p>Country: ${user.country}</p>
    <button id="logout-btn">Logout</button>
    <button id="refresh-btn">Refresh Token</button>
  `;
  const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement;
  const refreshBtn = document.getElementById("refresh-btn") as HTMLButtonElement;
  logoutBtn.onclick = logoutClick;
  refreshBtn.onclick = refreshTokenClick;
}

function displayTokenData(token: typeof config.currentToken): void {
  const oauth = document.getElementById("oauth");
  if (!oauth) return;
  oauth.innerHTML = `
    <h3>Token Info</h3>
    <p>Access Token: <code>${token.access_token}</code></p>
    <p>Refresh Token: <code>${token.refresh_token}</code></p>
    <p>Expires: ${token.expires}</p>
  `;
}

export {};