import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { resolve } from 'path'
import puppeteer from 'puppeteer'
import TelegramApi from 'node-telegram-bot-api'
import config from './config.cjs'
import { Html } from '../client/html.js'

const server = express()
const PORT = process.env.PORT || 8080
const __dirname = process.cwd()

const middlewere = [
  cors(),
  cookieParser(),
  express.json({ limit: '50kb' }),
  express.static(resolve(__dirname, 'dist'))
]

const token = process.env.TG_TOKEN
  const myChatId = process.env.CHAT_ID

  const bot = new TelegramApi(token, { polling: true })

const formatTime = (time) => {
  const regex = /(^\d{2}:\d{2})|(\d{2,})/g
  const split = time.match(regex)
  const date = `${split[3]}-${split[2]}-${split[1]}T${split[0]}:00`
  const newDate = new Date(date)
  return newDate
}
let list = []

async function checkWebsite(webpage) {
  const numPage = webpage || 1
  const url = `https://djinni.co/jobs/?page=${numPage}`
  const screenshot = `results_djinni.png`


  try {
    const browser = await puppeteer.launch({
      headless: 'new'
    })
    const page = await browser.newPage()
    await page.setUserAgent('Chrome/75.0.3770.100')
    await page.goto(url)
    await page.screenshot({
      path: screenshot,
      fullPage: true
    })

    const vacancy = await page.$$eval('.h3.job-list-item__link', (elem) => {
      return elem.map((e) => {
        return {
          "text": e.innerText.toLowerCase(),
          "href": e.href, "str": e.offsetParent.nextElementSibling.innerText.toLowerCase(),
          "header": e.offsetParent.offsetParent.children[0].children[0].innerText,
          "time": e.offsetParent.offsetParent.children[0].children[0].children[2].children[0].children[0].attributes[3].textContent
        }
      })
    })

    const forMe = vacancy.filter((obj) => { return obj.text.includes("react") || obj.text.includes("node") || obj.text.includes("javascript") || obj.text.includes("nodejs") })
    .filter((obj) => !obj.str.includes('intermediate') && !obj.str.includes("advanced"))

    const lastTime = vacancy[vacancy.length - 1].time
    const formatLastTime = formatTime(lastTime)
    const currentTime = new Date()
    const timeDifference = currentTime - formatLastTime
    const minutesDifference = Math.floor(timeDifference / (1000 * 60))


   async function takeScreenshot(url){
      await page.goto(url)
      return await page.screenshot({
        path: `for_me_${url.slice(23, 29)}.png`,
        fullPage: true
      })
    }
    if (forMe.length > 0) {
      console.log('FOR ME:', forMe);

        for (const rec of forMe) {
          if (!list.includes(rec.href)) {
            try {
              await takeScreenshot(rec.href);
              await bot.sendMessage(myChatId, `${rec.href}`)
              console.log(`Screenshot taken for ${rec.href}`);
              list = [...list, rec.href];
            } catch (error) {
              console.error(`Error taking screenshot for ${rec.href}:`, error);
            }
          } else {
            console.log(`${rec.href} already processed. Skipping.`);
          }
        }
      }


    // if (forMe[0]) {
    //   console.log('FOR ME:',forMe)
    //   forMe.reduce((acc, rec) => {
    //     acc.then(() => {
    //       return new Promise(async(resolve, reject) => {
    //         return takeScreenshot(rec.href).then((data) => {
    //           resolve(data)
    //         })
    //       })
    //     })

    //   }, Promise.resolve())
    // }


    if (minutesDifference < 20) {
      await browser.close()
      await checkWebsite(numPage + 1)
    }

    console.log(`${numPage}:`, vacancy, minutesDifference, currentTime, list)

    await browser.close()
    console.log('See screenshot: ' + screenshot)

  } catch(err){console.log(err)}
}

setInterval(checkWebsite, 300000)
middlewere.forEach((it) => server.use(it))

server.get('/', (req, res) => {
  res.send('Express Server')
})

server.get('/*', (req, res) => {
  const initialState = {
    location: req.url
  }
  res.send(
    Html({
      body: '',
      initialState
    })
  )
})

server.listen(PORT, () => {
  console.log(`Serving at http://localhost${PORT}`)
})
