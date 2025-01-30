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
        if (unit.weapons.length > 0 && weaponSets.some(set => set.has(unit.weapons[0].name))) {
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
