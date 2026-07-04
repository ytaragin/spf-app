import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import axios from 'axios'
import { SPFMetadata } from '../game/SPFMetadata.js'

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
    gameState.value = response.data
  }

  async function setLineup(lineup, isDefense) {
    let func = isDefense ? 'defense' : 'offense'
    let url = `${baseUrl}/${func}/lineup`

    isSubmittingLineup.value = true
    try {
      const response = await axios.post(url, lineup)
      gameMsg.value = response.data
      lineups.value[func] = lineup

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
      lineups.value[team] = response.data
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

  async function fetchPlayTypes() {
    let url = `${baseUrl}/game/nexttype`

    try {
      const response = await axios.get(url)

      playTypes.value = response.data.allowed_types || []
      nextPlayType.value = response.data.next_type || null
    } catch (err) {
      // handle error here
      console.error('Error fetching play types:', err)
      playTypes.value = [] // Ensure it's always an array
      nextPlayType.value = null // Reset next play type on error
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

  async function fetchPlayResult() {
    let url = `${baseUrl}/game/plays?result=true&count=1`
    const response = await axios.get(url)
    const newPlay = Array.isArray(response.data) ? response.data[0] : response.data

    // Add the new play to the existing array of play results only if play_counter has increased
    if (newPlay && newPlay.new_state && newPlay.new_state.play_counter) {
      const newPlayCounter = newPlay.new_state.play_counter
      const mostRecentPlay =
        playResults.value.length > 0 ? playResults.value[playResults.value.length - 1] : null
      const mostRecentPlayCounter =
        mostRecentPlay && mostRecentPlay.new_state ? mostRecentPlay.new_state.play_counter : 0

      // Only add if this is a new play (higher play counter)
      if (newPlayCounter > mostRecentPlayCounter) {
        playResults.value.push(newPlay)

        // Update the current game state with the new state from the play result
        updateGameStateFromPlayResult(newPlay)
      }
    }
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

  // Shared function to update game state from play result
  function updateGameStateFromPlayResult(playResult) {
    if (playResult && playResult.new_state) {
      gameState.value = { ...playResult.new_state }
      return true
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
    // Hover state and functions
    hoveredBox,
    relatedBox,
    setHoveredBox,
    clearHover,
    isBoxHighlighted,
    getBoxLabel
  }
})
