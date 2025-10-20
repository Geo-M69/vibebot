const { 
    createAudioPlayer, 
    createAudioResource, 
    joinVoiceChannel, 
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState
} = require('@discordjs/voice');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class MusicPlayer {
    constructor() {
        this.queues = new Map(); // guildId -> queue object
    }

    /**
     * Get or create queue for a guild
     */
    getQueue(guildId) {
        if (!this.queues.has(guildId)) {
            this.queues.set(guildId, {
                songs: [],
                volume: 100,
                loop: 0, // 0 = off, 1 = song, 2 = queue
                isPlaying: false,
                connection: null,
                player: null,
                textChannel: null,
                currentSong: null
            });
        }
        return this.queues.get(guildId);
    }

    /**
     * Join voice channel
     */
    async joinChannel(voiceChannel) {
        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: true,
                selfMute: false,
            });

            // Add error handler
            connection.on('error', error => {
                console.error('Voice connection error:', error);
            });

            // Handle disconnection
            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                try {
                    await Promise.race([
                        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                    ]);
                } catch (error) {
                    connection.destroy();
                }
            });

            await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
            return connection;
        } catch (error) {
            console.error('Failed to join voice channel:', error);
            throw new Error(`Could not join voice channel: ${error.message}`);
        }
    }

    /**
     * Get video info using yt-dlp
     */
    async getVideoInfo(query) {
        try {
            // Check if it's a URL or search query
            const isUrl = query.startsWith('http://') || query.startsWith('https://');
            const searchQuery = isUrl ? query : `ytsearch1:${query}`;

            // Optimized: Minimal fields, skip download, use cache
            const { stdout, stderr } = await execAsync(
                `yt-dlp --skip-download --no-playlist --no-check-certificate --print '%(title)s\n%(webpage_url)s\n%(duration)s\n%(thumbnail)s\n%(uploader)s\n%(id)s' "${searchQuery}"`,
                { maxBuffer: 1024 * 1024 * 5, timeout: 15000 }
            );

            const lines = stdout.trim().split('\n');
            
            if (lines.length < 6) {
                console.error('yt-dlp stderr:', stderr);
                throw new Error(`Incomplete video info received (got ${lines.length} lines)`);
            }
            
            return {
                title: lines[0] || 'Unknown Title',
                url: lines[1] || query,
                duration: parseInt(lines[2]) || 0,
                thumbnail: lines[3] || '',
                uploader: lines[4] || 'Unknown',
                id: lines[5] || ''
            };
        } catch (error) {
            console.error('getVideoInfo error:', error.stderr || error.message);
            throw new Error(`Failed to get video info: ${error.stderr || error.message}`);
        }
    }

    /**
     * Get playlist info using yt-dlp
     */
    async getPlaylistInfo(url) {
        try {
            // Optimized: Use flat-playlist with minimal fields
            const { stdout } = await execAsync(
                `yt-dlp --flat-playlist --skip-download --print '%(title)s|||%(id)s|||%(duration)s|||%(uploader)s' "${url}"`,
                { maxBuffer: 1024 * 1024 * 10, timeout: 20000 }
            );

            const videos = stdout.trim().split('\n').map(line => {
                const [title, id, duration, uploader] = line.split('|||');
                return {
                    title: title || 'Unknown Title',
                    url: `https://www.youtube.com/watch?v=${id}`,
                    duration: parseInt(duration) || 0,
                    thumbnail: `https://i.ytimg.com/vi/${id}/default.jpg`,
                    uploader: uploader || 'Unknown',
                    id: id
                };
            });

            return videos;
        } catch (error) {
            throw new Error(`Failed to get playlist info: ${error.message}`);
        }
    }

    /**
     * Create audio stream using yt-dlp
     */
    async createStream(url) {
        try {
            // Optimized: Use specific format codes (251=opus, best for Discord)
            // --no-check-certificate and --no-playlist for speed
            // Format 251 is Opus in WebM, native Discord format
            const { stdout, stderr } = await execAsync(
                `yt-dlp -f 251/250/249/140/bestaudio --no-check-certificate --no-playlist --get-url "${url}"`,
                { maxBuffer: 1024 * 1024 * 5, timeout: 30000 }
            );

            const streamUrl = stdout.trim();
            
            if (!streamUrl) {
                console.error('yt-dlp stderr:', stderr);
                throw new Error(`No stream URL returned. stderr: ${stderr}`);
            }
            
            // Create audio resource from the stream URL
            const resource = createAudioResource(streamUrl, {
                inlineVolume: true,
                inputType: 0 // StreamType.Arbitrary - let FFmpeg auto-detect
            });

            return resource;
        } catch (error) {
            console.error('createStream error:', {
                message: error.message,
                stderr: error.stderr,
                code: error.code,
                killed: error.killed
            });
            throw new Error(`Failed to create stream: ${error.stderr || error.message}`);
        }
    }

    /**
     * Play the next song in queue
     */
    async playNext(guildId) {
        const queue = this.getQueue(guildId);

        if (queue.songs.length === 0) {
            queue.isPlaying = false;
            queue.currentSong = null;
            return null;
        }

        const song = queue.songs[0];
        queue.currentSong = song;
        queue.isPlaying = true;

        try {
            const resource = await this.createStream(song.url);
            
            if (!queue.player) {
                queue.player = createAudioPlayer();
                queue.connection.subscribe(queue.player);

                // Handle player events
                queue.player.on(AudioPlayerStatus.Idle, () => {
                    if (queue.loop === 1) {
                        // Loop current song
                        this.playNext(guildId);
                    } else if (queue.loop === 2) {
                        // Loop queue
                        queue.songs.push(queue.songs.shift());
                        this.playNext(guildId);
                    } else {
                        // Normal - remove and play next
                        queue.songs.shift();
                        this.playNext(guildId);
                    }
                });

                queue.player.on('error', error => {
                    console.error(`Error: ${error.message}`);
                    queue.songs.shift();
                    this.playNext(guildId);
                });
            }

            // Set volume
            resource.volume.setVolume(queue.volume / 100);
            queue.player.play(resource);

            return song;
        } catch (error) {
            console.error('Error playing song:', error);
            queue.songs.shift();
            return this.playNext(guildId);
        }
    }

    /**
     * Add song to queue and play if not playing
     */
    async play(voiceChannel, textChannel, query, requester) {
        const queue = this.getQueue(voiceChannel.guild.id);
        queue.textChannel = textChannel;

        // Join voice channel if not connected
        if (!queue.connection) {
            queue.connection = await this.joinChannel(voiceChannel);
        }

        // Check if it's a playlist
        const isPlaylist = query.includes('list=');
        
        if (isPlaylist) {
            const videos = await this.getPlaylistInfo(query);
            const songs = videos.map(video => ({
                ...video,
                requester
            }));
            queue.songs.push(...songs);
            
            if (!queue.isPlaying) {
                await this.playNext(voiceChannel.guild.id);
            }
            
            return { type: 'playlist', songs, count: songs.length };
        } else {
            const videoInfo = await this.getVideoInfo(query);
            const song = {
                ...videoInfo,
                requester
            };
            queue.songs.push(song);

            if (!queue.isPlaying) {
                await this.playNext(voiceChannel.guild.id);
                return { type: 'playing', song };
            }
            
            return { type: 'added', song, position: queue.songs.length };
        }
    }

    /**
     * Skip current song
     */
    skip(guildId) {
        const queue = this.getQueue(guildId);
        if (!queue.isPlaying) return false;
        
        queue.songs.shift();
        this.playNext(guildId);
        return true;
    }

    /**
     * Stop playing and clear queue
     */
    stop(guildId) {
        const queue = this.getQueue(guildId);
        queue.songs = [];
        queue.isPlaying = false;
        queue.currentSong = null;
        
        if (queue.player) {
            queue.player.stop();
        }
        
        if (queue.connection) {
            queue.connection.destroy();
            queue.connection = null;
        }
        
        this.queues.delete(guildId);
    }

    /**
     * Pause playback
     */
    pause(guildId) {
        const queue = this.getQueue(guildId);
        if (queue.player && queue.isPlaying) {
            queue.player.pause();
            return true;
        }
        return false;
    }

    /**
     * Resume playback
     */
    resume(guildId) {
        const queue = this.getQueue(guildId);
        if (queue.player) {
            queue.player.unpause();
            return true;
        }
        return false;
    }

    /**
     * Set volume
     */
    setVolume(guildId, volume) {
        const queue = this.getQueue(guildId);
        queue.volume = Math.max(0, Math.min(200, volume));
        
        if (queue.player && queue.player.state.resource) {
            queue.player.state.resource.volume.setVolume(queue.volume / 100);
        }
        
        return queue.volume;
    }

    /**
     * Set loop mode
     */
    setLoop(guildId, mode) {
        const queue = this.getQueue(guildId);
        queue.loop = mode;
        return queue.loop;
    }

    /**
     * Shuffle queue
     */
    shuffle(guildId) {
        const queue = this.getQueue(guildId);
        if (queue.songs.length <= 1) return false;
        
        const currentSong = queue.songs.shift();
        for (let i = queue.songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
        }
        queue.songs.unshift(currentSong);
        return true;
    }

    /**
     * Remove song from queue
     */
    remove(guildId, index) {
        const queue = this.getQueue(guildId);
        if (index < 1 || index >= queue.songs.length) return null;
        
        const removed = queue.songs.splice(index, 1)[0];
        return removed;
    }

    /**
     * Format duration
     */
    formatDuration(seconds) {
        if (!seconds || seconds === 0) return 'LIVE';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

module.exports = new MusicPlayer();
