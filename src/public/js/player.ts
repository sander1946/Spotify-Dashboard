// declare global {
//   interface Window {
//     onSpotifyWebPlaybackSDKReady: () => void;
//     Spotify: any;
//   }
// }

// window.onSpotifyWebPlaybackSDKReady = () => {
//   const token = 'BQD_x_APDlnyqreV-pw2HtKl2KP1ICFXb3MLhmZjf0_7gL6PXafa8XtON8QNWprFs8GTbpXX7c5KEQe_xCXM5U72LFNyf7_5sp8EdN-ZNhzWnpeB_Son2QNYGcWqGNmBHp-FyzmD3FQ0manKg_5vjx987EQgOgReRVGi1ObCH3sVtR86AtttY4hUgOgDGc6rpVopivbIx0PxQ7vHSj6GB2sj6oeEE-MkNrpYNzxn5WMDe8MoyxxuplBGFjbXcHjwwyo_';
//   const player = new window.Spotify.Player({
//     name: 'Web Playback SDK Quick Start Player',
//     getOAuthToken: (cb: (token: string) => void) => { cb(token); },
//     volume: 0.5
//   });

//   player.addListener('ready', ({ device_id }: { device_id: string }) => {
//     console.log('Ready with Device ID', device_id);
//   });

//   player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
//     console.log('Device ID has gone offline', device_id);
//   });

//   player.addListener('initialization_error', ({ message }: { message: string }) => {
//     console.error(message);
//   });

//   player.addListener('authentication_error', ({ message }: { message: string }) => {
//     console.error(message);
//   });

//   player.addListener('account_error', ({ message }: { message: string }) => {
//     console.error(message);
//   });

//   document.getElementById('prev')?.addEventListener('click', () => {
//     player.previousTrack().then(() => {
//       console.log('Set to previous track!');
//     });
//   });

//   document.getElementById('play')?.addEventListener('click', () => {
//     player.togglePlay().then(() => {
//       console.log('Toggled playback!');
//     });
//   });

//   document.getElementById('next')?.addEventListener('click', () => {
//     player.nextTrack().then(() => {
//       console.log('Skipped to next track!');
//     });
//   });

//   player.connect();
// };

export {};