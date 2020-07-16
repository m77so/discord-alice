import * as Discord from 'discord.js'
import Niconico from './niconico'
import Youtube from './youtube'
import Twitter from './twitter'
import { Song, MusicSite } from './interface'

const {
    prefix,
    token,
} = require('./config.json')

const client = new Discord.Client();
client.login(token);

client.once('ready', () => {
    console.log('Ready!');
});

client.once('disconnect', () => {
    console.log('Disconnect!');
});

interface GuildQueue {
    songs: Song[],
    connection: Discord.VoiceConnection | null,
    volume: number,
    last_text_channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel | null
}
type Queue = { [key: string]: GuildQueue }
const queue: Queue = {}
const queueConstructor = function (q: Queue, id: string) {
    q[id] = { songs: [], connection: null, volume: 10, last_text_channel: null }
}

const musicSites: MusicSite[] = [Niconico, Youtube, Twitter]

const play = async function (q: GuildQueue, song: Song) {
    if (song === undefined) {
        q.connection = null
        console.log('song is undef')
        return
    }

    let dispatcher: Discord.StreamDispatcher = null

    for(const musicSite of musicSites) {
        if (song.site === musicSite.id) {
            dispatcher = await musicSite.play(song.url, q.connection)
            break
        }
    }

    if (dispatcher === null) {
        if (q.last_text_channel !== null)
            return q.last_text_channel.send("再生に失敗しました")
        return
    }

    dispatcher.setVolumeLogarithmic(q.volume / 100)

    dispatcher.on('finish', () => {
        q.songs.shift()
        play(q, q.songs[0])
    })
        .on("error", error => console.error(error));
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

    for(const musicSite of musicSites) {
        if (musicSite.getId(url) !== null) {
            song = await musicSite.getInfo(url)
            break
        }
    }

    if (song === null) return message.channel.send(`URL: ${url} がわかりませんでした`)
    q.songs.push(song)
    if (q.connection !== null) {
        return message.channel.send("曲を待ち行列に追加しました")
    }

    try {
        const connection = await voiceChannel.join()
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
    if (q.connection !== null && q.connection.dispatcher !== null )
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
        showQueue(message, serverQueue)
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

