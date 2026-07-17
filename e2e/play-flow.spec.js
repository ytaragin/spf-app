import { test, expect } from '@playwright/test'
import {
  awayPlayersResponse,
  homePlayersResponse,
  nextTypeResponse,
  lineupAckResponse,
  playCallAckResponse,
  runPlayAckResponse,
  buildGameStateResponse,
  buildPlayResultResponse
} from './fixtures/playFlowMocks.js'

// Installs page.route() handlers for every endpoint the play flow touches
// (D-02). The `/game/plays` route alternates between play 1 and play 2
// fixtures on successive invocations, proving state continuity across two
// chained plays (D-03).
async function installMocks(page) {
  let playCallCount = 0

  await page.route('**/players/away', (route) => route.fulfill({ json: awayPlayersResponse }))
  await page.route('**/players/home', (route) => route.fulfill({ json: homePlayersResponse }))
  await page.route('**/game/state', (route) => route.fulfill({ json: buildGameStateResponse() }))

  await page.route('**/game/nexttype', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: nextTypeResponse })
    }
    return route.fulfill({ body: 'Play type set successfully' })
  })

  await page.route('**/offense/lineup', (route) => route.fulfill({ body: lineupAckResponse }))
  await page.route('**/defense/lineup', (route) => route.fulfill({ body: lineupAckResponse }))
  await page.route('**/offense/call', (route) => route.fulfill({ body: playCallAckResponse }))
  await page.route('**/defense/call', (route) => route.fulfill({ body: playCallAckResponse }))
  await page.route('**/game/play', (route) => route.fulfill({ body: runPlayAckResponse }))

  await page.route('**/game/plays*', (route) => {
    playCallCount += 1
    const playResult =
      playCallCount === 1
        ? buildPlayResultResponse(1, { down: 'Second', yard_line: 33 })
        : buildPlayResultResponse(2, { down: 'Third', yard_line: 41 })
    return route.fulfill({ json: playResult })
  })
}

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name !== 'live') {
    await installMocks(page)
  }
})

test('completes two chained plays end to end', async ({ page }) => {
  await page.goto('/')

  const playButton = page.getByRole('button', { name: 'Play' })
  await expect(playButton).toBeEnabled()
  await playButton.click()
  await expect(page).toHaveURL(/\/game$/)

  await page.waitForResponse(
    (resp) => resp.url().includes('/game/nexttype') && resp.status() === 200
  )

  // --- Play 1 ---
  await page.getByRole('button', { name: 'Submit Lineup' }).click()
  await expect(page.getByText('Lineup set')).toBeVisible()

  const runPlayButton = page.getByRole('button', { name: 'Run Play' })
  await expect(runPlayButton).toBeEnabled()
  await runPlayButton.click()
  await page.waitForResponse((resp) => resp.url().includes('/game/plays') && resp.status() === 200)
  await expect(page.getByText(/Second/)).toBeVisible()

  // --- Play 2: prove state continuity across chained plays (D-03) ---
  await page.getByRole('button', { name: 'Submit Lineup' }).click()
  await expect(page.getByText('Lineup set')).toBeVisible()

  await expect(runPlayButton).toBeEnabled()
  await runPlayButton.click()
  await page.waitForResponse((resp) => resp.url().includes('/game/plays') && resp.status() === 200)
  await expect(page.getByText(/Third/)).toBeVisible()
})
