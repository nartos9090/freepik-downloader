import {join, resolve} from 'path'
import {readdirSync, readFileSync, statSync, unlinkSync} from "fs";
import {getSavedCookie, saveCookie} from "./cookie";
import puppeteer, {Browser, CookieParam, Page} from 'puppeteer'
import * as dotenv from 'dotenv'

dotenv.config()

const DOWNLOAD_PATH = resolve('./download')
const ICON_DOWNLOAD_COUNTER_SELECTOR = 'a[href="/user/downloads#from-element=dropdown_menu"]'
const DOWNLOAD_BUTTON_SELECTOR = 'button.download-button'

let browser: Browser
let page: Page

let bootUrl = 'https://freepik.com'

const PUPPETEER_ARGS = process.env.PUPPETEER_ARGS?.split(',').map((arg) => arg.trim())
const PUPPETEER_HEADLESS = process.env.PUPPETEER_HEADLESS === 'true'
const PUPPETEER_EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH

const boot = async () => {
    /* Launch new instance */
    browser = await puppeteer.launch({
        executablePath: PUPPETEER_EXECUTABLE_PATH || undefined,
        headless: PUPPETEER_HEADLESS,
        args: PUPPETEER_ARGS
    })

    page = await browser.newPage()
    await page.goto(bootUrl)

    /* Set download behaviour */
    const client = await page.target().createCDPSession()
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: DOWNLOAD_PATH,
    })
}

const setCookie = async () => {
    const excludeCookie = ['OptanonConsent']
    const cookiesObject = getSavedCookie()
    const cookies = Object.keys(cookiesObject)
        .map((key, index): CookieParam => ({
            name: key,
            domain: '.freepik.com',
            path: '/',
            value: cookiesObject[key]
        }))

    await page.setCookie(...(cookies.filter((cookie) => !excludeCookie.includes(cookie.name))))
    await page.cookies(bootUrl)

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
}

export const downloadByUrl = async (url: string): Promise<Downloaded> => {
    if (!browser) {
        await boot()
    }

    await setCookie()

    try {
        await page.goto(url)
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true)
            }, 5000)
        })

        await page.waitForSelector('button:has(img[alt="avatar"])', {timeout: 10000}).catch(() => {
            throw new Error('Token expired 1')
        })

        await page.click('button:has(img[alt="avatar"])')

        await new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true)
            }, 1000)
        })

        await page.waitForSelector(ICON_DOWNLOAD_COUNTER_SELECTOR, {timeout: 10000}).catch(() => {
            throw new Error('Token expired 2')
        })

        const counter = await page.evaluate((ICON_DOWNLOAD_COUNTER_SELECTOR) => {
            const counterRaw = ((document.querySelector(ICON_DOWNLOAD_COUNTER_SELECTOR)?.parentElement?.childNodes[1] as HTMLDivElement)?.childNodes[0] as HTMLDivElement)?.innerText
            if (counterRaw) {
                return counterRaw.split('/').map(Number)
            }
            return null
        }, ICON_DOWNLOAD_COUNTER_SELECTOR)

        console.log(counter)

        if (counter[0] >= counter[1]) {
            throw new Error('Download limit reached')
        }

        const count = counter[0]

        const thumbnail = await page.evaluate(() => {
            const thumb = document.querySelector('.thumb')
            return thumb?.getAttribute('src')
        })

        await page.evaluate(() => {
            const nativeDownloadButton = document.querySelector('a[data-cy="download-button"]') as HTMLButtonElement
            const preDownloadButton = Array.from(document.querySelectorAll('button')).filter(button => button.innerText === 'Download')

            if (nativeDownloadButton) {
                nativeDownloadButton.click()
            } else {
                preDownloadButton[0]?.click()

                setTimeout(() => {
                    const downloadButton = document.querySelector('a[data-cy="download-button"]') as HTMLButtonElement
                    console.log('downloadButton', downloadButton)
                    downloadButton?.click()
                }, 1000)
            }
        })

        console.info('downloading', url)

        refreshCookie(await page.cookies())

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
    }
}

function refreshCookie(cookie: CookieParam[]) {
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
