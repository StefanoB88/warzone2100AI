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
    if (!countDroid(DROID_CONSTRUCT) || researchDone) {
        return;
    }

    let labList = enumStruct(me, RES_LAB_STAT).filter((lab) => (
        lab.status === BUILT && structureIdle(lab)
    ));

    if (labList.length === 0) {
        return;
    }

    // Always allow at least 1 research lab to start researching even when power is low,
    // and require MIN_RESEARCH_POWER only when running multiple labs simultaneously
    const totalLabs = enumStruct(me, RES_LAB_STAT).filter(lab => lab.status === BUILT).length;
    const busyLabs = totalLabs - labList.length;
    if (busyLabs >= 1 && getRealPower() < MIN_RESEARCH_POWER) {
        return;
    }

    const researchPriorities = [
        isSeaMap ? ["R-Vehicle-Prop-Hover"] : null,
        START_COMPONENTS,

        // T1
        FUNDAMENTALS_ROCKET_WEAPON_T1,
        FUNDAMENTALS_MACHINEGUN_WEAPON_T1,
        FUNDAMENTALS_BODY_T1,
        FUNDAMENTALS_PROPULSION_T1,
        FUNDAMENTALS_UPGRADES_T1,
        FUNDAMENTALS_DEFENCE_T1,
		
		enemiesHaveVTOLs ? AA_RESEARCH : null,

        // T2
        FUNDAMENTALS_ROCKET_WEAPON_T2,
        FUNDAMENTALS_MACHINEGUN_WEAPON_T2,
        FUNDAMENTALS_BODY_T2,
        FUNDAMENTALS_PROPULSION_T2,
        ["R-Vehicle-Prop-VTOL"],
        FUNDAMENTALS_UPGRADES_T2,
        FUNDAMENTALS_VTOL_BOMBS_T2,
        FUNDAMENTALS_DEFENCE_T2,     

        // T3
        FUNDAMENTALS_ROCKET_WEAPON_T3,
        FUNDAMENTALS_MACHINEGUN_WEAPON_T3,
        FUNDAMENTALS_BODY_T3,
        FUNDAMENTALS_VTOL_BOMBS_T3,
        FUNDAMENTALS_HOWITZER_WEAPON,
        FUNDAMENTALS_PROPULSION_T3,
        FUNDAMENTALS_UPGRADES_T3,
        FUNDAMENTALS_DEFENCE_T3,

        // T4
        FUNDAMENTALS_ROCKET_WEAPON_T4,
        FUNDAMENTALS_MACHINEGUN_WEAPON_T4,
        FUNDAMENTALS_BODY_T4,
        FUNDAMENTALS_DEFENCE_T4,
        FUNDAMENTALS_PROPULSION_T4,
        FUNDAMENTALS_UPGRADES_T4
    ].filter(Boolean); // Removes any null values

    // List of all currently available research items
    const allResearchList = enumResearch();
    if (allResearchList.length === 0) {
        // Only mark researchDone if we have at least one lab built and there is truly nothing left to research
        if (gameTime > 60000) {
            researchDone = true;
        }
        return;
    }

    for (let lab of labList) {
        let found = false;

        // Try each research priority
        for (let researchCategory of researchPriorities) {
            if (found) break;
            found = evalResearch(lab, researchCategory);
        }

        // Last step: research a random item if no other research was found
        if (!found) {
            const currentAvailable = enumResearch();
            if (currentAvailable.length > 0) {
                const idx = Math.floor(Math.random() * currentAvailable.length);
                pursueResearch(lab, currentAvailable[idx].name);
            }
        }
    }
}
