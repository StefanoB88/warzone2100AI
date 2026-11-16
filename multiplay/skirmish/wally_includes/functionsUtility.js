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
	if (player === undefined) {
		player = me;
	}

	return (playerPower(player) - queuedPower(player));
}

// Sort an object according to the distance from the base
function sortByDistToPlayerBase(obj1, obj2, playerIndex) {
    if (playerIndex === undefined) {
        return 0;
    }

    const ally = alliesList.find(a => a.position === playerIndex);
    const playerBase = ally ? ally.base : startPositions[playerIndex];
    if (!playerBase) return 0;

	let dist1 = distBetweenTwoPoints(playerBase.x, playerBase.y, obj1.x, obj1.y);
	let dist2 = distBetweenTwoPoints(playerBase.x, playerBase.y, obj2.x, obj2.y);
	return (dist1 - dist2);
}

// Sort an object from farthest to closest to the player's base
function sortByDistToFarthestPlayerBase(obj1, obj2, playerIndex) {
    if (playerIndex === undefined) {
        return 0;
    }

    const ally = alliesList.find(a => a.position === playerIndex);
    const playerBase = ally ? ally.base : startPositions[playerIndex];
    if (!playerBase) return 0;

    let dist1 = distBetweenTwoPoints(playerBase.x, playerBase.y, obj1.x, obj1.y);
    let dist2 = distBetweenTwoPoints(playerBase.x, playerBase.y, obj2.x, obj2.y);
    
    return (dist2 - dist1);
}

// Sort an object according to the distance from the base
function sortByDistToBase(obj1, obj2) {
	let dist1 = distBetweenTwoPoints(BASE.x, BASE.y, obj1.x, obj1.y);
	let dist2 = distBetweenTwoPoints(BASE.x, BASE.y, obj2.x, obj2.y);
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
    let scavengerBase = { x: mapWidth / 2, y: mapHeight / 2 }; // Fallback to center of map
    let scavStructs = enumStruct(scavengerIndex);
    
    if (scavStructs.length > 0) {
        scavengerBase = { x: scavStructs[0].x, y: scavStructs[0].y };
    } else {
        let scavDroids = enumDroid(scavengerIndex);
        if (scavDroids.length > 0) {
            scavengerBase = { x: scavDroids[0].x, y: scavDroids[0].y };
        }
    }

    return {
        difficulty: null,
        colour: null,
        position: scavengerIndex, // only position index is filled
        isAI: true,
        isHuman: false,
        name: "Scavenger",
        team: -1,
        base: scavengerBase
    };
}


// Check if a player is still alive
function isPlayerAlive(playerIndex) {
	if (playerIndex === undefined) {
		return false;
	}

	if (playerIndex === scavengerIndex) {
		return (countStruct("A0BaBaFactory", scavengerIndex) + countStruct(DERRICK_STAT, scavengerIndex) + countDroid(DROID_ANY, scavengerIndex)) > 0;
	}

	if (countDroid(DROID_CONSTRUCT, playerIndex) + countStruct(FACTORY_STAT, playerIndex) + countStruct(CYBORG_FACTORY_STAT, playerIndex) > 0) {
		return true;
	}

	return false;
}

// Check if a player is an ally
function friendlyPlayer(player) {
	if (player === undefined) {
		return false;
	}

	return (player === me || allianceExistsBetween(me, player));
}

// Get the player name
function getPlayerName(player) {
	if (player === undefined || !playerData[player]) {
		return "Scavenger";
	}

	return playerData[player].name;
}

// Check if we have a lot of derricks
function checkIsHighOilMap() {
	isHighOilMap = countStruct(DERRICK_STAT, me) >= 30;
}

// Check if an object is a derrick
function isDerrick(obj) {
	return (obj.type === STRUCTURE && obj.stattype === RESOURCE_EXTRACTOR);
}

// Used for deciding if a truck will capture oil or build/recover in an area.
function isUnsafeEnemyObject(obj) {
	if (obj.player === me || allianceExistsBetween(me, obj.player)) {
		return false;
	}

	if (obj.type === DROID) {
		return true;
	}

	// Any defense or production facility makes the area unsafe
	if (obj.type === STRUCTURE && obj.status === BUILT) {
		const dangerousStats = [DEFENSE, FACTORY, CYBORG_FACTORY, VTOL_FACTORY, HQ];
		return dangerousStats.includes(obj.stattype);
	}

	return false;
}

// Evaluates if an area at (x, y) is safe from enemy units, defenses, and the enemy base
function isAreaSafe(x, y, range = 18) {
	if (x === undefined || y === undefined) {
		return false;
	}

	// Check if too close to the current enemy base
	if (currentEnemy && currentEnemy.base) {
		if (distBetweenTwoPoints(x, y, currentEnemy.base.x, currentEnemy.base.y) < 25) {
			return false;
		}
	}

	// Check if there are any dangerous enemy droids or structures in range, or if we are outnumbered
	const hasUnsafeObjects = enumRange(x, y, range, ENEMIES, false).some(isUnsafeEnemyObject);
	if (hasUnsafeObjects) {
		return false;
	}

	return numWeapObjectsInRange(x, y, ENEMIES, me, range, false);
}

function numWeapObjectsInRange(x, y, enemies, allyIndex, scanRadius, visible) {
    let isSafe = true;
    
	if (x === undefined || y === undefined) {
		return isSafe; // Seems to be the best fail-safe
	}

	if (!scanRadius) {
		scanRadius = 5;
	}

	if (visible === undefined) {
		visible = false;
	}

	let allyDroids = enumDroid(allyIndex, DROID_WEAPON).concat(enumDroid(allyIndex, DROID_CYBORG));
    let enemiesStuff = enumRange(x, y, scanRadius, enemies, visible);

    let enemyDroidsCount = 0;

    for (let i = 0, l = enemiesStuff.length; i < l; ++i) {
		let obj = enemiesStuff[i];

		if (obj.type === DROID && (obj.droidType === DROID_WEAPON || obj.droidType === DROID_CYBORG) && obj.droidType !== DROID_CONSTRUCT) {
            enemyDroidsCount++;
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