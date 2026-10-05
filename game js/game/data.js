const THEME_NAMES = [
  "River", "Green Forest", "Mushroom Woods", "Rainy Forest", "Mountain",
  "Flower Garden", "Cloud Valley", "Starry Sky", "Moon Forest", "Sakura Garden",
  "Autumn Woods", "Snow Forest", "Frozen Mountain", "Desert Oasis", "Cactus Canyon",
  "Tropical Island", "Underwater World", "Coral Garden", "Fairy Kingdom", "Magic Forest",
  "Crystal Cave", "Volcano", "Sky Kingdom", "Rainbow World", "Cosmic World",
  "Cyber City", "Steam Factory", "Construction Site", "Abandoned Town", "Subway Station",
  "Amusement Park", "Neon Alley", "Scrap Junkyard", "Greek Temple", "Egypt Pyramid",
  "Aztec Ruins", "Gothic Cathedral", "Sunken Shipwreck", "Stone Labyrinth", "Ancient Library",
  "Candy Land", "Toy Workshop", "Clockwork Realm", "Shadow Realm", "Mirror Maze",
  "Bone Graveyard", "Dragon Nest", "Witch Cabin", "Atlantis Palace", "Grand Canyon",
  "Foggy Swamp", "Bamboo Forest", "Autumn Wheatfield", "Iceberg Coast", "Bottomless Abyss",
  "Tornado Valley", "Lightning Ridge", "Deep Sea Trench", "Sunflower Field", "Geyser Basin",
  "Space Station", "Alien Jungle", "Saturn Rings", "Meteor Shower", "Virtual Matrix",
  "Power Core", "Mars Colony", "Cheese Mountain", "Dessert Desert", "Fruit Orchard",
  "Ramen Bowl", "Coffee House", "Wild West Town", "Medieval Castle", "Vintage Circus",
  "Chinatown", "Viking Village", "Venice Canals", "Chessboard Plain", "Geometric Void",
  "Origami World", "Ink Splash", "Time Rift", "Pillow Fort", "8-Bit Pixel",
  "Synthwave Sunset", "Card Casino", "Crayon Drawing", "Nuclear Wasteland", "Mega Tsunami",
  "Doomsday Volcano", "Glacial Age", "Bedroom Closet", "Honeycomb Hive", "Biotech Lab",
  "Spider Lair", "Tribal Village", "Treasure Vault", "Dust Storm Oasis", "Black Hole Edge",
];

const THEME_KEYS = [
  "river", "green_forest", "mushroom_woods", "rainy_forest", "mountain",
  "flower_garden", "cloud_valley", "starry_sky", "moon_forest", "sakura_garden",
  "autumn_woods", "snow_forest", "frozen_mountain", "desert_oasis", "cactus_canyon",
  "tropical_island", "underwater_world", "coral_garden", "fairy_kingdom", "magic_forest",
  "crystal_cave", "volcano", "sky_kingdom", "rainbow_world", "cosmic_world",
  "cyber_city", "steam_factory", "construction_site", "abandoned_town", "subway_station",
  "amusement_park", "neon_alley", "scrap_junkyard", "greek_temple", "egypt_pyramid",
  "aztec_ruins", "gothic_cathedral", "sunken_shipwreck", "stone_labyrinth", "ancient_library",
  "candy_land", "toy_workshop", "clockwork_realm", "shadow_realm", "mirror_maze",
  "bone_graveyard", "dragon_nest", "witch_cabin", "atlantis_palace", "grand_canyon",
  "foggy_swamp", "bamboo_forest", "autumn_wheatfield", "iceberg_coast", "bottomless_abyss",
  "tornado_valley", "lightning_ridge", "deep_sea_trench", "sunflower_field", "geyser_basin",
  "space_station", "alien_jungle", "saturn_rings", "meteor_shower", "virtual_matrix",
  "power_core", "mars_colony", "cheese_mountain", "dessert_desert", "fruit_orchard",
  "ramen_bowl", "coffee_house", "wild_west_town", "medieval_castle", "vintage_circus",
  "chinatown", "viking_village", "venice_canals", "chessboard_plain", "geometric_void",
  "origami_world", "ink_splash", "time_rift", "pillow_fort", "pixel_world",
  "synthwave_sunset", "card_casino", "crayon_drawing", "nuclear_wasteland", "mega_tsunami",
  "doomsday_volcano", "glacial_age", "bedroom_closet", "honeycomb_hive", "biotech_lab",
  "spider_lair", "tribal_village", "treasure_vault", "dust_storm_oasis", "black_hole_edge",
];

