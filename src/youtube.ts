import ytdl from 'ytdl-core'
import { Song, MusicSite } from './interface'
import {URL} from 'url'
const id = 'youtube'
import { AudioResource,  createAudioResource,StreamType } from '@discordjs/voice';


const resource = function(song: Song): AudioResource {
    const stream = ytdl(ytdl.getURLVideoID(song.url), {
        // filter: format => format.audioCodec === 'opus' && format.container === 'webm', //webm opus
        quality: 'highest',
        highWaterMark: 32 * 1024 * 1024, // https://github.com/fent/node-ytdl-core/issues/902
      }
      );
    const resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true
    });
    return resource
}

const getInfo = async function (url: string): Promise<Song> {
    const songInfo = await ytdl.getInfo(url)
    console.info(songInfo.formats.map(v=>[v.audioCodec, v.container, v.mimeType, v.itag ]))
    console.info(songInfo.formats)
    console.info("112")
    return {
        site: id,
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
        duration: parseInt(songInfo.videoDetails.lengthSeconds),
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
    resource, getInfo, getId, id
}

export default Youtube