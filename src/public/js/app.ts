import { 
  getToken, getUserData, redirectToSpotifyAuthorize, refreshToken, SpotifyUser,
  getPlaybackState, transferPlayback, getAvailableDevices, getCurrentlyPlayingTrack,
  startResumePlayback, pausePlayback, skipToNext, skipToPrevious, seekToPosition,
  setRepeatMode, setPlaybackVolume, setShuffle, getRecentlyPlayedTracks,
  getUserQueue, addItemToPlaybackQueue,
  getUsersTopItems,
  SpotifyPlaybackState
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
      if (!userData) {
        console.error("Failed to fetch user data after token exchange.");
        displayLogin();
        return;
      }
      displayUserData(userData);
      displayTokenData(config.currentToken);
    }
  })();
} else if (config.currentToken.access_token) {
  (async () => {
    const userData = await getUserData();
    if (!userData) {
      console.error("Failed to fetch user data on initial load.");
      displayLogin();
      return;
    }
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

// function displayPlaybackState(playbackState: SpotifyPlaybackState): void {
//   const playback_state = document.getElementById("playback-state") as HTMLDivElement | null;
//   const progress_bar = document.getElementById("progress-bar") as HTMLSpanElement | null;
//   if (progress_bar) {
//     const progressMs = playbackState.progress_ms || 0;
//     const durationMs = playbackState.item && playbackState.item.duration_ms ? playbackState.item.duration_ms : 1;
//     progress_bar.style.width = `${(progressMs / durationMs) * 100}%`;
//   }
//   if (!playback_state) return;
//   playback_state.innerHTML = `
//     <h3>Playback State</h3>
//     <p>Is Playing: ${playbackState.is_playing}</p>
//     <p>Progress: ${playbackState.progress_ms} ms out of ${playbackState.item?.duration_ms} ms</p>
//     <p>Device: ${playbackState.device ? `<strong>${playbackState.device.name}</strong> (${playbackState.device.type})` : "None"}</p>
//     <p>Repeat Mode: ${playbackState.repeat_state}</p>
//     <p>Shuffle State: ${playbackState.shuffle_state}</p>
//     <p>Volume: ${playbackState.device ? playbackState.device.volume_percent + "%" : "N/A"}</p>
//     <p>Timestamp: ${new Date(playbackState.timestamp).toLocaleString()}</p>
//     <p>Context: ${
//       playbackState.context
//         ? `<strong>${playbackState.context.type}</strong> - ${playbackState.context.uri}`
//         : "None"
//     }</p>
//     <p>Item: ${
//       playbackState.item
//         ? `<strong>${playbackState.item.name}</strong>${
//             "artists" in playbackState.item && Array.isArray((playbackState.item as any).artists)
//               ? " by " + (playbackState.item as any).artists.map((artist: any) => artist.name).join(", ")
//               : ""
//           }`
//         : "None"
//     }</p>
//     <p>Item URI: ${playbackState.item ? playbackState.item.uri : "N/A"}</p>
//     <p>Item ID: ${playbackState.item ? playbackState.item.id : "N/A"}</p>
//     <p>Item Type: ${playbackState.item ? playbackState.item.type : "N/A"}</p>
//     <p>Item External URLs: ${playbackState.item ? JSON.stringify(playbackState.item.external_urls) : "N/A"}</p>
//     <p>Item Album Images: ${
//       playbackState.item && playbackState.item.type === "track" && "album" in playbackState.item && playbackState.item.album
//         ? playbackState.item.album.images && playbackState.item.album.images.length > 0
//           ? `<img src="${playbackState.item.album.images[0].url}" alt="${playbackState.item.album.images[0].height}x${playbackState.item.album.images[0].width}" style="max-height: 500px; max-width: 500px;">`
//         : "N/A"
//         : "N/A"
//     }</p>
//     <p>Item Explicit: ${playbackState.item ? playbackState.item.explicit ? "Yes" : "No" : "N/A"}</p>
//     <p>Item Popularity: ${
//       playbackState.item && playbackState.item.type === "track"
//         ? (playbackState.item as any).popularity || "N/A"
//         : "N/A"
//     }</p>
//   `;
// }

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
    <h3>Player</h3>
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
    <hr>
    <h3>Users</h3>
    <button id="btn-get-user-data">Get Current Users Data</button>
    <br>
    <select type="text" id="input-top-user-type" placeholder="Entity Type">
      <option value="tracks">Tracks</option>
      <option value="artists" selected>Artists</option>
    </select>
    <select type="text" id="input-top-user-time-range" placeholder="Time Range">
      <option value="short_term">Short Term</option>
      <option value="medium_term" selected>Medium Term</option>
      <option value="long_term">Long Term</option>
    </select>
    <input type="number" id="input-top-user-limit" placeholder="Limit" value="20" min="0" max="50" />
    <input type="number" id="input-top-user-offset" placeholder="Offset" value="0" min="0"/>
    <button id="btn-get-user-top-items">Get Current Users Top Items</button>

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
    const state = (document.getElementById("input-shuffle-state") as HTMLInputElement).value === "true" ? true : false;
    try { await setShuffle(state); printOutput("Toggled shuffle."); } catch (e) { printOutput(e); }
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

  // Users
  (document.getElementById("btn-get-user-data") as HTMLButtonElement).onclick = async () => {
    try { printOutput(await getUserData()); } catch (e) { printOutput(e); }
  };
  (document.getElementById("btn-get-user-top-items") as HTMLButtonElement).onclick = async () => {
    const type = (document.getElementById("input-top-user-type") as HTMLSelectElement).value;
    const timeRange = (document.getElementById("input-top-user-time-range") as HTMLSelectElement).value;
    const limit = parseInt((document.getElementById("input-top-user-limit") as HTMLInputElement).value) || 20;
    const offset = parseInt((document.getElementById("input-top-user-offset") as HTMLInputElement).value) || 0;
    try { 
      printOutput(await getUsersTopItems(type, timeRange, limit, offset)); 
    } catch (e) { printOutput(e); }
  };
}

export {};