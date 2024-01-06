import { AudioResource, StreamType } from '@discordjs/voice'

export interface Song {
    url: string,
    title: string,
    site: string,
    duration: number,
    source_url?: string,
    input_type?: StreamType
}

export interface MusicSite {
    resource: (song: Song) => AudioResource,
    getInfo: (url: string) => Promise<Song>,
    getId: (url:string) => Promise<null|string>,
    id: string
}