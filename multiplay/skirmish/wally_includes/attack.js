function attack() {
    const attackerDroids = enumGroup(attackerGroup).filter(attacker => attacker.order !== DORDER_RTR)

    if (attackerDroids.length === 0) {
        return;
    }

    let MIN_GROUP_SIZE = isMyBaseInTrouble ? 1 : isHelpingAlly ? 5 : isHighOilMap ? 25 : 10

    if (attackerDroids.length < MIN_GROUP_SIZE && !isMyBaseInTrouble) {
        retreatToBase(attackerDroids)
        return
    }

    attackEnemy(attackerDroids)
    attackEnemyDefenses(attackerDroids)
}

function attackEnemy(attackerDroids) {
    const enemyIndex = currentEnemy.position;

    // If the current enemy is dead, choose another one
    if (!isPlayerAlive(enemyIndex) || enemyIndex === undefined) {
        setCurrentEnemy();
        return;
    }

    let sortFunc;

    if (isHelpingAlly) {
        sortFunc = (obj1, obj2) => sortByDistToPlayerBase(obj1, obj2, currentHelpedAlly.position);
    } else {
        sortFunc = sortByDistToBase;
    }

    const enemyDroid = enumDroid(enemyIndex, DROID_WEAPON, false)
        .concat(enumDroid(enemyIndex, DROID_CYBORG, false))
        .sort(sortFunc)[0];

    const enemyTruck = enumDroid(enemyIndex, DROID_CONSTRUCT, false)
        .sort(sortByDistToBase)[0];

    const closestDefense = enumStruct(enemyIndex, DEFENSE)
        .filter(def => def.stattype !== WALL) // Ignore walls
        .sort(sortByDistToBase)[0];

    const enemyDerrick = findNearestDerrick(enemyIndex);

    // Get closest among droid, truck, derrick
    const basePos = BASE;
    const candidates = [enemyDroid, enemyTruck, enemyDerrick, closestDefense].filter(Boolean);

    currentEnemyTarget = candidates.length > 0
        ? candidates.sort((a, b) =>
            distBetweenTwoPoints(basePos.x, basePos.y, a.x, a.y) -
            distBetweenTwoPoints(basePos.x, basePos.y, b.x, b.y)
        )[0]
        : null;

    // Fallback if no droid/truck/derrick found
    if (!currentEnemyTarget) {
        const enemyFactory = findNearestFactory(enemyIndex);
        if (enemyFactory) {
            currentEnemyTarget = enemyFactory;
        } else if (closestDefense) {
            currentEnemyTarget = closestDefense;
        } else {
            return; // No structures or droids remain
        }
    }

    // Destroy defenses that are too close to the base
    if (closestDefense && isNearBase(closestDefense.x, closestDefense.y)) {
        currentEnemyTarget = closestDefense;
    }

    // If the enemy is the scavenger, attack all the structures and the visible droids
    if (enemyIndex === scavengerIndex) {
        currentEnemyTarget = [...enumStruct(scavengerIndex), ...enumDroid(scavengerIndex, true)]
            .sort(sortByDistToBase)[0];
    }


    let realObject = getObject(currentEnemyTarget.type, enemyIndex, currentEnemyTarget.id);
    if (!realObject) {
        return; // Just for extra precaution
    }

    // Filter attacker droids based on distance
    const { attackingDroids, retreatingDroids } = filterDroidsByDistance(attackerDroids, currentEnemyTarget);

    // Send all the droids to attack if the base is in trouble
    if (isMyBaseInTrouble) {
        const droids = enumDroid(me, DROID_WEAPON)
        sendDroidsToAttackTarget(droids, currentEnemyTarget);
    } else {
        // Retreat to the base (move away) from the enemy target if it is too close
        retreatToBase(retreatingDroids)

        // Send droids that are at a safe distance to attack
        sendDroidsToAttackTarget(attackingDroids, currentEnemyTarget);
    }
}

function attackEnemyDefenses(attackerDroids) {
    if (!currentEnemyTarget) return;

    // Get the current list of Bunker Busters
    let bunkerBusterDroids = enumGroup(bunkerBusterGroup);

    // Send all to attack anything if the base is in trouble
    if (isMyBaseInTrouble) {
        sendDroidsToAttackTarget(bunkerBusterDroids, currentEnemyTarget);
    }

    useBunkerBuster = attackerDroids.some(droid =>
        distBetweenTwoPoints(droid.x, droid.y, closestEnemyStructure.x, closestEnemyStructure.y) <= BASE_THREAT_RANGE
    )

    if (!useBunkerBuster) {
        return
    }

    const enemyIndex = currentEnemy.position;

    // If there are less than 5 Bunker Busters at the start, don't begin the attack
    if (bunkerBusterDroids.length < 5) return;

    if (bunkerBusterDroids.length > 0) {
        // Get all enemy structures sorted by distance
        let enemyStructures = enumStruct(enemyIndex, DEFENSE)
            .sort(sortByDistToBase);

        if (enemyStructures.length === 0) {
            // Ensure the structure still exists
            let realObject = getObject(currentEnemyTarget.type, enemyIndex, currentEnemyTarget.id);
            if (!realObject) return;

            sendDroidsToAttackTarget(bunkerBusterDroids, currentEnemyTarget)
            return; // Attack everything else if there are no enemy structures left (rare case)
        }

        let targetStructure = enemyStructures[0];

        // Ensure the structure still exists
        let realObject = getObject(targetStructure.type, enemyIndex, targetStructure.id);
        if (!realObject) return;

        for (const bunkerBuster of bunkerBusterDroids) {
            orderDroidObj(bunkerBuster, DORDER_ATTACK, targetStructure);
        }
    }
}


