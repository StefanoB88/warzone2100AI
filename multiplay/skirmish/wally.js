
// -- definitions
const OIL_RES_STAT = "OilResource";
const RES_LAB_STAT = "A0ResearchFacility";
const POW_GEN_STAT = "A0PowerGenerator";
const FACTORY_STAT = "A0LightFactory";
const DERRICK_STAT = "A0ResourceExtractor";
const CYBORG_FACTORY_STAT = "A0CyborgFactory";
const PLAYER_HQ_STAT = "A0CommandCentre";
const VTOL_PAD_STAT = "A0VtolPad";
const VTOL_FACTORY_STAT = "A0VTolFactory1";
const REPAIR_FACILITY_STAT = "A0RepairCentre3";
const SENSOR_TOWERS = ["Sys-SensoTower02", "Sys-SensoTowerWS"];
const UPLINK_STAT = "A0Sat-linkCentre";
const LASERLINK_STAT = "A0LasSatCommand";
const ELECTRONIC_DEFENSES = ["Sys-SpyTower", "WallTower-EMP", "Emplacement-MortarEMP"];

// -- globals
const MIN_BASE_TRUCKS = 8;
const MAX_BASE_TRUCKS = 10;
const MIN_BUILD_POWER = 30;
const MIN_RESEARCH_POWER = -50;
const MIN_PRODUCTION_POWER = 50;
const BASE_THREAT_RANGE = Math.ceil(17 + (mapWidth + mapHeight) / 2 / 20);
var BASE = startPositions[me];
var buildersGroup;
var attackerGroup;
var researchDone;
var currentlyDead;
var isSeaMap; // Used to determine if it is a hover map.
var isMyBaseInTrouble = false; // Used to determine if the base is in danger.
var isHighOilMap;

var enemiesHaveVtol;
var areAllEnemiesDead = false;
var isHelpingAlly = false

/**
 * @typedef {Object} PlayerData
 * @property {string} difficulty - The player's difficulty level
 * @property {string} colour - The player's color
 * @property {string} position - The player's position
 * @property {boolean} isAI - Whether the player is AI-controlled
 * @property {boolean} isHuman - Whether the player is human
 * @property {string} name - The player's name
 * @property {number} team - The player's team
 * @property {{x: number, y: number}} base - The player's base coordinates
 */

/** @type {PlayerData[]} */
var alliesList = [];
var enemiesList = [];

/** @type {PlayerData} */
var currentEnemy; // Current enemy Wally is attacking.
var currentEnemyTarget; // Current enemy target Wally is attacking.

var scavengerIndex = undefined;


// Difficulty
var reactionSpeedDelay = 0

// And include the rest here.
include("/multiplay/skirmish/wally_includes/start.js");
include("/multiplay/skirmish/wally_includes/functionsUtility.js");
include("/multiplay/skirmish/wally_includes/production.js");
include("/multiplay/skirmish/wally_includes/productionUtility.js");
include("/multiplay/skirmish/wally_includes/productionTactics.js")
include("/multiplay/skirmish/wally_includes/research.js");
include("/multiplay/skirmish/wally_includes/researchUtility.js");
include("/multiplay/skirmish/wally_includes/build.js");
include("/multiplay/skirmish/wally_includes/buildUtility.js");
include("/multiplay/skirmish/wally_includes/attack.js");
include("/multiplay/skirmish/wally_includes/help.js");
include("/multiplay/skirmish/wally_includes/chat.js");
include("/multiplay/skirmish/wally_includes/laserlink.js");