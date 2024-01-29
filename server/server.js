import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { resolve } from 'path'
import puppeteer from 'puppeteer'
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

async function checkWebsite(webpage) {
  const numPage = webpage || 1
  const url = `https://djinni.co/jobs/?page=${numPage}`
  const screenshot = `results_djinni.png`


  try {
    const browser = await puppeteer.launch()
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

    console.log(vacancy, 'FOR ME:', vacancy.filter((obj) => { return obj.text.includes("react") || obj.text.includes("node") || obj.text.includes("javascript") })
      .filter((obj) => !obj.str.includes('intermediate') && !obj.str.includes("advanced")))
    await browser.close()
    console.log('See screenshot: ' + screenshot)

  } catch(err){console.log(err)}
}

setInterval(checkWebsite, 60000)

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