function filterDroidsByDistance(attackerDroids, enemyTarget) {
    const attackingDroids = [];
    const retreatingDroids = [];

    const DISTANCE_LIMITS = {
        ROCKETS: getRocketRange(),
        MACHINEGUN: getMachinegunRange(),
        SENSOR: componentAvailable("Sensor-WideSpec") ? 17 : 12,
        HOWITZERS: getHowitzerRange()
    };


    const weaponToLimit = new Map([
        ...ROCKET_WEAPON_LIST.map(w => [w, DISTANCE_LIMITS.ROCKETS]),
        ...MACHINEGUN_WEAPON_LIST.map(w => [w, DISTANCE_LIMITS.MACHINEGUN]),
        ...HOWITZERS_WEAPON_LIST.map(w => [w, DISTANCE_LIMITS.HOWITZERS])
    ]);

    for (const droid of attackerDroids) {
        const { x, y, weapons, droidType } = droid;
        const distance = distBetweenTwoPoints(x, y, enemyTarget.x, enemyTarget.y);

        const weaponName = weapons?.[0]?.name;
        let limit = weaponToLimit.get(weaponName);

        if (limit === undefined) {
            if (droidType === DROID_SENSOR) {
                limit = DISTANCE_LIMITS.SENSOR;
            } else if (droidType === DROID_CYBORG) {
                limit = getCyborgRange(weaponName);
            } else {
                limit = 5; // Default limit for unknown droids
            }
        }

        if (limit !== undefined && distance < limit) {
            retreatingDroids.push(droid);
        } else {
            attackingDroids.push(droid);
        }
    }

    return { attackingDroids, retreatingDroids };
}

function getRocketRange() {
    let range;

    switch (true) {
        case componentAvailable("Rocket-Pod"):
            range = 8;
            break;
        case componentAvailable("Rocket-LtA-T"):
            range = 9;
            break;
        case componentAvailable("Rocket-HvyA-T"):
            range = 10;
            break;
        case componentAvailable("Missile-A-T"):
            range = 14;
            break;
        default:
            range = 8;
    }

    return range;
}

function getCyborgRange(weaponName) {
    let range;

    switch (weaponName) {
        case "CyborgChaingun":
            range = 6;
            break;
        case "CyborgRotMG":
            range = 7;
            break;
        case "Cyb-Wpn-Laser":
            range = 12;
            break;
        case "Cyb-Hvywpn-PulseLsr":
            range = 14;
            break;
        case "CyborgRocket":
            range = 7;
            break;
        case "Cyb-Wpn-Atmiss":
            range = 13;
            break;
        case "Cyb-Hvywpn-TK":
            range = 10;
            break;
        case "Cyb-Hvywpn-A-T":
            range = 14;
            break;
        default:
            range = 6;
    }

    return range;
}

function getHowitzerRange() {
    let range;

    switch (true) {
        case componentAvailable("Howitzer105Mk1"):
            range = 55;
            break;
        case componentAvailable("Howitzer-Incendiary"):
            range = 40;
            break;
        case componentAvailable("Howitzer03-Rot"):
            range = 55;
            break;
        case componentAvailable("Howitzer150Mk1"):
            range = 64;
            break;
        default:
            range = 40;
    }

    return range;
}

function getMachinegunRange() {
    let range;

    switch (true) {
        case componentAvailable("MG2Mk1"):
            range = 6;
            break;
        case componentAvailable("MG3Mk1"):
            range = 7;
            break;
        case componentAvailable("MG4ROTARYMk1"):
            range = 9;
            break;
        case componentAvailable("MG5TWINROTARY"):
            range = 9;
            break;
        case componentAvailable("Laser2PULSEMk1"):
            range = 14;
            break;
        case componentAvailable("HeavyLaser"):
            range = 16;
            break;
        default:
            range = 6;
    }

    return range;
}


function retreatToBase(droids) {
    for (droid of droids) {
        if (droid.order !== DORDER_RTR) {
            orderDroid(droid, DORDER_RTB)
        }
    }
}

// Does a droid need to repair
function droidNeedsRepair(droid, percent) {
    // It's a sensor or it's busy or blocked
    if (droid.droidType === DROID_SENSOR || droid === null) {
        return false;
    }

    if (droid.weapons?.[0]?.name === BUNKER_BUSTER_WEAPON[0]) {
        return false;
    }

    // If the base is in trouble, send also damaged droids to defend
    if (isMyBaseInTrouble) {
        return false;
    }

    if (droid.propulsion === "hover01") {
        percent = 45;
    } else {
        percent = 30;
    }

    if (droid.order === DORDER_RTR && droid.health < 100) {
        return true;
    }

    const repairFacilities = enumStruct(me, REPAIR_FACILITY_STAT);

    if (droid.order !== DORDER_RTR && repairFacilities.length > 0 && droid.health < percent) {
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
    let derr = enumStruct(player, DERRICK_STAT, true).sort(sortByDistToBase);

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
            const enemy = playerDataObject(attacker.player);
            setCurrentEnemy(enemy);
            isMyBaseInTrouble = true;
        }

        if (!isHelpingAlly && !isMyBaseInTrouble) {
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