const SKIN_NAMES = [
  "Classic", "Yellow", "Blue", "Pink", "Black", "Snow", "Strawberry", "Lemon", "Blueberry", "Watermelon",
  "Mushroom", "Bunny", "Panda", "Cat", "Fox", "Wizard", "Prince", "Sakura", "Ice", "Fire",
  "Galaxy", "Rainbow", "Crystal", "Ghost", "Golden", "Chocolate", "Matcha", "Honey", "Donut", "Avocado",
  "Popcorn", "Bubblegum", "Cheese", "Sushi", "Ice Cream", "Autumn", "Bamboo", "Cactus", "Sunflower", "Raincoat",
  "Thunder", "Foggy", "Seashell", "Mossy", "Clover", "Cowboy", "Pirate", "Ninja", "Astronaut", "Chef",
  "Detective", "Clown", "Builder", "Businessman", "Artist", "Lion", "Shark", "Bee", "Unicorn", "Dragon",
  "Bat", "Deer", "Chick", "Mermaid", "Wolf", "Robo", "8-Bit", "Synthwave", "Zombie", "Mutant",
  "Alien", "Lego", "Cyborg", "Hologram", "Magnetic", "Wooden", "Marble", "Bronze", "Silver", "Obsidian",
  "Glass", "Jade", "Clay", "Origami", "Pearl", "Cursed", "Angel", "Steampunk", "Zebra", "Vortex",
  "Checker", "Tie-Dye", "Eclipse", "Tarot", "Magma", "Soap", "Balloon", "Mummy", "Jester", "Emperor",
];

const SKIN_KEYS = [
  "classic", "yellow", "blue", "pink", "black", "snow", "strawberry", "lemon", "blueberry", "watermelon",
  "mushroom", "bunny", "panda", "cat", "fox", "wizard", "prince", "sakura", "ice", "fire",
  "galaxy", "rainbow", "crystal", "ghost", "golden", "chocolate", "matcha", "honey", "donut", "avocado",
  "popcorn", "bubblegum", "cheese", "sushi", "ice_cream", "autumn", "bamboo", "cactus", "sunflower", "raincoat",
  "thunder", "foggy", "seashell", "mossy", "clover", "cowboy", "pirate", "ninja", "astronaut", "chef",
  "detective", "clown", "builder", "businessman", "artist", "lion", "shark", "bee", "unicorn", "dragon",
  "bat", "deer", "chick", "mermaid", "wolf", "robo", "eight_bit", "synthwave", "zombie", "mutant",
  "alien", "lego", "cyborg", "hologram", "magnetic", "wooden", "marble", "bronze", "silver", "obsidian",
  "glass", "jade", "clay", "origami", "pearl", "cursed", "angel", "steampunk", "zebra", "vortex",
  "checker", "tie_dye", "eclipse", "tarot", "magma", "soap", "balloon", "mummy", "jester", "emperor",
];

const ACCENTS = [
  null, "fruit_slice", "galaxy_star", "flower_crown", "ghost_wisp",
  "ice_crystal", "fruit_slice", "fruit_slice", "fruit_slice", "fruit_slice",
  "mushroom_cap", "bunny_ears", "panda_mask", "cat_ears", "fox_ears",
  "wizard_hat", "prince_crown", "flower_crown", "ice_crystal", "fire_crown",
  "galaxy_star", "rainbow_arc", "ice_crystal", "ghost_wisp", "prince_crown",
  "fruit_slice", "flower_crown", "fruit_slice", "rainbow_arc", "fruit_slice",
  "chef_hat", "rainbow_arc", "fruit_slice", "ninja_wrap", "chef_hat",
  "flower_crown", "bunny_ears", "ice_crystal", "flower_crown", "cowboy_hat",
  "fire_crown", "ghost_wisp", "ice_crystal", "mushroom_cap", "flower_crown",
  "cowboy_hat", "pirate_hat", "ninja_wrap", "astronaut_helmet", "chef_hat",
  "cowboy_hat", "rainbow_arc", "astronaut_helmet", "prince_crown", "rainbow_arc",
  "bunny_ears", "ice_crystal", "flower_crown", "rainbow_arc", "fire_crown",
  "ghost_wisp", "cowboy_hat", "bunny_ears", "rainbow_arc", "fox_ears",
  "astronaut_helmet", "galaxy_star", "galaxy_star", "ghost_wisp", "fire_crown",
  "astronaut_helmet", "rainbow_arc", "astronaut_helmet", "ghost_wisp", "rainbow_arc",
  "cowboy_hat", "ice_crystal", "prince_crown", "ice_crystal", "ghost_wisp",
  "ghost_wisp", "ice_crystal", "cowboy_hat", "fruit_slice", "prince_crown",
  "ghost_wisp", "rainbow_arc", "wizard_hat", "ninja_wrap", "galaxy_star",
  "rainbow_arc", "rainbow_arc", "galaxy_star", "wizard_hat", "fire_crown",
  "ghost_wisp", "rainbow_arc", "ninja_wrap", "prince_crown", "emperor_crown",
];

