function eventStartLevel() {
	// Greets the player
	chat(ALLIES, "Hello! I'm Wally, your best defensive ally. I'll help you win this game.")

	// setup groups
	baseBuildersGroup = newGroup()
	defensesBuildersGroup = newGroup()
	attackerGroup = newGroup()
	bunkerBusterGroup = newGroup()

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
	setTimer("build", reactionSpeedDelay + 1500 + ((1 + random(14)) * random(46))) // 1,5 Seconds
	setTimer("attack", reactionSpeedDelay + 1000 + ((1 + random(30)) * random(10))) // 1 Second
	setTimer("checkIsHighOilMap", reactionSpeedDelay + 30000 + ((1 + random(30)) * random(10))) // 30 Seconds
	setTimer("setCurrentEnemy", reactionSpeedDelay + 180000 + ((1 + random(30)) * random(10))) // 3 Minutes
	setTimer("lookForOil", reactionSpeedDelay + 1500 + ((1 + random(30)) * random(10))) // 1,5 Seconds
	setTimer("myBaseInTrouble", reactionSpeedDelay + 5000 + ((1 + random(30)) * random(10))) // 5 Seconds
	setTimer("checkAllyBaseInTrouble", reactionSpeedDelay + 15000 + ((1 + random(30)) * random(10))) // 15 Seconds
	setTimer("recycleOldBuilders", reactionSpeedDelay + 20000 + ((1 + random(30)) * random(10))) // 20 Seconds
	setTimer("checkTrucksCount", reactionSpeedDelay + 120000 + ((1 + random(30)) * random(10))) // 2 Minutes
	setTimer("donateOil", reactionSpeedDelay + 120000 + ((1 + random(30)) * random(10))) // 2 Minutes
	setTimer("checkAllies", reactionSpeedDelay + 120000 + ((1 + random(30)) * random(10))) // 2 Minutes
	setTimer("checkForDefeatedAllies", reactionSpeedDelay + 120000 + ((1 + random(33)) * random(88))) // 2 Minutes
	setTimer("swapBuildersRole", reactionSpeedDelay + 15000 + ((1 + random(30)) * random(10))) // 15 Seconds
}

// BaseBuilders should be at least 5, the rest are focused at building defenses
function swapBuildersRole() {
	const builders = enumDroid(me, DROID_CONSTRUCT);
	
	for(const builder of builders) {
		eventDroidBuilt(builder)
	}
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
	removeTimer("checkIsHighOilMap")
	removeTimer("setCurrentEnemy")
	removeTimer("lookForOil")
	removeTimer("myBaseInTrouble")
	removeTimer("checkAllyBaseInTrouble")
	removeTimer("recycleOldBuilders")
	removeTimer("checkTrucksCount")
	removeTimer("donateOil")
	removeTimer("checkAllies")
	removeTimer("checkForDefeatedAllies")
	removeTimer("swapBuildersRole")
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
		if (enumGroup(baseBuildersGroup).length >= 5) {
			groupAdd(defensesBuildersGroup, droid)
		} else {
			groupAdd(baseBuildersGroup, droid)
		}

		return;
	}

	if (droid.droidType === DROID_WEAPON && droid.weapons?.[0]?.name === BUNKER_BUSTER_WEAPON[0]) {
		groupAdd(bunkerBusterGroup, droid)
		retreatToBase([droid])
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