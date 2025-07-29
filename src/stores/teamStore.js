import { defineStore } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { SPFMetadata } from "../game/SPFMetadata.js"
import { useGameStore } from './gameStore.js'
import { TeamData } from '../game/TeamData.js'


export const useTeamsStore = defineStore('teams', () => {
  const HOME = "Home";
  const AWAY = "Away";

  const teams = ref({});
  const team = ref(new TeamData({ team: {}, availablePlayers: new Set([]), players: { "QB-1": { name: "Joe", id: "QB-1" }, "RB-1": { name: "John", id: "RB-1" } }, }));
  const managedTeam = ref(HOME);
  const otherTeam = ref(AWAY);

  const version = ref(1);
  const isLoading = ref(false);

  // let availablePlayers = ref(new Set([]));
  let playerPositions = ref({});
  let spfMetadata = new SPFMetadata();


  const baseUrl = "http://127.0.0.1:8080";

  const fetchPlayers = async () => {
    isLoading.value = true;
    try {
      console.log("Fetching players");

      const response = await axios.get(`${baseUrl}/players/away`);
      // team = JSON.parse(response.data);
      console.log(response.data)
      setTeam(response.data, AWAY);

      const response2 = await axios.get(`${baseUrl}/players/home`);
      // team = JSON.parse(response.data);
      console.log(response2.data)
      setTeam(response2.data, HOME);
      version.value++
      team.value = teams.value[managedTeam.value];

    } catch (error) {
      console.error('Error fetching players:', error);
      if (error.response) {
        console.error('Server responded with error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No response received from server. Is the server running at http://localhost:8080?');
      } else {
        console.error('Error setting up request:', error.message);
      }
    } finally {
      isLoading.value = false;
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
    console.log(`${side} Set - Data received:`, newTeam);
    console.log(`Team name from data: ${newTeam?.team?.name}`);
    teams.value[side] = new TeamData(newTeam);
    console.log(`Team data created for ${side}:`, teams.value[side]);
    console.log(`Team name from TeamData: ${teams.value[side].teamName()}`);
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
    console.log(`getting team name for ${side} - teams.value:`, teams.value);
    console.log(`teams.value[${side}]:`, teams.value[side]);
    if (teams.value[side]) {
      const teamName = teams.value[side].teamName();
      console.log(`Team name for ${side}: ${teamName}`);
      return teamName;
    }
    console.log(`No team data for ${side}, returning fallback`);
    return isLoading.value ? "Loading..." : "Team Not Set"
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
    managedTeam,
    getManagedTeam,
    toggleManagedTeam,
    version,
    updateVersion,
    homeTeam,
    awayTeam,
    isLoading,

  };


})
