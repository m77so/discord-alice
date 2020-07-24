import { VoiceConnection, StreamDispatcher } from 'discord.js'
import { MusicSite, Song } from './interface'
import Twit from 'twit'
import {
    twitter_consumer_key, twitter_consumer_secret
} from './config'

const id = 'twitter'


const getId = async function (url: string): Promise<string | null> {
    let urlobj: URL = null
    try {
        urlobj = new URL(url)
    } catch (err) {
        if (err.code === 'ERR_INVALID_URL') return null
        console.error(err)
        return null
    }
    if (!(['twitter.com', 'www.twitter.com'].includes(urlobj.hostname))) return null
    const res = /\/status\/(\d+)/.exec(url)
    if (res === null || res[1] === undefined) return null
    return res[1]
}
const getInfo = async function (url: string): Promise<Song> {
    const tweetid = await getId(url)
    const T = new Twit({
        consumer_key: twitter_consumer_key,
        consumer_secret: twitter_consumer_secret,
        app_only_auth: true
    })
    const video_urls = []
    const video_durations = []
    const tweet = await T.get('/statuses/show', { id: tweetid, 'include_entities': true, 'tweet_mode': 'extended' })
    if ('extended_entities' in tweet.data && 'media' in tweet.data['extended_entities']) {
        const exe = tweet.data['extended_entities']
        for (const media of exe.media) {
            if (!(media['type'] === 'video' || media['type'] === 'animated_gif')) continue
            const videos = media['video_info']['variants']
                .filter(a => a['content_type'] === 'video/mp4')
                .sort((a, b) => (a['bitrate']) - b['bitrate'])
                .reverse() // highest bitrate video first
            video_urls.push(videos[0])
            video_durations.push(media['video_info']['duration_mills']/1000)
        }
    }
    if (video_urls.length === 0){
        throw new Error('This tweet does not contain any video.')
    }
    const text = tweet.data['full_text']
    
    try {

        return {
            site: id,
            title: text,
            url: url,
            duration: video_durations[0],
            source_url: video_urls[0].url
        }
    } catch (err) {
        console.error(err)
    }
}

const play = async function (song: Song, connection: VoiceConnection): Promise<StreamDispatcher> {
    console.log(song.source_url)
    const dispatcher = connection.play(song.source_url, { bitrate: "auto" })
    return dispatcher
}


const Twitter: MusicSite = {
    play, getInfo, getId, id
}

export default Twitter