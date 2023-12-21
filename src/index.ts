import sanitize from 'sanitize-html'
import { markdown } from './drawdown'

// For testing

export interface Person {
  id: string
  name?: string
  email?: string
  properties?: { [key: string]: any }
}

export interface Event {
  name: string
  type: string

  website?: {
    url: string
  }

  properties?: { [key: string]: any }
}

export interface GAResponse {
  ok: boolean
  message: string
}

const getToken = () => {
  const token = getFromStorage('green-analytics-token')
  if (!token) {
    throw new Error('Green Analytics not initialized')
  }
  return token
}

const getCookie = (name: string) => {
  for (let cookie of document.cookie.split(';')) {
    cookie = cookie.trim()
    if (cookie.startsWith(name)) {
      return cookie.split('=')[1]
    }
  }
}

/**
 * Determine the correct way to get something from storage and get it
 * @param name The name of the item to get
 * @returns The item from storage
 */
const getFromStorage = (name: string): string | null => {
  if (navigator.cookieEnabled) {
    return getCookie(name) || null
  }
  return localStorage.getItem(name) || null
}

const setInStorage = (name: string, value: string) => {
  if (navigator.cookieEnabled) {
    document.cookie = `${name}=${value};path=/`
  } else {
    return localStorage.setItem(name, value)
  }
}

/**
 * Helper function to extract browser from user agent
 */
const getBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.match(/chrome|chromium|crios/)) {
    return 'Chrome'
  }
  if (userAgent.match(/firefox|fxios/)) {
    return 'Firefox'
  }
  if (userAgent.match(/safari/)) {
    return 'Safari'
  }
  if (userAgent.match(/opr\//)) {
    return 'Opera'
  }
  if (userAgent.match(/edg/)) {
    return 'Edge'
  }
  return 'Other'
}

const getOS = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.match(/windows/)) {
    return 'Windows'
  }
  if (userAgent.match(/macintosh/)) {
    return 'Mac'
  }
  if (userAgent.match(/linux/) || userAgent.match(/x11/)) {
    return 'Linux'
  }
  if (userAgent.match(/iphone/)) {
    return 'iOS'
  }
  if (userAgent.match(/android/)) {
    return 'Android'
  }
  return 'Other'
}

const getMobile = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  return userAgent.match(/mobile/)
}

export const insertCookiePolicy = async () => {
  if (typeof document === 'undefined') {
    // We cannot insert the cookie policy if no DOM is found
    return
  }
  try {
    const cookiePolicyInsertionPoint = document.getElementById(
      'green-analytics-cookie-policy',
    )
    if (cookiePolicyInsertionPoint) {
      const token = getToken()
      // If the element exists, load the cookie policy for this token
      // Load the markdown policy from the website.
      const response = await fetch(
        'https://green-analytics.com/api/database/cookie-policy',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',

            // Add the token to the header
            API_TOKEN: token,
          },
        },
      )

      const markdownString = (await response.json()).content as string

      const button = document.createElement('button')
      button.onclick = () => presentCookieBanner(false)
      button.style.width = '128px'
      button.style.backgroundColor = '#f5faf5'
      button.style.borderRadius = '8px'
      button.innerText = 'Update Cookie Settings'

      // Convert the markdown to html and insert it.
      cookiePolicyInsertionPoint.innerHTML = sanitize(markdown(markdownString))
      cookiePolicyInsertionPoint.appendChild(button)
    }
  } catch (err) {
    console.error('Failed inserting cookie policy', err)
  }
}

interface ConsentCookie {
  cookies: { name: string; type: string; accepted: boolean }[]
  lastUpdated: Date
}

interface AddCookieBannerHTMLProps {
  cookiePolicyLink: string
  cookies: ConsentCookie['cookies']
}