const SPECIAL_SKIN_COLORS = {
  Classic: ["#6fa83e", "#dceaa1"], Yellow: ["#e1be38", "#fff2a8"], Blue: ["#4297b9", "#bdeef1"],
  Pink: ["#e77ca6", "#ffe0e8"], Black: ["#31373b", "#aab0a5"], Snow: ["#dceff0", "#ffffff"],
  Golden: ["#d99b22", "#fff0a3"], Chocolate: ["#70422f", "#d8a77d"], Matcha: ["#91ae63", "#e1e6ab"],
  Ice: ["#72bfd0", "#dbfbff"], Fire: ["#d64c2f", "#ffd05e"], Galaxy: ["#4a3c86", "#d498ff"],
  Ghost: ["#b9ced0", "#f7ffff"], Obsidian: ["#202128", "#70577b"], Jade: ["#2f8a63", "#a7d8b0"],
  Magma: ["#29232b", "#ff703d"], Emperor: ["#7d263f", "#f1c34a"],
};

function paletteFor(name, index) {
  const dark = /Starry|Moon|Cosmic|Shadow|Abyss|Neon|Space|Matrix|Trench|Nuclear|Black Hole|Synthwave/.test(name);
  const cold = /Snow|Frozen|Ice|Glacial|Cloud|Sky|Underwater|Coral|Tsunami/.test(name);
  const warm = /Desert|Canyon|Volcano|Autumn|Candy|Circus|West|Treasure|Dust|Coffee|Cheese/.test(name);
  const hue = dark ? (220 + index * 11) % 360 : cold ? (175 + index * 5) % 220 : warm ? (18 + index * 4) % 70 : (90 + index * 17) % 360;
  return {
    sky: `hsl(${hue} ${dark ? 42 : 48}% ${dark ? 15 : 76}%)`,
    glow: `hsl(${(hue + 36) % 360} ${dark ? 58 : 62}% ${dark ? 35 : 88}%)`,
    deep: `hsl(${(hue + 190) % 360} ${dark ? 50 : 52}% ${dark ? 8 : 28}%)`,
    accent: `hsl(${(hue + 65) % 360} 72% ${dark ? 67 : 52}%)`,
    dark,
  };
}

function enemyFor(name, index) {
  if (index < 2) return null;
  if (/City|Factory|Construction|Subway|Neon|Junkyard|Lab|Station|Matrix|Core|Mars/.test(name)) return "air_burst";
  if (/Garden|Flower|Sakura|Sunflower|Candy|Fruit/.test(name)) return "butterfly";
  if (/Moon|Starry|Cave|Shadow|Abyss|Graveyard|Witch|Black Hole/.test(name)) return "bat";
  if (/Forest|Woods|Bamboo|Library|Village/.test(name)) return index > 20 ? "owl" : "bird";
  if (/Spider|Labyrinth|Ruins|Cathedral|Shipwreck/.test(name)) return "spider";
  return index > 6 && index % 3 === 0 ? "bee" : "bird";
}

export const THEMES = THEME_NAMES.map((name, index) => ({
  index,
  stage: index + 1,
  name,
  key: THEME_KEYS[index],
  motifAsset: `THEME_MOTIFS_0${Math.floor(index / 20) + 1}`,
  motifFrame: THEME_KEYS[index],
  propAsset: `THEME_PROPS_0${Math.floor(index / 20) + 1}`,
  propFrame: THEME_KEYS[index],
  creatureAsset: `THEME_CREATURES_${String(Math.floor(index / 10) + 1).padStart(2, "0")}`,
  creatureSheetAsset: `CREATURE_SHEET_${String(Math.floor(index / 4) + 1).padStart(2, "0")}`,
  flyFrame: `${THEME_KEYS[index]}_fly`,
  birdFrame: `${THEME_KEYS[index]}_bird`,
  palette: paletteFor(name, index),
  enemy: enemyFor(name, index),
}));

export const SKINS = SKIN_NAMES.map((name, index) => {
  const generatedHue = (95 + index * 43) % 360;
  const colors = SPECIAL_SKIN_COLORS[name] || [
    `hsl(${generatedHue} 55% ${index > 79 ? 36 : 48}%)`,
    `hsl(${(generatedHue + 45) % 360} 65% 79%)`,
  ];
  return {
    index,
    name,
    primary: colors[0],
    secondary: colors[1],
    accent: ACCENTS[index],
    animation: SKIN_KEYS[index],
    sheetAsset: `SKIN_SHEET_${String(Math.floor(index / 4) + 1).padStart(2, "0")}`,
    price: index === 0 ? 0 : Math.round((45 + index * 14) / 5) * 5,
    unlockStage: index === 0 ? 1 : Math.min(100, Math.max(2, Math.ceil(index * 0.9))),
  };
});

export function difficultyFor(stage) {
  if (stage <= 5) return "EASY";
  if (stage <= 15) return "NORMAL";
  if (stage <= 35) return "HARD";
  if (stage <= 70) return "VERY HARD";
  return "EXPERT";
}
