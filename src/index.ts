import axios from 'axios'
import {join} from 'path'
import {readFileSync, writeFileSync, existsSync, unlinkSync, createWriteStream} from "fs";

const COOKIE_FILE = join(__dirname, '../storage/cookie')

axios.defaults.withCredentials = true

const ID_PATTERN = /\d+?(?=\.htm)/

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

function setCookie(value: string) {
  if (existsSync(COOKIE_FILE)) {
    unlinkSync(COOKIE_FILE)
  }
  writeFileSync(COOKIE_FILE, value)
  console.info("Cookie set successfully")

  return "Cookie set successfully"
}

async function downloadByUrl(url: string): Promise<Downloaded> {
  const urlObject = new URL(url)
  const [id] = urlObject.pathname.match(ID_PATTERN)
  if (!id) {
    throw "Invalid URL"
  }

  try {
    // const location = await axios.get('https://www.freepik.com/download-file/' + id).then(res => {
    //   console.log(res.status)
    //   console.log(res.headers)
    //   return res.headers.location
    // })
    return await axios.get('https://www.freepik.com/download-file/' + id, {
      responseType: 'stream'
    }).then(res => {
      // if (!res.headers["content-disposition"]) {
      //   throw "Download failed"
      // }

      // const filename = res.headers["content-disposition"].split('filename=')[1].split(';')[0]
      const filename = id + '.zip'
      return new Promise((resolve, reject) => {
        const path = join(__dirname, '../download/', filename)
        const writer = createWriteStream(path)

        res.data.pipe(writer)
        let error = null

        writer.on('error', err => {
          error = err
          writer.close()
          reject(err)
        })

        writer.on('close', () => {
          if (!error) {
            resolve(new Downloaded(path, filename))
          }
        })
      })
    })
  } catch (e) {
    console.log(e)
    throw "Download failed"
  }
}

class Downloaded {
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

export default {
  setCookie,
  downloadByUrl
}