import fetchMock from 'jest-fetch-mock'

fetchMock.enableMocks()
// changes default behavior of fetchMock to use the real 'fetch' implementation and not mock responses
fetchMock.dontMock()
