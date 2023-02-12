import {Queue} from './model'
import freepik from '../index'
import axios from "axios";
import {Downloaded} from "../puppeteer-v2";

type QueueItem = {
    webhook_url: string
    download_url: string
}

let loggedIn: boolean = true

export const setLoggedIn = () => {
    loggedIn = true
    start()
}

const start = async () => {
    if (!loggedIn || await Queue.count({status: 'downloading'})) {
        return
    }
    let item = await Queue.findOne({status: 'queued'})
    while (item && loggedIn) {
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

    const payload: any = {
        id: item.id,
        download_url: item.download_url,
        token: item.token,
    }
    let file: Downloaded

    try {
        file = await freepik.downloadByUrlV2(item.download_url)
        payload.status = 'completed'
        payload.size = file.size
        payload.filename = file.filename
        payload.thumbnail = file.thumbnail
        payload.count = file.count
        await item.updateOne({status: 'completed', filename: file.filename})
    } catch (e) {
        console.log('failed to download', item.download_url)
        if (e.message === 'Error: token expired') {
            payload.status = 'token expired'
            loggedIn = false
            await item.updateOne({status: 'queued'})
        } else {
            payload.status = 'failed'
            await item.updateOne({status: 'failed'})
        }
    }

    // TODO: add retry for failure
    await axios.post(item.webhook_url, payload)
        .then((res) => {
            console.log('notification sent', item.download_url)
        }).catch((e) => {
            console.log(e?.message || e?.response?.data || e)
        })
}

start()

export default {
    start,
    add,
}