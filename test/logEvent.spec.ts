import { initGA, logEvent } from '../src'

describe('logEvent', () => {
  beforeAll(() => {
    return new Promise<void>(async (resolve) => {
      await initGA('b3cdaa7c-ca1b-4641-b01f-dace971b7850') // Green Analytics' token (Tokens are public)

      resolve()
    })
  })

  test('logEvent should work succesfully with token', async () => {
    expect(
      logEvent({
        name: 'Test',
        type: 'test',
      }),
    ).resolves.not.toThrow()
  })
})
