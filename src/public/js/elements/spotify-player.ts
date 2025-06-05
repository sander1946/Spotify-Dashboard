import { API } from "../api.js";
import { config } from "../config.js";
import { SpotifyPlaybackOptions, SpotifyPlaybackState } from "../interfaces.js";

export class SpotifyPlayer {
  // Properties
  public element: HTMLDivElement = document.createElement("div");
  private poller: PlaybackStatePoller | null = null;

  // ** shadow elements
  // containers
  private infoContainer: HTMLDivElement = document.createElement("div");
  private controlsContainer: HTMLDivElement = document.createElement("div");
  private deviceSelectionContainer: HTMLDivElement = document.createElement("div");

  // playback state, this is what will be updated with the current playback state from Spotify
  private playbackState: SpotifyPlaybackState | null = null; // Placeholder for playback state
  private repeatState: string = "off"; // Placeholder for repeat state
  private shuffleState: boolean = false; // Placeholder for shuffle state
  private playState: boolean = false; // Placeholder for play state

  // item elements
  private itemName: HTMLSpanElement = document.createElement("span");
  private itemImage: HTMLImageElement = document.createElement("img");
  private itemUrl: HTMLAnchorElement = document.createElement("a");
  private itemType: string = ""; // Placeholder for item type (track, album, ad or unknown)
  private itemId: string = ""; // Placeholder for item ID
  private itemUri: string = ""; // Placeholder for item URI
  private itemDuration: number = 0; // Duration in milliseconds
  private itemHref: string = ""; // Placeholder for item href

  // artist elements
  private artistName: HTMLSpanElement = document.createElement("span");
  private artistUrl: HTMLAnchorElement = document.createElement("a");
  private artistId: string = ""; // Placeholder for artist ID
  private artistUri: string = ""; // Placeholder for artist URI
  private artistHref: string = ""; // Placeholder for artist href

  // player controls
  private playButton: HTMLButtonElement = document.createElement("button");
  private nextButton: HTMLButtonElement = document.createElement("button");
  private previousButton: HTMLButtonElement = document.createElement("button");
  private volumeSlider: HTMLInputElement = document.createElement("input");
  private volumeButton: HTMLButtonElement = document.createElement("button");
  private progressBar: HTMLInputElement = document.createElement("input");
  private repeatButton: HTMLButtonElement = document.createElement("button");
  private shuffleButton: HTMLButtonElement = document.createElement("button");
  private shareButton: HTMLButtonElement = document.createElement("button");
  private deviceSelectionButton: HTMLButtonElement = document.createElement("button");

  constructor() {
    this.setupElements();
    this.setupEventListeners();
    this.setupStructure();
    // this.updatePlayerInfo();
  }

  registerPoller(poller: PlaybackStatePoller) {
    this.poller = poller;
  }

  setupElements() {
    // Create and style the info container
    this.infoContainer.className = "info-container";
    this.controlsContainer.className = "controls-container";
    
    // create the item elements
    this.itemName.className = "item-name";
    this.itemImage.className = "item-image";
    this.itemUrl.className = "item-url";
    this.itemUrl.target = "_blank"; // Open in new tab
    this.itemUrl.rel = "noopener noreferrer"; // Security best practice

    // create the artist elements
    this.artistName.className = "artist-name";
    this.artistUrl.className = "artist-url";
    this.artistUrl.target = "_blank"; // Open in new tab
    this.artistUrl.rel = "noopener noreferrer"; // Security best practice

    // create the player controls
    this.playButton.className = "play-button";
    this.nextButton.className = "next-button";
    this.previousButton.className = "previous-button";
    this.volumeSlider.className = "volume-slider";
    this.volumeSlider.type = "range";
    this.volumeSlider.min = "0";
    this.volumeSlider.max = "100";
    this.volumeSlider.style.display = "none"; // Initially hidden, can be shown later if needed
    this.progressBar.className = "progress-bar";
    this.progressBar.type = "range";
    this.progressBar.min = "0";
    this.progressBar.max = "100";
    this.repeatButton.className = "repeat-button";
    this.shuffleButton.className = "shuffle-button";
    this.shareButton.className = "share-button";
    this.volumeButton.className = "volume-button";
    this.deviceSelectionButton.className = "device-selection-button";
    
    // Add text content to buttons
    this.volumeButton.innerHTML = '<i class="bi bi-volume-up-fill"></i>';
    this.playButton.innerHTML = '<i class="bi bi-play-fill"></i>';
    this.nextButton.innerHTML = '<i class="bi bi-skip-end-fill"></i>';
    this.previousButton.innerHTML = '<i class="bi bi-skip-start-fill"></i>';
    this.repeatButton.innerHTML = '<i class="bi bi-repeat"></i>';
    this.shuffleButton.innerHTML = '<i class="bi bi-shuffle"></i>';
    this.shareButton.innerHTML = '<i class="bi bi-box-arrow-up"></i>';
    this.deviceSelectionButton.innerHTML = '<i class="bi bi-pc-display"></i>';
  }

