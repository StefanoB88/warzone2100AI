function attack() {
	const attackerDroids = enumGroup(attackerGroup).filter(attacker => attacker.order !== DORDER_RTR)

    if ((attackerDroids.length === 0) || areAllEnemiesDead === true) {
        return;
    }

    let MIN_GROUP_SIZE = isHelpingAlly ? 5 : isHighOilMap ? 30 : 15
    
    if (attackerDroids.length < MIN_GROUP_SIZE && !isMyBaseInTrouble) {
		retreatToBase(attackerDroids)
        return
    }

    attackEnemy(attackerDroids)
}

function attackEnemy(attackerDroids) {
    const enemyIndex = currentEnemy.position;

    // If the current enemy is dead, choose another one
    if (!isPlayerAlive(enemyIndex) || enemyIndex === undefined) {
        setCurrentEnemy();
        return;
    }

    const enemyDroids = enumDroid(enemyIndex, DROID_WEAPON, false)
        .concat(enumDroid(enemyIndex, DROID_CYBORG, false))
        .sort(sortByDistToBase);
    const enemyTrucks = enumDroid(enemyIndex, DROID_CONSTRUCT, false).sort(sortByDistToBase);

    const enemyStructures = enumStruct(enemyIndex, DEFENSE).sort(sortByDistToBase);
    const closestStructure = enemyStructures[0];

    if (enemyDroids[0]) {
        currentEnemyTarget = enemyDroids[0];
    } else if (enemyTrucks[0]) {
        currentEnemyTarget = enemyTrucks[0];
    } else {
        // Priority 1: Find a factory
        const enemyFactory = findNearestFactory(enemyIndex);
        if (enemyFactory) {
            currentEnemyTarget = enemyFactory;
        } else {
            // Priority 2: Find a derrick
            const enemyDerrick = findNearestDerrick(enemyIndex);
            if (enemyDerrick) {
                currentEnemyTarget = enemyDerrick;
            } else {
                // Priority 3: Find a structure
                if (closestStructure) {
                    currentEnemyTarget = closestStructure
                } else {
                    return; // No structures or droids remain
                }
            }
        }
    }

    if (closestStructure && isNearBase(closestStructure.x, closestStructure.y)) {
        currentEnemyTarget = closestStructure;
    }

    let realObject = getObject(currentEnemyTarget.type, enemyIndex, currentEnemyTarget.id);
    if (!realObject) {
        return; // Just for extra precaution
    }

    // Filter attacker droids based on distance
    const { attackingDroids, retreatingDroids } = filterDroidsByDistance(attackerDroids, currentEnemyTarget);

    // Send all to attack if the base is in trouble
    if (isMyBaseInTrouble) {
        const droids = attackingDroids.concat(retreatingDroids)
        sendDroidsToAttackTarget(droids, currentEnemyTarget);
    } else {
        // Retreat to the base (move away) from the enemy target if it is too close
        retreatToBase(retreatingDroids)

        // Send droids that are at a safe distance to attack
        sendDroidsToAttackTarget(attackingDroids, currentEnemyTarget);
    }
}

function filterDroidsByDistance(attackerDroids, enemyTarget) {
    const attackingDroids = [];
    const retreatingDroids = [];

    const DISTANCE_LIMITS = {
        ROCKETS: componentAvailable("Missile-A-T") ? 14 : 8,
        MACHINEGUN: componentAvailable("MG4ROTARYMk1") ? 9 : 6,
        CYBORGS: componentAvailable("Cyb-Hvywpn-A-T") ? 14 : 7,
        SENSOR: componentAvailable("Sensor-WideSpec") ? 17 : 12,
    };

    attackerDroids.forEach((attackerDroid) => {
        const distance = distBetweenTwoPoints(attackerDroid.x, attackerDroid.y, enemyTarget.x, enemyTarget.y);

        const weaponName = attackerDroid.weapons?.[0]?.name

        const isRetreating =
            (ROCKET_WEAPON_LIST.includes(weaponName) && distance < DISTANCE_LIMITS.ROCKETS) ||
            (MACHINEGUN_WEAPON_LIST.includes(weaponName) && distance < DISTANCE_LIMITS.MACHINEGUN) ||
            (attackerDroid.droidType === DROID_SENSOR && distance < DISTANCE_LIMITS.SENSOR) ||
            (attackerDroid.droidType === DROID_CYBORG && distance < DISTANCE_LIMITS.CYBORGS);

        if (isRetreating) {
            retreatingDroids.push(attackerDroid);
        } else {
            attackingDroids.push(attackerDroid);
        }
    });

    return { attackingDroids, retreatingDroids };
}


