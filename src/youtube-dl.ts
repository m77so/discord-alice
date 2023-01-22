import YTDlpWrap from 'yt-dlp-wrap';
import { Song, MusicSite } from './interface'
import { PassThrough } from 'stream'
import { AudioResource, createAudioResource, StreamType } from '@discordjs/voice'
import { join } from 'path'
const id = 'youtube-dl'
const ytdlp = new YTDlpWrap(join(__dirname, './yt-dlp_linux'))

const resource = function (song: Song): AudioResource {
    const stream = new PassThrough({
        highWaterMark: 1024 * 512,
      });
    ytdlp.execStream([
        song.url
    ]).pipe(stream)

    const resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true
    });
    return resource
}

const getInfo = async function (url: string): Promise<Song> {
    const songInfo = await ytdlp.getVideoInfo(url)
    console.log('ss',url, songInfo)
    return {
        site: id,
        title: songInfo.title,
        url: songInfo.webpage_url,
        duration: parseInt(songInfo.duration),
    }
}

const getId = async function(url: string): Promise<string|null> {
    const info = await getInfo(url)
    if (info.url === undefined) { return null}
    return info.url
}


const Youtube: MusicSite = {
    resource, getInfo, getId, id
}

export default Youtube