  setupStructure() {
    // Append elements to the info container
    this.infoContainer.appendChild(this.itemImage);
    this.infoContainer.appendChild(this.itemName);
    this.infoContainer.appendChild(this.artistName);
    this.infoContainer.appendChild(this.itemUrl);
    this.infoContainer.appendChild(this.artistUrl);

    // Append controls to the controls container
    this.controlsContainer.appendChild(this.progressBar);
    this.controlsContainer.appendChild(document.createElement("br")); // Line break for better layout
    this.controlsContainer.appendChild(this.volumeButton);
    this.controlsContainer.appendChild(this.volumeSlider); // this can be shown/hidden later
    this.controlsContainer.appendChild(this.shuffleButton);
    this.controlsContainer.appendChild(this.previousButton);
    this.controlsContainer.appendChild(this.playButton);
    this.controlsContainer.appendChild(this.nextButton);
    this.controlsContainer.appendChild(this.repeatButton);
    this.controlsContainer.appendChild(this.shareButton);
    this.controlsContainer.appendChild(document.createElement("br")); // Line break for better layout
    this.controlsContainer.appendChild(this.deviceSelectionButton);

    // Append containers to the shadow root
    this.element.appendChild(this.infoContainer);
    this.element.appendChild(this.controlsContainer);
    this.element.appendChild(this.deviceSelectionContainer);
  }

  afterButtonHandler() {
    window.setTimeout(() => {
      if (this.poller) {
        this.poller.pollNow(); // Immediately poll the current state
      } else {
        console.warn("No poller registered. Please register a PlaybackStatePoller instance.");
      }
    }, 500); // Poll after 0.5 seconds to ensure the state is updated
  }

  setupEventListeners() {
    // Add event listeners for player controls
    this.playButton.addEventListener("click", () => this.togglePlay());
    this.nextButton.addEventListener("click", () => this.next());
    this.previousButton.addEventListener("click", () => this.previous());
    this.volumeSlider.addEventListener("input", (e) => this.setVolume((e.target as HTMLInputElement).value));
    this.progressBar.addEventListener("input", (e) => this.seek((e.target as HTMLInputElement).value));
    this.repeatButton.addEventListener("click", () => this.toggleRepeat());
    this.shuffleButton.addEventListener("click", () => this.toggleShuffle());
    this.deviceSelectionButton.addEventListener("click", () => this.showDeviceSelection());
  }

