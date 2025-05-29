import { 
  getToken, getUserData, redirectToSpotifyAuthorize, refreshToken, SpotifyUser,
  getPlaybackState, transferPlayback, getAvailableDevices, getCurrentlyPlayingTrack,
  startResumePlayback, pausePlayback, skipToNext, skipToPrevious, seekToPosition,
  setRepeatMode, setPlaybackVolume, togglePlaybackState, getRecentlyPlayedTracks,
  getUserQueue, addItemToPlaybackQueue
} from "./api.js";
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
  // Hide API test UI
  const apiTestDiv = document.getElementById("api-test");
  if (apiTestDiv) apiTestDiv.style.display = "none";
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
  showApiTestUI();
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

// After displayTokenData, add API test UI
function showApiTestUI() {
  let apiTestDiv = document.getElementById("api-test") as HTMLElement | null;
  if (!apiTestDiv) {
    apiTestDiv = document.createElement("div");
    apiTestDiv.id = "api-test";
    document.body.appendChild(apiTestDiv);
  }
  apiTestDiv.innerHTML = `
    <hr>
    <h3>API Test Panel</h3>
    <button id="btn-get-playback-state">Get Playback State</button>
    <br>
    <button id="btn-get-available-devices">Get Available Devices</button>
    <br>
    <input id="input-device-id" placeholder="Device ID" />
    <button id="btn-transfer-playback">Transfer Playback</button>
    <br>
    <button id="btn-get-currently-playing">Get Currently Playing Track</button>
    <br>
    <input id="input-context-uri" placeholder="Context URI" />
    <input id="input-track-uris" placeholder="Track URIs (comma separated)" />
    <input id="input-offset" placeholder="Offset (number)" type="number" />
    <input id="input-position-ms" placeholder="Position ms" type="number" />
    <button id="btn-start-resume-playback">Start/Resume Playback</button>
    <br>
    <button id="btn-pause-playback">Pause Playback</button>
    <br>
    <button id="btn-skip-next">Skip To Next</button>
    <br>
    <button id="btn-skip-prev">Skip To Previous</button>
    <br>
    <input id="input-seek-ms" placeholder="Seek Position ms" type="number" />
    <button id="btn-seek-to-position">Seek To Position</button>
    <br>
    <input id="input-repeat-mode" placeholder="Repeat Mode (track, context, off)" />
    <button id="btn-set-repeat-mode">Set Repeat Mode</button>
    <br>
    <input id="input-volume" placeholder="Volume %" type="number" min="0" max="100" />
    <button id="btn-set-volume">Set Playback Volume</button>
    <br>
    <input id="input-shuffle-state" placeholder="Shuffle (true/false)" />
    <button id="btn-toggle-shuffle">Toggle Shuffle</button>
    <br>
    <input id="input-recent-limit" placeholder="Recently Played Limit" type="number" />
    <button id="btn-get-recently-played">Get Recently Played Tracks</button>
    <br>
    <button id="btn-get-user-queue">Get User Queue</button>
    <br>
    <input id="input-queue-uri" placeholder="URI to add to queue" />
    <button id="btn-add-to-queue">Add Item To Playback Queue</button>
    <br>
    <pre id="api-output" style="background:var(--content-secondary-color);max-height:300px;overflow:auto;"></pre>
  `;

  // Helper to print output
  function printOutput(data: any) {
    const out = document.getElementById("api-output");
    if (out) out.textContent = JSON.stringify(data, null, 2);
  }

  // Button handlers
  (document.getElementById("btn-get-playback-state") as HTMLButtonElement).onclick = async () => {
    try { printOutput(await getPlaybackState()); } catch (e) { printOutput(e); }
  };
  (document.getElementById("btn-get-available-devices") as HTMLButtonElement).onclick = async () => {
    try { printOutput(await getAvailableDevices()); } catch (e) { printOutput(e); }
  };
  (document.getElementById("btn-transfer-playback") as HTMLButtonElement).onclick = async () => {
    const deviceId = (document.getElementById("input-device-id") as HTMLInputElement).value;
    try { await transferPlayback(deviceId); printOutput("Transferred playback."); } catch (e) { printOutput(e); }
  };
  (document.getElementById("btn-get-currently-playing") as HTMLButtonElement).onclick = async () => {
    try { printOutput(await getCurrentlyPlayingTrack()); } catch (e) { printOutput(e); }
  };
  (document.getElementById("btn-start-resume-playback") as HTMLButtonElement).onclick = async () => {
    const context_uri = (document.getElementById("input-context-uri") as HTMLInputElement).value || undefined;
    const uris = (document.getElementById("input-track-uris") as HTMLInputElement).value.split(",").map(s => s.trim()).filter(Boolean);
    const offsetStr = (document.getElementById("input-offset") as HTMLInputElement).value;
    const offset = offsetStr ? { position: parseInt(offsetStr) } : undefined;
    const position_ms = parseInt((document.getElementById("input-position-ms") as HTMLInputElement).value) || undefined;
    try { 
      await startResumePlayback({ context_uri, uris: uris.length ? uris : undefined, offset, position_ms });
      printOutput("Started/resumed playback.");
    } catch (e) { printOutput(e); }
  };
  (document.getElementById("btn-pause-playback") as HTMLButtonElement).onclick = async () => {
    try { await pausePlayback(); printOutput("Paused playback."); } catch (e) { printOutput(e); }
  };
  (document.getElementById("btn-skip-next") as HTMLButtonElement).onclick = async () => {
    try { await skipToNext(); printOutput("Skipped to next."); } catch (e) { printOutput(e); }
  };
  (document.getElementById("btn-skip-prev") as HTMLButtonElement).onclick = async () => {
    try { await skipToPrevious(); printOutput("Skipped to previous."); } catch (e) { printOutput(e); }
  };
  (document.getElementById("btn-seek-to-position") as HTMLButtonElement).onclick = async () => {
    const ms = parseInt((document.getElementById("input-seek-ms") as HTMLInputElement).value);
    try { await seekToPosition(ms); printOutput("Seeked to position."); } catch (e) { printOutput(e); }
  };
  (document.getElementById("btn-set-repeat-mode") as HTMLButtonElement).onclick = async () => {
    const mode = (document.getElementById("input-repeat-mode") as HTMLInputElement).value;
    try { await setRepeatMode(mode); printOutput("Set repeat mode."); } catch (e) { printOutput(e); }
  };
  (document.getElementById("btn-set-volume") as HTMLButtonElement).onclick = async () => {
    const vol = parseInt((document.getElementById("input-volume") as HTMLInputElement).value);
    try { await setPlaybackVolume(vol); printOutput("Set volume."); } catch (e) { printOutput(e); }
  };
  (document.getElementById("btn-toggle-shuffle") as HTMLButtonElement).onclick = async () => {
    const state = (document.getElementById("input-shuffle-state") as HTMLInputElement).value;
    try { await togglePlaybackState(state); printOutput("Toggled shuffle."); } catch (e) { printOutput(e); }
  };
  (document.getElementById("btn-get-recently-played") as HTMLButtonElement).onclick = async () => {
    const limit = (document.getElementById("input-recent-limit") as HTMLInputElement).value || "50";
    try { printOutput(await getRecentlyPlayedTracks(limit)); } catch (e) { printOutput(e); }
  };
  (document.getElementById("btn-get-user-queue") as HTMLButtonElement).onclick = async () => {
    try { printOutput(await getUserQueue()); } catch (e) { printOutput(e); }
  };
  (document.getElementById("btn-add-to-queue") as HTMLButtonElement).onclick = async () => {
    const uri = (document.getElementById("input-queue-uri") as HTMLInputElement).value;
    try { await addItemToPlaybackQueue(uri); printOutput("Added to queue."); } catch (e) { printOutput(e); }
  };
}

export {};