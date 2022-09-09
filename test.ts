import freepik from './src'
import puppeteer from "./src/puppeteer";

freepik.setCookie('');
(async() => {
  const file = await puppeteer.downloadByUrl('https://www.freepik.com/premium-photo/white-watercolor-papar-texture-background-cover-card-design-overlay-aon-paint-art-background_13078613.htm#&position=2&from_view=popular')
})()