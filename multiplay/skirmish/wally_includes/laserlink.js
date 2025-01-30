function eventStructureReady(structure) {
    // If no enemy structure was found, try again in 1 minute
	const RETRY_TIME = 60000 + random(25) + random(50);

	if (!structure) {
		const LASER = enumStruct(me, LASERLINK_STAT);

		if (LASER.length > 0) {
			structure = LASER[0];
		} else {
			return
		}
	}

	const struct = returnClosestEnemyStructure();

	if (struct) {
		const obj = getObject(struct.typeInfo, struct.playerInfo, struct.idInfo);

		activateStructure(structure, obj);
		chat(ALL_PLAYERS, `${getPlayerName(obj.player)}... Laser is ready, I aim it steady!`);
	} else {
		queue("eventStructureReady", RETRY_TIME, structure);
	}
}

function returnClosestEnemyStructure() {
	let enemyIndex = currentEnemy.position;

	if (enemyIndex === undefined) {
		enemyIndex = getAliveEnemyPlayersData()[0].position;
	}

	if (enemyIndex !== undefined) {
		let struct = enumStruct(enemyIndex, LASSAT)
			.concat(enumStruct(enemyIndex, HQ))
			.concat(enumStruct(enemyIndex, FACTORY))
			.concat(enumStruct(enemyIndex, CYBORG_FACTORY))
			.concat(enumStruct(enemyIndex, VTOL_FACTORY))
			.concat(enumStruct(enemyIndex))

		if (struct.length > 0) {
			return objectInformation(struct[0]);
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