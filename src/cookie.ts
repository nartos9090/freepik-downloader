import {parse as cookieParse} from 'cookie-parse'
import {existsSync, readFileSync, unlinkSync, writeFileSync} from 'fs'
import {COOKIE_FILE} from "./constants";
import axios from "./axios";
import {parse as setCookieParse} from 'set-cookie-parser'

export function setCookie(value: string) {
  const cookie = cookieParse(value)
  saveCookie(cookie)
  console.info("Cookie set successfully")

  return "Cookie set successfully"
}

function saveCookie(cookie: Object) {
  if (existsSync(COOKIE_FILE)) {
    unlinkSync(COOKIE_FILE)
  }

  writeFileSync(COOKIE_FILE, JSON.stringify(cookie))
}

export function getSavedCookie() {
  return JSON.parse(readFileSync(COOKIE_FILE, 'utf-8'))
}

export async function checkAndRefreshCookie(url: string) {
  await axios.get(url).then((res) => {
    const setCookie = setCookieParse(res)
    const saved = getSavedCookie()

    for (const cookie of setCookie) {
      saved[cookie.name] = cookie.value
    }

    saveCookie(saved)
  })
}