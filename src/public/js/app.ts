import { getToken, getUserData, redirectToSpotifyAuthorize, refreshToken, SpotifyUser } from "./api.js";
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