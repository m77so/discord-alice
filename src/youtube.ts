import ytdl from 'ytdl-core-discord'
import { VoiceConnection, StreamDispatcher} from 'discord.js'
import { Song, MusicSite } from './interface'
import {URL} from 'url'
const id = 'youtube'


const play = async function(song: Song, connection: VoiceConnection): Promise<StreamDispatcher> {
    return connection.play(await ytdl(song.url), { bitrate: "auto", type: 'opus', highWaterMark: 64 })
}

const getInfo = async function (url: string): Promise<Song> {
    const songInfo = await ytdl.getInfo(url)
    return {
        site: id,
        title: songInfo.title,
        url: songInfo.video_url,
        duration: parseInt(songInfo.length_seconds),
    }
}

const getId = async function(url: string): Promise<string | null> {
    let urlobj: URL = null
    try{
        urlobj = new URL(url)
    } catch (err) {
        if(err.code === 'ERR_INVALID_URL') return null
        console.error(err)
        return null
    }
    if (!(['youtube.com', 'www.youtube.com', 'youtu.be'].includes(urlobj.hostname))) return null
    if (urlobj.hostname === 'youtu.be') return urlobj.pathname.substr(1)
    return urlobj.searchParams.get('v')
}


const Youtube: MusicSite = {
    play, getInfo, getId, id
}

export default Youtube