const express = require('express')
const axios = require('axios')
import * as dotenv from 'dotenv'
import { createWriteStream, unlinkSync } from 'fs'
dotenv.config()

const app = express()
const PORT = 3001

// Generate a random string for id
const id = Math.random().toString(36).substring(2, 10)

const download_url = process.env.TEST_DOWNLOAD_URL
const cookie = process.env.TEST_COOKIE

const API_URL = 'http://localhost:3000'
const apiInstance = axios.create({
    baseURL: API_URL,
})

app.use(express.json())

// Webhook endpoint
app.post('/webhook/:id', (req, res) => {
    if (req.params.id !== id) {
        console.log('Webhook received with invalid ID')
        return res.status(400).json({ success: false, message: 'Invalid ID' })
    }

    console.log('Webhook received with valid ID:', req.body)
    res.status(200).json({ success: true, message: 'Valid webhook' })

    download(req.body.id)
})

const download = async (id: string) => {
    const response = await apiInstance.get(`/v2/queue/download?id=${id}`, {
        responseType: 'stream'
    })

    const contentDisp = response.headers['content-disposition']
    const filename = contentDisp ? contentDisp.split('filename=')[1].replace(/"/g, '') : `downloaded_${id}.zip`

    const filePath = `./${filename}`
    const writer = createWriteStream(filePath)
    response.data.pipe(writer)

    writer.on('finish', async () => {
        console.log(`File downloaded successfully as ${filePath}`);
        unlinkSync(filePath)
    })
}

const test = async () => {
    console.log('Running test')
    try {
        console.log('Downloading as', id)
        // Step 1: set cookie
        await apiInstance.post('/set-cookie', {
            cookie: cookie
        })
        console.log('Cookie set successfully')

        // Step 2: add queue
        const webhook_url = `http://localhost:${PORT}/webhook/${id}`
        await apiInstance.post('/v2/queue', {
            download_url,
            webhook_url,
        })
        console.log('Download request sent')
    } catch (error) {
        console.error('Error in test script:', error.response?.data || error.message || error)
    }
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)

    test()
})
