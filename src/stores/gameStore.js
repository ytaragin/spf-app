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
    })
    const lineups = ref({})


    const baseUrl = "http://127.0.0.1:8080";

    // methods
    async function fetchGame() {
        // fetch game data from the server
        console.log("Fetching Game from Server")
        const response = await axios.get("localhost:8080/game/state");
        game.value = response.data;
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

    function getPlayer(position) {
//        console.log(`Checking for ${position}`);
        let id = getPlayerFromLineup(position, "defense");
        if (id == null || id == "") {
            id = getPlayerFromLineup(position, "offense");
        }

//        console.log(`Returning ${id}`)
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

    async function runPlay() {
        let url = `${baseUrl}/game/play`;

        // convert play object to JSON and send it to the server
        const response = await axios.post(url);
        // update the game state with the response data
        gameMsg.value = response.data;
    }



    // return everything that should be exposed to the store
    return {
        game,
        fetchGame,
        setLineup,
        getLineup,
        setDefensivePlay,
        setOffensivePlay,
        gameState, gameMsg,
        getPlayer,
        runPlay
    };
});
