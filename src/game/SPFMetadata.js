export class SPFMetadata {
    constructor() {
        // initialize your class properties here
        let defRow1 = {
            positions: ["DL", "LB"],
            allowMultiple: true,
        }
        let defRow2 = {
            positions: ["LB"],

        }
        let defRow3 = {
            positions: ["DB"]
        }
        let defRow3BoxL = {
            positions: ["DB"],
            allowMultiple: true,

        }

        let offLine = {
            positions: ["OL"]
        }
        let qb = {
            positions: ["QB"]
        }

        let backs = {
            positions: ["RB"]
        }
        let end = {
            positions: ["RB", "TE", "WR"]
        }
        let flanker = {
            positions: ["RB", "WR"]
        }

        this.metadata = {
            defensiveBoxes: [
                ["box_e", "box_d", "box_c", "box_b", "box_a"],
                ["box_j", "box_i", "box_h", "box_g", "box_f"],
                ["box_o", "box_n", "box_m", "box_l", "box_k"]
            ],
            offensiveBoxes: [
                ["LE_tight", "LT", "LG", "C", "RG", "RT", "RE_tight"],
                ["FL1", "QB", "FL2",],
                ["B1", "B2", "B3",]
            ],
            boxInfo: {
                "box_a": defRow1,
                "box_b": defRow1,
                "box_c": defRow1,
                "box_d": defRow1,
                "box_e": defRow1,
                "box_f": defRow2,
                "box_g": defRow2,
                "box_h": defRow2,
                "box_i": defRow2,
                "box_j": defRow2,
                "box_k": defRow3,
                "box_l": defRow3BoxL,
                "box_m": defRow3,
                "box_n": defRow3,
                "box_o": defRow3,
                "LE_tight": end, "LT": offLine, "LG": offLine, "C": offLine, "RG": offLine, "RT": offLine, "RE_tight": end,
                "FL1": flanker, "QB": qb, "FL2": flanker,
                "B1": backs, "B2": backs, "B3": backs
            },
            labels: {
                "box_a": "Box A",
                "box_b": "Box B",
                "box_c": "Box C",
                "box_d": "Box D",
                "box_e": "Box E",
                "box_f": "Box F",
                "box_g": "Box G",
                "box_h": "Box H",
                "box_i": "Box I",
                "box_j": "Box J",
                "box_k": "Box K",
                "box_l": "Box L",
                "box_m": "Box M",
                "box_n": "Box N",
                "box_o": "Box O",
                "LE_tight": "LE",
            }
        }

    }

    getBoxLabel(box) {
        if (this.metadata.labels.hasOwnProperty(box)) {
            return this.metadata.labels[box]
        }
        return box;
    }

    getDefensiveBoxLayout() {
        return this.metadata.defensiveBoxes;
    }


    getBoxLayout(isDefense) {
        if (isDefense) {
            return this.metadata.defensiveBoxes;
        }
        return this.metadata.offensiveBoxes;
    }

    getPositionMetaData(box) {
        return this.metadata.boxInfo[box];
    }

    getPositionForABox(box) {
        return this.metadata.boxInfo[box].positions;
    }
}

// defensiveBoxes: [
//     ["BoxA", "BoxB", "BoxC", "BoxD", "BoxE"],
//     ["BoxF", "BoxG", "BoxH", "BoxI", "BoxJ"],
//     ["BoxK", "BoxL", "BoxM", "BoxN", "BoxO"]
// ],