  updatePlayerInfo(state?: SpotifyPlaybackState | null) {
    // Update the player info with the current playback state
    if (state) {
      this.playbackState = state;
      this.itemName.textContent = state.item?.name || "Unknown Track";
      this.itemId = state.item?.id || "";
      this.itemUri = state.item?.uri || "";
      this.itemHref = state.item?.external_urls.spotify || "";
      this.itemType = state.item?.type || "unknown";
      this.itemDuration = state.item?.duration_ms || 0;

      // Update item image
      if (state.item?.type === "track" && (state.item as any).album?.images && (state.item as any).album.images.length > 0) {
        this.itemImage.src = (state.item as any).album.images[0].url;
      } else {
        this.itemImage.src = config.defaultAlbumImage; // Fallback image
      }

      // Update item URL
      this.itemUrl.href = this.itemHref;
      this.itemUrl.textContent = "View on Spotify";

      // Update artist info
      if (state.item?.type === "track" && (state.item as any).artists && (state.item as any).artists.length > 0) {
        const artist = (state.item as any).artists[0];
        this.artistName.textContent = artist.name;
        this.artistId = artist.id;
        this.artistUri = artist.uri;
        this.artistHref = artist.external_urls.spotify;
        this.artistUrl.href = this.artistHref;
        this.artistUrl.textContent = "View Artist on Spotify";
      } else {
        this.artistName.textContent = "Unknown Artist";
        this.artistUrl.href = "#"; // Fallback link
      }

      // Update playback controls
      this.playState = state.is_playing;
      this.playButton.getElementsByClassName("bi")[0].classList.toggle("bi-play-fill", !this.playState);
      this.playButton.getElementsByClassName("bi")[0].classList.toggle("bi-pause-fill", this.playState);
      
      // Update repeat and shuffle states
      this.repeatState = state.repeat_state || "off";
      this.shuffleState = state.shuffle_state || false;

      // Update repeat button icon
      if (this.repeatState === "context") {
        this.repeatButton.getElementsByClassName("bi")[0].classList.replace("bi-repeat-1", "bi-repeat");
        this.repeatButton.setAttribute("data-state", "active");
      } else if (this.repeatState === "track") {
        this.repeatButton.getElementsByClassName("bi")[0].classList.replace("bi-repeat", "bi-repeat-1");
        this.repeatButton.setAttribute("data-state", "active");
      }
      else {
        this.repeatButton.getElementsByClassName("bi")[0].classList.replace("bi-repeat-1", "bi-repeat");
        this.repeatButton.setAttribute("data-state", "inactive");
      }
      // Update shuffle button state
      this.shuffleButton.setAttribute("data-state", this.shuffleState ? "active" : "inactive"); 
      // Update volume slider
      if (state.device && state.device.volume_percent) {  
        this.volumeSlider.value = state.device.volume_percent.toString();
      }
      // Update progress bar
      if (state.progress_ms && this.itemDuration) {
        const progressPercent = (state.progress_ms / this.itemDuration) * 100;
        this.progressBar.value = progressPercent.toString();
      } else {
        this.progressBar.value = "0"; // Reset if no progress
      }
    }
    else {
      // Reset player info if no playback state
      this.itemName.textContent = "No Track Playing";
      this.itemImage.src = config.defaultAlbumImage; // Fallback image
      this.itemUrl.href = "#"; // Fallback link
      this.artistName.textContent = "No Artist";
      this.artistUrl.href = "#"; // Fallback link
      this.playState = false;
      this.playButton.getElementsByClassName("bi")[0].classList.replace("bi-pause-fill", "bi-play-fill");
      this.repeatState = "off";
      this.shuffleState = false;
      this.volumeSlider.value = "50"; // Default volume
      this.progressBar.value = "0"; // Reset progress bar
    }
    // Update the element with the new info
    // this.element.setAttribute("data-item-type", this.itemType);
    // this.element.setAttribute("data-item-id", this.itemId);
    // this.element.setAttribute("data-item-uri", this.itemUri);
    // this.element.setAttribute("data-item-duration", this.itemDuration.toString());
    // this.element.setAttribute("data-item-href", this.itemHref);
    // this.element.setAttribute("data-artist-id", this.artistId);
    // this.element.setAttribute("data-artist-uri", this.artistUri);
    // this.element.setAttribute("data-artist-href", this.artistHref);
  }

