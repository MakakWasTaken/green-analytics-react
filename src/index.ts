import stripJs from 'strip-js'
import { markdown } from './drawdown'

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
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',

            // Add the token to the header
            API_TOKEN: token,
          },
        },
      )

      const markdownString = (await response.json()).content as string

      // Convert the markdown to html and insert it.
      cookiePolicyInsertionPoint.innerHTML = stripJs(markdown(markdownString))
    }
  } catch (err) {
    console.error('Failed inserting cookie policy', err)
  }
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

    // Send the pageview event
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
