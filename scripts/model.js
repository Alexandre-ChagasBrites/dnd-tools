async function fetchDnd(url) {
    try {    
        const response = await fetch(`https://www.dnd5eapi.co${url}`);
        return await response.json();
    } catch {
        return null;
    }
}

class Model {
    constructor() {
        this.players = JSON.parse(localStorage.getItem("players")) || {};
        this.monsters = {};
        this.characters = [];
        this.isRunning = false;
        this.isPaused = false;
        this.timer = new Timer(1000);
        this.activeCharacter = null;
        this.targetCharacter = null;

        this.characterAdded = new Event();
        this.characterRemoved = new Event();
        this.combatResumed = new Event();
        this.combatPaused = new Event();
        this.activeChanged = new Event();
        this.targetChanged = new Event();
    }

    addCharacter(characterType) {
        const character = {
            type: characterType,
            name: characterType.name,
            hit_points: characterType.hit_points,
            armor_class: characterType.armor_class[0],
            initiative: null,
        };

        if (characterType.group === "player") {
            
        } else if (characterType.group === "monster") {
            const count = this.characters.reduce((sum, character) => character.type === characterType ? sum + 1 : sum, 0);
            character.name += ` #${count + 1}`;
        }

        this.characters.push(character);
        this.characterAdded.notify({ character: character });
    }
    
    removeCharacter(character) {
        const index = this.characters.indexOf(character);
        if (index !== -1) {
            this.characters.splice(index, 1);
            this.characterRemoved.notify({ character: character });
            if (this.targetCharacter === character) {
                this.setTarget(null);
            }
        }
    }

    startCombat() {
        if (this.characters.length === 0) {
            return;
        }
        this.isRunning = true;
        this.isPaused = false;
        this.timer.start();
        this.combatResumed.notify({});
        this.setActive(this.characters[0]);
    }

    stopCombat() {
        this.isRunning = false;
        this.isPaused = true;
        this.timer.stop();
        this.combatPaused.notify({});
        this.setActive(null);
    }

    resumeCombat() {
        this.isPaused = false;
        this.timer.resume();
        this.combatResumed.notify({});
    }

    pauseCombat() {
        this.isPaused = true;
        this.timer.pause();
        this.combatPaused.notify({});
    }

    previousTurn() {
        const index = this.characters.indexOf(this.activeCharacter);
        if (index !== -1) {
            this.setActive(this.characters[(index - 1 + this.characters.length) % this.characters.length]);
        }
    }

    nextTurn() {
        const index = this.characters.indexOf(this.activeCharacter);
        if (index !== -1) {
            this.setActive(this.characters[(index + 1) % this.characters.length]);
        }
    }

    setActive(character) {
        this.activeCharacter = character;
        this.activeChanged.notify({ active: character });
    }

    setTarget(character) {
        this.targetCharacter = character;
        this.targetChanged.notify({ target: character });
    }

    addPlayer(player) {
        const index = player.name.toLowerCase().replaceAll(" ", "-");
        this.players[index] = player;
    }

    getPlayer(index) {
        if (index in this.players) {
            return this.players[index];
        } else {  
            return null;
        }
    }
    
    async getMonster(index) {
        if (index in this.monsters) {
            return this.monsters[index];
        } else {
            const monster = await fetchDnd(`/api/monsters/${index}`);
            if (monster !== null) {
                monster.group = "monster";
                this.monsters[index] = monster;
            }
            return monster;
        }
    }

    async getCharacterType(group, index) {
        if (group === "player") {
            return this.getPlayer(index);
        } else if (group === "monster") {
            return await this.getMonster(index);
        }
    }

    async getMonsterList() {
        return await fetchDnd("/api/monsters");
    }

    async loadCharacters() {
        for (const character of this.characters) {
            this.characterRemoved.notify({ character: character });
        }
        this.characters = JSON.parse(localStorage.getItem("characters")) || [];
        for (const character of this.characters) {
            character.type = await this.getCharacterType(character.type.group, character.type.index);
            this.characterAdded.notify({ character: character });
        }
    }

    async saveCharacters() {
        for (const character of this.characters) {
            character.type = {
                group: character.type.group,
                index: character.type.index
            };
        }
        localStorage.setItem("characters", JSON.stringify(this.characters));
        for (const character of this.characters) {
            character.type = await this.getCharacterType(character.type.group, character.type.index);
        }
    }
}
