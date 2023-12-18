import stripJs from 'strip-js'
import { markdown } from '../src/drawdown'

describe('drawdown', () => {
  const markdownString = `
# Cookie Policy Last Updated: Thu Dec 14 2023 15:23:20 GMT+0000 (Coordinated Universal Time) 

## 1. Introduction 

Welcome to Green Analytics ("we," "our," or "us"). This Cookie Policy is designed to inform you about our use of different types of cookies on our website. 
By continuing to browse our site, you agree to the use of cookies as described in this policy. 

## 2. What are Cookies? 

Cookies are small text files that are stored on your device when you visit a website. 
They are widely used to make websites work more efficiently. 

## 3. Categories of Cookies

<script>
const test = 0;
</script>
`

  // Test markdown capabilities
  test('markdown generates html', () => {
    const html = markdown(markdownString)

    expect(html).toContain('<h1>')
  })

  test('markdown & stripJs works in combination', () => {
    const response = markdown(stripJs(markdownString))

    expect(response).toContain('<h1>')
    expect(response).not.toContain('<script>')
  })

  test('green-analytics cookie-policy endpoint', async () => {
    const response = await fetch(
      'https://green-analytics.com/api/database/cookie-policy',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          API_TOKEN: 'b3cdaa7c-ca1b-4641-b01f-dace971b7850', // Green Analytics' token (Tokens are public)
        },
      },
    )

    const markdownString = (await response.json()).content as string

    const htmlString = markdown(stripJs(markdownString))

    expect(htmlString).toContain('<h1>')
  })
})
