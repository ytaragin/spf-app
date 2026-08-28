import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import axios from 'axios'
import { SPFMetadata } from '../game/SPFMetadata.js'
import { applyGameState } from '../game/gameStateReducer.js'

export const useGameStore = defineStore('game', () => {
  // SPFMetadata instance
  const spfMetadata = new SPFMetadata()

  // initial state
  const gameMsg = ref('+++')
  const game = ref(null)
  const gameState = ref({
    home_score: 0,
    away_score: 0,
    quarter: 1,
    time_remaining: '15:00',
    possession: 'Home',
    yard_line: 25,
    first_down_target: 35,
    last_status: 'Start',
    down: 'First'
  })
  const lineups = ref({})
  const playTypes = ref([])
  const nextPlayType = ref(null)
  const playResults = ref([])

  // Async feedback state (surfaced to the UI via snackbar/:loading)
  const error = ref(null)
  const isRunningPlay = ref(false)
  const isSubmittingLineup = ref(false)
  const isSubmittingPlay = ref(false)

  // Play-flow state: has the current play's lineup been submitted? Drives the
  // "Select Play" section and gates "Run Play". Reset after each play runs.
  const lineupSubmitted = ref(false)

  function clearError() {
    error.value = null
  }

  function setLineupSubmitted(value) {
    lineupSubmitted.value = value
  }

  // Hover state for SpotComponent relationships
  const hoveredBox = ref(null)
  const relatedBox = ref(null)

  const baseUrl = import.meta.env.VITE_API_BASE_URL

  // methods
  async function fetchGame() {
    // fetch game data from the server
    let url = `${baseUrl}/game/state`
    const response = await axios.get(url)
    applyIncomingGameState(response.data)
  }

  /**
   * Local-apply only — does not POST. The single write site for a `gameState`
   * bootstrap/announcement, shared by the REST `fetchGame`, the WebSocket
   * `GameStarted` event, and (Phase 9) the `GET /state` resync — hence the
   * generic name. Performs no collateral resets: `playResults`, `lineups`,
   * `nextPlayType`, and `lineupSubmitted` are untouched (D-17).
   *
   * @param {object} state  the candidate incoming game state
   * @returns {boolean} whether the reducer actually advanced `gameState`
   */
  function applyIncomingGameState(state) {
    const previous = gameState.value
    const applied = applyGameState(previous, state)
    gameState.value = applied
    return applied !== previous
  }

  /**
   * Local-apply only — does not POST. The single write site for `lineups[side]`,
   * shared by the REST `setLineup` / `getLineup` and both WebSocket lineup
   * events (D-06). `side` is always an `'offense'`/`'defense'` literal chosen by
   * the caller, never taken from a payload.
   *
   * @param {'offense'|'defense'} side  which side's lineup to replace
   * @param {object} lineup  the whole lineup object (last-writer-wins)
   */
  function applyLineup(side, lineup) {
    lineups.value[side] = lineup
  }

  async function setLineup(lineup, isDefense) {
    let func = isDefense ? 'defense' : 'offense'
    let url = `${baseUrl}/${func}/lineup`

    isSubmittingLineup.value = true
    try {
      const response = await axios.post(url, lineup)
      gameMsg.value = response.data
      applyLineup(func, lineup)

      // handle success here
    } catch (err) {
      // handle error here
      if (err.response) {
        // handle 400 error here
        let msg = err.response.data
        console.error(`Error setting lineup: ${msg}`)
        gameMsg.value = msg
        error.value = `Failed to set ${func} lineup: ${msg}`
      } else {
        error.value = `Failed to set ${func} lineup`
      }
    } finally {
      isSubmittingLineup.value = false
    }
    // convert lineup object to JSON and send it to the server
  }

  function getPlayerFromLineup(position, side) {
    let l = lineups.value[side]
    if (l == null) {
      return null
    }
    let p = l[position]
    if (Array.isArray(p)) {
      p = p[0]
    }
    if (!p) {
      p = ''
    }

    return p
  }

  function getHardCodedValue() {
    return 42
  }

  function getPlayer(position) {
    let id = getPlayerFromLineup(position, 'defense')
    if (id == null || id == '') {
      id = getPlayerFromLineup(position, 'offense')
    }

    return id
  }

  async function getLineup(isDefense) {
    let team = isDefense ? 'defense' : 'offense'
    let url = `${baseUrl}/${team}/lineup`

    try {
      const response = await axios.get(url)
      applyLineup(team, response.data)
    } catch (err) {
      // handle error here
      if (err.response) {
        // handle 400 error here
        let msg = err.response.data
        console.error(`Error fetching ${team} lineup: ${msg}`)
        gameMsg.value = msg
        error.value = `Failed to fetch ${team} lineup: ${msg}`
      } else {
        error.value = `Failed to fetch ${team} lineup`
      }
    }
    // convert lineup object to JSON and send it to the server
  }

  /**
   * Local-apply only — does not POST. The single write site for `nextPlayType`,
   * shared by the REST `fetchPlayTypes` / `setPlayType` and the WebSocket
   * `NextPlayTypeSet` event (D-06). Scope is deliberately `nextPlayType` alone:
   * `playTypes` keeps its inline assignments in `fetchPlayTypes` because it has a
   * single write site already and extracting it would add an action with no
   * second caller. The POSTing sibling remains `setPlayType` (D-05, D-07).
   *
   * Accepts either a bare play-type string or the `{ next_type }` object shape
   * returned by `/game/nexttype` (D-10); anything else normalizes to `null`.
   *
   * @param {string|{ next_type: string }|null|undefined} type
   */
  function applyNextPlayType(type) {
    let normalized = null
    if (typeof type === 'string' && type !== '') {
      normalized = type
    } else if (type !== null && typeof type === 'object' && typeof type.next_type === 'string') {
      normalized = type.next_type || null
    }
    nextPlayType.value = normalized
  }

  async function fetchPlayTypes() {
    let url = `${baseUrl}/game/nexttype`

    try {
      const response = await axios.get(url)

      playTypes.value = response.data.allowed_types || []
      applyNextPlayType(response.data.next_type)
    } catch (err) {
      // handle error here
      console.error('Error fetching play types:', err)
      playTypes.value = [] // Ensure it's always an array
      applyNextPlayType(null) // Reset next play type on error
      if (err.response) {
        // handle 400 error here
        let msg = err.response.data
        console.error(`Error fetching play types: ${msg}`)
        gameMsg.value = msg
        error.value = `Failed to fetch play types: ${msg}`
      } else {
        error.value = 'Failed to fetch play types'
      }
    }
  }

  const getPlayTypes = computed(() => playTypes.value)
  const getNextPlayType = computed(() => nextPlayType.value)

  async function setDefensivePlay(play) {
    let url = `${baseUrl}/defense/call`

    isSubmittingPlay.value = true
    try {
      // convert play object to JSON and send it to the server
      const response = await axios.post(url, play, {
        headers: {
          'content-type': 'application/json'
        }
      })
      // update the game state with the response data
      gameMsg.value = response.data
    } catch (err) {
      let msg = err.response ? err.response.data : err.message
      console.error(`Error setting defensive play: ${msg}`)
      gameMsg.value = msg
      error.value = `Failed to submit defensive play: ${msg}`
    } finally {
      isSubmittingPlay.value = false
    }
  }

  async function setOffensivePlay(play) {
    let url = `${baseUrl}/offense/call`

    isSubmittingPlay.value = true
    try {
      // convert play object to JSON and send it to the server
      const response = await axios.post(url, play, {
        headers: {
          'content-type': 'application/json'
        }
      })
      // update the game state with the response data
      gameMsg.value = response.data
    } catch (err) {
      let msg = err.response ? err.response.data : err.message
      console.error(`Error setting offensive play: ${msg}`)
      gameMsg.value = msg
      error.value = `Failed to submit offensive play: ${msg}`
    } finally {
      isSubmittingPlay.value = false
    }
  }

  async function setKickoffPlay(kickoffOptions) {
    // Extract the onside value from the kickoff options
    const playData = {
      onside: kickoffOptions.onside || false
    }

    let url = `${baseUrl}/offense/call`

    isSubmittingPlay.value = true
    try {
      const response = await axios.post(url, playData, {
        headers: {
          'content-type': 'application/json'
        }
      })
      gameMsg.value = response.data
    } catch (err) {
      let msg = err.response ? err.response.data : err.message
      console.error(`Error setting kickoff play: ${msg}`)
      gameMsg.value = msg
      error.value = `Failed to submit kickoff play: ${msg}`
    } finally {
      isSubmittingPlay.value = false
    }
  }

  async function runPlay() {
    let url = `${baseUrl}/game/play`

    // convert play object to JSON and send it to the server
    let response
    isRunningPlay.value = true
    try {
      response = await axios.post(url)
      gameMsg.value = response.data
      // Play ran successfully: collapse the lineup/play-call flow for the next play.
      lineupSubmitted.value = false
    } catch (err) {
      if (err.response) {
        let msg = err.response.data
        console.error(`Error running play: ${msg}`)
        gameMsg.value = msg
        error.value = `Failed to run play: ${msg}`
      } else {
        error.value = 'Failed to run play'
        throw err
      }
    } finally {
      isRunningPlay.value = false
    }
    // update the game state with the response data
    // gameMsg.value = response.data;
  }

  /**
   * Local-apply only — does not POST. Shared apply+push path for a play result,
   * used by both the REST `fetchPlayResult` and the WebSocket dispatch, so a play
   * delivered twice cannot double-push.
   *
   * @param {object} playAndState  a PlayAndState carrying `new_state`
   * @returns {boolean} whether the reducer actually advanced `gameState`
   */
  function applyPlayResult(playAndState) {
    // Apply through the reducer first; the array-push gate is derived from
    // whether the reducer actually advanced gameState (single source of truth
    // for "is this a new play?"). No independent play_counter comparison here.
    // The lineupSubmitted reset is gated on that same verdict, so a duplicate or
    // stale delivery is a true zero-op that never collapses the UI (D-13, D-14).
    if (updateGameStateFromPlayResult(playAndState)) {
      playResults.value.push(playAndState)
      lineupSubmitted.value = false
      return true
    }
    return false
  }

  async function fetchPlayResult() {
    let url = `${baseUrl}/game/plays?result=true&count=1`
    const response = await axios.get(url)
    const newPlay = Array.isArray(response.data) ? response.data[0] : response.data

    applyPlayResult(newPlay)
  }

  async function fetchAllPlayResults() {
    let url = `${baseUrl}/game/plays?result=true`
    const response = await axios.get(url)

    playResults.value = response.data || []

    // Update the current game state with the most recent play result's new_state
    if (playResults.value.length > 0) {
      const mostRecentPlay = playResults.value[playResults.value.length - 1]
      updateGameStateFromPlayResult(mostRecentPlay)
    }
  }

  async function fetchGameData(fullSync = false) {
    try {
      await fetchGame()
      await fetchPlayTypes()
      if (fullSync) {
        await fetchAllPlayResults()
      } else {
        await fetchPlayResult()
      }
    } catch (err) {
      console.error('Error fetching game data:', err)
      gameMsg.value = 'Error fetching game data'
      error.value = 'Failed to fetch game data'
    }
  }

  async function setPlayType(playType) {
    let url = `${baseUrl}/game/nexttype`

    try {
      const response = await axios.post(url, playType, {
        headers: {
          'Content-Type': 'text/plain'
        }
      })
      gameMsg.value = response.data || 'Play type set successfully'
      // Optimistic local write so REST and WS share one nextPlayType write site (D-06).
      applyNextPlayType(playType)
    } catch (err) {
      console.error('Error setting play type:', err)
      if (err.response) {
        let msg = err.response.data
        console.error(`Error setting play type: ${msg}`)
        gameMsg.value = msg
        error.value = `Failed to set play type: ${msg}`
      } else {
        error.value = 'Failed to set play type'
      }
    }
  }

  const getPlayResult = computed(() => {
    return playResults.value.length > 0 ? playResults.value[playResults.value.length - 1] : null
  })
  const getAllPlayResults = computed(() => {
    return playResults.value
  })

  // Shared function to update game state from play result.
  // Returns true only when the reducer actually applied the incoming state
  // (i.e. play_counter advanced), so callers can derive downstream decisions
  // — like appending to playResults — from the single reducer gate.
  function updateGameStateFromPlayResult(playResult) {
    if (playResult && playResult.new_state) {
      const applied = applyGameState(gameState.value, playResult.new_state)
      const didApply = applied !== gameState.value
      gameState.value = applied
      return didApply
    }
    return false
  }

  // Hover management functions
  function setHoveredBox(boxName) {
    hoveredBox.value = boxName
    relatedBox.value = spfMetadata.getRelatedPassDefenseBox(boxName)
  }

  function clearHover() {
    hoveredBox.value = null
    relatedBox.value = null
  }

  function isBoxHighlighted(boxName) {
    return boxName === hoveredBox.value || boxName === relatedBox.value
  }

  function getBoxLabel(boxName) {
    return spfMetadata.getBoxLabel(boxName)
  }

  // return everything that should be exposed to the store
  return {
    game,
    fetchGame,
    setLineup,
    getLineup,
    setDefensivePlay,
    setOffensivePlay,
    setKickoffPlay,
    gameState,
    gameMsg,
    // Async feedback state
    error,
    clearError,
    isRunningPlay,
    isSubmittingLineup,
    isSubmittingPlay,
    // Play-flow state
    lineupSubmitted,
    setLineupSubmitted,
    getPlayer,
    getHardCodedValue,
    runPlay,
    fetchPlayTypes,
    getPlayTypes,
    getNextPlayType,
    setPlayType,
    fetchPlayResult,
    fetchGameData,
    getPlayResult,
    getAllPlayResults,
    updateGameStateFromPlayResult,
    // Local-apply actions (do not POST)
    applyPlayResult,
    applyIncomingGameState,
    applyLineup,
    applyNextPlayType, // Hover state and functions
    hoveredBox,
    relatedBox,
    setHoveredBox,
    clearHover,
    isBoxHighlighted,
    getBoxLabel
  }
})
