export class TeamData {

    constructor(data) {
        console.log('TeamData constructor called with:', data);
        this.availablePlayers = new Set([]);
        this.players = data.players;
        this.team = data.team;
        console.log('TeamData this.team set to:', this.team);
        this.resetAllPlayers();
    }

    getPlayerByID = (id) => {
        // console.log(this.players)
        if (this.players.hasOwnProperty(id)) {
            return this.players[id]
        }
        return null;
    };


    getPlayersForPositions(positions) {
        // console.log(positions);
        let ids = [...this.availablePlayers]
            .map((id) => [id, this.players[id].position])
            // let ids = ids2
            .filter(pair => positions.includes(pair[1]))
            .map(pair => pair[0]);
        // console.log(ids)
        return ids;
    }

    assignPlayer(id) {
        return this.availablePlayers.delete(id);
    }

    resetPlayer(id) {
        this.availablePlayers.add(id)
    }

    resetAllPlayers() {
        Object.values(this.players).forEach(p => {
            this.availablePlayers.add(p.id);
        });
    }


    availablePlayerIDs() {
        let ids = [...this.availablePlayers];

        // console.log(`Avail players are: ${ids}`);
        return ids;
    }

    allPlayers() {
        // console.log("All players computing");
        // console.log(team.value.players)
        return this.players
    };

    teamName() {
        console.log('teamName() called, this.team:', this.team);
        if (this.team && this.team.name) {
            console.log('Returning team name:', this.team.name);
            return this.team.name
        }
        console.log('No team name found, returning XYZ');
        return "XYZ"
    }

}
