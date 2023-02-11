import {Queue} from './model'
import freepik from '../index'
import axios from "axios";
import {Downloaded} from "../puppeteer-v2";

const Formdata = require('form-data')

type QueueItem = {
    webhook_url: string
    download_url: string
}

const start = async () => {
    if (await Queue.count({status: 'downloading'})) {
        return
    }
    let item = await Queue.findOne({status: 'queued'})
    while (item) {
        if (item) {
            await download(item)
        }
        item = await Queue.findOne({status: 'queued'})
    }
}

const add = async (item: QueueItem) => {
    return Queue.create(item)
}

const download = async (item) => {
    await item.updateOne({status: 'downloading'})

    const payload: any = {}
    let file: Downloaded

    try {
        file = await freepik.downloadByUrlV2(item.download_url)
        payload.status = 'completed'
        payload.id = item.id
        payload.download_url = item.download_url
        payload.size = file.size
        payload.filename = file.filename
        payload.thumbnail = file.thumbnail
        payload.count = file.count
        payload.file = file.get(true)
        await item.updateOne({status: 'completed'})
    } catch (e) {
        console.log('failed to download', item.download_url)
        payload.set('status', 'failed')
        await item.updateOne({status: 'failed'})
    }

    // TODO: add retry for failure
    await axios.post(item.webhook_url, payload, {maxBodyLength: Infinity, maxContentLength: Infinity})
        .then(() => {
            file.delete()
        })
}

start()

export default {
    start,
    add,
}