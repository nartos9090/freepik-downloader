import axios from './axios'
import {join} from 'path'
import {readFileSync, unlinkSync, createWriteStream} from "fs";
import {checkAndRefreshCookie} from "./cookie";

const ID_PATTERN = /\d+?(?=\.htm)/

export async function downloadByUrl(url: string): Promise<Downloaded> {
  const urlObject = new URL(url)
  const [id] = urlObject.pathname.match(ID_PATTERN)

  if (!id) {
    throw "Invalid URL"
  }

  let file_format = '.zip'
  if (urlObject.pathname.includes('photo/')) {
    file_format = '.jpg'
  }

  try {
    await checkAndRefreshCookie(url)
    let download_url = 'https://www.freepik.com/download-file/' + id
    return await axios.get(download_url, {
      responseType: 'stream'
    }).then(res => {
      // if (!res.headers["content-disposition"]) {
      //   throw "Download failed"
      // }

      // const filename = res.headers["content-disposition"].split('filename=')[1].split(';')[0]
      const filename = id + file_format
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
    throw e
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

