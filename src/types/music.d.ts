/**
 * Music Bot Type Definitions
 */

import { User, VoiceChannel, TextChannel, VoiceConnection } from 'discord.js';
import { AudioPlayer } from '@discordjs/voice';

/**
 * Song object representing a queued track
 */
export interface Song {
    /** YouTube video title */
    title: string;
    
    /** YouTube video URL */
    url: string;
    
    /** Duration in seconds (0 for livestreams) */
    duration: number;
    
    /** Thumbnail image URL */
    thumbnail: string | null;
    
    /** Channel/uploader name */
    uploader: string;
    
    /** YouTube video ID */
    id: string;
    
    /** Discord user who requested the song */
    requester: User;
}

/**
 * Queue object for a guild
 */
export interface Queue {
    /** Array of songs in the queue */
    songs: Song[];
    
    /** Current volume (0-200) */
    volume: number;
    
    /** Loop mode: 0 = off, 1 = song, 2 = queue */
    loop: 0 | 1 | 2;
    
    /** Whether music is currently playing */
    isPlaying: boolean;
    
    /** Voice connection instance */
    connection: VoiceConnection | null;
    
    /** Audio player instance */
    player: AudioPlayer | null;
    
    /** Text channel for bot messages */
    textChannel: TextChannel | null;
    
    /** Currently playing song */
    currentSong: Song | null;
}

/**
 * Result type for play command
 */
export type PlayResult = 
    | { type: 'playing'; song: Song }
    | { type: 'added'; song: Song; position: number }
    | { type: 'playlist'; songs: Song[]; count: number };

/**
 * Music Player Service Interface
 */
export interface MusicPlayerService {
    /** Map of guild queues */
    queues: Map<string, Queue>;
    
    /**
     * Get or create queue for a guild
     */
    getQueue(guildId: string): Queue;
    
    /**
     * Join a voice channel
     */
    joinChannel(voiceChannel: VoiceChannel): Promise<VoiceConnection>;
    
    /**
     * Get video information from YouTube
     */
    getVideoInfo(query: string): Promise<Song>;
    
    /**
     * Get playlist information from YouTube
     */
    getPlaylistInfo(url: string): Promise<Song[]>;
    
    /**
     * Create audio stream from YouTube URL
     */
    createStream(url: string): Promise<any>;
    
    /**
     * Play the next song in queue
     */
    playNext(guildId: string): Promise<Song | null>;
    
    /**
     * Play a song or add to queue
     */
    play(
        voiceChannel: VoiceChannel,
        textChannel: TextChannel,
        query: string,
        requester: User
    ): Promise<PlayResult>;
    
    /**
     * Skip the current song
     */
    skip(guildId: string): boolean;
    
    /**
     * Stop playback and clear queue
     */
    stop(guildId: string): void;
    
    /**
     * Pause playback
     */
    pause(guildId: string): boolean;
    
    /**
     * Resume playback
     */
    resume(guildId: string): boolean;
    
    /**
     * Set volume (0-200)
     */
    setVolume(guildId: string, volume: number): number;
    
    /**
     * Set loop mode (0=off, 1=song, 2=queue)
     */
    setLoop(guildId: string, mode: 0 | 1 | 2): 0 | 1 | 2;
    
    /**
     * Shuffle the queue
     */
    shuffle(guildId: string): boolean;
    
    /**
     * Remove a song from queue by index
     */
    remove(guildId: string, index: number): Song | null;
    
    /**
     * Format duration from seconds to MM:SS or HH:MM:SS
     */
    formatDuration(seconds: number): string;
}
