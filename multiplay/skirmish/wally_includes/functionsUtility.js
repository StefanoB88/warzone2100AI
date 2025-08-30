// Objects
function playerDataObject(playerIndex) {
    if (playerIndex === undefined) {
        return
    }

    const player = playerData[playerIndex];
    const baseData = enumStruct(playerIndex, PLAYER_HQ_STAT)[0] ?? startPositions[playerIndex]

	return {
		"difficulty": player.difficulty,
		"colour": player.colour,
		"position": playerIndex,
		"isAI": player.isAI,
		"isHuman": player.isHuman,
		"name": player.name,
		"team": player.team,
        "base": {
            x: baseData.x,
            y: baseData.y
        }
	};
}

// Functions

function isHoverMap() {
    for (let i = 0; i < maxPlayers; ++i) {
        // If propulsion cannot reach the starting position of player i from BASE
        if (!propulsionCanReach("wheeled01", BASE.x, BASE.y, startPositions[i].x, startPositions[i].y)) {
            let temp = 0;

            // Loop through all players' positions
            for (let t = 0; t < maxPlayers; ++t) {
                if (i !== t && !propulsionCanReach("hover01", startPositions[i].x, startPositions[i].y, startPositions[t].x, startPositions[t].y)) {
                    temp++;
                }
            }

            // If at least one other player's position cannot be reached by hover
            if (temp !== maxPlayers - 1) {
                return true; // Exit early, no need to continue checking
            }
        }
    }

    return false; // If no conditions are met, return false
}

// Return a number in the range of 0 to (max - 1).
function random(max) {
    return (Math.random() * max) >>> 0;
}


// Return our real power level
function getRealPower(player) {
	if (!player) {
		player = me;
	}

	return (playerPower(player) - queuedPower(player));
}

// Sort an object according to the distance from the base
function sortByDistToPlayerBase(obj1, obj2, playerIndex) {
    if (playerIndex === undefined) {
        return
    }

    let playerBase = alliesList[playerIndex].base

	let dist1 = distBetweenTwoPoints(playerBase.x, playerBase.y, obj1.x, obj1.y);
	let dist2 = distBetweenTwoPoints(playerBase.x, playerBase.y, obj2.x, obj2.y);
	return (dist1 - dist2);
}

// Sort an object from farthest to closest to the player's base
function sortByDistToFarthestPlayerBase(obj1, obj2, playerIndex) {
    if (playerIndex === undefined) {
        return;
    }

    let playerBase = alliesList[playerIndex].base;

    let dist1 = distBetweenTwoPoints(playerBase.x, playerBase.y, obj1.x, obj1.y);
    let dist2 = distBetweenTwoPoints(playerBase.x, playerBase.y, obj2.x, obj2.y);
    
    return (dist2 - dist1);
}

// Sort an object according to the distance from the base
function sortByDistToBase(obj1, obj2) {
    let playerBase = enumStruct(me, PLAYER_HQ_STAT)[0] ?? BASE

	let dist1 = distBetweenTwoPoints(playerBase.x, playerBase.y, obj1.x, obj1.y);
	let dist2 = distBetweenTwoPoints(playerBase.x, playerBase.y, obj2.x, obj2.y);
	return (dist1 - dist2);
}

// Get all the allies alive players data
function getAliveAllyPlayersData() {
    const allies = [];

    for (let i = 0; i < maxPlayers; ++i) {
        if (i !== me && allianceExistsBetween(me, i) && isPlayerAlive(i)) {
            const allyPlayerData = playerDataObject(i);
            if (allyPlayerData) {
                allies.push(allyPlayerData);
            }
        }
    }

    return allies;
}

// Get all the allies defeated players data
function getDefeatedAllyPlayersData() {
    const allies = [];

    for (let i = 0; i < maxPlayers; ++i) {
        if (i !== me && allianceExistsBetween(me, i) && !isPlayerAlive(i)) {
            const allyPlayerData = playerDataObject(i);
            if (allyPlayerData) {
                allies.push(allyPlayerData);
            }
        }
    }

    return allies;
}

