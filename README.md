# Freepik Premium Downloader
Just an automation script that serves a simple API to download assets from freepik.com. You still need a **premium account** to setup this script.

I made this script because my organization has a premium freepik account. It has limit of 100 downloads per day, but also with a limit of 3 devices. I want to maximize the usage of this premium account. So I made this script. Everyone can use the API to download assets from freepik.com.

Thanks to [INFINITE UNY](https://github.com/InfiniteUny).

## How it works
The downloader uses headless [puppeteer](https://github.com/puppeteer/puppeteer) to open the assets URL given. It will automatically click the download button and save the assets locally. I don't know how to detect completed download, so I just read the directory. If there is a matching file, then it will be sent to the user.

Currently, it only uses 1 browser tab open, so I think it can't be uses to download multiple files at the same time.

## Project Structure


## Before Setup
You need a cookie from a premium freepik account.

## Setup
1. Clone this repository and run ```npm install```
2. Build the project ```npm run build```
3. Run the API ```npm run api```. It will serve an API in ```http://localhost:3000```. You can change it in ```src/api.ts```.
4. Send your cookie. Then restart the API.
```
curl -X POST -H "Content-Type: application/json" \
    -d '{"cookie": "Your cookie here"}' \
    http://localhost:3000/set-cookie
```
5. Start download a premium asset by this URL. ```http://localhost:3000/download?url=FREEPIK_URL```. example ```http://localhost:3000/download?url=https://www.freepik.com/premium-vector/continuous-one-line-drawing-thank-you-text_11439558.htm#query=thankyou&position=6&from_view=search&track=sph```.

## Integrate with your own system
You can also integrate this downloader with your own script.

Run ```npm install git+https://github.com/nartos9090/freepik-downloader```.

Example
```ts
const {downloadByUrl, refreshCookie} = require('freepik-premium-downloader')

// download an asset
const asset = await downloadByUrl('FREEPIK_ASSET_URL')

// get the filename
const filename = asset.filename

// get the file path
const path = asset.path

// get the file buffer
const file = asset.get()

// delete file
asset.delete()
```

## Note
This downloader is lack off documentation, error handling, bad architecture, etc. Sorry for the inconvenience.
