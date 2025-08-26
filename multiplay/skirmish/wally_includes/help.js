function checkAllyBaseInTrouble() {
	// Help an ally, only if my base is safe
	if (isMyBaseInTrouble) {
		return;
	}

	for (const ally of alliesList) {
		if (!isPlayerAlive(ally.position)) {
			return
		}

		const allyBasePosition = ally.base

		const isSafe = numWeapObjectsInRange(allyBasePosition.x, allyBasePosition.y, ENEMIES, ally.position, BASE_THREAT_RANGE, true);

		if (!isSafe && isHelpingAlly === false) {
			helpAlly(ally)
			return;
		} else {
			// If there are no more enemies, retire
			stopHelpingAlly()
			return;
		}
	}

	return;
}

// Returns true if the ally is helped, false otherwise
function helpAlly(allyPlayerData) {
	currentHelpedAlly = allyPlayerData

	const playerData = allyPlayerData;

    if (enumGroup(attackerGroup).length < 10) {
		return false; // Early exit if not enough droids
	}

    const enemiesDroids = enumRange(playerData.base.x, playerData.base.y, BASE_THREAT_RANGE, ENEMIES, true)
		.filter(obj => obj.type === DROID && (obj.droidType === DROID_WEAPON || obj.droidType === DROID_CYBORG))

    if (enemiesDroids.length === 0) {
		return false; // No enemiesDroids found
	}

    const droidsEnemyPlayer = enemiesDroids[0].player;

    if (droidsEnemyPlayer !== undefined) {
		setCurrentEnemy(droidsEnemyPlayer);
	}

    chat(ALLIES, `Hold on ${playerData.name}! I'm coming to help you, ${enumGroup(attackerGroup).length} units are on the way`);

    helpingAlly();

    return true;
}

function helpingAlly() {
	// Set helping state
	isHelpingAlly = true;

	// Don't change the target for 3 minutes, since we are helping an ally
	removeTimer("checkAllyBaseInTrouble")
	removeTimer("setCurrentEnemy")
	queue("stopHelpingAlly", 180000); // After 3 minutes, stop helping the ally
}

function stopHelpingAlly() {
	if (isHelpingAlly === false) {
		return
	}

	setCurrentEnemy()
	setTimer("checkAllyBaseInTrouble", reactionSpeedDelay + 15000 + ((1 + random(30)) * random(10))) // 15 Seconds
	setTimer("setCurrentEnemy", reactionSpeedDelay + 60000 + ((1 + random(30)) * random(10))) // 60 Seconds
	isHelpingAlly = false
}

function myBaseInTrouble() {
	const isSafe = numWeapObjectsInRange(BASE.x, BASE.y, ENEMIES, me, BASE_THREAT_RANGE, true);

	if (isSafe) {
		isMyBaseInTrouble = false;
		return false;
	} else {
		isMyBaseInTrouble = true;
		stopHelpingAlly()
		return true;
	}
}

function donateOil() {
    let currentPower = getRealPower(me);

    // Do not proceed if power is below 5000 or no allies exist
    if (currentPower < 5000 || alliesList.length === 0) {
        return;
    }

    // Shuffle alliesList to select allies in random order
    const shuffledAllies = shuffleArray([...alliesList]);

    for (const ally of shuffledAllies) {
        // Check if the ally needs power
        if (getRealPower(ally) < 50 && friendlyPlayer(ally) && isPlayerAlive(ally)) {
            let powerToDonate;

            // Calculate power to donate based on current power levels
            if (currentPower >= 15000) {
                powerToDonate = currentPower / 3.5;
            } else if (currentPower >= 10000) {
                powerToDonate = currentPower / 3;
            } else if (currentPower >= 5000) {
                powerToDonate = currentPower / 2.5;
            } else {
                continue; // Skip if not enough power to donate
            }

            // Ensure donation will not drop below 5000 power
            if (currentPower - powerToDonate < 5000) {
                continue; // Skip this ally if donation would drop power too low
            }

            // Donate power to the ally
            donatePower(powerToDonate, ally);
            chat(ally, `I've sent you: ${powerToDonate.toFixed(2)} power to help you out.`);

            // Update current power after donation
            currentPower -= powerToDonate;

            // Exit loop after donating to a random ally
            break;
        }
    }
}


function checkForDefeatedAllies() {
	const defeatedAllies = getDefeatedAllyPlayersData()

	for (const ally of defeatedAllies) {

		const truckForAlly = enumDroid(me, DROID_CONSTRUCT)[0]
    
        if (donateObject(truckForAlly, ally)) {
            chat(ALLIES, `${ally.name} ` + "I've sent you a truck :P")
        }
	}
}