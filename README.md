# Wally.js - Warzone 2100 AI Bot

**Wally.js** is a versatile skirmish & multiplayer AI bot for **Warzone 2100**, designed for smart range-based micro, progressive territory control, adaptive counter-production, and strong ally cooperation.

---

## ✨ Key Features

- **Weapon-Range Kiting & Focus Fire**: Units automatically maintain their optimal weapon distance (moving closer or retreating to kite enemies) while prioritizing low-health targets within a safe engagement margin.
- **Progressive Forward Defenses**: Builds a strong home defense network first, then progressively advances defense lines toward captured oil derricks or toward the enemy base on flat maps as army advantage grows — only when the area is verified safe.
- **Smart Oil & Truck Survival**: Evaluates oil safety against all enemies on the map, checks route midpoints, remembers danger zones where trucks or derricks were ambushed, and pulls exposed builders back to base if enemies approach.
- **Multi-Facility Load-Balanced Repairs**: Builds up to the maximum limit (5) of Repair Facilities along the outer base perimeter and distributes damaged units evenly across them to prevent repair bottlenecks.
- **Cluster-Bomb VTOL Air Force**: Dedicated VTOL bomber squadrons armed exclusively with Cluster, HEAP, Phosphor, Thermite, and Plasmite bombs, with automatic rearming pads and smart ground target selection (prioritizing enemy trucks, factories, and low-AA areas).
- **Adaptive Counter-Production & AA Defenses**: Dynamically adjusts Anti-Personnel (Machineguns/Lasers) vs Anti-Tank (Rockets/Missiles) ratios, switches to thermal bodies against flamers, builds static Anti-Air defenses when enemy VTOLs are spotted, deploys Bunker Busters only when the main army is near enemy fortifications, and switches to Hover propulsion on sea/island maps.
- **High-Density Laser Satellite Strikes**: Scans all enemies to fire the Laser Satellite at the highest-density cluster of enemy structures or units.
- **Active Ally Cooperation & Chat Commands**:
  - Automatically defends allies under attack and builds defenses in allied bases.
  - Responds to map **Beacons** (`Alt+H`): defends allied bases or switches target to the pinged enemy.
  - Supports chat commands: `"help me"`, `"need truck"`, `"need power"`, and `"attack"` / `"target"`.

---

## 📥 Installation

1. Clone or download this repository.  
2. Place the `multiplay` folder (or pack it as a `.wz` archive) into your Warzone 2100 `mods/autoload` directory (e.g., `C:\Users\<yourname>\AppData\Roaming\Warzone 2100 Project\Warzone 2100\mods\autoload`).  
3. Select **Wally** as your AI when starting a new Skirmish or Multiplayer game.  

---

## 👤 Author

**Stefano Brandi**  
[GitHub Profile](https://github.com/StefanoB88)  

---

## 📜 License

This project is licensed under the **GNU General Public License v2.0 or later (GPL-2.0-or-later)**.  
See the [LICENSE](multiplay/skirmish/LICENSE) file for details.  
