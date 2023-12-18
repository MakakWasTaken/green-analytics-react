import stripJs from 'strip-js'
import { markdown } from '../src/drawdown'

describe('drawdown', () => {
  const markdownString = `
# Cookie Policy

Last Updated: Thu Dec 14 2023 15:23:20 GMT+0000 (Coordinated Universal Time)

## 1. Introduction

Welcome to Green Analytics ("we," "our," or "us"). This Cookie Policy is designed to inform you about our use of different types of cookies on our website. By continuing to browse our site, you agree to the use of cookies as described in this policy.

## 2. What are Cookies?

Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently.

## 3. Categories of Cookies

### 3.1 None Cookies

None cookies are essential for the basic functionality of our website. They do not collect any personal information and are necessary for the proper operation of the site.

### 3.2 Essential Cookies

Essential cookies are crucial for the basic functions of our website. They enable you to navigate and use key features. Without these cookies, our website may not function properly.

### 3.3 Performance Cookies

Performance cookies help us analyze how visitors use our website. They collect information such as the number of visitors, the pages visited, and the sources of traffic. This data helps us improve the performance and user experience of our site.

### 3.4 Functionality Cookies

Functionality cookies allow our website to remember choices you make, such as language preferences and customized settings. These cookies enhance your experience by providing personalized features.

### 3.5 Marketing Cookies

Marketing cookies are used to track visitors across websites. They are employed to display ads that are relevant and engaging for the individual user. These cookies may share information with third parties for advertising purposes.

## 4. Our cookies

| Name      | Description    | Category        | Expiration Time       | Domain              |
| --------- | -------------- | --------------- | --------------------- | ------------------- |
| green-analytics-token |  | MARKETING | session | green-analytics.com |
| green-analytics-session-id |  | MARKETING | session | green-analytics.com |

## 5. Managing Cookies

Most web browsers allow you to control cookies through their settings. You can choose to accept or reject cookies and delete existing ones. However, disabling certain cookies may impact the functionality and user experience of the website.

## 6. Changes to the Cookie Policy

We reserve the right to update this Cookie Policy at any time. Any changes will be effective immediately upon posting. Please check this page regularly for updates.

If you have any questions about our Cookie Policy, please contact us at [makakwastaken@gmail.com](mailto:makakwastaken@gmail.com).
  

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

  test('table is generated properly', async () => {
    const tableMarkdown = `
| Name      | Description    | Category        | Expiration Time       | Domain              |
| --------- | -------------- | --------------- | --------------------- | ------------------- |
| green-analytics-token |  | MARKETING | session | green-analytics.com |
| green-analytics-session-id |  | MARKETING | session | green-analytics.com |
    `
    const html = markdown(tableMarkdown)

    expect(html).toContain('<th>Name</th>')
  })
})
