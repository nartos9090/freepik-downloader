import {join, resolve} from 'path'
import {readdirSync, readFileSync, statSync, unlinkSync} from "fs";
import {getSavedCookie, saveCookie} from "./cookie";
import puppeteer, {Browser} from 'puppeteer'

const DOWNLOAD_PATH = resolve('./download')
const DOWNLOAD_BUTTON_SELECTOR = 'button.download-button'

export const downloadByUrl = async (url: string): Promise<Downloaded> => {
    let bootUrl = 'https://freepik.com'
    const browser = await puppeteer.launch({headless: true})
    const page = await browser.newPage()

    await page.goto(bootUrl)

    /* Set cookies */
    const cookiesObject = getSavedCookie()
    const cookies = Object.keys(cookiesObject).map(key => ({name: key, value: cookiesObject[key]}))

    await page.setCookie(...cookies)
    await page.cookies(bootUrl)

    /* Set download behaviour */
    const client = await page.target().createCDPSession()
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: DOWNLOAD_PATH,
    })

    try {
        await page.goto(url)
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true)
            }, 5000)
        })

        const counter = await page.evaluate(() => {
            const counterRaw = document.getElementById('icons_downloaded_counters')?.innerHTML
            if (counterRaw) {
                return counterRaw.split('/').map(Number)
            }
            return null
        })

        if (counter?.[1] !== 100) {
            throw new Error('token expired')
        }

        const count = counter[0]

        const thumbnail = await page.evaluate(() => {
            const thumb = document.querySelector('.thumb')
            return thumb?.getAttribute('src')
        })

        await page.click(DOWNLOAD_BUTTON_SELECTOR)
        console.info('downloading', url)

        refreshCookie(await page.cookies())
        console.info('refresh cookie')

        return await new Promise((res, rej) => {
            const filename = url.replace(/^https?:\/\//, '').split('/')[2].split('_')[0]
            let counter = 0
            const interval = setInterval(() => {
                const files = readdirSync(DOWNLOAD_PATH + '/')
                const file = files.find((v) => v.includes(filename) && !v.includes('.crdownload'))
                if (file) {
                    const downloaded = new Downloaded(join(resolve('./download'), './' + file), file, thumbnail, count)
                    console.info('downloaded', url)
                    res(downloaded)
                    clearInterval(interval)
                }
                if (counter >= 100) {
                    console.error('failed to download', url)
                    rej()
                }
                counter++
            }, 2000)
        })
    } catch (e) {
        console.error(e)
        throw new Error(e)
    } finally {
        browser.close()
    }
}

function refreshCookie(cookie: puppeteer.Protocol.Network.Cookie[]) {
    const cookiesObject = cookie.reduce((a, c) => {
        a[c.name] = c.value
        return a
    }, {})

    saveCookie(cookiesObject)
}

export class Downloaded {
    public path: string
    public filename: string
    public thumbnail: string
    public count: number
    public size: number
    public mime: string

    constructor(path, filename, thumbnail, count) {
        this.path = path
        this.filename = filename
        this.thumbnail = thumbnail
        this.count = count
        const stat = statSync(path)
        this.size = stat.size
        // this.mime = mimeTypes.contentType(path.extname(path))
    }

    delete(): void {
        unlinkSync(this.path)
    }

    get(encode: boolean = false): Buffer {
        // @ts-ignore
        return readFileSync(this.path, {...encode && {encoding: 'base64'}});
    }

    toJSON() {
        return {
            file: readFileSync(this.path, {encoding: 'base64'}),
            filename: this.filename,
            thumbnail: this.thumbnail,
            count: this.count,
            size: this.size,
            // mime: this.mime,
        }
    }
}
