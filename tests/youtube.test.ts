import Youtube from '../src/youtube'

test('info', async () => {
    const songInfo = await Youtube.getInfo('https://www.youtube.com/watch?v=M1jTgXgEPFo&feature=youtu.be')
    expect(songInfo.site).toBe('youtube')
    expect(songInfo.title).toBe('Neko Hacker - Chocolate Adventure feat. ななひら')
    expect(songInfo.url).toBe('https://www.youtube.com/watch?v=M1jTgXgEPFo')
})

test('getid', () => {
    expect(Youtube.getId('https://www.youtube.com')).toBeNull()

    expect(Youtube.getId('https://www.youtube.com/watch?v=M1jTgXgEPFo&feature=youtu.be')).toBe( 'M1jTgXgEPFo')
    expect(Youtube.getId('https://www.nicovideo.jp/watch/nm2829323')).toBeNull()
    expect(Youtube.getId('https://youtu.be/3k6cHJn3eLE')).toBe('3k6cHJn3eLE')
    expect(Youtube.getId('https://google.com')).toBeNull()
    expect(Youtube.getId('🍣')).toBeNull()
    expect(Youtube.getId('我々は宇宙人だ')).toBeNull()

})