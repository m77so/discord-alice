import { VoiceConnection, StreamDispatcher} from 'discord.js'
import { Converter } from 'ffmpeg-stream'
import { Song, MusicSite } from './interface'
import { execSync } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
const {
    nico_email,
    nico_password,
} = require('./config.json')
const id = 'twitter'


const getId = function(url: string): string | null {
    let urlobj: URL = null
    try{
        urlobj = new URL(url)
    } catch (err) {
        if(err.code === 'ERR_INVALID_URL') return null
        console.error(err)
        return null
    }
    if (!(['twitter.com', 'www.twitter.com'].includes(urlobj.hostname))) return null
    const res = /\/status\/(\d+)/.exec(url)
    if (res === null || res[1] === undefined) return null
    return res[1]
}
const getInfo = async function (url: string): Promise<Song> {
    const smid = getId(url)
    try {

        return {
            site: id,
            title: '未対応',
            url: url,
            duration: -1
        }
    } catch (err) {
        console.error(err)
    }
}

const play = async function(url: string, connection: VoiceConnection): Promise<StreamDispatcher> {
    const tweetid = getId(url)
    const command = `cd ${path.resolve('./twitter-python')} && pipenv run twitter-dl --video --nophoto  --tweet ${tweetid} -c config.json dest`
    const res = execSync(command)
    console.log(res)
    const filename = path.resolve(`./twitter-python/dest`, `${tweetid}-1.mp4`)
    console.log(filename)
    const converter = new Converter()
    const input = converter.createInputStream({
        f: "mp4",
    })
    fs.createReadStream(filename).pipe(input)
    const output = converter.createOutputStream({
        acodec: "libmp3lame",
        f: "mp3"
    })
    const dispatcher = connection.play(output,  { bitrate: "auto" })
    converter.run() // awaitしない
    return dispatcher
}


const Twitter: MusicSite = {
    play, getInfo, getId, id
}

export default Twitter