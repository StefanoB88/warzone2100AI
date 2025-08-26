// Handle Build
function build() {
	if (!countDroid(DROID_CONSTRUCT)) {
		return
	}

	if (buildBasicBase()) {
		return
	}

	const defensesBuilders = enumGroup(defensesBuildersGroup)

	if (defensesBuilders.length >= 1 && getRealPower() > MIN_BUILD_POWER) {
		const def = returnBestDefense();
    	if (def !== null) {
			grabTrucksAndBuild(def, BASE, defensesBuilders);
    	}
	}

	if (checkUncompletedStructures()) {
		return
	}
	
	if (baseMaintenance()) {
		return
	}

	if (buildFundamentals()) {
		return
	}
}

// Basic base design so as to survive in a no bases match.
function buildBasicBase() {

	const trucks = enumDroid(me, DROID_CONSTRUCT)

	// Build HQ if missing
	if (countStruct(PLAYER_HQ_STAT) === 0 && grabTrucksAndBuild(PLAYER_HQ_STAT, BASE, trucks)) {
		return true;
	}

	// Build at least 2 power gen
	if (countStruct(POW_GEN_STAT) < 2 && grabTrucksAndBuild(POW_GEN_STAT, BASE, trucks)) {
		return true;
	}

	// Build at least 2 factories
	if (countStruct(FACTORY_STAT) < 2 && grabTrucksAndBuild(FACTORY_STAT, BASE, trucks)) {
		return true;
	}

	// Build at least 2 lab if there are still something to research
	if (!researchDone && countStruct(RES_LAB_STAT) < 2 && grabTrucksAndBuild(RES_LAB_STAT, BASE, trucks)) {
		return true;
	}

	if ((!countStruct(POW_GEN_STAT) || (numUnusedDerricks() > 0)) && grabTrucksAndBuild(POW_GEN_STAT, BASE, trucks)) {
		return true
	}

	return false;
}

// Check if there are uncompleted structures near the base
function checkUncompletedStructures() {
    let hasAssignedTask = false;

    // Find uncompleted structures near the base
    let structlist = enumStruct(me).filter((structure) => (
        structure.status !== BUILT &&
        distBetweenTwoPoints(BASE.x, BASE.y, structure.x, structure.y) < 40
    ));

    if (structlist.length === 0) {
        return false;
    }

    // Get idle trucks for the first uncompleted structure
    const idleTrucks = findIdleTrucks(structlist[0], defensesBuildersGroup);

	const halfCount = Math.floor(idleTrucks.length / 2); // Calculate half
    const droidsToCompleteStructure = idleTrucks.slice(-halfCount)

    if (droidsToCompleteStructure.length && structlist.length) {
		structlist = structlist.sort(sortByDistToBase);
		for (let j = 0; j < droidsToCompleteStructure.length; ++j) {
			if (orderDroidObj(droidsToCompleteStructure[j], DORDER_HELPBUILD, structlist[0])) {
				success = true;
			}
		}
	}

    return hasAssignedTask;
}

// Build modules and check research completion.
function baseMaintenance() {
	// Check if there are no power generators.
	if (countStruct(POW_GEN_STAT) === 0) {
		return false;
	}

	// Minimum power required for a module to be considered for upgrade.
	const MIN_POWER_FOR_MODULE = -50;

	// letiables for storing the selected structure and module for upgrade.
	let struct = null;
	let module = "";

	// letiable to track the success of the maintenance process.
	let success = false;

	// List of modules with their required amount and corresponding structure type.
	const modList = [
		{ "mod": "A0PowMod1", "amount": 1, "structure": POW_GEN_STAT },
		{ "mod": "A0ResearchModule1", "amount": 1, "structure": RES_LAB_STAT },
		{ "mod": "A0FacMod1", "amount": 2, "structure": FACTORY_STAT },		
		{ "mod": "A0FacMod1", "amount": 2, "structure": VTOL_FACTORY_STAT }
	];

	// Iterate through the module list to find a suitable structure for upgrade.
	for (let i = 0; i < modList.length; ++i) {
		if (isStructureAvailable(modList[i].mod)) {
			const structList = enumStruct(me, modList[i].structure).sort(sortByDistToBase);

			for (let c = 0; c < structList.length; c++) {
				if (structList[c].modules < modList[i].amount) {
					struct = structList[c];
					module = modList[i].mod;
					break;
				}
			}
			if (struct !== null) {
				break;
			}
		}
	}

	// Check if there is a selected structure and either the power is sufficient or it's a power module,
	// or if the count of DERRICK_STAT structures is greater than or equal to 12.
	if (struct && (getRealPower() > MIN_POWER_FOR_MODULE || module === "A0PowMod1" || countStruct(DERRICK_STAT) >= 12)) {

		// Find all idle trucks
		const idleTrucks = findIdleTrucks();
	
		// Iterate through each idle truck to find a suitable build location
		for (const truck of idleTrucks) {
			// Check if the truck can help with building at the selected location
			if (struct && canDroidHelp(truck, struct.x, struct.y)) {
				if (orderDroidBuild(truck, DORDER_BUILD, module, struct.x, struct.y)) {
					success = true
				}
			}
		}
	}

	// Check if it's a sea map, then demolish cyborg factories
	if (demolishCyborgFactories()) {
		success = true;
	}

	// Return the final success status.
	return success;
}

