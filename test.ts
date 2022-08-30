import {downloadByUrl,setCookie } from './src'

setCookie('GR_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmcmVlcGlrIiwianRpIjoiZjgwOTBmNjJkYTYzNmQ2MWJkZTQ1NWFlOTg5MGJmOWY1N2NjMTY5MTY3OTgyNWY4YWI0NGQ2YjNiYjlhYjY3MmYxYTQ4MzVkMWZmY2MwN2UiLCJzdWIiOiIyMjYwODk0OCIsImlhdCI6MTY2MTg0NTEwMi41OTY0ODksImV4cCI6MTY2MzE0MTEwMi4wNTE5NDksInNjb3BlcyI6WyJhbGdfaG1hYyIsIm5vX3VzZXJkYXRhIiwidXNfYWQiXX0.bkvmXgThSRoXeztpmqgaoVAMCTleeZEXK0dkI_rDyuA;')
;(async () => {
   const file = await downloadByUrl('https://www.freepik.com/premium-psd/digital-marketing-agency-business-advertising-agency-social-media-post-template_28922131.htm#query=template&position=9&from_view=keyword')
})()