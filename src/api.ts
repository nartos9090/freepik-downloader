import freepik from './index'
const express = require('express')

const app = express()
const port = 3000

app.get('/download', async (req, res) => {
  const url = req.query.url

  try {
    const file = await freepik.downloadByUrl(url)
    return res.download(file.path)
  } catch (e) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.post('/set-cookie', async (req, res) => {
  const cookie = req.body.cookie
  freepik.setCookie(cookie)
  return res.status(200)
})

app.listen(port, () => {
  console.log(`Llistening on port ${port}`)
})