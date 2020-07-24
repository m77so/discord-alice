let configfileExists: boolean = true
let configjson
try{
    configjson = require('./config.json')
}catch (err) {
    configfileExists = false
}
const env = process.env

export const prefix = env['PREFIX'] || configjson['prefix']
export const token = env['TOKEN'] || configjson['token']
export const nico_email = env['NICO_EMAIL'] || configjson['nico_email']
export const nico_password = env['NICO_PASSWORD'] || configjson['nico_password']
export const twitter_consumer_key = env['TWITTER_CONSUMER_KEY'] || configjson['twitter_consumer_key']
export const twitter_consumer_secret = env['TWITTER_CONSUMER_SECRET'] || configjson['twitter_consumer_secret']
