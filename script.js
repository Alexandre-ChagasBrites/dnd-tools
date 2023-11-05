const playpauseButton = document.getElementById("playpauseButton");
const stopButton = document.getElementById("stopButton");
const combatantInput = document.getElementById("combatantInput");
const combatantList = document.getElementById("combatantList");
const activeDiv = document.getElementById("active");
const targetDiv = document.getElementById("target");
const logDiv = document.getElementById("log");
const addButton = document.getElementById("addButton");
const tbody = document.querySelector("tbody");

let isRunning = false;
let isPaused = true;
const combatantMap = {};
let selected = null;

playpauseButton.addEventListener("click", (event) => {
    if (!isRunning) {
        isRunning = true;
        isPaused = false;
        startedCombat();
    } else {
        isPaused = !isPaused;
        if (isPaused) {
            pausedCombat();
        } else {
            resumedCombat();
        }
    }
    playpauseButton.textContent = isPaused ? "⏵" : "⏸";
});

stopButton.addEventListener("click", (event) => {
    if (isRunning) {
        isRunning = false;
        isPaused = true;
        stoppedCombat();
        playpauseButton.textContent = "⏵";
    }
});

function startedCombat() {

}

function stoppedCombat() {

}

function resumedCombat() {
    
}

function pausedCombat() {

}

async function fillCombatantMap() {
    const monsters = await fetchDnd("/api/monsters");
    if (monsters === null)
        return;
    for (var i = 0; i < monsters.count; i++) {
        const entry = monsters.results[i];
        combatantMap[entry.name] = entry.url;
        addOption(combatantList, entry);
    }
}
fillCombatantMap();

function addOption(datalist, entry) {
    const option = document.createElement("option");
    option.setAttribute("value", entry.name);
    datalist.appendChild(option);
}

addButton.addEventListener("click", async (event) => {
    const monster = await fetchDnd(combatantMap[combatantInput.value]);
    if (monster === null)
        return;

    const tr = document.createElement("tr");

    const ini = document.createElement("td");
    const input = document.createElement("input");
    input.setAttribute("type", "number");
    input.classList.add("number");
    ini.appendChild(input);
    tr.appendChild(ini);

    const name = createChildWithText(tr, "td", monster.name);
    const hp = createChildWithText(tr, "td", `${monster.hit_points}/${monster.hit_points}`);
    const ac = createChildWithText(tr, "td", monster.armor_class[0].value);

    const remove = document.createElement("td");
    const button = document.createElement("button");
    button.appendChild(document.createTextNode("Remove"));
    button.setAttribute("type", "button");
    remove.appendChild(button);
    tr.appendChild(remove);

    tr.addEventListener("click", (event) => {
        if (selected !== null) {
            if (selected.tr === tr) {
                return;
            }
            removeSelected();
        }
        selected = {
            "character": monster,
            "tr": tr,
        };
        addSelected();
    });

    input.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    button.addEventListener("click", (event) => {
        tbody.removeChild(tr);
        if (selected !== null && selected.tr === tr) {
            removeSelected();
            selected = null;
        }
        event.stopPropagation();
    });

    tbody.appendChild(tr);
});

function createElementWithText(tagName, data) {
    const element = document.createElement(tagName);
    const text = document.createTextNode(data);
    element.appendChild(text);
    return element;
}

function createChildWithText(parent, tagName, data) {
    const element = createElementWithText(tagName, data);
    parent.appendChild(element);
    return element;
}

function createChildWithHtml(parent, tagName, html) {
    const element = document.createElement(tagName);
    element.innerHTML = html;
    parent.appendChild(element);
    return element;
}

async function fetchDnd(url) {
    try {
        const response = await fetch("https://www.dnd5eapi.co" + url);
        return await response.json();
    } catch {
        return null;
    }
}

function addSelected() {
    const character = selected.character;

    selected.tr.classList.add("selected");

    createChildWithText(targetDiv, "h3", character.name);
    createChildWithText(targetDiv, "p", `${character.size} ${character.type}, ${character.alignment}`);

    targetDiv.appendChild(document.createElement("hr"));
    createChildWithHtml(targetDiv, "p", `
        <strong>Classe de Armadura</strong> ${character.armor_class[0].value} (${character.armor_class[0].type})<br>
        <strong>Pontos de Vida</strong> ${character.hit_points} (${character.hit_points_roll})<br>
        <strong>Deslocamento</strong> ${Object.entries(character.speed).map(entry => `${entry[0].substring(0, 1).toUpperCase().concat(entry[0].substring(1))} ${entry[1]}`).join(", ")}<br>
    `);
    
    targetDiv.appendChild(document.createElement("hr"));
    const stats = targetDiv.appendChild(document.createElement("div"));
    stats.classList.add("abilities");
    createChildWithHtml(stats, "p", `<strong>FOR</strong><br>${character.strength}(${getBonus(character.strength)})`);
    createChildWithHtml(stats, "p", `<strong>DES</strong><br>${character.dexterity}(${getBonus(character.dexterity)})`);
    createChildWithHtml(stats, "p", `<strong>CON</strong><br>${character.constitution}(${getBonus(character.constitution)})`);
    createChildWithHtml(stats, "p", `<strong>INT</strong><br>${character.intelligence}(${getBonus(character.intelligence)})`);
    createChildWithHtml(stats, "p", `<strong>SAB</strong><br>${character.wisdom}(${getBonus(character.wisdom)})`);
    createChildWithHtml(stats, "p", `<strong>CAR</strong><br>${character.charisma}(${getBonus(character.charisma)})`);
    
    targetDiv.appendChild(document.createElement("hr"));
    createChildWithHtml(targetDiv, "p", `
        <strong>Testes de Resistência</strong> ${character.proficiencies.filter(entry => entry.proficiency.index.startsWith("saving-throw")).map(entry => `${entry.proficiency.name.substring(13)} +${entry.value}`).join(", ")}<br>
        <strong>Perícias</strong> ${character.proficiencies.filter(entry => entry.proficiency.index.startsWith("skill")).map(entry => `${entry.proficiency.name.substring(6)} +${entry.value}`).join(", ")}<br>
        <strong>Sentidos</strong> ${Object.entries(character.senses).map(entry => `${entry[0].substring(0, 1).toUpperCase().concat(entry[0].substring(1).replaceAll("_", " "))} ${entry[1]}`).join(", ")}<br>
        <strong>Idiomas</strong> ${character.languages}<br>
        <strong>Nível de Desafio</strong> ${getChallengeRating(character.challenge_rating)} (${character.xp} XP)<br>
    `);

    addSection(targetDiv, character, "special_abilities");
    addSection(targetDiv, character, "actions", "Ações");
    
    if ("desc" in character) {
        createChildWithText(targetDiv, "p", character.desc);
    }
}

function addSection(parent, character, attribute, title = null) {
    if (character[attribute] === null || character[attribute].length === 0) {
        return;
    }
    if (title !== null) {
        createChildWithText(targetDiv, "h4", title);
    }
    targetDiv.appendChild(document.createElement("hr"));
    for (data of character[attribute]) {
        createChildWithHtml(parent, "p", `
            <strong>${data.name}</strong>. ${data.desc.replaceAll("\n", "<br>")}
        `);
        if ("spellcasting" in data) {
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
        }
    }
}

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

function removeSelected() {
    selected.tr.classList.remove("selected");
    targetDiv.replaceChildren();
}
