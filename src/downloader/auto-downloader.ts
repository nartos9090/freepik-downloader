import { join, resolve } from 'path'
import { readdirSync } from "fs";
import { getSavedCookie, saveCookie } from "../cookie/cookie";
import puppeteer, { Browser, CDPSession, CookieParam, Page, Protocol } from 'puppeteer'
import { PUPPETEER_ARGS, PUPPETEER_EXECUTABLE_PATH, PUPPETEER_HEADLESS } from '../config';
import { Downloaded } from '../type';

const DOWNLOAD_PATH = resolve(__dirname, './download')
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

// selector
const DOWNLOAD_COUNTER_SELECTOR = 'div#__next>div:nth-child(2)>div:nth-child(3)>div:nth-child(3)>div:nth-child(1)>div:nth-child(2)'
const NATIVE_DOWNLOAD_BUTTON_SELECTOR = 'a[data-cy="download-button"]'
const SUBSCRIPTION_STATUS_SELECTOR = '*[data-cy="popover-user-my-subscription"]>button>*:nth-child(2)'
const THUMBNAIL_SELECTOR = '*[data-cy="resource-detail-preview"]>img'
const PRE_DOWNLOAD_BUTTON_SELECTOR = 'button[data-cy="wrapper-download-free"]>button'
const SIGN_IN_BUTTON_SELECTOR = '*[data-cy="signin-button"]'

let browser: Browser
let page: Page
let client: CDPSession

const bootUrl = 'https://freepik.com'

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
    client = await page.target().createCDPSession()
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

    await page.setUserAgent(USER_AGENT)
}

const sleep = async (duration: number) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true)
        }, duration)
    })
}

const getCounter = async () => {
    await page.waitForSelector(DOWNLOAD_COUNTER_SELECTOR, { timeout: 10000 }).catch(() => {
        throw new Error('Download counter not found')
    })

    const counter = await page.evaluate((DOWNLOAD_COUNTER_SELECTOR) => {
        const counterRaw = (document.querySelector(DOWNLOAD_COUNTER_SELECTOR) as HTMLDivElement)?.innerText
        if (counterRaw) {
            return counterRaw.split('/').map(Number)
        }
        return null
    }, DOWNLOAD_COUNTER_SELECTOR)

    if (!counter) {
        throw new Error('Download counter error')
    }

    return counter as [number, number]
}

export const downloadByUrl = async (url: string): Promise<Downloaded> => {
    if (!browser) {
        await boot()
    }

    await setCookie()

    try {
        await page.goto('https://www.freepik.com/user/my-subscriptions')

        await sleep(3000)

        await page.goto('https://www.freepik.com/user/downloads')

        await sleep(5000)

        const sign_in_button = await page.evaluate((SIGN_IN_BUTTON_SELECTOR) => {
            return document.querySelector(SIGN_IN_BUTTON_SELECTOR) as HTMLAnchorElement
        }, SIGN_IN_BUTTON_SELECTOR)

        if (sign_in_button) {
            throw new Error('Token expired')
        }

        refreshCookie(await client.send('Network.getAllCookies'))

        const [count, maxCount] = await getCounter()

        if (count >= maxCount) {
            throw new Error('Download limit reached')
        }

        await page.goto(url)

        await sleep(5000)

        const thumbnail = await page.evaluate((THUMBNAIL_SELECTOR) => {
            const thumb = document.querySelector(THUMBNAIL_SELECTOR)
            return thumb?.getAttribute('src')
        }, THUMBNAIL_SELECTOR)

        await page.evaluate((NATIVE_DOWNLOAD_BUTTON_SELECTOR, PRE_DOWNLOAD_BUTTON_SELECTOR) => {
            const nativeDownloadButton = document.querySelector(NATIVE_DOWNLOAD_BUTTON_SELECTOR) as HTMLButtonElement
            console.log('nativeDownloadButton', nativeDownloadButton)

            if (nativeDownloadButton) {
                nativeDownloadButton.click()
            } else {
                const preDownloadButton: HTMLElement[] = Array.from(document.querySelectorAll(PRE_DOWNLOAD_BUTTON_SELECTOR))

                new Set(preDownloadButton).forEach((button) => {
                    // console.log(button)
                    button.click()
                })

                setTimeout(() => {
                    const downloadButton = document.querySelector(NATIVE_DOWNLOAD_BUTTON_SELECTOR) as HTMLButtonElement
                    // console.log('downloadButton', downloadButton)
                    downloadButton?.click()
                }, 2000)
            }
        }, NATIVE_DOWNLOAD_BUTTON_SELECTOR, PRE_DOWNLOAD_BUTTON_SELECTOR)

        console.info('downloading', url)

        return await new Promise((res, rej) => {
            const filename = url.replace(/^https?:\/\//, '').split('/')[2].split('_')[0]
            let counter = 0
            const interval = setInterval(() => {
                const files = readdirSync(DOWNLOAD_PATH + '/')
                const file = files.find((v) => v.includes(filename) && !v.includes('.crdownload'))
                if (file) {
                    const downloaded = new Downloaded(join(resolve(__dirname, './download'), './' + file), file, thumbnail, count, maxCount)
                    console.info('downloaded', url)
                    res(downloaded)
                    clearInterval(interval)
                }
                if (counter >= 100) {
                    console.log(counter)
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

function refreshCookie(cookie: Protocol.Network.GetAllCookiesResponse) {
    const cookiesObject = cookie.cookies.reduce((a, c) => {
        a[c.name] = c.value
        return a
    }, {})

    saveCookie(cookiesObject)

    console.info('cookie refreshed')
}