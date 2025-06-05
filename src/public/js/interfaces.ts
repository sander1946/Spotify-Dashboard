export interface SpotifyTokenResponse {
  access_token: string; // The access token that can be used to make requests to the Spotify Web API.
  refresh_token: string; // The refresh token that can be used to obtain a new access token when the current one expires.
  expires_in: number; // The number of seconds until the access token expires.
}

export interface SpotifyUser {
  country: string; // The country of the user, as set in the user's account profile.
  display_name?: string; // The name displayed on the user's profile. This may be the user's real name or a nickname.
  email: string; // The user's email address, as set in the user's account profile.
  explicit_content?: SpotifyExplicitContentObject; // The user's explicit content settings.
  external_urls: SpotifyExternalUrlObject; // External URLs for this user.
  followers: SpotifyFollowersObject; // The followers of the user.
  href: string; // A link to the Web API endpoint providing full details of the user.
  id: string; // The Spotify user ID for the user.
  images: SpotifyImageObject[]; // The user's profile images, in various sizes, widest first.
  product: string; // The user's Spotify product type, e.g. "premium", "free", "open".
  type: string; // The object type, e.g. "user".
  uri: string; // The Spotify URI for the user.
}

export interface SpotifyFollowersObject {
  href: string | null; // A link to the Web API endpoint providing full details of the followers.
  total: number; // The total number of followers for this user.
}

export interface SpotifyExplicitContentObject {
  filter_enabled: boolean; // If the user has enabled explicit content filtering.
  filter_locked: boolean; // If the user has locked explicit content filtering.
}

export interface SpotifyPlaybackState {
  device: SpotifyDeviceObject; // The device that is currently active.
  repeat_state: string; // off, track, context
  shuffle_state: boolean; // If shuffle is on or off.
  context?: SpotifyContextObject; // A Context Object. Can be null.
  timestamp: number; // Unix Millisecond Timestamp when playback state was last changed (play, pause, skip, scrub, new song, etc.).
  progress_ms?: number; // Progress into the currently playing track or episode. Can be null.
  is_playing: boolean; // If something is currently playing, return true.
  item?: SpotifyTrackObject | SpotifyEpisodeObject; // The currently playing track or episode. Can be null.
  currently_playing_type?: string; // The object type of the currently playing item. Can be one of track, episode, ad or unknown.
  actions: SpotifyActionsObject; // Actions that the user can perform on the currently playing item.
}

export interface SpotifyTrackObject {
  album: SpotifyAlbumObject; // The album on which the track appears. The album object includes a link in href to full information about the album.
  artists: SpotifyArtistObject[]; // The artists who performed the track. Each artist object includes a link in href to more detailed information about the artist.
  available_markets: string[]; // A list of the countries in which the track can be played, identified by their ISO 3166-1 alpha-2 code.
  disc_number: number; // The disc number (usually 1 unless the album consists of more than one disc).
  duration_ms: number; // The track length in milliseconds.
  explicit: boolean; // Whether or not the track has explicit lyrics (true = yes it does; false = no it does not OR unknown).
  external_ids: SpotifyExternalIdObject; // Known external IDs for the track.
  external_urls: SpotifyExternalUrlObject; // External URLs for this track.
  href: string; // A link to the Web API endpoint providing full details of the track.
  id: string; // The Spotify ID for the track.
  is_playable: boolean; // If the track is playable in the user's current market.
  linked_from?: SpotifyTrackObject; // If the track is a remix, this field will contain information about the original track.
  restrictions?: SpotifyRestrictionsObject; // Restrictions that apply to the track in the user's current market.
  name: string; // The name of the track.
  popularity: number; // The popularity of the track. The value will be between 0 and 100, with 100 being the most popular.
  preview_url: string | null; // !! Deprecated - A link to a 30 second preview (MP3 format) of the track. Can be null.
  track_number: number; // The number of the track. If an album has several discs, the track number is the number on the specified disc.
  type: string; // The object type, e.g. "track".
  uri: string; // The Spotify URI for the track.
  is_local?: boolean; // If the track is local to the user's device.
}

