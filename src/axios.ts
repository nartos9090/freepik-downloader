import axios from "axios";
import {readFileSync} from "fs";
import {COOKIE_FILE} from "./constants";

axios.defaults.withCredentials = true

axios.interceptors.request.use(
  (config) => {
    try {
      // @ts-ignore
      config.headers.Cookie = buildCookie()
      return config
    } catch (e) {
      console.log(e)
      return Promise.reject('AXIOS ERROR')
    }
  }, function (e) {
    console.log(e)
    // Do something with request error
    return Promise.reject('AXIOS ERROR')
  }
)

const buildCookie = () => {
  const saved = JSON.parse(readFileSync(COOKIE_FILE, 'utf-8'))
  return Object.keys(saved).map(key => `${key}=${saved[key]}`).join('; ')
}

export default axios