import { niconico, Nicovideo } from 'niconico'
import { Song, MusicSite } from './interface'
import {
    nico_email,
    nico_password,
} from './config'
import { PassThrough } from 'stream'
import { AudioResource, createAudioResource, StreamType } from '@discordjs/voice'
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
const getId = async function(url: string): Promise<string | null> {
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
    const smid = await getId(url)
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

const resource = function (song: Song): AudioResource {
    const stream = new PassThrough({
        highWaterMark: 1024 * 512,
      });

    const smid = /sm\d+/.exec(song.url)[0]
    nicoStream(smid).then(ns=> {
        ns.pipe(stream)
    })

    const resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true
    });
    return resource
}

const Niconico: MusicSite = {
    resource, getInfo, getId, id
}

export default Niconico