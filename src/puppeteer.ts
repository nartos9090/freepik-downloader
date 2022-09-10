import axios from './axios'
import {join, resolve} from 'path'
import {readFileSync, unlinkSync, createWriteStream, readdirSync} from "fs";
import {checkAndRefreshCookie, getSavedCookie} from "./cookie";
import puppeteer, {Browser} from 'puppeteer'
import {readdir} from "fs/promises";

const DOWNLOAD_PATH = resolve('./download')
const DOWNLOAD_BUTTON_SELECTOR = 'a.download-button'

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
  await boot()
  await page.goto(url)
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true)
    }, 5000)
  })
  await page.click(DOWNLOAD_BUTTON_SELECTOR)

  return new Promise((resolve, reject) => {
    const filename = url.replace(/^https?:\/\//, '').split('/')[2].split('_')[0]
    const interval = setInterval(() => {
      const files = readdirSync(DOWNLOAD_PATH + '/')
      const file = files.find((v) => v.includes(filename) && !v.includes('.crdownload'))
      if (file) {
        const downloaded = new Downloaded(DOWNLOAD_PATH + '/' + file, file)
        resolve(downloaded)
        clearInterval(interval)
      }
    }, 2000)
  })
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