export interface SpotifyEpisodeObject {
  audio_preview_url: string | null; // !! Deprecated - A link to a 30 second preview (MP3 format) of the episode. Can be null.
  description: string; // A description of the episode.
  html_description: string; // An HTML description of the episode.
  duration_ms: number; // The episode length in milliseconds.
  explicit: boolean; // Whether or not the episode has explicit content (true = yes it does; false = no it does not OR unknown).
  external_urls: SpotifyExternalUrlObject; // External URLs for this episode.
  href: string; // A link to the Web API endpoint providing full details of the episode.
  id: string; // The Spotify ID for the episode.
  images: SpotifyImageObject[]; // The cover art for the episode in various sizes, widest first.
  is_externally_hosted: boolean; // If the episode is hosted outside of Spotify's CDN.
  is_playable: boolean; // If the episode is playable in the user's current market.
  language: string; // !! Deprecated - A list of the languages used in the episode, identified by their ISO 639 code.
  languages: string[]; // A list of the languages used in the episode, identified by their ISO 639 code.
  name: string; // The name of the episode.
  release_date: string; // The date the episode was first released, for example "1981-12-15".
  release_date_precision: string; // The precision with which release_date value is known. Possible values: "year", "month", "day".
  resume_point?: SpotifyResumePointObject; // The episode's resume point, which is the last position in milliseconds that the user has listened to.
  type: string; // The object type, e.g. "episode".
  uri: string; // The Spotify URI for the episode.
  restrictions?: SpotifyRestrictionsObject; // Restrictions that apply to the episode in the user's current market.
  show: SpotifyShowObject; // The show to which the episode belongs.
}

export interface SpotifyShowObject {
  available_markets: string[]; // A list of the countries in which the show can be played, identified by their ISO 3166-1 alpha-2 code.
  copyrights: SpotifyCopyrightObject[]; // The copyright statements of the show.
  description: string; // A description of the show.
  html_description: string; // An HTML description of the show.
  explicit: boolean; // Whether or not the show has explicit content (true = yes it does; false = no it does not OR unknown).
  external_urls: SpotifyExternalUrlObject; // External URLs for this show.
  href: string; // A link to the Web API endpoint providing full details of the show.
  id: string; // The Spotify ID for the show.
  images: SpotifyImageObject[]; // The cover art for the show in various sizes, widest first.
  is_externally_hosted: boolean; // If the show is hosted outside of Spotify's CDN.
  languages: string[]; // A list of the languages used in the show, identified by their ISO 639 code.
  media_type: string; // The media type of the show, e.g. "audio".
  name: string; // The name of the show.
  publisher: string; // The publisher of the show.
  type: string; // The object type, e.g. "show".
  uri: string; // The Spotify URI for the show.
  total_episodes: number; // The total number of episodes in the show.
}

export interface SpotifyCopyrightObject {
  text: string; // The copyright text.
  type: string; // The type of copyright, e.g. "C" for copyright or "P" for phonogram.
}

export interface SpotifyResumePointObject {
  fully_played: boolean; // If the episode has been fully played.
  resume_position_ms: number; // The user's most recent position in the episode in milliseconds.
}

export interface SpotifyExternalIdObject {
  isrc?: string; // The International Standard Recording Code (ISRC) for the track.
  ean?: string; // The International Article Number (EAN) for the track.
  upc?: string; // The Universal Product Code (UPC) for the track.
}

export interface SpotifyAlbumObject {
  album_type: string; // The Spotify ID for the album. Allowed values: "album", "single", "compilation"
  total_tracks: number; // The total number of tracks in the album.
  available_markets: string[]; // A list of the countries in which the album can be played, identified by their ISO 3166-1 alpha-2 code.
  external_urls: SpotifyExternalUrlObject; // External URLs for this album.
  href: string; // A link to the Web API endpoint providing full details of the album.
  id: string; // The Spotify ID for the album.
  images: SpotifyImageObject[]; // The cover art for the album in various sizes, widest first.
  name: string; // The name of the album.
  release_date: string; // The date the album was first released, for example "1981-12-15".
  release_date_precision: string; // The precision with which release_date value is known. Possible values: "year", "month", "day".
  restrictions?: SpotifyRestrictionsObject; // Restrictions that apply to the album in the user's current market.
  type: string; // The object type, e.g. "album".
  uri: string; // The Spotify URI for the album.
  artists: SpotifyArtistObject[]; // The artists of the album.
}

export interface SpotifyArtistObject {
  external_urls: SpotifyExternalUrlObject; // External URLs for this artist.
  href: string; // A link to the Web API endpoint providing full details of the artist.
  id: string; // The Spotify ID for the artist.
  name: string; // The name of the artist.
  type: string; // The object type, e.g. "artist".
  uri: string; // The Spotify URI for the artist.
}

export interface SpotifyRestrictionsObject {
  reason: string; // The reason for the restriction. Possible values: "market", "product", "explicit".
}

export interface SpotifyImageObject {
  url: string; // The source URL of the image.
  height?: number; // The image height in pixels.
  width?: number; // The image width in pixels.
}

export interface SpotifyActionsObject {
  interrupting_playback?: boolean; // If the user has the ability to interrupt playback on this device.
  pausing?: boolean; // If the user has the ability to pause playback on this device.
  resuming?: boolean; // If the user has the ability to resume playback on this device.
  seeking?: boolean; // If the user has the ability to seek to a position in the currently playing track on this device.
  skipping_next?: boolean; // If the user has the ability to skip to the next track on this device.
  skipping_prev?: boolean; // If the user has the ability to skip to the previous track on this device.
  toggling_repeat_context?: boolean; // If the user has the ability to toggle repeat context on this device.
  toggling_shuffle?: boolean; // If the user has the ability to toggle shuffle on this device.
  toggling_repeat_track?: boolean; // If the user has the ability to toggle repeat track on this device.
  transferring_playback?: boolean; // If the user has the ability to transfer playback to this device.
}

