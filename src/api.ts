import freepik from './index'
const bodyParser = require('body-parser')
const express = require('express')

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/download', async (req, res) => {
  const url = req.query.url

  try {
    const file = await freepik.downloadByUrl(url)
    await res.download(file.path)
    setTimeout(() => {
      file.delete()
    }, 100000)
  } catch (e) {
    console.log(e)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.post('/set-cookie', async (req, res) => {
  console.log(req.data)
  const cookie = req.body.cookie
  freepik.setCookie(cookie)
  return res.status(200).end()
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
