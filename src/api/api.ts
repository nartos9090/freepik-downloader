import freepik from '../index'
import {API_PORT} from "./config";
import downloadQueue, {setLoggedIn} from "./queue";
import {join, resolve} from "path";
import {Queue} from "./model";
import {unlinkSync} from "fs";

const bodyParser = require('body-parser')
const express = require('express')

const app = express()

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/download', async (req, res) => {
    const url = req.query.url

    try {
        const file = await freepik.downloadByUrl(url)
        await res.download(file.path)
        setTimeout(() => {
            file.delete()
        }, 100000)
    } catch (e) {
        console.log(e)
        return res.status(500).json({error: 'Internal Server Error'})
    }
})

app.get('/v2/download', async (req, res) => {
    const url = req.query.url

    try {
        const file = await freepik.downloadByUrlV2(url)
        await res.json(file)
        setTimeout(() => {
            file.delete()
        }, 100000)
    } catch (e) {
        console.log(e)
        return res.status(500).json({error: 'Internal Server Error'})
    }
})

app.post('/set-cookie', async (req, res) => {
    const cookie = req.body.cookie
    await freepik.setCookie(cookie)
    setLoggedIn()
    return res.status(200).end()
})

app.post('/v2/queue', async (req, res) => {
    const {webhook_url, download_url} = req.body
    const item = await downloadQueue.add({
        webhook_url,
        download_url,
    })
    downloadQueue.start()
    return res.json(item)
})

app.get('/v2/queue/download', async (req, res) => {
    const {id} = req.query
    const item = await Queue.findOne({_id: id})
    if (!item) {
        return res.status(404).json({error: 'Not found'})
    }
    const path = join(resolve('./download'), './' + item.filename)
    await res.download(path, item.filename)
    setTimeout(() => {
        unlinkSync(path)
    }, 600 * 1000)
})

app.listen(API_PORT, () => {
    console.log(`Listening on port ${API_PORT}`)
})
