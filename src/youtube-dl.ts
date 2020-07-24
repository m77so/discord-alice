import youtubedl from 'youtube-dl'
import { VoiceConnection, StreamDispatcher} from 'discord.js'
import { Song, MusicSite } from './interface'
import { promisify } from 'util'
import {PassThrough, Duplex} from 'stream'
const id = 'youtube-dl'


const play = async function(song: Song, connection: VoiceConnection): Promise<StreamDispatcher> {
    const pt = new PassThrough()
    console.log(pt, song.url)
    youtubedl(song.url, [], { cwd: __dirname }).pipe(pt)
    return connection.play(pt, { bitrate: "auto"})
}

const getInfo = async function (url: string): Promise<Song> {
    const songInfo = await promisify(youtubedl.getInfo)(url, [])
    console.log('ss',url, songInfo)
    return {
        site: id,
        title: songInfo.title,
        url: songInfo.webpage_url,
        duration: parseInt(songInfo._duration_raw),
    }
}

const getId = async function(url: string): Promise<string|null> {
    const info = await getInfo(url)
    if (info.url === undefined) { return null}
    return info.url
}


const Youtube: MusicSite = {
    play, getInfo, getId, id
}

export default Youtube