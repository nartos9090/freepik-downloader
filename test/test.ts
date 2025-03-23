import freepik from '../src'
import * as dotenv from 'dotenv'
dotenv.config()

freepik.setCookie(process.env.TEST_COOKIE!);
(async () => {
  const file = await freepik.downloadByUrlV2(process.env.TEST_DOWNLOAD_URL!)
  console.log(file)
  file.delete()
})()