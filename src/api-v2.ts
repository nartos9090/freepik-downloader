import freepik from './index'
const bodyParser = require('body-parser')
const express = require('express')

const app = express().prefix('/v2')
const port = 3002

// app.use(bodyParser.urlencoded({extended: false}))
// app.use(bodyParser.json())

app.get('/download', async (req, res) => {
  const url = req.query.url

  try {
    const file = await freepik.downloadByUrlV2(url)
    await res.json(file)
    setTimeout(() => {
      file.delete()
    }, 100000)
  } catch (e) {
    console.log(e)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.post('/set-cookie',bodyParser.urlencoded({extended: false}), async (req, res) => {
  const cookie = req.body.cookie
  await freepik.setCookie(cookie)
  return res.status(200).end()
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
