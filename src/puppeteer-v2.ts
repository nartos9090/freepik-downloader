import {join, resolve} from 'path'
import {readFileSync, unlinkSync, readdirSync, statSync} from "fs";
import {getSavedCookie, saveCookie} from "./cookie";
import puppeteer, {Browser} from 'puppeteer'

const DOWNLOAD_PATH = resolve('./download')
const DOWNLOAD_BUTTON_SELECTOR = 'button.download-button'

const ID_PATTERN = /\d+?(?=\.htm)/

let browser: Browser
let page: puppeteer.Page
let booted = false

const boot = async () => {
  if (booted) {
    return
  }
  let bootUrl = 'https://freepik.com'

  /* Launch new instance */
  browser = await puppeteer.launch({headless: true})
  page = await browser.newPage()
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

    return new Promise((res, rej) => {
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
    throw new Error('failed to download')
  }
}

function refreshCookie(cookie: puppeteer.Protocol.Network.Cookie[]) {
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

  get(): Buffer {
    return readFileSync(this.path);
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
