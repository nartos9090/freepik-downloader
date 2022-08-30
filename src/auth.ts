import axios from 'axios'
import {join} from 'path'
import {readFileSync, writeFileSync, existsSync, unlinkSync} from "fs";

const COOKIE_FILE = join(__dirname, '../storage/cookie')

axios.defaults.withCredentials = true

function setCookie(value: string) {
  if (existsSync(COOKIE_FILE)) {
    unlinkSync(COOKIE_FILE)
  }
  writeFileSync(COOKIE_FILE, value)
  console.info("Cookie set successfully")

  axios.interceptors.request.use(
    (config) => {
      // @ts-ignore
      config.headers.Cookie = readFileSync(COOKIE_FILE)
      return config
    }, function (error) {
      // Do something with request error
      return Promise.reject(error);
    }
  )

  return "Cookie set successfully"
}

export {
  setCookie
}