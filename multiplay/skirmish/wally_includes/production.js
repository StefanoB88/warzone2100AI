function produceDroids() {
    // Check if power is sufficient to produce anything
    if (getRealPower() < MIN_PRODUCTION_POWER) {
        return; // Stop function if there's not enough power
    }

    // List of factory types
    const FAC_LIST = [FACTORY_STAT, VTOL_FACTORY_STAT, CYBORG_FACTORY_STAT];
    let virtualTrucks = 0; // Count of trucks currently being produced

    // Step 1: Count the number of construction units (trucks) being built
    let factories = enumStruct(me, FACTORY_STAT);

    let allGroundFactory = enumStruct(me, FACTORY_STAT).concat(enumStruct(me, CYBORG_FACTORY_STAT));

    if (allGroundFactory.length === 0) {
        return; // Stop function if there are no factories
    }

    for (let i = 0; i < factories.length; ++i) {
        let droid = getDroidProduction(factories[i]); // Get the droid being built
        if (droid !== null && droid.droidType === DROID_CONSTRUCT) {
            virtualTrucks += 1; // Increment virtual truck count
        }
    }

    // Step 2: Manage unit production for all factory types
    for (let i = 0; i < FAC_LIST.length; ++i) {
        // Skip cyborg factories on sea maps
        if (FAC_LIST[i] === CYBORG_FACTORY_STAT && isSeaMap === true) {
            continue;
        }

        // Get list of factories for the current type
        let factories = enumStruct(me, FAC_LIST[i]);

        for (let j = 0; j < factories.length; ++j) {
            let factory = factories[j];

            // Proceed only if the factory is idle
            if (structureIdle(factory)) {

                const numTrucks = countDroid(DROID_CONSTRUCT) + virtualTrucks;

                if (FAC_LIST[i] === FACTORY_STAT) {

                    // Standard factories: Build trucks or attackers
                    if (numTrucks + virtualTrucks < MIN_BASE_TRUCKS) {
                        produceBuilder(factory); // Build a truck
                    } else if (countStruct(POW_GEN_STAT)) {
                        produceTank(factory); // Build an attacker unit if power generator exists

                        // Occasionally build sensors
						if (random(100) < createSensorProbability()) {
							produceSensors(factory);
						}
                    }
                } else {
                    // For other factory types, ensure power generator exists
                    if (!countStruct(POW_GEN_STAT)) {
                        continue; // Skip if no power generator exists
                    }

                    if (FAC_LIST[i] === CYBORG_FACTORY_STAT) {
						const shouldBuildCyborgConstructor = numTrucks < MIN_BASE_TRUCKS && !countStruct(FACTORY_STAT, me);

						if (shouldBuildCyborgConstructor) {
							produceCyborgBuilder(factory); // Build cyborg builder units
						} else {
							produceCyborg(factory); // Build cyborg units
						}
					} else {
                        produceVTOL(factory); // Build VTOL units
                    }
                }
            }
        }
    }
}

function produceBuilder(factory) {
    return createDroid(factory, "Constructor", BUILDER_BODY_LIST, BUILDER_PROP_LIST, "Spade1Mk1")
}

function produceTank(factory) {
    // Default components
    let firstWeapon = ROCKET_WEAPON_LIST
    let secondWeapon = ROCKET_WEAPON_LIST
    let tankProp = TANK_PROP_LIST
    let tankBody = TANK_BODY_LIST

    // Components with probability
    const ANTIPERSONELL_WEAPON_PROBABILITY = 60
    const ANTITANK_WEAPON_PROBABILITY = 40
    const THERMAL_BODY_PROBABILITY = checkFlameWeapons()
    const BUNKER_BUSTER_PROBABILITY = isMyBaseInTrouble ? 0 : checkCurrentEnemyDefenses()
    const HOWITZERS_WEAPON_PROBABILITY = checkLongRangeSupport()

    let FAST_PROP_PROBABILITY = 0

    if (isSeaMap === false) {
        FAST_PROP_PROBABILITY = checkTankKillerWeapons()
    }

    // When dragon is available, try a chance at using EMP-Cannon as secondary.
	if (componentAvailable("Body14SUP") && componentAvailable("EMP-Cannon")) {
        secondWeapon = "EMP-Cannon";
    }

    if (random(100) < THERMAL_BODY_PROBABILITY) {
        tankBody = TANK_BODY_LIST_THERMIC
    }   

    if (random(100) < FAST_PROP_PROBABILITY) {
        tankProp = "HalfTrack"
    }
    
    if (random(100) < ANTIPERSONELL_WEAPON_PROBABILITY) {
        firstWeapon = MACHINEGUN_WEAPON_LIST;
    } else if (random(100) < ANTITANK_WEAPON_PROBABILITY) {
        firstWeapon = ROCKET_WEAPON_LIST;
    } else if (random(100) < BUNKER_BUSTER_PROBABILITY) {
        firstWeapon = BUNKER_BUSTER_WEAPON
        secondWeapon = BUNKER_BUSTER_WEAPON
        tankProp = "hover01"
    } else if (random(100) < HOWITZERS_WEAPON_PROBABILITY) {
        firstWeapon = HOWITZERS_WEAPON_LIST
        secondWeapon = HOWITZERS_WEAPON_LIST
        tankProp = "hover01"
        tankBody = TANK_MEDIUM_BODY_LIST
    }
    
    if (isSeaMap === true) {
        tankProp = "hover01"
    }

    return createDroid(factory, "Attacker", tankBody, tankProp, firstWeapon, secondWeapon)
}

