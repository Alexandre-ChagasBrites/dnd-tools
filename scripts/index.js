const model = new Model();
const view = new View();

function loadPlayerGroup() {
    for (const player of Object.values(model.players)) {
        view.addPlayer(player);
    }
}

async function loadMonsterGroup() {
    const monsters = await model.getMonsterList();
    if (monsters !== null) {
        for (let i = 0; i < monsters.count; i++) {
            const monster = monsters.results[i];
            view.addMonster(monster);
        }   
    }
}

function controlCharacterAdded({character}) {
    view.addCharacter(character);
}

function controlCharacterRemoved({character}) {
    view.removeCharacter(character)
}

function controlCombatResumed() {
    view.setResumed();
}

function controlCombatPaused() {
    view.setPaused();
}

function controlActiveChanged({active}) {
    view.tagCharacter(active, "current");
    view.setTurn(active != null ? active.name : "");
}

function controlTargetChanged({target}) {
    view.tagCharacter(target, "selected");
    view.renderInfo(view.target, target !== null ? target.type : null);
}

function controlTimerChanged({time}) {
    view.setTimer(time);
}

function controlPlaypauseButtonClick() {
    if (model.isRunning) {
        if (model.isPaused) {
            model.resumeCombat();
        } else {
            model.pauseCombat();
        }
    } else {
        model.startCombat();
    }
}

function controlStopButtonClick() {
    if (model.isRunning) {
        model.stopCombat();
    }
}

function controlPrevButtonClick() {
    if (model.isRunning) {
        model.previousTurn();
    }
}

function controlNextButtonClick() {
    if (model.isRunning) {
        model.nextTurn();
    }
}

async function controlAddButtonClick({group, index}) {
    const characterType = await model.getCharacterType(group, index);
    if (characterType !== null) {
        model.addCharacter(characterType);
    }
}

function controlRemoveButtonClick({character}) {
    model.removeCharacter(character);
}

function controlCharacterClick({character}) {
    model.setTarget(character);
}

function controlCharacterInitiativeChanged({character, initiative}) {
    character.initiative = initiative;
}

async function controlLoadInputChanged({files}) {
    for (const file of files) {
        if (file.type !== "application/json") {
            continue;
        }

        const text = await file.text();
        const player = JSON.parse(text);

        model.addPlayer(player);
        view.addPlayer(player);
    }
}

function controlLoad() {
    loadPlayerGroup();
    loadMonsterGroup();
    model.loadCharacters();
}

function controlSave() {
    model.saveCharacters();
}

model.characterAdded.attach(controlCharacterAdded);
model.characterRemoved.attach(controlCharacterRemoved);
model.combatResumed.attach(controlCombatResumed);
model.combatPaused.attach(controlCombatPaused);
model.activeChanged.attach(controlActiveChanged);
model.targetChanged.attach(controlTargetChanged);
model.timer.changed.attach(controlTimerChanged);

view.playpauseButtonClick.attach(controlPlaypauseButtonClick);
view.stopButtonClick.attach(controlStopButtonClick);
view.prevButtonClick.attach(controlPrevButtonClick);
view.nextButtonClick.attach(controlNextButtonClick);
view.addButtonClick.attach(controlAddButtonClick);
view.removeButtonClick.attach(controlRemoveButtonClick);
view.characterClick.attach(controlCharacterClick);
view.characterInitiativeChanged.attach(controlCharacterInitiativeChanged);
view.loadInputChanged.attach(controlLoadInputChanged);

window.addEventListener("load", controlLoad);
window.addEventListener("pagehide", controlSave);
