import freepik from './src'

freepik.setCookie('');
(async() => {
  const file = await freepik.downloadByUrlV2('https://www.freepik.com/premium-photo/low-angle-view-star-field_125118730.htm#fromView=image_search_similar&page=1&position=20&uuid=642fbd22-89ea-447a-b13d-584d603bbbcd&new_detail=true')
  console.log(file)
})()