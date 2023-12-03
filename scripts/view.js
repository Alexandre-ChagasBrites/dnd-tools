function getBonus(value) {
    value = Math.floor((value - 10) / 2);
    if (value >= 0) {
        return `+${value}`;
    } else {
        return value;
    }
}

function getChallengeRating(challenge_rating) {
    if (challenge_rating >= 1) {
        return challenge_rating;
    } else {
        return `1/${1 / challenge_rating}`;
    }
}

class View {
    constructor() {
        this.prevButton = document.getElementById("prevButton");
        this.round = document.getElementById("round");
        this.playpauseButton = document.getElementById("playpauseButton");
        this.stopButton = document.getElementById("stopButton");
        this.turn = document.getElementById("turn");
        this.nextButton = document.getElementById("nextButton");
        this.active = document.getElementById("active");
        this.target = document.getElementById("target");
        this.logTimer = document.getElementById("logTimer");
        this.logBody = document.getElementById("logBody");
        this.characterSelect = document.getElementById("characterSelect");
        this.playerGroup = document.getElementById("playerGroup");
        this.monsterGroup = document.getElementById("monsterGroup");
        this.addButton = document.getElementById("addButton");
        this.loadButton = document.getElementById("loadButton");
        this.loadInput = document.getElementById("loadInput");
        this.saveButton = document.getElementById("saveButton");
        this.encounterBody = document.getElementById("encounterBody");

        this.playpauseButtonClick = new Event();
        this.stopButtonClick = new Event();
        this.prevButtonClick = new Event();
        this.nextButtonClick = new Event();
        this.addButtonClick = new Event();
        this.removeButtonClick = new Event();
        this.characterClick = new Event();
        this.characterInitiativeChanged = new Event();
        this.loadInputChanged = new Event();

        this.prevButton.addEventListener("click", () => this.prevButtonClick.notify({}));
        this.playpauseButton.addEventListener("click", () => this.playpauseButtonClick.notify({}));
        this.stopButton.addEventListener("click", () => this.stopButtonClick.notify({}));
        this.nextButton.addEventListener("click", () => this.nextButtonClick.notify({}));

        this.addButton.addEventListener("click", () => {
            if (this.characterSelect.selectedIndex !== -1) {
                const option = this.characterSelect.options[this.characterSelect.selectedIndex];
                const index = option.text.toLowerCase().replaceAll(" ", "-");
                this.addButtonClick.notify({
                    group: option.parentNode === this.playerGroup ? "player" : "monster",
                    index: index,
                });
            }
        });

        this.loadButton.addEventListener("click", () => this.loadInput.click());
        this.loadInput.addEventListener("change", () => this.loadInputChanged.notify({ files: this.loadInput.files }));
    }

    addPlayer(player) {
        this.playerGroup.insertAdjacentHTML("beforeend", `<option>${player.name}</option>`);
    }

    addMonster(monster) {
        this.monsterGroup.insertAdjacentHTML("beforeend", `<option>${monster.name}</option>`);
    }

    addCharacter(character) {
        this.encounterBody.insertAdjacentHTML("beforeend", `
            <tr>
                <td class="arrow">➤</td>
                <td><input type="number" class="number"></td>
                <td>${character.name}</td>
                <td>${character.hit_points}/${character.hit_points}</td>
                <td>${character.armor_class.value}</td>
                <td><button type="button">Remove</button></td>
            </tr>
        `);
    
        const tr = this.encounterBody.children[this.encounterBody.children.length - 1];
        const input = tr.children[1].children[0];
        const button = tr.children[5].children[0];

        if (character.initiative !== null) {
            input.value = character.initiative;
        }
    
        tr.addEventListener("click", () => this.characterClick.notify({ character: character }));
        input.addEventListener("click", (event) => event.stopPropagation());

        input.addEventListener("change", () => {
            this.characterInitiativeChanged.notify({
                character: character,
                initiative: input.value.length > 0 ? parseInt(input.value) : null
            });
        });
    
        button.addEventListener("click", (event) => {
            this.removeButtonClick.notify({ character: character });
            event.stopPropagation();
        });
    }

    removeCharacter(character) {
        for (const tr of this.encounterBody.children) {
            if (tr.children[2].textContent === character.name) {
                tr.remove();
            }
        }
    }

    setRound(round) {
        this.round.textContent = round.toString();
    }

    setTurn(turn) {
        this.turn.textContent = turn;
    }

    setResumed() {
        this.playpauseButton.textContent = "⏸";
    }

    setPaused() {
        this.playpauseButton.textContent = "⏵";
    }
    
