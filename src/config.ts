import * as dotenv from "dotenv"
import { join } from "path"
dotenv.config()

export const FREEPIK_DOWNLOADER_API_PORT = process.env.FREEPIK_DOWNLOADER_API_PORT || 3000
export const PUPPETEER_ARGS = process.env.FREEPIK_DOWNLOADER_PUPPETEER_ARGS?.split(',').map((arg) => arg.trim())
export const PUPPETEER_HEADLESS = process.env.FREEPIK_DOWNLOADER_PUPPETEER_HEADLESS === 'true'
export const PUPPETEER_EXECUTABLE_PATH = process.env.FREEPIK_DOWNLOADER_PUPPETEER_EXECUTABLE_PATH 
export const COOKIE_FILE = join(__dirname, '../storage/cookie.json')