const addCookieBannerHTML = ({
  cookiePolicyLink,
  cookies,
}: AddCookieBannerHTMLProps) => {
  const cookieBanner = document.getElementById('green-analytics-cookie-banner')
  if (cookieBanner) {
    console.warn('Cookie banner has already been added to the DOM, showing it')
    cookieBanner.style.display = 'flex'
    return
  }

  const container = document.createElement('div')
  container.id = 'green-analytics-cookie-banner'

  // Position
  container.style.position = 'fixed'
  container.style.bottom = '0'
  container.style.left = '0'
  container.style.right = '0'

  // Layout
  container.style.padding = '8px'
  container.style.display = 'flex'
  container.style.backgroundColor = '#f5faf5'
  container.style.height = '64px'
  container.style.alignItems = 'center'
  container.style.justifyContent = 'space-evenly'

  // The components needed in the cookie banner are as follows:
  // Image (Custom if pro plan or paid cookie policy) TODO: Implement this customizability.

  const gaContainer = document.createElement('div')

  gaContainer.style.marginLeft = '32px'

  const gaPoweredBy = document.createElement('p')
  gaPoweredBy.innerText = 'Powered by'
  gaPoweredBy.style.margin = '0'
  gaPoweredBy.style.color = '#bbb'

  const gaTitle = document.createElement('a')
  gaTitle.href = 'https://green-analytics.com/'
  gaTitle.innerText = 'Green Analytics'
  gaTitle.style.textDecoration = 'none'
  gaTitle.style.color = '#346d34'

  gaContainer.appendChild(gaPoweredBy)
  gaContainer.appendChild(gaTitle)

  container.appendChild(gaContainer)

  // Description
  const description = document.createElement('div')

  // We only use p to insert to not cause issues with SEO (Accesibility) on the website.
  const descriptionTitle = document.createElement('p')
  descriptionTitle.style.fontSize = '18px'
  descriptionTitle.style.margin = '0'
  descriptionTitle.innerText = 'Cookie Settings'

  const descriptionText = document.createElement('p')
  descriptionText.style.margin = '0'
  descriptionText.innerHTML = `We use cookies to improve your experience of our website. To learn more about our policy please consult the <a href="${cookiePolicyLink}">Cookie Policy</a>`

  description.appendChild(descriptionTitle)
  description.appendChild(descriptionText)

  container.appendChild(description)

  // Consent buttons
  const consentContainer = document.createElement('div')

  const d = new Date()
  d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000)

  const rejectButton = document.createElement('button')
  // By clicking reject, we reject all cookies that are not marked as essential.
  // It is the company's responsibility to correctly classify these cookies.

  rejectButton.innerText = 'Only Essential'
  rejectButton.style.border = 'none'
  rejectButton.style.borderRadius = '5px'
  rejectButton.style.height = '30px'
  rejectButton.style.width = '120px'
  rejectButton.style.margin = '0 8px'

  rejectButton.onclick = () => {
    // When the user rejects cookies, we create a cookie with all the cookies names of the cookies that were rejected
    document.cookie = `green-analytics-cookie-consent=${JSON.stringify({
      cookies: cookies.map((cookie) => ({
        name: cookie.name,
        type: cookie.type,
        accepted: cookie.type === 'ESSENTIAL',
      })),
      lastUpdated: new Date(),
    })};expires=${d.toUTCString()};path=/`

    // Hide cookie banner
    const banner = document.getElementById('green-analytics-cookie-banner')
    if (banner) {
      banner.style.display = 'none'
    }

    // Enforce
    enforceCookiePolicy()
  }

  const acceptButton = document.createElement('button')

  acceptButton.innerText = 'Accept All'
  acceptButton.style.border = 'none'
  acceptButton.style.borderRadius = '5px'
  acceptButton.style.height = '30px'
  acceptButton.style.width = '120px'
  rejectButton.style.margin = '0 8px'
  acceptButton.style.backgroundColor = '#346d34'
  acceptButton.style.color = '#f5faf5'

  acceptButton.onclick = () => {
    document.cookie = `green-analytics-cookie-consent=${JSON.stringify({
      cookies: cookies.map((cookie) => ({
        name: cookie.name,
        type: cookie.type,
        accepted: true,
      })),
      lastUpdated: new Date(),
    })};expires=${d.toUTCString()};path=/`

    // Hide cookie banner
    const banner = document.getElementById('green-analytics-cookie-banner')
    if (banner) {
      banner.style.display = 'none'
    }

    // Enforce
    enforceCookiePolicy()
  }

  consentContainer.appendChild(rejectButton)
  consentContainer.appendChild(acceptButton)

  container.appendChild(consentContainer)

  document.body.appendChild(container)
}

export const presentCookieBanner = async (auto = true) => {
  // Present the cookie banner allowing the user to give consent
  if (auto) {
    if (!getCookie('green-analytics-cookie-consent')) {
      // If auto is enabled and the cookie is not present, load the cookie settings from Green Analytics
      // If the cookie policy is enabled, show it.
      addCookieBannerHTML({
        cookiePolicyLink: 'TODO: LOAD FROM SETTINGS',
        cookies: [], // TODO: LOAD FROM SETTINGS
      })
    }
  } else {
    // If auto is false, this means that we will force show the cookie consent banner.
    // This will be used by the cookie policy. Therefore we already know the link to the cookie policy

    const consent = getCookie('green-analytics-cookie-consent')
    if (consent) {
      const parsedConsent = JSON.parse(consent) as ConsentCookie

      addCookieBannerHTML({
        cookiePolicyLink: window.location.href,
        cookies: parsedConsent.cookies,
      })
    } else {
      // We need to fetch the cookies from the settings, because there is no record of the current cookies
    }
  }
}