// Return all enemy players that are still alive
function getAliveEnemyPlayersData() {
    const enemies = [];

    for (let i = 0; i < maxPlayers; ++i) {
        if (i !== me && !allianceExistsBetween(me, i) && isPlayerAlive(i)) {
            const enemyPlayerData = playerDataObject(i);
            if (enemyPlayerData) {
                enemies.push(enemyPlayerData);
            }
        }
    }

    // Check for scavenger player
    if (scavengers) {
        const hasScavengerStructures = countStruct("A0BaBaFactory", scavengerPlayer) +
                                       countStruct(DERRICK_STAT, scavengerPlayer);
        const hasScavengerDroids = countDroid(DROID_ANY, scavengerPlayer);

        if (hasScavengerStructures > 0 || hasScavengerDroids > 0) {
            scavengerIndex = scavengerPlayer;
            const scavengerData = createScavengerPlayerData(scavengerPlayer);
            if (scavengerData) {
                enemies.push(scavengerData);
            }
        }
    }

    return enemies;
}

/**
 * Create a minimal PlayerData object for the scavenger player
 * @param {number} scavengerIndex - The index of the scavenger
 * @returns {PlayerData}
 */
function createScavengerPlayerData(scavengerIndex) {
    return {
        difficulty: null,
        colour: null,
        position: scavengerIndex, // only position index is filled
        isAI: true,
        isHuman: false,
        name: "Scavenger",
        team: -1,
        base: null
    };
}


// Check if a player is still alive
function isPlayerAlive(playerIndex) {
	if (playerIndex === undefined) {
		return false;
	}

	if (countDroid(DROID_CONSTRUCT, playerIndex) + countStruct(FACTORY_STAT, playerIndex) + countStruct(CYBORG_FACTORY_STAT, playerIndex) > 0) {
		return true;
	}

	return false;
}

// Check if a player is an ally
function friendlyPlayer(player) {
	if (!player) {
		return false;
	}

	return (player === me || allianceExistsBetween(me, player));
}

// Get the player name
function getPlayerName(player) {
	if (!player) {
		return;
	}

	return playerData[player].name;
}

// Check if we have a lot of derricks
function checkIsHighOilMap() {
	if (countStruct(DERRICK_STAT, me) >= 30) {
		isHighOilMap = true;
	}
	isHighOilMap =  false;
}

// Used for deciding if a truck will capture oil.
function isUnsafeEnemyObject(obj) {
	if (obj.player === me || allianceExistsBetween(me, obj.player)) {
		return false;
	}

	if (obj.type === DROID) {
		return true;
	}

	return (obj.type === STRUCTURE && obj.stattype === DEFENSE && obj.status === BUILT);
}

function numWeapObjectsInRange(x, y, enemies, allyIndex, scanRadius, visible) {
    let isSafe = true;
    
	if (!x || !y) {
		return isSafe; // Seems to be the best fail-safe
	}

	if (!scanRadius) {
		scanRadius = 5;
	}

	if (!visible) {
		visible = false;
	}

	let allyDroids = enumDroid(allyIndex, DROID_WEAPON).concat(enumDroid(allyIndex, DROID_CYBORG));
    let enemiesStuff = enumRange(x, y, scanRadius, enemies, visible);

    let enemyDroidsCount = 0

    for (let i = 0, l = enemiesStuff.length; i < l; ++i) {
		let obj = enemiesStuff[i];

		if (obj.type === DROID && (obj.droidType === DROID_WEAPON || obj.droidType === DROID_CYBORG) && obj.droidType !== DROID_CONSTRUCT) {
            enemyDroidsCount++
        }
	}

	if (enemyDroidsCount > allyDroids.length) {
		isSafe = false;
	}

	return isSafe;
}

function isBaseStructure(type) {
    return [FACTORY, CYBORG_FACTORY, VTOL_FACTORY, POWER_GEN, RESEARCH_LAB, HQ].includes(type);
}

function isNearBase(x, y) {
    return distBetweenTwoPoints(x, y, BASE.x, BASE.y) <= BASE_THREAT_RANGE;
}

// Fisher-Yates shuffle for better randomization
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}