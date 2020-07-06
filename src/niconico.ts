import { niconico, Nicovideo } from 'niconico'
import { VoiceConnection, StreamDispatcher} from 'discord.js'
import { Converter } from 'ffmpeg-stream'

const {
    nico_email,
    nico_password,
} = require('./config.json')

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

const getInfo = async function (url: string) {
    const smid = /sm\d+/.exec(url)[0]
    try {
        const session = await niconico.login(
            nico_email, nico_password
        )
        const client = new Nicovideo(session)

        const songInfo = await client.thumbinfo(smid)
        return {
            site: 'nicovideo',
            title: songInfo.title,
            url: url,
            duration: -1
        }
    } catch (err) {
        console.error(err)
    }
}

const play = async function(url: string, connection: VoiceConnection): Promise<StreamDispatcher> {
    const smid = /sm\d+/.exec(url)[0]
    const converter = new Converter()
    const input = converter.createInputStream({
        f: "mp4",
    })
    const nicostream = await nicoStream(smid)
    nicostream.data.pipe(input)
    const output = converter.createOutputStream({
        acodec: "libmp3lame",
        f: "mp3"
    })
    const dispatcher = connection.play(output,  { bitrate: "auto" })
    await converter.run()
    return dispatcher
}

export default {
    play, getInfo, 
}