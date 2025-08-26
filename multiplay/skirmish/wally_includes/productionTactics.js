function checkWeaponPercentage(enemyTypeLists, weaponLists) {
    if (currentEnemy === undefined) {
        return 0;
    }

    let weaponCount = 0;
    const enemyUnits = enemyTypeLists.flatMap(type => enumDroid(currentEnemy.position, type));
    const totalEnemies = enemyUnits.length;

    if (totalEnemies === 0) {
        return 0;
    }

    const weaponSets = weaponLists.map(list => new Set(list));

    for (const unit of enemyUnits) {
        if (unit.weapons?.length > 0 && weaponSets.some(set => set.has(unit.weapons[0]?.name))) {
            weaponCount++;
        }
    }    

    return (weaponCount / totalEnemies) * 100;
}

// Specific functions for flame and tank killer
function checkFlameWeapons() {
    return checkWeaponPercentage(
        [DROID_WEAPON, DROID_CYBORG],
        [FLAME_WEAPON_LIST, CYBORG_FLAMERS]
    );
}

function checkTankKillerWeapons() {
    return checkWeaponPercentage(
        [DROID_WEAPON, DROID_CYBORG],
        [ROCKET_WEAPON_LIST, CYBORG_HEAVY_ROCKETS, CYBORG_LIGHT_ROCKETS]
    );
}

// If the enemies have a lot of defenses, produce some bunker buster
function checkCurrentEnemyDefenses() {
    const enemyIndex = currentEnemy.position;

    const currentEnemyDefenses = enumStruct(enemyIndex, DEFENSE).sort(sortByDistToBase)

    let probability = currentEnemyDefenses.length / useBunkerBuster ? 1.2 : 2;

    return probability;
}

// Produce long distance support tanks in case we have a huge group of front tanks
function checkLongRangeSupport() {
    let probability = 5;

    const myDroidsSize = enumGroup(attackerGroup)
    .filter(droid => !HOWITZERS_WEAPON_LIST.includes(droid.weapons?.[0]?.name ?? ""))
    .length

    if (myDroidsSize >= 50) {
        probability = 10
    } else if (myDroidsSize >= 80) {
        probability = 20
    } else if (myDroidsSize >= 100) {
        probability = 25
    }

    return probability
}
