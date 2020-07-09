import { VoiceConnection, StreamDispatcher } from "discord.js";

export interface Song {
    url: string,
    title: string,
    site: string,
    duration: number,
}
type stringnull = null | string
export interface MusicSite {
    play: (url: string, connection: VoiceConnection) => Promise<StreamDispatcher>,
    getInfo: (url: string) => Promise<Song>,
    getId: (url:string) => (null|string),
    id: string
}