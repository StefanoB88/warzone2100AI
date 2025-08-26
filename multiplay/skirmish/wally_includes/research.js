function isPowerResearch(research) {
	const POWERS = [
		"R-Struc-Power-Upgrade01",
		"R-Struc-Power-Upgrade01b",
		"R-Struc-Power-Upgrade01c",
		"R-Struc-Power-Upgrade02",
		"R-Struc-Power-Upgrade03",
		"R-Struc-Power-Upgrade03a",
	];

	for (let i = 0, len = POWERS.length; i < len; ++i) {
		if (research === POWERS[i]) {
			return true;
		}
	}

	return false;
}

function evalResearch(lab, list) {
    const sufficientPower = getRealPower() > 15000;

    for (let i = 0; i < list.length; ++i) {
        if (sufficientPower && isPowerResearch(list[i])) {
            // Skip power research if we have enough power
            continue;
        }

        if (pursueResearch(lab, list[i])) {
            return true; // Research found and pursued
        }
    }

    return false; // No research pursued
}


function research() {
    // Don't research if:
    // We don't have builders
    // We finished all the researches
    // We don't have enough power at all
    if (!countDroid(DROID_CONSTRUCT) || researchDone || getRealPower() < MIN_RESEARCH_POWER) {
        return;
    }

    let labList = enumStruct(me, RES_LAB_STAT).filter((lab) => (
        lab.status === BUILT && structureIdle(lab)
    ));

    if (labList.length === 0) {
        return;
    }

    const researchPriorities = [
        isSeaMap ? "R-Vehicle-Prop-Hover" : null,
        START_COMPONENTS,

        FUNDAMENTALS_BODY_T1,
        FUNDAMENTALS_ROCKETS_WEAPON_T1,
        FUNDAMENTALS_MACHINEGUN_WEAPON_T1,
        FUNDAMENTALS_UPGRADES_T1,
        FUNDAMENTALS_PROPULSION_T1,

        FUNDAMENTALS_BODY_T2,
        FUNDAMENTALS_UPGRADES_T2,
        FUNDAMENTALS_DEFENCE_T1,
        FUNDAMENTALS_PROPULSION_T2,

        FUNDAMENTALS_BODY_T3,
        FUNDAMENTALS_UPGRADES_T3,
        FUNDAMENTALS_DEFENCE_T2,
        FUNDAMENTALS_ROCKETS_WEAPON_T2,
        FUNDAMENTALS_MACHINEGUN_WEAPON_T2,
        FUNDAMENTALS_HOWITZER_WEAPON,
        FUNDAMENTALS_PROPULSION_T3,

        FUNDAMENTALS_SATELLITE,
        FUNDAMENTALS_UPGRADES_T4,
        FUNDAMENTALS_PROPULSION_T4,
        FUNDAMENTALS_BODY_T4
    ].filter(Boolean); // Removes any null value (like the one for "R-Vehicle-Prop-Hover" if not isSeaMap)

    // List of all possible research items if nothing else is found
    const allResearchList = enumResearch();

    for (let lab of labList) {
        let found = false;

        // Try each research priority
        for (let researchCategory of researchPriorities) {
            if (found) break;
            found = evalResearch(lab, researchCategory);
        }

        // Last step: research a random item if no other research was found
        if (!found && allResearchList.length > 0) {
            const idx = Math.floor(Math.random() * allResearchList.length);
            pursueResearch(lab, allResearchList[idx].name);
        }
    }

    if (allResearchList.length === 0) {
        researchDone = true
    }
}