  togglePlay() {
    // Send the play or pause command to Spotify
    if (this.playState) {
      this.pause();
    } else {
      this.play();
    }
    this.playState = !this.playState; // Toggle play state
    this.playButton.getElementsByClassName("bi")[0].classList.toggle("bi-play-fill", !this.playState);
    this.playButton.getElementsByClassName("bi")[0].classList.toggle("bi-pause-fill", this.playState);
    this.afterButtonHandler(); // Poll the current state after toggling play
  }

  play() {
    const options = {} as SpotifyPlaybackOptions;

    API.startResumePlayback(options).then(() => {
      console.log("Playback started");
    }).catch((error) => {
      console.error("Error starting playback:", error);
    });
  }

  pause() {
    // Send the pause command to Spotify
    API.pausePlayback().then(() => {
      console.log("Playback stopped");
    }).catch((error) => {
      console.error("Error starting stopping:", error);
    });
  }

  next() {
    // Send the next track command to Spotify
    API.skipToNext().then(() => {
      console.log("Skipped to next track");
    }).catch((error) => {
      console.error("Error skipping to next track:", error);
    });
    this.afterButtonHandler(); // Poll the current state after toggling play
  }

  previous() {
    // Send the previous track command to Spotify
    API.skipToPrevious().then(() => {
      console.log("Skipped to previous track");
    }).catch((error) => {
      console.error("Error skipping to previous track:", error);
    });
    this.afterButtonHandler(); // Poll the current state after toggling play
  }

  setVolume(volume: string) {
    // Send the set volume command to Spotify
    const volumePercent = parseInt(volume, 10);
    if (volumePercent < 0 || volumePercent > 100) {
      console.error("Volume must be between 0 and 100");
      return;
    }
    API.setPlaybackVolume(volumePercent).then(() => {
      console.log(`Volume set to: ${volumePercent}%`);
    }).catch((error) => {
      console.error("Error setting volume:", error);
    });
    this.afterButtonHandler(); // Poll the current state after toggling play
  }

  seek(position: string) {
    // Send the seek command to Spotify
    const positionMs = parseInt(position, 10) * 1000; // Convert seconds to milliseconds
    API.seekToPosition(positionMs).then(() => {
      console.log(`Seeked to position: ${positionMs} ms`);
    }).catch((error) => {
      console.error("Error seeking to position:", error);
    });
    this.afterButtonHandler(); // Poll the current state after toggling play
  }

  toggleRepeat() {
    // Logic to toggle repeat mode
    if (this.repeatState === "off") {
      this.repeatState = "context"; // Set to context repeat
      this.repeatButton.setAttribute("data-state", "active");
    } else if (this.repeatState === "context") {
      this.repeatState = "track"; // Set to track repeat
      this.repeatButton.getElementsByClassName("bi")[0].classList.replace("bi-repeat", "bi-repeat-1");
    } else if (this.repeatState === "track") {
      this.repeatState = "off"; // Turn off repeat
      this.repeatButton.setAttribute("data-state", "inactive");
      this.repeatButton.getElementsByClassName("bi")[0].classList.replace("bi-repeat-1", "bi-repeat");
    }
    // Update the repeat state in Spotify
    API.setRepeatMode(this.repeatState).then(() => {
      console.log(`Repeat mode set to: ${this.repeatState}`);
    }).catch((error) => {
      console.error("Error setting repeat mode:", error);
    });
    this.afterButtonHandler(); // Poll the current state after toggling play
  }

  toggleShuffle() {
    // Logic to toggle shuffle mode
    this.shuffleState = !this.shuffleState; // Toggle shuffle state
    this.shuffleButton.setAttribute("data-state", this.shuffleState ? "active" : "inactive");
    // Update the shuffle state in Spotify
    API.setShuffle(this.shuffleState).then(() => {
      console.log(`Shuffle mode set to: ${this.shuffleState}`);
    }).catch((error) => {
      console.error("Error setting shuffle mode:", error);
    });
    this.afterButtonHandler(); // Poll the current state after toggling play
  }

