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
                ["le", "lt", "lg", "c", "rg", "rt", "re"],
                ["fl1", "qb", "fl2",],
                ["b1", "b2", "b3",]
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
                "le": end, "lt": offLine, "lg": offLine, "c": offLine, "rg": offLine, "rt": offLine, "re": end,
                "fl1": flanker, "qb": qb, "fl2": flanker,
                "b1": backs, "b2": backs, "b3": backs
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
                "LE": "LE",
            },
            offensivePlays: {
                InsideRun: {
                    code: "IR",
                    description: "Running, Inside Right [IR]",
                    boxes: ["b1", "b2", "b3"]
                },
                InsideLeft: {
                    code: "IL",
                    description: "Running, Inside Left [IL]",
                    boxes: ["b1", "b2", "b3"]
                },
                InsideRight: {
                    code: "IR",
                    description: "Running, Sweep Right [IR]",
                    boxes: ["b1", "b2", "b3"]
                },
                InsideLeft: {
                    code: "IL",
                    description: "Running, Sweep Left [IL]",
                    boxes: ["b1", "b2", "b3"]
                },
                EndAround: {
                    code: "ER",
                    description: "Running, End Around[ER]",
                    boxes: ["b1", "b2", "b3"]
                },
                ScreenPass: {
                    code: "SC",
                    description: "Screen Pass[SC]",
                    boxes: ["b1", "b2", "b3"]
                },
                QuickPass: {
                    code: "QK",
                    description: "Quick Pass[QK]",
                    boxes: ["b1", "b2", "b3", "fl1", "fl2", "le", "re"]
                },
                ShortPass: {
                    code: "SH",
                    description: "Short Pass[SH]",
                    boxes: ["b1", "b2", "b3", "fl1", "fl2", "le", "re"]
                },
                LongPass: {
                    code: "LG",
                    description: "Long Pass[LG]",
                    boxes: ["b1", "b2", "b3", "fl1", "fl2", "le", "re"]
                },
            },

            defensivePlays: {
                RunDefense: { code: "Run", description: "Run Defense", boxes: ["b1", "b2", "b3"] },
                PassDefense: { code: "Pass", description: "Pass Defense", boxes: ["b1", "b2", "b3", "fl1", "fl2", "le", "re"] },
                PreventDefense: { code: "Prevent", description: "Prevent Defense", boxes: ["b1", "b2", "b3", "fl1", "fl2", "le", "re"] },
                Blitz: { code: "Pass - Blitz", description: "Pass - Blitz Defense", boxes: ["b1", "b2", "b3", "fl1", "fl2", "le", "re"] }

            },


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

    getOffensivePlayNames() {
        return Object.keys(this.metadata.offensivePlays);
    }
    getDefensivePlayNames() {
        return Object.keys(this.metadata.defensivePlays);
    }

    getBoxesPerPlay(play) {
        console.log(play);
        if (!play) {
            return [];
        }
        return this.metadata.offensivePlays[play].boxes;
    }
    getOffensePlayInfo(play) {
        if (!play) {
            return null;
        }
        return this.metadata.offensivePlays[play];
    }
    getDefensePlayInfo(play) {
        if (!play) {
            return null;
        }
        return this.metadata.defensivePlays[play];
    }

}

// defensiveBoxes: [
//     ["BoxA", "BoxB", "BoxC", "BoxD", "BoxE"],
//     ["BoxF", "BoxG", "BoxH", "BoxI", "BoxJ"],
//     ["BoxK", "BoxL", "BoxM", "BoxN", "BoxO"]
// ],