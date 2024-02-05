import { defineStore } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { SPFMetadata } from "../game/SPFMetadata.js"
import { useGameStore } from './gameStore.js'
import { TeamData } from '../game/TeamData.js'


export const useTeamsStore = defineStore('teams', () => {
  const HOME = "home";
  const AWAY = "away";

  const teams = ref({});
  const team = ref(new TeamData({ team: {}, availablePlayers: new Set([]), players: { "QB-1": { name: "Joe", id: "QB-1" }, "RB-1": { name: "John", id: "RB-1" } }, }));
  const managedTeam = ref(HOME);
  const otherTeam = ref(AWAY);

  const version = ref(1);

  // let availablePlayers = ref(new Set([]));
  let playerPositions = ref({});
  let spfMetadata = new SPFMetadata();

  const fetchPlayers = async () => {
    try {
      console.log("Fetching players");

      const response = await axios.get('http://localhost:8080/players/away');
      // team = JSON.parse(response.data);
      console.log(response.data)
      setTeam(response.data, AWAY);

      const response2 = await axios.get('http://localhost:8080/players/home');
      // team = JSON.parse(response.data);
      console.log(response2.data)
      setTeam(response2.data, HOME);
      version.value++
      team.value = teams.value[managedTeam.value];

    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  function toggleManagedTeam() {
    let temp = managedTeam.value;
    managedTeam.value = otherTeam.value;
    otherTeam.value = temp;
    // managedTeam.value = managedTeam.value == HOME ? AWAY : HOME
    console.log(`Switching Mangement to ${otherTeam.value}`)
    // [managedTeam.value, otherTeam.value] = [otherTeam.value, managedTeam.value]

    team.value = teams.value[managedTeam.value];
  }
  const getManagedTeam = () => { return managedTeam.value }

  function selectPlayer(id, spot) {
    team.value.assignPlayer(id);
    let curr = playerPositions.value[spot];
    if (curr) {
      team.value.resetPlayer(curr.id);
    }
    playerPositions.value[spot] = team.value.getPlayerByID(id);
    // console.log(playerPositions)

  }

  function removePlayer(spot) {
    let curr = playerPositions.value[spot];
    if (curr) {
      team.value.resetPlayer(curr.id);
    }
    delete playerPositions.value[spot];
  }

  function updateVersion() {
    console.log("Incrementing Version")
    version.value++;
  }

  function setTeam(newTeam, side) {

    console.log(`${side} Set`)
    teams.value[side] = new TeamData(newTeam);
    // console.log(teams.value)

    // console.log(`Selected Player Size: ${availablePlayers.value.size}`)

    // console.log(team.value)
  }

  const getPlayerByIDBothTeams = (id) => {
    let rec = team.value.getPlayerByID(id);
    if (!rec) { //&& teams.value[otherTeam]
      // console.log(`Checking ${otherTeam.value}`)
      rec = teams.value[otherTeam.value].getPlayerByID(id);
    }

    return rec;
  };

  function getTeamName(side) {
    if (teams.value[side]) {
      return teams.value[side].teamName()
    }
    return "BLABLA"
  }

  const homeTeam = computed(() => getTeamName(HOME))
  const awayTeam = computed(() => getTeamName(AWAY))

  function getPlayersForBox(box) {
    let positions = spfMetadata.getPositionForABox(box);
    return team.value.getPlayersForPositions(positions);
  }

  function getPlayersSetInBox(box) {
    return playerPositions.value[box];
  }

  const availablePlayerIDs = computed(() => {
    let ids = [...team.availablePlayerIDs()];

    console.log(`Avail players are: ${ids}`);
    return ids;
  });



  const allPlayers = computed(() => {
    // console.log("All players computing");
    // console.log(team.value.players)
    return team.value.players
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
    getPlayerByIDBothTeams,
    playerPositions,
    getPlayersForBox,
    getPlayersSetInBox,
    removePlayer,
    getManagedTeam,
    toggleManagedTeam,
    version,
    updateVersion,
    homeTeam,
    awayTeam,

  };


})
