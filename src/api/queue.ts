import { Queue } from './model'
import freepik from '../index'
import axios from "axios";
import { WebhookPayload } from './type';

let loggedIn: boolean = true

export const setLoggedIn = () => {
    loggedIn = true
    start()
}

const start = async () => {
    if (!loggedIn || await Queue.isDownloading()) {
        return
    }

    let item
    do {
        if (item) {
            await download(item)
        }

        item = await Queue.peek()
    } while (item && loggedIn)
}

const add = (webhook_url: string, download_url: string) => {
    return Queue.enqueue(webhook_url, download_url)
}

const download = async (item) => {
    Queue.updateStatus(item.id, "downloading")

    const payload: WebhookPayload = {
        id: item.id,
        download_url: item.download_url,
        token: item.token,
        status: null,
        size: null,
        filename: null,
        thumbnail: null,
        count: null,
    }

    try {
        const file = await freepik.downloadByUrlV2(item.download_url)

        payload.status = 'completed'
        payload.size = file.size
        payload.filename = file.filename
        payload.thumbnail = file.thumbnail
        payload.count = file.count

        Queue.dequeue(item.id, payload.filename)
    } catch (e) {
        console.log('failed to download', item.download_url)
        console.log(e)
        if (e.message === 'Error: token expired') {
            payload.status = 'token expired'
            loggedIn = false
            Queue.updateStatus(item.id, "queued")
        } else {
            payload.status = 'failed'
            Queue.updateStatus(item.id, "failed")
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