export interface SpotifyContextObject {
  type: string; // The object type, e.g. "artist", "playlist", "album", "show".
  href: string; // A link to the Web API endpoint providing full details of the track.
  external_urls: SpotifyExternalUrlObject; // External URLs for this context. 
  uri: string; // The Spotify URI for the context.
}

export interface SpotifyExternalUrlObject {
  spotify: string; // The Spotify URL for the object.
}
export interface SpotifyDeviceObject {
  id?: string; // The device ID. This ID is unique and persistent to some extent. However, this is not guaranteed and any cached device_id should periodically be cleared out and refetched as necessary.
  is_active: boolean; // If this device is the currently active device.
  is_private_session: boolean; // If this device is currently in a private session.
  is_restricted: boolean; // Whether controlling this device is restricted. At present if this is "true" then no Web API commands will be accepted by this device.
  name: string; // A human-readable name for the device. Some devices have a name that the user can configure (e.g. "Loudest speaker") and some devices have a generic name associated with the manufacturer or device model.
  type: string; // Device type, such as "computer", "smartphone" or "speaker".
  volume_percent?: number; // The current volume in percent. Range: 0 - 100
  supports_volume: boolean; // If this device can be used to set the volume.
}

export interface SpotifyAvailableDeviceObject {
  devices: SpotifyDeviceObject[]; // An array of available devices.
}

export interface SpotifyCurrentlyPlayingTrack {
  device: SpotifyDeviceObject; // The device that is currently active.
  repeat_state: string; // off, track, context
  shuffle_state: boolean; // If shuffle is on or off.
  context?: SpotifyContextObject; // A Context Object. Can be null.
  timestamp: number; // Unix Millisecond Timestamp when playback state was last changed (play, pause, skip, scrub, new song, etc.).
  progress_ms?: number; // Progress into the currently playing track or episode. Can be null.
  is_playing: boolean; // If something is currently playing, return true.
  item?: SpotifyTrackObject | SpotifyEpisodeObject; // The currently playing track or episode. Can be null.
  currently_playing_type?: string; // The object type of the currently playing item. Can be one of track, episode, ad or unknown.
  actions: SpotifyActionsObject; // Actions that the user can perform on the currently playing item.
}

export interface SpotifyRecentlyPlayedTrack {
  href: string; // A link to the Web API endpoint providing full details of the track.
  limit: number; // The maximum number of items in the response. as specified in the request.
  next: string | null; // The URL to the next page of items. If this is null, there are no more items.
  cursor: SpotifyCursorObject; // The cursor object containing the after and before values for pagination.
  total: number; // The total number of items available in the response.
  items: SpotifyRecentlyPlayedItem[]; // An array of recently played items.
}

export interface SpotifyCursorObject {
  after: string; // The cursor value to use as the after parameter in the next request.
  before: string; // The cursor value to use as the before parameter in the next request.
}

export interface SpotifyRecentlyPlayedItem {
  track: SpotifyTrackObject; // The track that was played.
  played_at: string; // The date and time when the track was played, in ISO 8601 format.
  context?: SpotifyContextObject; // A Context Object. Can be null.
}

export interface SpotifyUserQueue {
  currently_playing: SpotifyTrackObject | SpotifyEpisodeObject | null; // The currently playing track or episode, if any.
  queue: (SpotifyTrackObject | SpotifyEpisodeObject)[]; // The user's queue, which is an array of tracks or episodes.
}

export interface SpotifyUserTopItems {
  href: string; // A link to the Web API endpoint returning the full result of the request
  limit: number; // The maximum number of items in the response, as specified in the request.
  next?: string; // The URL to the next page of items. If this is null, there are no more items.
  offset: number; // The offset of the items returned in the response, as specified in the request.
  previous?: string; // The URL to the previous page of items. If this is null, there are no previous items.
  total: number; // The total number of items available in the response.
  items: (SpotifyTrackObject | SpotifyArtistObject)[]; // An array of the user's top items, which can be tracks or artists.
}

export interface SpotifyPlaybackOptions {
  context_uri?: string | null; // Optional, can be used to specify a context (e.g., playlist, album)
  uris?: string[]; // Optional, can be used to specify tracks to play
  offset?: { position: number } | { uri: string }; // Optional, can be used to specify the position in the context
  position_ms?: number; // Optional, can be used to specify the position in milliseconds
  device_id?: string; // Optional, can be used to specify the device ID to play on
}