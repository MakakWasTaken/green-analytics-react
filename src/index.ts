/* eslint-disable @typescript-eslint/no-unused-vars */

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
    throw new Error('No token found')
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
  } else {
    return localStorage.getItem(name) || null
  }
}

const setInStorage = (name: string, value: string) => {
  if (navigator.cookieEnabled) {
    document.cookie = `${name}=${value}`
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
  } else if (userAgent.match(/firefox|fxios/)) {
    return 'Firefox'
  } else if (userAgent.match(/safari/)) {
    return 'Safari'
  } else if (userAgent.match(/opr\//)) {
    return 'Opera'
  } else if (userAgent.match(/edg/)) {
    return 'Edge'
  } else {
    return 'Other'
  }
}

const getOS = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.match(/windows/)) {
    return 'Windows'
  } else if (userAgent.match(/macintosh/)) {
    return 'Mac'
  } else if (userAgent.match(/linux/) || userAgent.match(/x11/)) {
    return 'Linux'
  } else if (userAgent.match(/iphone/)) {
    return 'iOS'
  } else if (userAgent.match(/android/)) {
    return 'Android'
  } else {
    return 'Other'
  }
}

const getMobile = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.match(/mobile/)) {
    return true
  } else {
    return false
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
    sessionId = Math.random().toString(36).substring(2, 15)
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
