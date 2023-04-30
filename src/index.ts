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

const getToken = () => {
  const token = sessionStorage.getItem('green-analytics-token') || undefined
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

export const initGA = (token: string) => {
  // Check if doNotTrack is enabled, if so cancel the script
  if (navigator.doNotTrack === '1') {
    return
  }

  // Store the token in the sessionStorage to make identifying easier
  sessionStorage.setItem('green-analytics-token', token)

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

  logEvent(event, userProperties)
}

const getSessionId = () => {
  let sessionId: string | undefined
  if (navigator.cookieEnabled) {
    sessionId = getCookie('green-analytics-session-id')
  }
  if (!sessionId) {
    // Check if the person is already set
    sessionId =
      sessionStorage.getItem('green-analytics-session-id') || undefined
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15)
      if (navigator.cookieEnabled) {
        document.cookie = `green-analytics-session-id=${sessionId}`
      } else {
        sessionStorage.setItem('green-analytics-session-id', sessionId)
      }
    }
  }

  return sessionId
}

export const setPerson = (person: Person) => {
  const token = getToken()

  // The only required information is a id
  if (!person.id) {
    throw new Error('person.id is required')
  }

  // Check if the person is already set
  if (sessionStorage.getItem('green-analytics-person-id') === person.id) {
    return
  }

  // Store the person id in the sessionStorage to make identifying easier
  if (navigator.cookieEnabled) {
    document.cookie = `green-analytics-person-id=${person.id}`
  } else {
    sessionStorage.setItem('green-analytics-person-id', person.id)
  }

  const sessionId = getSessionId()

  // Send the person to the server
  fetch('https://green-analytics.com/api/database/events/setPerson', {
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
  })
}

export const logEvent = (
  event: Event,
  userProperties?: { [key: string]: any },
) => {
  if (navigator.doNotTrack === '1') {
    return
  }

  const token = getToken()

  const sessionId = getSessionId()
  let personId: string | undefined
  if (navigator.cookieEnabled) {
    personId = getCookie('green-analytics-person-id')
  }
  if (!personId) {
    // If a person id is set sent it with the request
    personId = sessionStorage.getItem('green-analytics-person-id') || undefined
  }

  // Send the event to the server
  fetch('https://green-analytics.com/api/database/events/logEvent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',

      // Add the token to the header
      API_TOKEN: token,
    },
    body: JSON.stringify({ event, userProperties, sessionId, personId }),
  })
}
