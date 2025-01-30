function eventStartLevel() {
	// Greets the player
	chat(ALLIES, "Hello! I'm Wally, your best defensive ally. I'll help you win this game.")

	// setup groups
	buildersGroup = newGroup()
	attackerGroup = newGroup()

	enumDroid(me).forEach(droid => {
		eventDroidBuilt(droid);
	});

	isSeaMap = isHoverMap()

	// Set Difficulty
	setDifficulty()

	// Check if the Technology level is 4
	isMultiTech4()

	// Recycle old builder if possible
	recycleOldBuilders()

	// Set the allies
	alliesList = getAliveAllyPlayersData()

	// Set the enemies
	enemiesList = getAliveEnemyPlayersData()

	// Set the current enemy
	setCurrentEnemy()

	// Set the timer call randomly so as not to calculate in the same tick.
	setTimer("produceDroids", reactionSpeedDelay + 1500 + ((1 + random(30)) * random(10))); // 1,5 Seconds
	setTimer("research", reactionSpeedDelay + 1500 + ((1 + random(30)) * random(10))) // 1,5 Seconds
	setTimer("build", reactionSpeedDelay + 3000 + ((1 + random(30)) * random(10))) // 3 Seconds
	setTimer("attack", reactionSpeedDelay + 1500 + ((1 + random(30)) * random(10))) // 1,5 Seconds
	setTimer("isHighOilMap", reactionSpeedDelay + 45000 + ((1 + random(30)) * random(10))) // 45 Seconds
	setTimer("setCurrentEnemy", reactionSpeedDelay + 120000 + ((1 + random(30)) * random(10))) // 2 Minutes
	setTimer("lookForOil", reactionSpeedDelay + 2000 + ((1 + random(30)) * random(10))) // 2 Seconds
	setTimer("myBaseInTrouble", reactionSpeedDelay + 10000 + ((1 + random(30)) * random(10))) // 10 Seconds
	setTimer("checkAllyBaseInTrouble", reactionSpeedDelay + 15000 + ((1 + random(30)) * random(10))) // 15 Seconds
	setTimer("recycleOldBuilders", reactionSpeedDelay + 20000 + ((1 + random(30)) * random(10))) // 20 Seconds
	setTimer("checkTrucksCount", reactionSpeedDelay + 120000 + ((1 + random(30)) * random(10))) // 2 Minutes
	setTimer("donateOil", reactionSpeedDelay + 120000 + ((1 + random(30)) * random(10))) // 2 Minutes
	setTimer("checkAllies", reactionSpeedDelay + 120000 + ((1 + random(30)) * random(10))) // 2 Minutes
}

// Check and update the alive allies
function checkAllies() {
	alliesList = getAliveAllyPlayersData()
}

// Set the an enemy player as enemy to attack
function setCurrentEnemy(enemyPlayerData) {
	enemiesList = getAliveEnemyPlayersData()

	if (enemyPlayerData !== undefined) {
		currentEnemy = enemyPlayerData
	} else if (enemiesList.length > 0) {

		if (enemiesList.length === 1 && enemiesList[0].position === scavengerPlayer) {
			areAllEnemiesDead = true
			shutdownScripts()
			return
		}

		currentEnemy = enemiesList[random(enemiesList.length)]
	} else {
		areAllEnemiesDead = true
		shutdownScripts()
	}
}

function shutdownScripts() {
	removeTimer("produceDroids")
	removeTimer("research")
	removeTimer("build")
	removeTimer("attack")
	removeTimer("isHighOilMap")
	removeTimer("setCurrentEnemy")
	removeTimer("lookForOil")
	removeTimer("myBaseInTrouble")
	removeTimer("checkAllyBaseInTrouble")
	removeTimer("recycleOldBuilders")
	removeTimer("checkTrucksCount")
	removeTimer("donateOil")
	removeTimer("checkAllies")
}

function setDifficulty() {
	switch (difficulty) {
		case EASY:
			reactionSpeedDelay = 15000; // 15 Seconds
			break;
		case MEDIUM:
			reactionSpeedDelay = 5000; // 5 Seconds
			break;
		case HARD:
		case INSANE:
			reactionSpeedDelay = 0; // 0 Seconds - normal speed
			break;
		default:
			break;
	}
}

function isMultiTech4() {
	if (getMultiTechLevel() === 4) {
		researchDone = true
		recycleOldBuilders()
	}
}

function eventDroidBuilt(droid) {
	if (!droid || droid.type != DROID) {
		return;
	}

	if (droid.droidType === DROID_CONSTRUCT) {
		groupAdd(buildersGroup, droid)
		return;
	}

	if (droid.droidType === DROID_WEAPON || droid.droidType === DROID_SENSOR || droid.droidType === DROID_CYBORG || droid.isVTOL === true) {
		groupAdd(attackerGroup, droid)
		return;
	}
}

function eventObjectTransfer(obj, from) {
	if (obj.type === DROID) {
		let droid = obj
		eventDroidBuilt(droid)
		recycleOldBuilders()
		chat(from, "Thank you for the gift <3")
	}
}

// The parameter "to" is always "me"
function eventBeacon(x, y, from, to, message) {

}