function buildFundamentals() {
	let vtolGroup = enumGroup(attackerGroup).filter(droid => droid.isVTOL === true);
	let needVtolPads = 2 * countStruct(VTOL_PAD_STAT) < vtolGroup.length;

	if (factoryBuildOrder()) {
		return;
	}

	if (buildResearchLabs()) {
		return;
	}

	// Build VTOL pads if needed
	if (needVtolPads && grabTrucksAndBuild(VTOL_PAD_STAT)) {
		return;
	}

	if (isStructureAvailable(UPLINK_STAT) && countStruct(UPLINK_STAT) === 0 && grabTrucksAndBuild(UPLINK_STAT)) {
		return;
	}

	if (isStructureAvailable(LASERLINK_STAT) && countStruct(LASERLINK_STAT) === 0 && grabTrucksAndBuild(LASERLINK_STAT)) {
		return;
	}

	if (isStructureAvailable(REPAIR_FACILITY_STAT) && countStruct(REPAIR_FACILITY_STAT) < countStruct(FACTORY_STAT) && grabTrucksAndBuild(REPAIR_FACILITY_STAT)) {
		return;
	}

	// Build VTOL defenses in base.
	/*if (random(100) < 10 && buildAntiAir(true)) {
		return;
	}*/

	// Check if there are old defenses to demolish
	if (demolishOldDefenses()) {
		return;
	}

	// "All fundamental buildings built -- proceed to build defenses"
	if (buildDefenses()) {
		return;
	}	

	return false
}

function buildDefensesForAllies() {
    // Count all defenses near my base only once
    const myDefensesCount = enumRange(BASE.x, BASE.y, BASE_THREAT_RANGE, me, true)
        .filter((obj) => obj.stattype === DEFENSE).length;

    // Determine the maximum number of defenses to build for allies
    const maxDefensesForAllies = myDefensesCount >= 100 ? 100 : 30;

    // If I have fewer than 30 defenses, don't build any
    if (myDefensesCount < 30) {
        return false;
    }

    // Process each ally
    for (const ally of alliesList) {
        // Get the ally's base position
        const allyBasePosition = enumStruct(ally.position, PLAYER_HQ_STAT)[0] ?? startPositions[ally.position];

        // If an ally is too far or if my base is in trouble, skip this ally
        if (distBetweenTwoPoints(BASE.x, BASE.y, allyBasePosition.x, allyBasePosition.y) > 60 || isMyBaseInTrouble) {
            continue; // Skip ally and check next one
        }

        // Combine defenses from both my base and the ally's base in a single `enumRange` call
        const allAlliedDefenses = enumRange(
            allyBasePosition.x, allyBasePosition.y, BASE_THREAT_RANGE, ally, true
        )
        .concat(
            enumRange(allyBasePosition.x, allyBasePosition.y, BASE_THREAT_RANGE, me, true)
        )
        .filter((obj) => obj.stattype === DEFENSE).length;

        // Skip if the ally already has enough defenses
        if (allAlliedDefenses >= maxDefensesForAllies) {
            continue;
        }

        // If there's enough power, build a defense
        if (getRealPower() > MIN_BUILD_POWER) {
            const def = returnBestDefense();
            if (def !== null) {
                grabTrucksAndBuild(def, allyBasePosition);
                return true; // Exit once a defense is built
            }
        } else {
            return false; // Not enough power to build defenses
        }
    }

    return false; // Return false if no defenses were built for allies
}

let lastAttemptTime = 0;
const RETRY_DELAY = 20000; // 20-second delay in milliseconds

function buildDefenses() {
    // If the game time is less than the retry time, exit early
    if (gameTime < lastAttemptTime) {
        return false;
    }

    // If not enough power is available, set the retry time and exit
    if (getRealPower() < MIN_BUILD_POWER) {
        return false;
    }

    // If the ripple is unavailable, set the a delay time
    if (!isStructureAvailable("Emplacement-Rocket06-IDF")) {
        lastAttemptTime = gameTime + RETRY_DELAY;
    }

    // If I'm already building defenses for the allies, exit
    if (buildDefensesForAllies()) {
        return true;
    }

    // Build defenses if possible
    const def = returnBestDefense();
    if (def !== null) {
        return grabTrucksAndBuild(def);
    }

    return false; // No defenses built
}