    setTimer(time) {
        const seconds = Math.floor(time / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        this.logTimer.textContent = `${hours.toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
    }

    tagCharacter(character, token) {
        for (const tr of this.encounterBody.children) {
            if (character !== null && tr.children[2].textContent === character.name) {
                tr.classList.add(token);
            } else {
                tr.classList.remove(token);
            }
        }
    }

    renderInfo(div, character) {
        div.replaceChildren();
        if (character === null) {
            return;
        }

        div.insertAdjacentHTML("beforeend", `
            <h3>${character.name}</h3>
            <p>${character.size} ${character.type}, ${character.alignment}</p>
            <hr/>
            <p>
                <strong>Classe de Armadura</strong> ${character.armor_class[0].value} (${character.armor_class[0].type})<br>
                <strong>Pontos de Vida</strong> ${character.hit_points} (${character.hit_points_roll})<br>
                <strong>Deslocamento</strong> ${Object.entries(character.speed).map(entry => `${entry[0].substring(0, 1).toUpperCase().concat(entry[0].substring(1))} ${entry[1]}`).join(", ")}<br>
            </p>
            <hr/>
            <div class="abilities">
                <p><strong>FOR</strong><br>${character.strength}(${getBonus(character.strength)})</p>
                <p><strong>DES</strong><br>${character.dexterity}(${getBonus(character.dexterity)})</p>
                <p><strong>CON</strong><br>${character.constitution}(${getBonus(character.constitution)})</p>
                <p><strong>INT</strong><br>${character.intelligence}(${getBonus(character.intelligence)})</p>
                <p><strong>SAB</strong><br>${character.wisdom}(${getBonus(character.wisdom)})</p>
                <p><strong>CAR</strong><br>${character.charisma}(${getBonus(character.charisma)})</p>
            </div>
            <hr/>
            <p>
                <strong>Testes de Resistência</strong> ${character.proficiencies.filter(entry => entry.proficiency.index.startsWith("saving-throw")).map(entry => `${entry.proficiency.name.substring(13)} +${entry.value}`).join(", ")}<br>
                <strong>Perícias</strong> ${character.proficiencies.filter(entry => entry.proficiency.index.startsWith("skill")).map(entry => `${entry.proficiency.name.substring(6)} +${entry.value}`).join(", ")}<br>
                <strong>Sentidos</strong> ${Object.entries(character.senses).map(entry => `${entry[0].substring(0, 1).toUpperCase().concat(entry[0].substring(1).replaceAll("_", " "))} ${entry[1]}`).join(", ")}<br>
                <strong>Idiomas</strong> ${character.languages}<br>
                <strong>Nível de Desafio</strong> ${getChallengeRating(character.challenge_rating)} (${character.xp} XP)<br>
            </p>
        `);
    
        this.renderInfoSection(div, character, "special_abilities");
        this.renderInfoSection(div, character, "actions", "Ações");
        
        if ("desc" in character) {
            div.insertAdjacentHTML("beforeend", `<p>${character.desc}</p>`);
        }
    }
    
    renderInfoSection(div, character, field, title = null) {
        if (!(field in character) || character[field] === null || character[field].length === 0) {
            return;
        }
    
        if (title !== null) {
            div.insertAdjacentHTML("beforeend", `<h4>${title}</h4>`);
        }
    
        div.insertAdjacentHTML("beforeend", `<hr/>`);
        for (const data of character[field]) {
            div.insertAdjacentHTML("beforeend", `<p><strong>${data.name}</strong>. ${data.desc.replaceAll("\n", "<br>")}</p>`);
            /*if ("spellcasting" in data) {
                const p = document.createElement("p");
                for (const [key, value] of Object.entries(data.spellcasting.slots)) {
                    p.appendChild(document.createTextNode(key + " "));
                    const buttons = [];
                    for (let i = 0; i <= value; i++) {
                        const button = document.createElement("button");
                        button.appendChild(document.createTextNode(i > 0 ? "⭘" : "⮾"));
                        button.setAttribute("type", "button");
                        button.classList.add("slot");
    
                        button.addEventListener("click", (event) => {
                            for (let j = 1; j <= value; j++) {
                                buttons[j].textContent = j <= i ? "◉" : "⭘";
                            }
                        });
    
                        buttons.push(button);
                        p.append(button);
                    }
                    p.appendChild(document.createElement("br"));
                }
                parent.appendChild(p);
                //createChildWithHtml(parent, "p", `⮾◉⭘<br>`);
            }*/
        }
    }
}
