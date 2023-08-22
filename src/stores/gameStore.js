import { defineStore } from "pinia";
import { computed, onMounted, ref, reactive } from 'vue'
import axios from "axios";

export const useGameStore = defineStore("game", () => {
    // initial state
    const gameMsg = ref("+++");
    const game = ref(null);
    const gameState = ref({
        home: 0,
        away: 0,
        quarter: 1,
        time_remaining: "15:00",
        possession: "home",
        yard_line: 25,
    })
    const lineups = ref({})


    const baseUrl = "http://127.0.0.1:8080";

    // methods
    async function fetchGame() {
        // fetch game data from the server
        console.log("Fetching Game from Server")
        const response = await axios.get("localhost:8080/game");
        game.value = response.data;
    }

    async function setLineup(lineup, isDefense) {

        let func = isDefense ? "defense" : "offense";
        let url = `${baseUrl}/set${func}lineup`;


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
            p = ""
        }
        // console.log(`Found ID ${p}`)
        // console.log(p)

        return p;
    }

    function getPlayer(position) {
        let id = getPlayerFromLineup(position, "defense");
        if (id == null) {
            id = getPlayerFromLineup(position, "offense");
        }

        return id;
    }

    async function getLineup(isDefense) {
        let team = isDefense ? "defense" : "offense";
        console.log(`Fetching ${team} lineup`)
        let url = `${baseUrl}/get${team}lineup`;

        try {
            console.log(`Calling ${url}`)
            const response = await axios.get(url);
            console.log(response);
            lineups.value[team] = response.data;
            console.log(lineups)

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



    async function setDefensivePlay(play) {
        // convert play object to JSON and send it to the server
        const response = await axios.post("localhost:8080/play", play);
        // update the game state with the response data
        game.value = response.data;
    }


    // return everything that should be exposed to the store
    return {
        game,
        fetchGame,
        setLineup,
        getLineup,
        setDefensivePlay,
        gameState, gameMsg,
        getPlayer
    };
});