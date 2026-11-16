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
			const buildPos = getDefenseBuildPosition(defensesBuilders);
			grabTrucksAndBuild(def, buildPos, defensesBuilders);
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

	// Build at least 1 factory first (top priority for unit production)
	if (countStruct(FACTORY_STAT) === 0 && grabTrucksAndBuild(FACTORY_STAT, BASE, trucks)) {
		return true;
	}

	// Build at least 1 power gen
	if (countStruct(POW_GEN_STAT) === 0 && grabTrucksAndBuild(POW_GEN_STAT, BASE, trucks)) {
		return true;
	}

	// Build at least 1 research lab
	if (!researchDone && countStruct(RES_LAB_STAT) === 0 && grabTrucksAndBuild(RES_LAB_STAT, BASE, trucks)) {
		return true;
	}

	// Build second factory
	if (countStruct(FACTORY_STAT) < 2 && grabTrucksAndBuild(FACTORY_STAT, BASE, trucks)) {
		return true;
	}

	// Build second power gen if there are unused derricks
	if (countStruct(POW_GEN_STAT) < 2 && numUnusedDerricks() > 0 && grabTrucksAndBuild(POW_GEN_STAT, BASE, trucks)) {
		return true;
	}

	// Build second research lab
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
			if (canDroidHelp(droidsToCompleteStructure[j], structlist[0].x, structlist[0].y)) {
				if (orderDroidObj(droidsToCompleteStructure[j], DORDER_HELPBUILD, structlist[0])) {
					hasAssignedTask = true;
				}
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

		// Assign up to 2 idle trucks to build the module
		let assigned = 0;
		for (const truck of idleTrucks) {
			// Check if the truck can help with building at the selected location
			if (struct && canDroidHelp(truck, struct.x, struct.y)) {
				if (orderDroidBuild(truck, DORDER_BUILD, module, struct.x, struct.y)) {
					success = true;
					assigned++;
					if (assigned >= 2) break;
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
	let vtols = enumGroup(vtolGroup);
	let needVtolPads = 2 * countStruct(VTOL_PAD_STAT) < vtols.length;

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

	if (isStructureAvailable(REPAIR_FACILITY_STAT)) {
		if (buildRepairFacilities()) {
			return;
		}
	}

	// Build VTOL defenses in base if enemies have VTOLs
	if (enemiesHaveVTOLs && random(100) < 25 && buildAntiAir()) {
		return;
	}

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
	if (!isHighOilMap) {
		return false; // Only build defenses for allies on high oil maps
	}

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
			allyBasePosition.x, allyBasePosition.y, BASE_THREAT_RANGE, ally.position, true
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

// Builds Repair Facilities up to the maximum structure limit (5 in standard skirmish),
// placing them on the outer perimeter of the base (away from essential core buildings) and at safe forward positions.
function buildRepairFacilities() {
	const maxLimit = typeof getStructureLimit === "function" ? getStructureLimit(REPAIR_FACILITY_STAT, me) : 5;
	const currentCount = countStruct(REPAIR_FACILITY_STAT);

	if (currentCount >= maxLimit) {
		return false;
	}

	// Build the first 1-2 repair facilities as soon as we have minimal build power; build up to the max limit when economy is healthy
	if (currentCount >= 2 && getRealPower() < MIN_BUILD_POWER) {
		return false;
	}

	// Count how many repair facilities we have around our base perimeter
	const basePerimeterRepairs = enumStruct(me, REPAIR_FACILITY_STAT).filter(
		r => distBetweenTwoPoints(BASE.x, BASE.y, r.x, r.y) <= BASE_THREAT_RANGE + 15
	);

	// Keep at least 3 Repair Facilities on the outer perimeter of our base (or up to maxLimit if no forward positions exist)
	if (basePerimeterRepairs.length < Math.min(3, maxLimit)) {
		const perimeterPos = getOuterBaseRepairPosition();
		if (grabTrucksAndBuild(REPAIR_FACILITY_STAT, perimeterPos)) {
			return true;
		}
	}

	// Try to build remaining Repair Facilities at forward protected derricks
	if (buildForwardRepairFacilities(maxLimit)) {
		return true;
	}

	// If no forward derrick is suitable (e.g. flat map), build the remaining Repair Facilities up to maxLimit on the base perimeter
	if (currentCount < maxLimit) {
		const perimeterPos = getOuterBaseRepairPosition();
		if (grabTrucksAndBuild(REPAIR_FACILITY_STAT, perimeterPos)) {
			return true;
		}
	}

	return false;
}

// Calculates a position outside the core base buildings (at ~14 tiles from BASE toward the front or map center)
// so Repair Facilities don't clutter factories, labs, and generators, and damaged units reach them faster.
function getOuterBaseRepairPosition() {
	const targetPos = (currentEnemy && currentEnemy.base)
		? currentEnemy.base
		: { x: Math.floor(mapWidth / 2), y: Math.floor(mapHeight / 2) };

	const totalDist = distBetweenTwoPoints(BASE.x, BASE.y, targetPos.x, targetPos.y);
	if (totalDist < 15) {
		return BASE;
	}

	const dx = (targetPos.x - BASE.x) / totalDist;
	const dy = (targetPos.y - BASE.y) / totalDist;
	// Perpendicular vector to spread multiple repair facilities along an arc outside the base
	const px = -dy;
	const py = dx;

	const existingCount = countStruct(REPAIR_FACILITY_STAT);
	const offsets = [0, 6, -6, 12, -12];
	const sideOffset = offsets[existingCount % offsets.length];
	const forwardOffset = 14; // 14 tiles away from core BASE

	const rx = Math.max(4, Math.min(mapWidth - 4, Math.round(BASE.x + dx * forwardOffset + px * sideOffset)));
	const ry = Math.max(4, Math.min(mapHeight - 4, Math.round(BASE.y + dy * forwardOffset + py * sideOffset)));

	return { x: rx, y: ry };
}

function buildForwardRepairFacilities(maxLimit = 5) {
	if (getRealPower() < MIN_BUILD_POWER || countStruct(REPAIR_FACILITY_STAT) >= maxLimit) {
		return false;
	}

	// Get all remote derricks
	let remoteDerricks = enumStruct(me, DERRICK_STAT).filter(
		derrick => !isNearBase(derrick.x, derrick.y)
	);

	if (currentEnemy && currentEnemy.base) {
		const baseToEnemy = distBetweenTwoPoints(BASE.x, BASE.y, currentEnemy.base.x, currentEnemy.base.y);
		
		// Filter out derricks that are further from the enemy than we are (must be between us and them)
		remoteDerricks = remoteDerricks.filter(d => 
			distBetweenTwoPoints(d.x, d.y, currentEnemy.base.x, currentEnemy.base.y) < baseToEnemy
		);

		// Sort by distance to enemy base (closest to enemy first)
		remoteDerricks.sort((a, b) => {
			return distBetweenTwoPoints(a.x, a.y, currentEnemy.base.x, currentEnemy.base.y) - 
				   distBetweenTwoPoints(b.x, b.y, currentEnemy.base.x, currentEnemy.base.y);
		});
	} else {
		// Fallback: sort by furthest from our base
		remoteDerricks.sort(sortByDistToBase).reverse();
	}

	for (const derrick of remoteDerricks) {
		// Only build forward base if derrick is protected (has at least 1 defense nearby) and the area is safe
		const hasDefenses = enumRange(derrick.x, derrick.y, 15, me, false)
			.filter(obj => obj.type === STRUCTURE && obj.stattype === DEFENSE).length >= 1;

		if (hasDefenses && isAreaSafe(derrick.x, derrick.y, 18)) {
			// Check if we already have a repair facility nearby
			const nearbyRepairFacilities = enumRange(derrick.x, derrick.y, 18, me, false)
				.filter(obj => obj.type === STRUCTURE && obj.stattype === REPAIR_FACILITY).length;

			if (nearbyRepairFacilities === 0 && countStruct(REPAIR_FACILITY_STAT) < maxLimit) {
				if (grabTrucksAndBuild(REPAIR_FACILITY_STAT, derrick)) {
					return true;
				}
			}
		}
	}

	return false;
}


let lastAttemptTime = 0;
const RETRY_DELAY = 20000; // 20-second delay in milliseconds

function buildDefenses() {
	// If the game time is less than the retry time, exit early
	if (gameTime < lastAttemptTime) {
		return false;
	}

	// If not enough power is available, exit
	if (getRealPower() < MIN_BUILD_POWER) {
		return false;
	}

	const baseDefensesCount = enumRange(BASE.x, BASE.y, BASE_THREAT_RANGE, me, false)
		.filter(obj => obj.type === STRUCTURE && obj.stattype === DEFENSE).length;

	// Only throttle defense construction if our base already has at least 10 defenses and Ripple is not yet researched
	if (!isStructureAvailable("Emplacement-Rocket06-IDF") && baseDefensesCount >= 10 && !isMyBaseInTrouble) {
		lastAttemptTime = gameTime + RETRY_DELAY;
	}

	// Priority 1: Ensure our main base has a solid minimum defense perimeter before building for allies or remote derricks
	if (isMyBaseInTrouble || baseDefensesCount < 15) {
		let def = returnBestDefense(false);
		if (def !== null && grabTrucksAndBuild(def, BASE)) {
			return true;
		}
	}

	// Priority 2: Build defenses for allies on high oil maps
	if (buildDefensesForAllies()) {
		return true;
	}

	// Priority 3: Protect remote conquered derricks ONLY if the area around them is safe
	const derricks = enumStruct(me, DERRICK_STAT).filter(
		derrick => !isNearBase(derrick.x, derrick.y) && isAreaSafe(derrick.x, derrick.y, 16)
	);

	let allProtected = true;

	for (const derrick of derricks) {
		const hasDerrickEnoughDefenses = enumRange(derrick.x, derrick.y, 6, me, true)
			.filter(obj => obj.stattype === DEFENSE).length >= 2;

		// build defenses if derrick has not enough
		if (!hasDerrickEnoughDefenses) {
			let def = returnBestDefense(true);
			if (def !== null) {
				return grabTrucksAndBuild(def, derrick);
			}
			allProtected = false;
			break;
		}
	}

	// If all safe derricks are protected, build a defense near the base or push forward along our territory
	if (allProtected) {
		let def = returnBestDefense(false);
		if (def !== null) {
			const buildPos = getDefenseBuildPosition();
			return grabTrucksAndBuild(def, buildPos);
		}
	}

	return false; // No defenses built
}

// Determines whether to fortify the main base or push defenses forward as we gain territory
function getDefenseBuildPosition(builders) {
	// Always prioritize the main base if it is under attack or has fewer than 20 core defenses
	if (isMyBaseInTrouble) {
		return BASE;
	}

	const baseDefensesCount = enumRange(BASE.x, BASE.y, BASE_THREAT_RANGE, me, false)
		.filter(obj => obj.type === STRUCTURE && obj.stattype === DEFENSE).length;

	// Ensure the home base is always well-fortified first (at least 20 defenses), and keep 65% of future defenses at base
	if (baseDefensesCount < 20 || random(100) < 65) {
		return BASE;
	}

	// 1. First, check if there are forward derricks in a SAFE area that need to be turned into outposts
	let forwardDerricks = enumStruct(me, DERRICK_STAT).filter(d => !isNearBase(d.x, d.y));

	if (forwardDerricks.length > 0) {
		if (currentEnemy && currentEnemy.base) {
			const baseToEnemy = distBetweenTwoPoints(BASE.x, BASE.y, currentEnemy.base.x, currentEnemy.base.y);
			const advancingDerricks = forwardDerricks.filter(d =>
				distBetweenTwoPoints(d.x, d.y, currentEnemy.base.x, currentEnemy.base.y) < baseToEnemy
			);
			if (advancingDerricks.length > 0) {
				forwardDerricks = advancingDerricks;
			}
		}
		forwardDerricks.sort(sortByDistToBase);

		for (const derrick of forwardDerricks) {
			if (!isAreaSafe(derrick.x, derrick.y, 18)) continue;

			const localDefenses = enumRange(derrick.x, derrick.y, 12, me, false)
				.filter(obj => obj.type === STRUCTURE && obj.stattype === DEFENSE).length;

			if (localDefenses < 6) {
				return { x: derrick.x, y: derrick.y };
			}
		}
	}

	// 2. For flat maps without middle derricks (or once all derricks are fortified):
	// Advance progressively along the line from our BASE toward the current enemy base
	// ONLY if our army + allied armies hold a stable advantage and the forward zone is completely safe.
	if (currentEnemy && currentEnemy.base && isTeamInStableAdvantage()) {
		const forwardPos = getProgressiveForwardPosition(currentEnemy.base);
		if (forwardPos) {
			return forwardPos;
		}
	}

	return BASE;
}

// Checks if our army + allied armies have a stable military advantage and sufficient base army size
function isTeamInStableAdvantage() {
	const myArmySize = enumGroup(attackerGroup).length;
	const minRequiredArmy = isHighOilMap ? 20 : 10;

	if (myArmySize < minRequiredArmy || isHelpingAlly) {
		return false;
	}

	let alliedPowerCount = countDroid(DROID_ANY, me) - countDroid(DROID_CONSTRUCT, me);
	for (const ally of alliesList) {
		if (isPlayerAlive(ally.position)) {
			alliedPowerCount += countDroid(DROID_ANY, ally.position) - countDroid(DROID_CONSTRUCT, ally.position);
		}
	}

	let visibleEnemyCombatDroids = enumDroid(ENEMIES, DROID_WEAPON, true).length
		+ enumDroid(ENEMIES, DROID_CYBORG, true).length;

	return alliedPowerCount >= visibleEnemyCombatDroids;
}

// Calculates progressive outpost positions along the vector from BASE to the enemy base
function getProgressiveForwardPosition(enemyBase) {
	const totalDist = distBetweenTwoPoints(BASE.x, BASE.y, enemyBase.x, enemyBase.y);
	if (totalDist <= BASE_THREAT_RANGE + 25) {
		return null; // Enemy base is already right next to us
	}

	const dx = (enemyBase.x - BASE.x) / totalDist;
	const dy = (enemyBase.y - BASE.y) / totalDist;

	// Step forward every 14 tiles starting just outside our base threat range, stopping 25 tiles before the enemy base
	const startDist = BASE_THREAT_RANGE + 10;
	const maxDist = totalDist - 25;
	const STEP = 14;

	for (let dist = startDist; dist <= maxDist; dist += STEP) {
		const px = Math.round(BASE.x + dx * dist);
		const py = Math.round(BASE.y + dy * dist);

		// Ensure coordinates are inside map boundaries
		if (px < 4 || py < 4 || px >= mapWidth - 4 || py >= mapHeight - 4) {
			continue;
		}

		// Stop advancing if this sector is not safe for our construction trucks
		if (!isAreaSafe(px, py, 18)) {
			break; // Frontline reached — do not send trucks into unsafe territory
		}

		// Count how many defenses we already built at this step
		const stepDefenses = enumRange(px, py, 10, me, false)
			.filter(obj => obj.type === STRUCTURE && obj.stattype === DEFENSE).length;

		// Fortify each step with at least 4 defenses before advancing to the next step closer to the enemy
		if (stepDefenses < 4) {
			return { x: px, y: py };
		}
	}

	return null;
}


function returnBestDefense(isDerrickDefense = false) {
	const ARTILLERY_CHANCE = 75;
	const BASTION_CHANCE = 15;
	const EMP_CHANCE = 25;
	const SENSOR_CHANCE = 5;

	let defenses;
	let bestDefense;

	// If it is a derrick, build the best available defense tier
	if (isDerrickDefense) {
		let defenseList;
		if (isStructureAvailable("Emplacement-Rocket06-IDF") || isStructureAvailable("WallTower-HvATrocket")) {
			defenseList = STRONG_DEFENSES;
		} else if (isStructureAvailable("WallTower06") || isStructureAvailable("Pillbox-RotMG")) {
			defenseList = MEDIUM_DEFENSES;
		} else {
			defenseList = WEAK_DEFENSES;
		}
		for (let i = 0; i < defenseList.length; i++) {
			if (isStructureAvailable(defenseList[i])) {
				return defenseList[i];
			}
		}
		return null;
	}

	// If the ripple is unavailable, build weak/medium defenses
	if (!isStructureAvailable("Emplacement-Rocket06-IDF")) {
		if (isStructureAvailable("WallTower06") || isStructureAvailable("Pillbox-RotMG")) {
			defenses = MEDIUM_DEFENSES[random(MEDIUM_DEFENSES.length)]
			return defenses
		} else {
			defenses = WEAK_DEFENSES[random(WEAK_DEFENSES.length)]
			return defenses
		}
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

function buildAntiAir() {
	if (!enemiesHaveVTOLs) {
		return false;
	}

	let bestAADefense = null;
	
	// Find the strongest available AA defense
	for (let i = 0; i < AA_DEFENSES.length; i++) {
		if (isStructureAvailable(AA_DEFENSES[i])) {
			bestAADefense = AA_DEFENSES[i];
			break;
		}
	}

	if (!bestAADefense) {
		return false; // No AA researched yet
	}

	return grabTrucksAndBuild(bestAADefense);
}

// Order all idle builders that may be in danger to return to base
function callIdleBuildersToBase() {
	const idleBuilders = findIdleTrucks(null, baseBuildersGroup);

	idleBuilders.forEach(truck => {
		const isUnsafe = enumRange(truck.x, truck.y, 10, ENEMIES, false)
			.some(isUnsafeEnemyObject);

		if (isUnsafe) {
			orderDroid(truck, DORDER_RTB)
		}
	});
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

	for (const { new: newStruct, old: oldStructs } of upgradeMap) {
		if (isStructureAvailable(newStruct)) {
			const targets = oldStructs
				.flatMap(type => enumStruct(me, type))
				.sort(sortByDistToBase);

			for (const struct of targets) {
				if (demolishThis(struct)) {
					return true;
				}
			}
		}
	}

	return false;
}

// Demolish useless cyborg factories
function demolishCyborgFactories() {
	if (isSeaMap) {
		const cybFacs = enumStruct(me, CYBORG_FACTORY_STAT);
		if (cybFacs.length > 0) {
			return demolishThis(cybFacs[0]);
		}
	}
	return false;
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
	if (obj === null || obj === undefined) {
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
	if (!structure) return false;
	let success = false;
	let droidList = findIdleTrucks(structure, defensesBuildersGroup);
	if (droidList.length === 0) {
		droidList = findIdleTrucks(structure, baseBuildersGroup);
	}

	for (let i = 0, d = droidList.length; i < d; ++i) {
		if (canDroidHelp(droidList[i], structure.x, structure.y)) {
			if (orderDroidObj(droidList[i], DORDER_DEMOLISH, structure)) {
				success = true;
				break; // One truck is enough to demolish a structure
			}
		}
	}

	return success;
}

// Function to grab available trucks and build a structure
function grabTrucksAndBuild(structure, base, trucks) {
	// If no ally base is provided, use my base
	if (!base) {
		const hq = enumStruct(me, PLAYER_HQ_STAT)[0];
		if (hq) {
			BASE = { x: hq.x, y: hq.y };
		}
		base = BASE;
	}

	if (!structure) {
		return false;
	}

	// Check if the structure is available to build
	if (!isStructureAvailable(structure)) {
		return false;
	}

	let idleTrucks;

	if (trucks) {
		idleTrucks = trucks.filter(t => canDroidHelp(t, base.x, base.y));
	} else {
		// Find all idle trucks
		idleTrucks = findIdleTrucks(base);
	}

	if (idleTrucks.length === 0) {
		return false; // No trucks available
	}

	let buildSuccessful = false;
	const maxBlockingTiles = 0;

	// Pick a single build location and assign up to 2 trucks to build it together
	const firstTruck = idleTrucks[0];
	const buildLocation = pickStructLocation(firstTruck, structure, base.x, base.y, maxBlockingTiles);

	if (!buildLocation) {
		return false;
	}

	let assigned = 0;
	for (const truck of idleTrucks) {
		if (canDroidHelp(truck, buildLocation.x, buildLocation.y)) {
			if (orderDroidBuild(truck, DORDER_BUILD, structure, buildLocation.x, buildLocation.y)) {
				buildSuccessful = true;
				assigned++;
				if (assigned >= 2) break; // Max 2 trucks per structure so others stay free
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
		mydroid.order !== DORDER_RECOVER &&
		droidCanReach(mydroid, bx, by)
	);
}

function lookForOil() {
	// Also try to grab nearby free Oil Drums and Artifacts (Crates)
	grabFreeObjects();

	// Limit the number of "extra" derricks. Each power generator can only handle 4 derricks.
	// If we have 10 more derricks than our power generators can process, stop capturing more until we build another generator.
	if (countStruct(DERRICK_STAT) - (countStruct(POW_GEN_STAT) * 4) >= 10) {
		return false;
	}

	// Get all available idle droids from base builders group first (cheap check)
	let droids = enumGroup(baseBuildersGroup).filter(droid =>
		droid.order !== DORDER_BUILD &&
		droid.order !== DORDER_HELPBUILD &&
		droid.order !== DORDER_LINEBUILD &&
		droid.order !== DORDER_RECYCLE &&
		droid.order !== DORDER_DEMOLISH &&
		droid.order !== DORDER_RECOVER
	);

	if (droids.length === 0) return false;

	const UNSAFE_AREA_RANGE = 18;
	let success = false;

	// Allied base positions
	let allyBasePositions = alliesList.map((a) => a.base);

	// Get all constructor droids that are currently building something
	let busyTrucks = enumDroid(me, DROID_CONSTRUCT).filter(truck =>
		truck.order === DORDER_BUILD || truck.order === DORDER_HELPBUILD
	);

	// Pre-filter oils with cheap distance checks and sort by distance to base
	let oils = enumFeature(ALL_PLAYERS, OIL_RES_STAT)
		.filter((oil) => {
			let tooCloseToAlly = allyBasePositions.some(base =>
				base && distBetweenTwoPoints(base.x, base.y, oil.x, oil.y) < 15
			);
			if (tooCloseToAlly) return false;

			// Is it practically inside the enemy base? Suicide to send a truck there.
			let tooCloseToEnemyBase = currentEnemy && currentEnemy.base ?
				distBetweenTwoPoints(oil.x, oil.y, currentEnemy.base.x, currentEnemy.base.y) < 25 : false;
			if (tooCloseToEnemyBase) return false;

			// Check if any of our trucks are already building near this oil
			let alreadyTargeted = busyTrucks.some(truck =>
				distBetweenTwoPoints(truck.x, truck.y, oil.x, oil.y) < 5
			);
			return !alreadyTargeted;
		})
		.sort(sortByDistToBase);

	if (oils.length === 0) return false;

	// Assign one truck per oil — closest idle truck to each oil
	let assignedDroids = new Set();

	for (const oil of oils) {
		if (assignedDroids.size >= droids.length) break; // All idle trucks assigned!

		// Check if area is safe only when considering this oil
		if (!isAreaSafe(oil.x, oil.y, UNSAFE_AREA_RANGE)) continue;

		let bestDroid = null;
		let bestDist = 99999;

		for (const droid of droids) {
			if (assignedDroids.has(droid.id)) continue;

			let dist = distBetweenTwoPoints(droid.x, droid.y, oil.x, oil.y);
			if (dist < bestDist && droidCanReach(droid, oil.x, oil.y)) {
				bestDist = dist;
				bestDroid = droid;
			}
		}

		if (bestDroid) {
			assignedDroids.add(bestDroid.id);
			if (orderDroidBuild(bestDroid, DORDER_BUILD, DERRICK_STAT, oil.x, oil.y)) {
				success = true;
			}
		}
	}

	return success;
}

// Collect free Oil Drums (+100 power) and Artifacts (Crates) on the map
function grabFreeObjects() {
	const collectibles = enumFeature(ALL_PLAYERS, OIL_DRUM_STAT)
		.concat(enumFeature(ALL_PLAYERS, ARTIFACT_STAT))
		.sort(sortByDistToBase);

	if (collectibles.length === 0) {
		return false;
	}

	// Use idle combat units or defense builders so we don't slow down base oil trucks
	const collectors = enumGroup(attackerGroup)
		.concat(enumGroup(defensesBuildersGroup))
		.filter(d =>
			d.order !== DORDER_RECOVER &&
			d.order !== DORDER_BUILD &&
			d.order !== DORDER_HELPBUILD &&
			d.order !== DORDER_RTR
		);

	if (collectors.length === 0) {
		return false;
	}

	let assignedCollectors = new Set();
	const MAX_COLLECT_ITEMS = 3; // Process up to 3 closest items per tick to keep CPU usage minimal
	let count = 0;

	for (const item of collectibles) {
		if (count >= MAX_COLLECT_ITEMS || assignedCollectors.size >= collectors.length) break;

		// Skip items if the area around them is not safe
		if (!isAreaSafe(item.x, item.y, 18)) continue;

		let bestDroid = null;
		let bestDist = 99999;

		for (const droid of collectors) {
			if (assignedCollectors.has(droid.id)) continue;

			const dist = distBetweenTwoPoints(droid.x, droid.y, item.x, item.y);
			if (dist < bestDist && droidCanReach(droid, item.x, item.y)) {
				bestDist = dist;
				bestDroid = droid;
			}
		}

		if (bestDroid) {
			assignedCollectors.add(bestDroid.id);
			orderDroidObj(bestDroid, DORDER_RECOVER, item);
			count++;
		}
	}

	return count > 0;
}