function returnBestDefense() {
	const ARTILLERY_CHANCE = 75;
	const BASTION_CHANCE = 15;
	const EMP_CHANCE = 20;
	const SENSOR_CHANCE = 5;

	let defenses;
	let bestDefense;

	// If the ripple is unavailable, retreat trucks and set the retry time
	if (!isStructureAvailable("Emplacement-Rocket06-IDF")) {
		defenses = WEAK_DEFENSES[random(WEAK_DEFENSES.length)]
		return defenses
	}

	if (random(100) < SENSOR_CHANCE) {
		defenses = SENSORS_TOWERS;
	} else if (random(100) < EMP_CHANCE) {
		defenses = EMP_DEFENSES;
	} else if (random(100) < ARTILLERY_CHANCE) {
		defenses = ARTILLERY_DEFENSES
	} else if (random(100) < BASTION_CHANCE) {
		defenses = FORTRESS_DEFENSES
	} else {
		defenses = ARTILLERY_DEFENSES
	}

	for (let i = 0; i < defenses.length; i++) {
		if (isStructureAvailable(defenses[i])) {
			bestDefense = defenses[i];
			break;
		}
	}

	return bestDefense;
}

// Build factories. Attempts to build at least 1 of each factory.
function factoryBuildOrder() {
	const FAC_ORDER = [FACTORY_STAT, VTOL_FACTORY_STAT, CYBORG_FACTORY_STAT];
	const derrNum = countStruct(DERRICK_STAT);
	let num = 1;

	if (derrNum >= 20) {
		num = 5;
	} else if (derrNum >= 16) {
		num = 4;
	} else if (derrNum >= 12) {
		num = 3;
	} else if (derrNum >= 8) {
		num = 2;
	}

	for (let x = 0; x < 2; ++x) {
		for (const fac of FAC_ORDER) {
			// If the fac is a CYBORG_FACTORY and the map is marine, go to the next iteration
			if (fac === CYBORG_FACTORY_STAT && isSeaMap) {
				continue;
			}

			// Check if there are enough such factories already built
			if (countStruct(fac) < num) {
				// Build a factory
				if (grabTrucksAndBuild(fac)) {
					return true;
				}
			}
		}
	}

	return false;
}

// Build the research labs. Attempts to build up to a certain number based on derricks.
function buildResearchLabs() {
    if (researchDone) {
        return false;
    }

    const derrCount = countStruct(DERRICK_STAT);
    let amount = 3;

    // Determine the number of research labs to build
    if (derrCount >= 26) {
        amount = 5;
    } else if (derrCount >= 12) {
        amount = 4;
    } else if (derrCount >= 8) {
        amount = 3;
    }

    const currentLabs = countStruct(RES_LAB_STAT);

    // Attempt to build research labs until the desired amount is reached
    for (let i = currentLabs; i < amount; ++i) {
        if (grabTrucksAndBuild(RES_LAB_STAT)) {
            return true;
        }
    }

    return false;
}


// Demolish old defenses if an upgrade is available
function demolishOldDefenses() {
    const upgradeMap = [
        { new: "Emplacement-Rocket06-IDF", old: WEAK_DEFENSES }, 
        { new: "Sys-SensoTowerWS", old: ["Sys-SensoTower02"] }, 
        { new: "Emplacement-HvART-pit", old: ["Emplacement-Rocket06-IDF"] }, 
        { new: "X-Super-MassDriver", old: ["X-Super-Cannon"] }
    ];

    upgradeMap.forEach(({ new: newStruct, old: oldStructs }) => {
        if (isStructureAvailable(newStruct)) {
            oldStructs
                .flatMap(type => enumStruct(me, type))
                .sort(sortByDistToBase)  // sort by distance
                .forEach(demolishThis);  // demolish each structure
        }
    })
}

// Demolish useless cyborg factories
function demolishCyborgFactories() {
	if (isSeaMap) {
		return demolishThis(CYBORG_FACTORY_STAT)
	}
}

// If positive, there are oil derricks that unused due to lack of power generators.
function numUnusedDerricks() {
	return countStruct(DERRICK_STAT) - countStruct(POW_GEN_STAT) * 4;
}

// Function to check if more derricks are needed due to unused power generators
function needMoreDerricks() {
    var powGenCount = countStruct(POW_GEN_STAT, me);
    var derrickCount = countStruct(DERRICK_STAT, me);

    var minDerricksNeeded = powGenCount * 5; // A power generator can support 4 derricks but we set 5 to be safe

    if (derrickCount >= minDerricksNeeded) {
        return false;
    }

    return true;
}

