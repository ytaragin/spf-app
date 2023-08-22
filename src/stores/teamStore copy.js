import { defineStore } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { SPFMetadata } from "../game/SPFMetadata.js"


export const useTeamsStore = defineStore('teams', () => {
  const HOME = "home";
  const AWAY = "away";

  const teams = ref({});
  teams.value[HOME] = { team: {}, availablePlayers: new Set([]), players: { "QB-1": { name: "Joe", id: "QB-1" }, "RB-1": { name: "John", id: "RB-1" } }, };
  teams.value[AWAY] = { team: {}, players: { "QB-1": { name: "Joe", id: "QB-1" }, "RB-1": { name: "John", id: "RB-1" } }, };

  let availablePlayers = ref(new Set([]));
  let playerPositions = ref({});
  let spfMetadata = new SPFMetadata();



  const fetchPlayers = async () => {
    try {
      console.log("Fetching players");

      const response = await axios.get('http://localhost:8080/players/away');
      // team = JSON.parse(response.data);
      console.log(response.data, AWAY)
      setTeam(response.data);

      const response2 = await axios.get('http://localhost:8080/players/home');
      // team = JSON.parse(response.data);
      console.log(response2.data)
      setTeam(response2.data, HOME);


    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  function selectPlayer(id, spot) {
    availablePlayers.value.delete(id);
    let curr = playerPositions.value[spot];
    if (curr) {
      availablePlayers.value.add(curr.id)
    }
    playerPositions.value[spot] = getPlayerByID(id);
    // console.log(playerPositions)

  }

  function removePlayer(spot) {
    let curr = playerPositions.value[spot];
    if (curr) {
      availablePlayers.value.add(curr.id)
    }
    delete playerPositions.value[spot];
  }

  function setTeam(newTeam, side) {

    awayTeam.value = newTeam;

    Object.values(newTeam.players).forEach(p => {
      availablePlayers.value.add(p.id);
    });

    // console.log(`Selected Player Size: ${availablePlayers.value.size}`)

    // console.log(team.value)
  }

  const getPlayerByID = (id) => {
    return awayTeam.value.players[id]
  };

  function getPlayersForBox(box) {
    let positions = spfMetadata.getPositionForABox(box);
    // console.log(positions);
    let ids = [...availablePlayers.value]
      .map((id) => [id, awayTeam.value.players[id].position])
      // let ids = ids2
      .filter(pair => positions.includes(pair[1]))
      .map(pair => pair[0]);
    // console.log(ids)
    return ids;
  }

  const availablePlayerIDs = computed(() => {
    let ids = [...availablePlayers.value];

    // console.log(`Avail players are: ${ids}`);
    return ids;
  });



  const allPlayers = computed(() => {
    // console.log("All players computing");
    // console.log(team.value.players)
    return awayTeam.value.players
  });

  onMounted(() => {
    fetchPlayers();
  });

  return {
    fetchPlayers,
    allPlayers,
    availablePlayerIDs,
    setTeam,
    selectPlayer,
    availablePlayers,
    getPlayerByID,
    playerPositions,
    getPlayersForBox,
    removePlayer

  };


})
