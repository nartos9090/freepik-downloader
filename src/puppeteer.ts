import {join, resolve} from 'path'
import {readFileSync, unlinkSync, readdirSync} from "fs";
import {getSavedCookie, saveCookie} from "./cookie";
import puppeteer, {Browser, Cookie, Page, Protocol} from 'puppeteer'
import * as dotenv from 'dotenv'

dotenv.config()

const DOWNLOAD_PATH = resolve('./download')
const DOWNLOAD_BUTTON_SELECTOR = 'button.download-button'

const PUPPETEER_ARGS = process.env.PUPPETEER_ARGS?.split(',').map((arg) => arg.trim())
const PUPPETEER_HEADLESS = process.env.PUPPETEER_HEADLESS === 'true'
const PUPPETEER_EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH

const ID_PATTERN = /\d+?(?=\.htm)/

let browser: Browser
let page: Page
let booted = false

const boot = async () => {
    if (booted) {
        return
    }
    let bootUrl = 'https://freepik.com'

    /* Launch new instance */
    browser = await puppeteer.launch({
        executablePath: PUPPETEER_EXECUTABLE_PATH || undefined,
        headless: PUPPETEER_HEADLESS,
        args: PUPPETEER_ARGS
    })
    page = await browser.newPage()
    await page.goto(bootUrl)

    /* Set cookies */
    const cookiesObject = getSavedCookie()
    const cookies = Object.keys(cookiesObject).map(key => ({name: key, value: cookiesObject[key]}))

    const excludeCookie = ['OptanonConsent']
    await page.setCookie(...cookies.filter((cookie) => !excludeCookie.includes(cookie.name)))
    await page.cookies(bootUrl)

    /* Set download behaviour */
    const client = await page.target().createCDPSession()
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: DOWNLOAD_PATH,
    })

    booted = true
}

export const downloadByUrl = async (url: string): Promise<Downloaded> => {
    try {
        await boot()
        await page.goto(url)
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true)
            }, 5000)
        })
        await page.click(DOWNLOAD_BUTTON_SELECTOR)
        console.info('downloading', url)

        refreshCookie(await page.cookies())
        console.info('refresh cookie')

        return new Promise((res, rej) => {
            const filename = url.replace(/^https?:\/\//, '').split('/')[2].split('_')[0]
            let counter = 0
            const interval = setInterval(() => {
                const files = readdirSync(DOWNLOAD_PATH + '/')
                const file = files.find((v) => v.includes(filename) && !v.includes('.crdownload'))
                if (file) {
                    const downloaded = new Downloaded(join(resolve('./download'), './' + file), file)
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
        throw new Error('failed to download')
    }
}

function refreshCookie(cookie: Cookie[]) {
    const cookiesObject = cookie.reduce((a, c) => {
        a[c.name] = c.value
        return a
    }, {})

    saveCookie(cookiesObject)
}

export async function reboot() {
    console.log('REBOOT')
    if (booted) {
        await browser.close()
        browser = null
        booted = false
    }
}

export class Downloaded {
    public path: string
    public filename: string

    constructor(path, filename) {
        this.path = path
        this.filename = filename
    }

    delete(): void {
        unlinkSync(this.path)
    }

    get(): Buffer {
        return readFileSync(this.path);
    }
}
