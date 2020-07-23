import { VoiceConnection, StreamDispatcher } from "discord.js";

export interface Song {
    url: string,
    title: string,
    site: string,
    duration: number,
    source_url?: string
}

export interface MusicSite {
    play: (song: Song, connection: VoiceConnection) => Promise<StreamDispatcher>,
    getInfo: (url: string) => Promise<Song>,
    getId: (url:string) => (null|string),
    id: string
}