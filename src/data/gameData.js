// Game data constants

export const SHAPES = {
  S_CROSS: [[0,0], [0,1], [0,-1], [1,0], [-1,0]],
  S_LINE: [[0,0], [0,1], [0,2], [0,-1], [0,-2]],
  S_L: [[0,0], [0,1], [0,2], [1,0], [2,0]],
  A_SQUARE: [[0,0], [0,1], [1,0], [1,1]],
  A_T: [[0,0], [-1,0], [1,0], [0,1]],
  A_Z: [[0,0], [1,0], [0,1], [-1,1]],
  B_CORNER: [[0,0], [1,0], [0,1]],
  B_LINE: [[0,0], [0,1], [0,-1]]
};

export const CHARACTERS = {
  // RED HEROES (WARLORDS)
  ENTJ: { name: "Oda Nobunaga", title: "Demon King", role: "Warlord", rank: 'S', shape: 'S_CROSS', hp: 55, mp: 40, atk: 70, def: 10, spd: 9, skillName: "Tenka Fubu", skillCost: 20, desc: "Deal 1.8x DMG to target.", type: "single", heroId: '0' },
  ENFP: { name: "Toyotomi Hideyoshi", title: "Great Unifier", role: "Warlord", rank: 'S', shape: 'S_LINE', hp: 52, mp: 50, atk: 58, def: 10, spd: 9, skillName: "Sunomata", skillCost: 25, desc: "Party Atk +5 (3 turns).", type: "aoe", heroId: '1' },
  ENTP: { name: "Date Masamune", title: "One-Eyed Dragon", role: "Warlord", rank: 'A', shape: 'A_Z', hp: 52, mp: 40, atk: 64, def: 10, spd: 8, skillName: "Dragon Roar", skillCost: 25, desc: "DMG + Lower Enemy Def.", type: "single", heroId: '2' },
  ENFJ: { name: "Sanada Yukimura", title: "Crimson Demon", role: "Warlord", rank: 'A', shape: 'A_T', hp: 55, mp: 40, atk: 60, def: 12, spd: 9, skillName: "Death Charge", skillCost: 25, desc: "Dmg based on missing HP.", type: "single", heroId: '3' },

  // DUELISTS
  ISFP: { name: "Miyamoto Musashi", title: "Sword Saint", role: "Duelist", rank: 'S', shape: 'S_CROSS', hp: 95, mp: 20, atk: 55, def: 9, spd: 19, skillName: "Two Heavens", skillCost: 20, desc: "Attack twice (70% DMG each).", type: "single", heroId: '4' },
  INFJ: { name: "Uesugi Kenshin", title: "War God", role: "Duelist", rank: 'A', shape: 'A_T', hp: 105, mp: 60, atk: 20, def: 14, spd: 15, skillName: "Bishamonten", skillCost: 20, desc: "2.0x Holy DMG (Ignores DEF).", type: "single", heroId: '5' },
  ESFP: { name: "Maeda Keiji", title: "Kabukimono", role: "Duelist", rank: 'B', shape: 'B_CORNER', hp: 95, mp: 30, atk: 24, def: 8, spd: 18, skillName: "Matsuri Beat", skillCost: 25, desc: "Party Spd +5.", type: "aoe", heroId: '6' },
  ISTP: { name: "Hattori Hanzo", title: "Shadow", role: "Duelist", rank: 'B', shape: 'B_LINE', hp: 85, mp: 40, atk: 21, def: 10, spd: 20, skillName: "Assassinate", skillCost: 20, desc: "Crit DMG, Ignores 50% Def.", type: "single", heroId: '7' },

  // GUARDIANS
  INTJ: { name: "Tokugawa Ieyasu", title: "The Patient", role: "Guardian", rank: 'S', shape: 'S_L', hp: 130, mp: 30, atk: 14, def: 22, spd: 10, skillName: "Great Peace", skillCost: 15, desc: "Self Def +15.", type: "single", heroId: '8' },
  ESTJ: { name: "Minamoto Yoritomo", title: "First Shogun", role: "Guardian", rank: 'A', shape: 'A_SQUARE', hp: 120, mp: 20, atk: 16, def: 18, spd: 11, skillName: "Kamakura Law", skillCost: 15, desc: "Heal Self 40 HP + Def Up.", type: "single", heroId: '9' },
  ESTP: { name: "Takeda Shingen", title: "Tiger of Kai", role: "Guardian", rank: 'A', shape: 'A_SQUARE', hp: 125, mp: 30, atk: 17, def: 16, spd: 12, skillName: "Furinkazan", skillCost: 20, desc: "Party Def +5 (3 turns).", type: "aoe", heroId: 'a' },

  // TACTICIANS
  ISTJ: { name: "Akechi Mitsuhide", title: "The Scholar", role: "Tactician", rank: 'S', shape: 'S_CROSS', hp: 90, mp: 70, atk: 14, def: 10, spd: 13, skillName: "Honno-ji Fire", skillCost: 35, desc: "25 Fire DMG to ALL enemies.", type: "aoe", heroId: 'b' },
  INTP: { name: "Takenaka Hanbei", title: "Genius Strategist", role: "Tactician", rank: 'B', shape: 'B_LINE', hp: 80, mp: 80, atk: 12, def: 10, spd: 14, skillName: "Eight Gates", skillCost: 25, desc: "Stun target for 1 turn.", type: "single", heroId: 'c' },
  ISFJ: { name: "Ishida Mitsunari", title: "Loyal Admin", role: "Tactician", rank: 'B', shape: 'B_CORNER', hp: 95, mp: 60, atk: 12, def: 14, spd: 13, skillName: "Supply Lines", skillCost: 30, desc: "Heal Party 30 HP.", type: "aoe", heroId: 'd' },
  ESFJ: { name: "Nene", title: "Kodai-in", role: "Tactician", rank: 'B', shape: 'B_CORNER', hp: 90, mp: 70, atk: 10, def: 12, spd: 14, skillName: "Mother's Love", skillCost: 25, desc: "Heal Single Target 60 HP.", type: "single", heroId: 'e' },
  INFP: { name: "Sen no Rikyu", title: "Tea Master", role: "Tactician", rank: 'B', shape: 'B_LINE', hp: 85, mp: 90, atk: 8, def: 12, spd: 12, skillName: "Wabi-Sabi", skillCost: 35, desc: "Heal Party 25 HP & 15 MP.", type: "aoe", heroId: 'f' },
  
  // HELL MODE CHARACTERS
  TRUMP: { name: "Donald Trump", title: "The Leader", role: "Warlord", rank: 'S', shape: 'S_CROSS', hp: 200, mp: 100, atk: 100, def: 30, spd: 15, skillName: "Make America Great Again", skillCost: 40, desc: "40 DMG to ALL enemies, Heal Self 30 HP.", type: "aoe", heroId: 'Z' },
  DROID: { name: "Droid", title: "Protector", role: "Guardian", rank: 'A', shape: 'A_SQUARE', hp: 100, mp: 30, atk: 40, def: 20, spd: 12, skillName: "Guard Protocol", skillCost: 0, desc: "Passive: Guards attacks on Trump.", type: "passive", heroId: 'Y' },
};

// Hero ID to MBTI mapping (for decoding hashcodes)
export const HERO_ID_TO_MBTI = {};
Object.keys(CHARACTERS).forEach(mbti => {
  HERO_ID_TO_MBTI[CHARACTERS[mbti].heroId] = mbti;
});

export const MBTI_TYPES = [
  "ENTJ", "INTJ", "ENTP", "INTP", "ESTJ", "ISTJ", "ESFJ", "ISFJ",
  "ENFJ", "INFJ", "ENFP", "INFP", "ESTP", "ISTP", "ESFP", "ISFP"
];

export const GRID_SIZE = 5;


