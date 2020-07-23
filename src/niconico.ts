import { niconico, Nicovideo } from 'niconico'
import { VoiceConnection, StreamDispatcher} from 'discord.js'
import { Converter } from 'ffmpeg-stream'
import { Song, MusicSite } from './interface'
const {
    nico_email,
    nico_password,
} = require('./config.json')
const id = 'niconico'

const nicoStream = async function (videoId: string) {
    try {
        const session = await niconico.login(
            nico_email, nico_password
        )
        const client = new Nicovideo(session)

        return client.stream(videoId)
    } catch (err) {
        console.error(err)
    }
}
const getId = function(url: string): string | null {
    let urlobj: URL = null
    try{
        urlobj = new URL(url)
    } catch (err) {
        if(err.code === 'ERR_INVALID_URL') return null
        console.error(err)
        return null
    }
    if (!(['nicovideo.jp', 'www.nicovideo.jp', 'nico.ms'].includes(urlobj.hostname))) return null
    const smids = /sm\d+/.exec(url)
    if (smids === null) return null
    return smids[0]
}
const getInfo = async function (url: string): Promise<Song> {
    const smid = getId(url)
    try {
        const session = await niconico.login(
            nico_email, nico_password
        )
        const client = new Nicovideo(session)

        const songInfo = await client.thumbinfo(smid)
        return {
            site: id,
            title: songInfo.title,
            url: url,
            duration: -1
        }
    } catch (err) {
        console.error(err)
    }
}

const play = async function(song: Song, connection: VoiceConnection): Promise<StreamDispatcher> {
    const smid = /sm\d+/.exec(song.url)[0]
    const converter = new Converter()
    const input = converter.createInputStream({
        f: "mp4",
    })
    const nicostream = await nicoStream(smid)
    nicostream.pipe(input)
    const output = converter.createOutputStream({
        acodec: "libmp3lame",
        f: "mp3"
    })
    const dispatcher = connection.play(output,  { bitrate: "auto" })
    converter.run() // awaitしない
    return dispatcher
}


const Niconico: MusicSite = {
    play, getInfo, getId, id
}

export default Niconico