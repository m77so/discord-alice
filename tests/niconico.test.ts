import Niconico from '../src/niconico'

test('info', async () => {
    const songInfo = await Niconico.getInfo('https://www.nicovideo.jp/watch/sm14951608')
    expect(songInfo.site).toMatch('nicovideo')
    expect(songInfo.title).toMatch('組曲『ニコニコ動画』改(茶畑∴+ななひら)')
    expect(songInfo.url).toMatch('https://www.nicovideo.jp/watch/sm14951608')
})