function produceSensors(factory) {
	if (componentAvailable("hover01")) {
		const sensorTurret = componentAvailable("Sensor-WideSpec") ? "Sensor-WideSpec" : "SensorTurret1Mk1"
		return createDroid(factory, "Scanner", SCANNER_BODY_LIST, "hover01", sensorTurret)
	}
}

function produceCyborgBuilder(factory) {
	return createDroid(factory, "Combat Engineer Cyborg", "CyborgLightBody", "CyborgLegs", "CyborgSpade");
}

function produceCyborg(factory) {
    const CYBORG_ANTIPERSONELL_WEAPON_PROBABILITY = 30
    const CYBORG_ANTITANK_WEAPON_PROBABILITY = 70

    if (random(100) < CYBORG_ANTITANK_WEAPON_PROBABILITY) {
        if (createDroid(factory, "Cyborg Heavy Rocket", "CyborgHeavyBody", "CyborgLegs", CYBORG_HEAVY_ROCKETS)) {
            return
        } else {
            return createDroid(factory, "Cyborg Rocket", "CyborgLightBody", "CyborgLegs", CYBORG_LIGHT_ROCKETS);
        }
    } else if (random(100) < CYBORG_ANTIPERSONELL_WEAPON_PROBABILITY) {
        if (createDroid(factory, "Cyborg Laser", "CyborgHeavyBody", "CyborgLegs", CYBORG_HEAVY_LASER)) {
            return
        } else {
            return createDroid(factory, "Cyborg Machinegun", "CyborgLightBody", "CyborgLegs", CYBORG__LIGHT_MACHINEGUN);
        }
    }
}

function produceVTOL(factory) {
    return createDroid(factory, "VTOL", TANK_BODY_LIST, "V-Tol", VTOL_ROCKETS)
}

/**
 * @param {*} body
 * @param {*} factory
 * @param {*} propulsion
 * @param {*} templateName    
 * @description Returns true if the production was started
 */
function createDroid(factory, templateName, body, propulsion, turret1, turret2) {
    return buildDroid(factory, templateName, body, propulsion, null, "", turret1, turret2)
}

// Build sensors according to the artillery number of the team, with a probability between a min of 3% and a max of 13%.
function createSensorProbability() {
    const sensorCount = enumDroid(me, DROID_SENSOR).length

    if (sensorCount >= 3) {
        return 0
    }

    const teamRippleNumber = countStruct("Emplacement-HvART-pit", ALLIES) 
                           + countStruct("Emplacement-Rocket06-IDF", ALLIES);

    // Base probability with Spectral Sensor
    let probability = componentAvailable("Sensor-WideSpec") ? 6 : 3;

    // Adjust probability based on teamRippleNumber
    if (teamRippleNumber === 0) {
        probability = 0;
    } else if (teamRippleNumber < 10) {
        probability = 2;
    }

    return probability;
}

// Replace builders that have no hover propulsion, if hover is available
function recycleOldBuilders() {
    if (!componentAvailable("hover01") || !isHighOilMap) {
        return
    }

    // Don't recycle if we don't have at least the basic base
	if (countStruct(PLAYER_HQ_STAT) === 0 || countStruct(FACTORY_STAT) === 0 || countStruct(POW_GEN_STAT) === 0) {
		return
	}

    const buildersToRecycle = enumDroid(me, DROID_CONSTRUCT).filter(builder => builder.propulsion != "hover01")

    if (buildersToRecycle.length > 0) {
        buildersToRecycle.forEach(builder => {
            return orderDroid(builder, DORDER_RECYCLE)
        });
    }
}

// Check if we have too many trucks and recycle excess ones
function checkTrucksCount() {
    const builders = enumDroid(me, DROID_CONSTRUCT); // Get all builder droids
    const excessCount = builders.length - MAX_BASE_TRUCKS;

    if (excessCount > 0) {
        const excessBuilders = builders.slice(-excessCount);

        // Recycle excess builders
        excessBuilders.forEach(builder => {
            orderDroid(builder, DORDER_RECYCLE);
        });
    }
}

