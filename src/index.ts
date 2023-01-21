import * as Discord from 'discord.js'
import * as DiscordVoice from '@discordjs/voice'

// import Niconico from './niconico'
import Youtube from './youtube'
// import Twitter from './twitter'
// import YoutubeDl from './youtube-dl'
import { Song, MusicSite } from './interface'

import { prefix, token } from './config'
import { AudioPlayerStatus, createAudioPlayer } from '@discordjs/voice'


const client = new Discord.Client({intents:[
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.MessageContent,
]});
client.login(token);

client.once('ready', () => {
    console.log('Ready!');
});

client.once('disconnect', () => {
    console.log('Disconnect!');
});

interface GuildQueue {
    songs: Song[],
    connection: DiscordVoice.VoiceConnection | null,
    subscription: DiscordVoice.PlayerSubscription | null,
    player: DiscordVoice.AudioPlayer | null,
    resource: DiscordVoice.AudioResource | null,
    volume: number,
    last_text_channel: Discord.TextBasedChannel | null
}
type Queue = { [key: string]: GuildQueue }
const queue: Queue = {}
const queueConstructor = function (q: Queue, id: string) {
    q[id] = { songs: [], connection: null, subscription: null, player: null, resource: null, volume: 10, last_text_channel: null }
}

// const musicSites: MusicSite[] = [Niconico, Twitter, Youtube, YoutubeDl]
const musicSites: MusicSite[] = [Youtube]

const connection_close = function (q: GuildQueue) {
    q.songs = []
    q.player.stop()
    q.connection.disconnect()
    q.connection.destroy()
    q.player = null
    q.connection = null
}

const play = async function (q: GuildQueue, song: Song) {
    if (song === undefined) {
        q.connection = null
        console.log('song is undef')
        return
    }
    if (q.player === null){
        const player = createAudioPlayer()
        q.connection.subscribe(player)

        player.on('error', error => {
            console.error(`Error: ${error.message}`);
            return q.last_text_channel.send("再生に失敗しました")
        })
    
        player.on(AudioPlayerStatus.Idle, () => {
            q.songs.shift()
            if(q.songs.length > 0){
                play(q, q.songs[0])
            } else {
                connection_close(q)
            }
        })


        q.player = player
    }

    for (const musicSite of musicSites) {
        if (song.site === musicSite.id) {
            q.resource = musicSite.resource(song)
            q.player.play(q.resource)
            q.resource.volume.setVolumeLogarithmic(q.volume / 100)

            await DiscordVoice.entersState(q.player, AudioPlayerStatus.Playing, 10 * 1000)

            break
        }
    }
    


}


const append = async function (message: Discord.Message, q: GuildQueue) {
    const args = message.content.split(" ").filter(str => str !== "");
    const voiceChannel = message.member.voice.channel
    if (!voiceChannel) {
        return message.channel.send("ボイスチャンネルに参加して")
    }
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has(Discord.PermissionFlagsBits.Connect) || !permissions.has(Discord.PermissionFlagsBits.Speak)) {
        return message.channel.send(
            "チャンネルに参加して発話する権利をください"
        );
    }
    console.log(args)
    const url = args[1]
    let song: Song = null;

    for(const musicSite of musicSites) {
        const musicId = await musicSite.getId(url)
        if ( musicId !== null) {
            try{
                song = await musicSite.getInfo(url)
            } catch (err) {
                return message.channel.send(err)
            }
            break
        }
    }

    if (song === null) return message.channel.send(`URL: ${url} がわかりませんでした`)
    q.songs.push(song)
    if (q.connection !== null ) {
        console.log(q)
        return message.channel.send("曲を待ち行列に追加しました")
    }

    try {
        const connection = DiscordVoice.joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: false,
        })
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
    if (message.member.voice.channel.id !== q.connection.joinConfig.channelId) {
        return message.channel.send("聞いている人だけが止められます")
    }
    q.player.stop()
}

const stop = function (message: Discord.Message, q: GuildQueue) {
    if (message.member.voice.channel === null || message.member.voice.channel.id !== q.connection.joinConfig.channelId) {
        return message.channel.send("聞いている人だけが止められます")
    }
    connection_close(q)
}

const showQueue = function (message: Discord.Message, q: GuildQueue) {
    const msgEmbed = new Discord.EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("きゅー")
        .setTimestamp()
    

    q.songs.forEach((s, idx) => {
        msgEmbed.addFields({
            name: `Track ${idx + 1}`,
            value: `[${s.title}](${s.url}) ${s.duration}sec`
        })
    })
    message.channel.send({embeds: [msgEmbed]})
}

const setVolume = function (message: Discord.Message, q: GuildQueue) {
    const args = message.content.split(" ").filter(str => str !== "");
    const vol = parseInt(args[1]);
    if (!(vol > 0 && vol < 1e5)) {
        return message.channel.send('不正な値です')
    }
    if (q.connection !== null && q.player !== null )
        q.resource.volume.setVolumeLogarithmic(vol / 100)

    q.volume = vol
    message.channel.send(`Volumeを${vol}に設定しました${vol > 100 ? '💔💔💔' : ''}`)
}

client.on('messageCreate', async message => {
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
        await append(message, serverQueue)
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

