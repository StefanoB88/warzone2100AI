function eventStructureReady(structure) {
	if (!structure) {
		const LASER = enumStruct(me, LASERLINK_STAT);

		if (LASER.length > 0) {
			structure = LASER[0];
		} else {
			return
		}
	}

	// If no enemy structure was found, try again in 1 minute
	const RETRY_TIME = 60000 + random(25) + random(50);

	const struct = returnClosestEnemyStructure();

	if (struct) {
		const obj = getObject(struct.typeInfo, struct.playerInfo, struct.idInfo);

		activateStructure(structure, obj);
		
		const playerName = playerData[obj.player].name
		const enemyPlayerName = playerName ?? "Hmmm"
		chat(ALL_PLAYERS, `${enemyPlayerName}... Laser is ready, I aim it steady!`);
	} else {
		queue("eventStructureReady", RETRY_TIME, structure);
	}
}

function returnClosestEnemyStructure() {
    let enemyIndex = currentEnemy.position;

    if (enemyIndex === undefined) {
        const aliveEnemies = getAliveEnemyPlayersData();
        if (!aliveEnemies || aliveEnemies.length === 0) {
			return;
		}
        enemyIndex = aliveEnemies[0].position;
    }

    if (enemyIndex !== undefined) {
        const structureTypes = [LASSAT, HQ, FACTORY, CYBORG_FACTORY, VTOL_FACTORY, null];

        for (const type of structureTypes) {
            const structs = type ? enumStruct(enemyIndex, type) : enumStruct(enemyIndex);
            if (structs.length > 0) {
                return objectInformation(structs[0]);
            }
        }
    }
}


function objectInformation(object) {
	return {
		"typeInfo": object.type,
		"playerInfo": object.player,
		"idInfo": object.id
	};
}