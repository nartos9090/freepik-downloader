import freepik from '../index'
import downloadQueue, { setLoggedIn } from "./queue"
import { join, resolve } from "path"
import { Queue } from "./model"
import { API_PORT } from '../config'

const bodyParser = require('body-parser')
const express = require('express')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/v2/download', async (req, res) => {
    const url = req.query.url

    try {
        const file = await freepik.downloadByUrlV2(url)

        // set headers of count
        res.setHeader('count', file.count)
        res.setHeader('max-count', file.maxCount)
        res.setHeader('filename', file.filename)
        res.setHeader('size', file.size)

        // set content disposition
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`)
        await res.send(file.get())
    } catch (e) {
        console.log(e)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
})

app.post('/set-cookie', async (req, res) => {
    const cookie = req.body.cookie
    freepik.setCookie(cookie)
    setLoggedIn()
    return res.status(200).end()
})

app.post('/v2/queue', async (req, res) => {
    const { webhook_url, download_url } = req.body
    const item = downloadQueue.add(webhook_url, download_url,)
    downloadQueue.start()
    return res.json(item)
})

app.get('/v2/queue/download', async (req, res) => {
    const { id } = req.query
    const item = Queue.findById(id)

    if (!item) {
        return res.status(404).json({ error: 'Not found' })
    }

    const path = join(resolve('./download'), './' + item.filename)
    res.setHeader('Content-Disposition', `attachment; filename="${item.filename}"`)
    await res.download(path, item.filename)

    Queue.setGarbage(id)
})

app.listen(API_PORT, () => {
    console.log(`Listening on port ${API_PORT}`)
})