  showDeviceSelection() {
    console.log("Showing device selection");
    API.getAvailableDevices().then((devices) => {
      console.log("Available devices:", devices);
      if (devices && devices.devices && devices.devices.length > 0) {
        console.log("Available devices:", devices);
        const deviceList = document.createElement("ul");
        devices.devices.forEach((device) => {
          const deviceItem = document.createElement("li");
          switch (device.type) {
            // case "Computer":
            //   deviceItem.innerHTML = `<i class="bi bi-laptop"></i>${device.name} (${device.type})`;
            //   break;
            // case "Smartphone":
            //   deviceItem.innerHTML = `<i class="bi bi-phone"></i>${device.name} (${device.type})`;
            //   break;
            // case "Speaker":
            //   deviceItem.innerHTML = `<i class="bi bi-speaker"></i>${device.name} (${device.type})`;
            //   break;
            default:
              deviceItem.innerHTML = `<i class="bi bi-device"></i>${device.name} (${device.type})`;
              break;
          };
          deviceItem.addEventListener("click", () => {
            // Logic to switch to the selected device
            console.log(`Switching to device: ${device.name}`);
            let currentDeviceId = device.id;
            if (!currentDeviceId) {
              return console.error("Device ID is required to transfer playback.");
            }
            API.transferPlayback(`${currentDeviceId}`);
          });
          deviceList.appendChild(deviceItem);
        });
        this.deviceSelectionContainer.innerHTML = ""; // Clear previous content
        this.deviceSelectionContainer.appendChild(deviceList);
      }
    }).catch((error) => {
      console.error("Error fetching available devices:", error);
      this.deviceSelectionContainer.innerHTML = "<p>Error fetching devices. Please try again later.</p>";
    });
  }
}

// --- PlaybackStatePoller ---
class PlaybackStatePoller {
  private timer: number | null = null;
  private stopped: boolean = false; // a flag to stop polling
  private spotifyPlayer: SpotifyPlayer;

  constructor(spotifyPlayer: SpotifyPlayer) {
    this.spotifyPlayer = spotifyPlayer;
  }

  start() {
    this.stopped = false;
    this.poll();
  }

  stop() {
    this.stopped = true;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  pollNow() {
    this.stop(); // Stop any existing polling
    this.start(); // Immediately poll the current state
  }

  private async poll() {
    if (this.stopped) return; // return if polling is stopped
    try {
      const state = await API.getPlaybackState();
      // You can handle the state here, e.g. update UI or emit an event
      // Example: console.log("Playback state:", state);   
      console.log("Playback state:", state);
      
      if (state && state.item) {
        this.spotifyPlayer.updatePlayerInfo(state);
      }

      let nextDelay = 5000; // default 5s
      if (!state || (Array.isArray(state) && state.length === 0)) {
        nextDelay = 15000; // empty array, poll every 15s
      } else if (state.is_playing && typeof state.progress_ms === "number" && state.item && typeof state.item.duration_ms === "number") {
        // Calculate ms until song ends
        const msLeft = Math.max(0, state.item.duration_ms - state.progress_ms);
        nextDelay = Math.min(5000, msLeft + 500); // 0.5s after song ends or 5s, whichever is smaller
      }
      console.log(`Next poll in ${nextDelay}ms`);
      this.timer = window.setTimeout(() => this.poll(), nextDelay);
    } catch (e) {
      // On error, try again in 15s
      console.error("Error fetching playback state:", e);
      this.timer = window.setTimeout(() => this.poll(), 15000);
    }
  }
}

const spotifyPlayer = new SpotifyPlayer();
const poller = new PlaybackStatePoller(spotifyPlayer);
spotifyPlayer.registerPoller(poller); // Register the poller with the player
poller.start();

document.getElementById("spotify-player")?.appendChild(spotifyPlayer.element);