function retreatToBase(attackerDroids) {
	for(attackerDroid of attackerDroids) {
		if (attackerDroid.order !== DORDER_RTR) {
			orderDroidLoc(attackerDroid, DORDER_MOVE, BASE.x, BASE.y)
		}
	}
}

// Does a droid need to repair
function droidNeedsRepair(droid, percent) {
	// It's a sensor or it's busy or blocked
	if (droid.droidType === DROID_SENSOR || droid === null) {
		return false;
	}

	// If the base is in trouble, send also damaged droids to defend
	if (isMyBaseInTrouble) {
		return false;
	}

	if (droid.propulsion === "hover01") {
		percent = 50;
	} else {
		percent = 35;
	}

	if (droid.order === DORDER_RTR && droid.health < 100) {
		return true;
	}

	if (droid.order !== DORDER_RTR &&
		countStruct(REPAIR_FACILITY_STAT) > 0 &&
		droid.health < percent) {
		orderDroid(droid, DORDER_RTR);
		return true;
	}

	return false;
}

// Function to order droids to attack the target
function sendDroidsToAttackTarget(droids, target) {
	for (let j = 0; j < droids.length; j++) {
		const droid = droids[j];
		if (droid.droidType === DROID_SENSOR) {
			orderDroidObj(droid, DORDER_OBSERVE, target);
		} else if (droid.order !== DORDER_RECYCLE && !droidNeedsRepair(droid)) {
			orderDroidObj(droid, DORDER_ATTACK, target);
		}
	}
}

// Return the nearest factory (normal factory has precedence)
function findNearestFactory(player) {
	let facs = enumStruct(player, FACTORY_STAT).sort(sortByDistToBase);
	let cybFacs = enumStruct(player, CYBORG_FACTORY_STAT).sort(sortByDistToBase);
	let vtolFacs = enumStruct(player, VTOL_FACTORY_STAT).sort(sortByDistToBase);
	let target;

	if (facs.length > 0) {
		target = facs[0];
	} else if (cybFacs.length > 0) {
		target = cybFacs[0];
	} else if (vtolFacs.length > 0) {
		target = vtolFacs[0];
	}

	return target;
}

// Return closest player derrick ID
function findNearestDerrick(player) {
	let target;
	let derr = enumStruct(player, DERRICK_STAT).sort(sortByDistToBase);

	if (derr.length > 0) {
		target = derr[0];
	}

	return target;
}

function eventAttacked(victim, attacker) {
    if (!attacker || !victim || attacker.player === me || allianceExistsBetween(attacker.player, me)) return;

    // Check if the base is in trouble
    if (attacker.type === DROID || attacker.type === STRUCTURE) {
        if (attacker.type === DROID && attacker.isVTOL === true) {
            enemiesHaveVtol = true;
        }

        if ((victim.type === STRUCTURE && isBaseStructure(victim.stattype)) ||
            (victim.stattype === DEFENSE && isNearBase(attacker.x, attacker.y))) {
            isMyBaseInTrouble = true;
        }

        if (attacker.player !== currentEnemy) {
            if (attacker.player === scavengerIndex) {
                const scavenger = createScavengerPlayerData(scavengerIndex);
                setCurrentEnemy(scavenger);
                return
            }
            
			const enemy = playerDataObject(attacker.player);
            setCurrentEnemy(enemy);
        }
    }
}
