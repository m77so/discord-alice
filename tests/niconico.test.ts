import Niconico from '../src/niconico'

test('info', async () => {
    const songInfo = await Niconico.getInfo('https://www.nicovideo.jp/watch/sm14951608')
    expect(songInfo.site).toBe('niconico')
    expect(songInfo.title).toBe('組曲『ニコニコ動画』改(茶畑∴+ななひら)')
    expect(songInfo.url).toBe('https://www.nicovideo.jp/watch/sm14951608')
})

test('getid', () => {
    expect(Niconico.getId('https://www.nicovideo.jp')).toBeNull()

    expect(Niconico.getId('https://www.nicovideo.jp/watch/sm13256898')).toBe( 'sm13256898')
    expect(Niconico.getId('https://www.nicovideo.jp/watch/nm2829323')).toBeNull()
    expect(Niconico.getId('http://nico.ms/sm36297364?cp_webto=share_tw-androidapp')).toBe('sm36297364')
    expect(Niconico.getId('https://youtube.com')).toBeNull()
    expect(Niconico.getId('🍣')).toBeNull()
    expect(Niconico.getId('我々は宇宙人だ')).toBeNull()

})