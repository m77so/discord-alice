import { niconico, Nicovideo } from 'niconico'
import * as Discord from 'discord.js'
import ytdl from 'ytdl-core-discord';
import {Converter } from 'ffmpeg-stream'

const {
    prefix,
    token,
    nico_email,
    nico_password,
} = require('./config.json')

const client = new Discord.Client();
client.login(token);

client.once('ready', () => {
    console.log('Ready!');
});

client.once('disconnect', () => {
    console.log('Disconnect!');
});

interface Song {
    url: string,
    title: string,
    site: string,
    duration: number,
}
interface GuildQueue {
    songs: Song[],
    connection: Discord.VoiceConnection | null,
    volume: number,
    last_text_channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel | null
}
type Queue = { [key: string]: GuildQueue }
const queue: Queue = {}
const queueConstructor = function (q: Queue, id: string) {
    q[id] = { songs: [], connection: null, volume: 100, last_text_channel: null }
}

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

const nicoThumb = async function (videoId: string) {
    try {
        const session = await niconico.login(
            nico_email, nico_password
        )
        const client = new Nicovideo(session)

        const res = await client.thumbinfo(videoId)
        return res
    } catch (err) {
        console.error(err)
    }
}

const play = async function (q: GuildQueue, song: Song) {
    if (song === undefined) {
        q.connection = null
        console.log('song is undef')
        return
    }

    let dispatcher: Discord.StreamDispatcher = null

    console.log(song, song.site , song.site ==='nicovideo')
    if (song.site === 'nicovideo') {
        const smid = /sm\d+/.exec(song.url)[0]
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
        dispatcher = q.connection.play(output,  { bitrate: "auto" })
        await converter.run()
    }
    else if (song.site === 'youtube')
        dispatcher = q.connection.play(await ytdl(song.url), { bitrate: "auto", type: 'opus' })

    if (dispatcher === null) {
        if (q.last_text_channel !== null)
            return q.last_text_channel.send("再生に失敗しました")
        return
    }

    dispatcher.on('finish', () => {
        q.songs.shift()
        play(q, q.songs[0])
    })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(q.volume / 100)
}


const append = async function (message: Discord.Message, q: GuildQueue) {
    const args = message.content.split(" ").filter(str => str !== "");
    const voiceChannel = message.member.voice.channel
    if (!voiceChannel) {
        return message.channel.send("ボイスチャンネルに参加して")
    }
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send(
            "チャンネルに参加して発話する権利をください"
        );
    }
    console.log(args)
    const url = args[1]
    let song: Song = null;
    if (/^https:\/\/(www\.)?youtube.com/i.exec(url) !== null || /^https:\/\/(www\.)?youtu.be/i.exec(url) !== null) {
        const songInfo = await ytdl.getInfo(args[1])
        song = {
            site: 'youtube',
            title: songInfo.title,
            url: songInfo.video_url,
            duration: parseInt(songInfo.length_seconds),
        }
    } else if (/^https:\/\/(www\.)?nicovideo.jp/i.exec(url) !== null) {
        const smid = /sm\d+/.exec(url)[0]
        const songInfo = await nicoThumb(smid)
        song = {
            site: 'nicovideo',
            title: songInfo.title,
            url: url,
            duration: -1
        }
    }
    if (song === null) return message.channel.send(`URL: ${url} がわかりませんでした`)
    q.songs.push(song)
    if (q.connection !== null) {
        return message.channel.send("曲を待ち行列に追加しました")
    }

    try {
        const connection = await voiceChannel.join()
        console.log(2345)
        q.connection = connection;
        play(q, q.songs[0])
    } catch (err) {
        q.connection = null
    }
}

const skip = function (message: Discord.Message, q: GuildQueue) {
    if (q.songs.length < 1) {
        return message.channel.send("曲が流れていません")
    }
    if (message.member.voice.channel.id !== q.connection.channel.id) {
        return message.channel.send("聞いている人だけが止められます")
    }
    q.connection.dispatcher.end()
}

const stop = function (message: Discord.Message, q: GuildQueue) {
    if (message.member.voice.channel === null || message.member.voice.channel.id !== q.connection.channel.id) {
        return message.channel.send("聞いている人だけが止められます")
    }
    q.songs = []
    q.connection.dispatcher.end()
}

const showQueue = function (message: Discord.Message, q: GuildQueue) {
    const msg = {
        embed: {
            title: "きゅー",
            timestamp: new Date(),
            fields: []
        }
    }
    q.songs.forEach((s, idx) => {
        msg.embed.fields.push({
            name: `Track ${idx + 1}`,
            value: `[${s.title}](${s.url}) ${s.duration}sec`
        })
    })
    message.channel.send(msg)
}

const setVolume = function (message: Discord.Message, q: GuildQueue) {
    const args = message.content.split(" ").filter(str => str !== "");
    const vol = parseInt(args[1]);
    if (!(vol > 0 && vol < 1e5)) {
        return message.channel.send('不正な値です')
    }
    q.connection.dispatcher.setVolumeLogarithmic(vol / 100)
    q.volume = vol
    message.channel.send(`Volumeを${vol}に設定しました${vol > 100 ? '💔💔💔' : ''}`)
}
client.on('message', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    console.log(message.content)
    if (!(message.guild.id in queue)) {
        queueConstructor(queue, message.guild.id)
    }
    console.log(queue)
    const serverQueue = queue[message.guild.id]
    serverQueue.last_text_channel = message.channel
    if (message.content.startsWith(`${prefix}play`)) {
        append(message, serverQueue)
    } else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue)
    } else if (message.content.startsWith(`${prefix}stop`)) {
        stop(message, serverQueue)
    } else if (message.content.startsWith(`${prefix}q`)) {
        showQueue(message, serverQueue)
    } else if (message.content.startsWith(`${prefix}dumpq`)) {
        console.log(serverQueue)
    } else if (message.content.startsWith(`${prefix}volume`)) {
        setVolume(message, serverQueue)
    }
})