const enforceCookiePolicy = () => {
  // Get all cookies that the user allowed, through their consent.
  // Remove the cookies that have been disallowed.
}

export const initGA = async (
  token: string,
): Promise<GAResponse | undefined> => {
  // Check if doNotTrack is enabled, if so cancel the script
  if (navigator.doNotTrack === '1') {
    return
  }

  try {
    // Store the token in the localStorage to make identifying easier
    setInStorage('green-analytics-token', token)

    // Check for cookie policy insertion point.
    insertCookiePolicy()
    presentCookieBanner()
    enforceCookiePolicy()

    const event: Event = {
      name: document.title,
      type: 'pageview',

      website: {
        url: window.location.origin,
      },

      properties: {
        path: window.location.pathname,
        referrer: document.referrer,
      },
    }

    const userProperties: { [key: string]: any } = {
      browser: getBrowser(),
      os: getOS(),
      mobile: getMobile(),

      // Get the screen size
      width: window.innerWidth,
      height: window.innerHeight,

      // Get the timezone
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

      // Get the language
      language: navigator.language,

      // Get the user agent
      userAgent: navigator.userAgent,
    }

    const response = await logEvent(event, userProperties)

    return response as GAResponse
  } catch (error) {
    console.error(error)
  }
}

const getSessionId = () => {
  let sessionId = getFromStorage('green-analytics-session-id')

  if (!sessionId) {
    sessionId = window.crypto.getRandomValues(new Uint32Array(1))[0].toString()
    if (!sessionId) {
      throw new Error('Could not generate sessionId')
    }
    setInStorage('green-analytics-session-id', sessionId)
  }

  return sessionId
}

export const setPerson = async (
  person: Person,
): Promise<GAResponse | undefined> => {
  try {
    const token = getToken()

    // The only required information is a id
    if (!person.id) {
      throw new Error('person.id is required')
    }

    // Check if the person is already set
    if (getFromStorage('green-analytics-person-id') === person.id) {
      return
    }

    // Store the person id in the localStorage to make identifying easier
    setInStorage('green-analytics-person-id', person.id)

    const sessionId = getSessionId()

    // Send the person to the server
    const response = await fetch(
      'https://green-analytics.com/api/database/events/setPerson',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

          // Add the token to the header
          API_TOKEN: token,
        },
        body: JSON.stringify({
          person: {
            ...person,
            website: { url: window.location.origin },
          },
          sessionId,
        }),
      },
    )

    return (await response.json()) as GAResponse
  } catch (err) {
    console.error(err)
  }
}

export const logEvent = async (
  event: Event,
  userProperties?: { [key: string]: any },
): Promise<GAResponse | undefined> => {
  if (navigator.doNotTrack === '1') {
    return
  }

  try {
    const token = getToken()

    const sessionId = getSessionId()
    const personId = getFromStorage('green-analytics-person-id')

    // Send the event to the server
    const response = await fetch(
      'https://green-analytics.com/api/database/events/logEvent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

          // Add the token to the header
          API_TOKEN: token,
        },
        body: JSON.stringify({ event, userProperties, sessionId, personId }),
      },
    )

    return (await response.json()) as GAResponse
  } catch (error) {
    console.error(error)
  }
}

// Check that we are on the client side
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  window.onload = () => {
    // If a script tag is used, load the plugin
    const scripts = document.getElementsByTagName('script')
    for (let i = 0; i < scripts.length; i++) {
      // Check if any of the script files contains the green-analytics file. If so, initialize the script using the provided token.
      if (scripts[i].src.includes('green-analytics.js')) {
        const token = scripts[i].getAttribute('data-token')
        const noInit = scripts[i].getAttribute('no-init')

        if (!token) {
          throw new Error(
            'data-token needs to be set on the green-analytics script tag',
          )
        }

        // If the user needs to provide consent first, it is possible to add no-init to the tag.
        if (!noInit) {
          // Initialize the framework
          initGA(token)
        }
        break
      }
    }
  }
}

// If not script tag is provided, await manual initialization of the plugin.