// Return all the trucks that do nothing
function findIdleTrucks(obj, builderGroupName) {
	if (!builderGroupName) {
		builderGroupName = baseBuildersGroup
	}

	let builders = enumGroup(builderGroupName);
	let droidlist = [];
	if (obj !== null) {
		obj = BASE;
	}

	for (let i = 0, d = builders.length; i < d; ++i) {
		if (canDroidHelp(builders[i], obj.x, obj.y)) {
			droidlist.push(builders[i]);
		}
	}

	return droidlist;
}

// Demolish object.
function demolishThis(structure) {
	let success = false;
	let droidList = findIdleTrucks(structure, defensesBuildersGroup);

	for (let i = 0, d = droidList.length; i < d; ++i) {
		if (orderDroidObj(droidList[i], DORDER_DEMOLISH, structure)) {
			success = true;
		}
	}

	return success;
}

// TODO: use HQ as base if possible !!!!!!!!!!!!!!!

// Function to grab available trucks and build a structure
function grabTrucksAndBuild(structure, base, trucks) {
	// If no ally base is provided, use my base
	if (!base) {
		base = enumStruct(me, PLAYER_HQ_STAT)[0] ?? BASE;
	}

	if (!structure) {
		return false
	}

    // Check if the structure is available to build
    if (!isStructureAvailable(structure)) {
        return false;
    }

	let idleTrucks;

	if (trucks) {
		idleTrucks = trucks
	} else {
		// Find all idle trucks
		idleTrucks = findIdleTrucks();
	}
    
    if (idleTrucks.length === 0) {
        return false; // No trucks available
    }

    let buildSuccessful = false;
    const maxBlockingTiles = 0;

    // Iterate through each idle truck to find a suitable build location
    for (const truck of idleTrucks) {
        const buildLocation = pickStructLocation(truck, structure, base.x, base.y, maxBlockingTiles);

        // Check if the truck can help with building at the selected location
        if (buildLocation && canDroidHelp(truck, buildLocation.x, buildLocation.y)) {
            const buildOrdered = orderDroidBuild(truck, DORDER_BUILD, structure, buildLocation.x, buildLocation.y);

            if (buildOrdered) {
                buildSuccessful = true;
            }
        }
    }

    return buildSuccessful;
}

function canDroidHelp(mydroid, bx, by) {
	return (mydroid.order !== DORDER_BUILD &&
		mydroid.order !== DORDER_HELPBUILD &&
		mydroid.order !== DORDER_LINEBUILD &&
		mydroid.order !== DORDER_RECYCLE &&
		mydroid.order !== DORDER_DEMOLISH &&
		droidCanReach(mydroid, bx, by)
	);
}

function lookForOil() {
	if (!needMoreDerricks()) {
		return false;
	}

	const UNSAFE_AREA_RANGE = 30; // Define the range for unsafe areas
	let success = false;

	// Get allied base positions
	let allyBasePositions = alliesList.map((ally) => ally.base);

	// Filter and sort oil resources
	let oils = enumFeature(ALL_PLAYERS, OIL_RES_STAT)
		.filter((oil) => {
			// Check if the oil is too close to any allied base
			let tooCloseToAlly = allyBasePositions.some((base) =>
				distBetweenTwoPoints(base.x, base.y, oil.x, oil.y) < 15
			);

			// Check if the oil is in an unsafe area
			let isUnsafe = enumRange(oil.x, oil.y, UNSAFE_AREA_RANGE, ENEMIES, false)
				.filter(isUnsafeEnemyObject).length > 0;

			return !tooCloseToAlly && !isUnsafe;
		})
		.sort(sortByDistToBase); // Sort by distance to base

	// If no valid oils are found, exit early
	if (oils.length === 0) {
		return false;
	}

	let closestOil = oils[0]; // Select the closest valid oil

	// Find the nearest available droid
	let droids = enumGroup(baseBuildersGroup).filter((droid) =>
		canDroidHelp(droid, closestOil.x, closestOil.y)
	);

	if (droids.length === 0) {
		return false;
	}

	let closestDroid = droids.sort((a, b) =>
		distBetweenTwoPoints(a.x, a.y, closestOil.x, closestOil.y) -
		distBetweenTwoPoints(b.x, b.y, closestOil.x, closestOil.y)
	)[0];

	// Issue build order for the droid
	success = orderDroidBuild(
		closestDroid,
		DORDER_BUILD,
		DERRICK_STAT,
		closestOil.x,
		closestOil.y
	);

	return success;
}

