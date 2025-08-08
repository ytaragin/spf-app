import { defineStore } from "pinia";
import { computed, onMounted, ref, reactive } from 'vue'
import axios from "axios";

export const useGameStore = defineStore("game", () => {
    // initial state
    const gameMsg = ref("+++");
    const game = ref(null);
    const gameState = ref({
        home_score: 0,
        away_score: 0,
        quarter: 1,
        time_remaining: "15:00",
        possession: "home",
        yard_line: 25,
        first_down_target: 35,
        last_status: "Start",
        down: "First",

    })
    const lineups = ref({})
    const playTypes = ref([])
    const nextPlayType = ref(null)
    const playResults = ref([])


    const baseUrl = "http://127.0.0.1:8080";

    // methods
    async function fetchGame() {
        // fetch game data from the server
        console.log("Fetching Game Status from Server")
        let url = `${baseUrl}/game/state`;
        const response = await axios.get(url);
        gameState.value = response.data;
        console.log(`got ${response}`);
        console.log(response.data);
        console.log(gameState.value);
    }

    async function setLineup(lineup, isDefense) {

        let func = isDefense ? "defense" : "offense";
        let url = `${baseUrl}/${func}/lineup`;


        try {
            const response = await axios.post(url, lineup);
            gameMsg.value = response.data;
            lineups.value[func] = lineup;

            // handle success here
        } catch (error) {
            // handle error here
            if (error.response) {
                // handle 400 error here
                let msg = error.response.data;
                console.log(`Error was ${msg}`); // the server response data
                gameMsg.value = msg
            }
        }
        // convert lineup object to JSON and send it to the server

    }

    function getPlayerFromLineup(position, side) {
        // console.log(`Finding ${position} in ${side}`)
        // console.log(lineups.value[side])
        let l = lineups.value[side];
        if (l == null) {
            // console.log("No Match")
            return null;
        }
        let p = l[position];
        if (Array.isArray(p)) {
            // console.log(`Is Array ${p}`)
            p = p[0];

        }
        if (!p) {
            // console.log(`Setting Blank`)
            p = ""
        }
        // console.log(`Found ID ${p}`)
        // console.log(p)

        return p;
    }

    function getHardCodedValue() {
        return 42
    }

    function getPlayer(position) {
        console.log(`Checking for ${position}`);
        let id = getPlayerFromLineup(position, "defense");
        if (id == null || id == "") {
            id = getPlayerFromLineup(position, "offense");
        }

        console.log(`Returning ${id}`)
        return id;
    }

    async function getLineup(isDefense) {
        let team = isDefense ? "defense" : "offense";
        console.log(`Fetching ${team} lineup`)
        let url = `${baseUrl}/${team}/lineup`;

        try {
            console.log(`Calling ${url}`)
            const response = await axios.get(url);
            console.log(response);
            lineups.value[team] = response.data;
            console.log(lineups.value)

        } catch (error) {
            // handle error here
            if (error.response) {
                // handle 400 error here
                let msg = error.response.data;
                console.log(`Error was ${msg}`); // the server response data
                gameMsg.value = msg
            }
        }
        // convert lineup object to JSON and send it to the server

    }

    async function fetchPlayTypes() {
        let url = `${baseUrl}/game/nexttype`;

        try {
            const response = await axios.get(url);
            console.log('Play types response:', response);
            console.log('Play types data:', response.data);

            playTypes.value = response.data.allowed_types || [];
            nextPlayType.value = response.data.next_type || null;

            console.log('Final playTypes value:', playTypes.value);
            console.log('Final nextPlayType value:', nextPlayType.value);
        } catch (error) {
            // handle error here
            console.error('Error fetching play types:', error);
            playTypes.value = []; // Ensure it's always an array
            nextPlayType.value = null; // Reset next play type on error
            if (error.response) {
                // handle 400 error here
                let msg = error.response.data;
                console.log(`Error was ${msg}`); // the server response data
                gameMsg.value = msg;
            }
        }
    }

    const getPlayTypes = computed(() => playTypes.value)
    const getNextPlayType = computed(() => nextPlayType.value)



    async function setDefensivePlay(play) {
        let url = `${baseUrl}/defense/call`;

        // convert play object to JSON and send it to the server
        const response = await axios.post(url, play, {
            headers: {
                'content-type': 'application/json'
            }
        });
        // update the game state with the response data
        gameMsg.value = response.data;
    }




    async function setOffensivePlay(play) {
        console.log("Hello there")
        console.log(play)
        console.log(typeof play)

        // let data = JSON.stringify(play);
        // console.log(data);

        // let p =        {
        //     "play_type": "SH",
        //     "strategy": "Draw",
        //     "target": "FL1"
        // };

        let url = `${baseUrl}/offense/call`;

        // // convert play object to JSON and send it to the server
        const response = await axios.post(url, play, {
            headers: {
                'content-type': 'application/json'
            }
        });
        // // update the game state with the response data


        gameMsg.value = response.data;
    }

    async function setKickoffPlay(kickoffOptions) {
        console.log("Setting kickoff play")
        console.log(kickoffOptions)

        // Extract the onside value from the kickoff options
        const playData = {
            "onside": kickoffOptions.onside || false
        }

        let url = `${baseUrl}/offense/call`;

        try {
            const response = await axios.post(url, playData, {
                headers: {
                    'content-type': 'application/json'
                }
            });
            gameMsg.value = response.data;
        } catch (error) {
            console.error('Error setting kickoff play:', error);
            if (error.response) {
                let msg = error.response.data;
                console.log(`Error was ${msg}`);
                gameMsg.value = msg;
            }
        }
    }

    async function runPlay() {
        let url = `${baseUrl}/game/play`;

        // convert play object to JSON and send it to the server
        let response;
        try {
            response = await axios.post(url);
            gameMsg.value = response.data;
        } catch (error) {
            if (error.response) {
                let msg = error.response.data;
                console.log(`Error was ${msg}`);
                gameMsg.value = msg;
            } else {
                throw error;
                gameMsg.value = "Unknown Error";
            }
        }
        // update the game state with the response data
        // gameMsg.value = response.data;
    }

    async function fetchPlayResult() {
        let url = `${baseUrl}/game/plays?result=true&count=1`;
        const response = await axios.get(url);
        const newPlay = Array.isArray(response.data) ? response.data[0] : response.data;

        // Add the new play to the existing array of play results only if play_counter has increased
        if (newPlay && newPlay.new_state && newPlay.new_state.play_counter) {
            const newPlayCounter = newPlay.new_state.play_counter;
            const mostRecentPlay = playResults.value.length > 0 ? playResults.value[playResults.value.length - 1] : null;
            const mostRecentPlayCounter = mostRecentPlay && mostRecentPlay.new_state ? mostRecentPlay.new_state.play_counter : 0;

            // Only add if this is a new play (higher play counter)
            if (newPlayCounter > mostRecentPlayCounter) {
                playResults.value.push(newPlay);
                console.log(`Added new play with counter ${newPlayCounter}`);
            } else {
                console.log(`Skipping play - counter ${newPlayCounter} not greater than most recent ${mostRecentPlayCounter}`);
            }
        }

        console.log(`got ${response}`);
        console.log(response.data);
        console.log('All play results:', playResults.value);
    }

    async function fetchAllPlayResults() {
        let url = `${baseUrl}/game/plays?result=true`;
        const response = await axios.get(url);
        const newPlay = Array.isArray(response.data) ? response.data[0] : response.data;

        playResults.value = response.data || [];
        console.log(`got ${response}`);
        console.log(response.data);
        console.log('All play results:', playResults.value);
    }

    async function fetchGameData(fullSync = false) {
        console.log("Fetching complete game data (state, play types, and play result)")
        try {
            await fetchGame();
            await fetchPlayTypes();
            if (fullSync) {
                await fetchAllPlayResults();
            } else {
                await fetchPlayResult();
            }
            console.log("Successfully fetched all game data");
        } catch (error) {
            console.error("Error fetching game data:", error);
            gameMsg.value = "Error fetching game data";
        }
    }

    async function setPlayType(playType) {
        let url = `${baseUrl}/game/nexttype`;

        try {
            const response = await axios.post(url, playType, {
                headers: {
                    'Content-Type': 'text/plain'
                }
            });
            gameMsg.value = response.data || 'Play type set successfully';
            console.log('Play type set:', playType);
            console.log('Server response:', response.data);
        } catch (error) {
            console.error('Error setting play type:', error);
            if (error.response) {
                let msg = error.response.data;
                console.log(`Error was ${msg}`);
                gameMsg.value = msg;
            }
        }
    }

    const getPlayResult = computed(() => {
        return playResults.value.length > 0 ? playResults.value[playResults.value.length - 1] : null;
    })
    const getAllPlayResults = computed(() => {
        return playResults.value;
    })
    onMounted(() => {
        fetchGame();
    });

    // return everything that should be exposed to the store
    return {
        game,
        fetchGame,
        setLineup,
        getLineup,
        setDefensivePlay,
        setOffensivePlay,
        setKickoffPlay,
        gameState, gameMsg,
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
        getAllPlayResults
    };
});
