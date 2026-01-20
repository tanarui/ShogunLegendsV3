import { CHARACTERS } from '../data/gameData.js';
import { getFactorScoresFromMBTI } from './gameUtils.js';
import { applyFactorReturns } from '../modules/factorReturns.js';
import { createUnit } from './unitUtils.js';

/**
 * Start Challenge Mode - Creates elite S-rank enemies
 * @param {Object} params
 * @param {Array} params.units - Current units array
 * @param {Object} params.factorReturns - Factor returns data
 * @param {Function} params.t - Translation function
 * @param {string} params.language - Current language
 * @returns {Object} - Challenge mode data
 */
export const startChallengeMode = ({ units, factorReturns, t, language }) => {
  const healedPlayerTeam = units.filter(u => u.isPlayer).map(u => ({
    ...u,
    currentHp: u.maxHp,
    currentMp: u.maxMp,
    isGuarding: u.role === 'Guardian',
    isSentinel: false,
    status: null,
    buffs: [],
    anim: null,
    totalDmgDealt: 0,
    isChanting: false,
    currentSentinelCharges: u.maxSentinelCharges // Reset Charges
  }));

  const sRankKeys = Object.keys(CHARACTERS).filter(k => CHARACTERS[k].rank === 'S' && k !== 'TRUMP' && k !== 'DROID');
  const challengeKeys = [];

  const challengeEnemies = Array(5).fill(null).map((_, i) => {
    const key = sRankKeys[Math.floor(Math.random() * sRankKeys.length)];
    challengeKeys.push(key);
    
    // Apply factor returns using individual hero's MBTI-based factor scores
    const heroFactorScores = getFactorScoresFromMBTI(key);
    let factorMods = factorReturns ? applyFactorReturns({mbti: key}, factorReturns, heroFactorScores) : {};
    
    // Apply Omyo Hedge: zero out negative impacts in challenge mode
    if (factorMods) {
      factorMods = {
        atk: Math.max(0, factorMods.atk || 0),
        def: Math.max(0, factorMods.def || 0),
        spd: Math.max(0, factorMods.spd || 0),
        hp: Math.max(0, factorMods.hp || 0),
        mp: Math.max(0, factorMods.mp || 0)
      };
    }
    
    const unit = createUnit(key, false, `boss_${i}`, {}, i===2, factorMods);
    unit.name = `Elite ${unit.name}`;
    if (unit.role === 'Guardian') unit.isGuarding = true;

    // CHALLENGE BOSS BUFF
    if (i === 2) {
      unit.isDemonLord = true;
      unit.maxHp *= 2;
      unit.currentHp *= 2;
      unit.atk *= 2;
      unit.def *= 2;
      unit.name = `👹 ${unit.name}`;
    }
    return unit;
  });

  const allUnits = [...healedPlayerTeam, ...challengeEnemies];
  const initialQueue = [...allUnits].sort((a, b) => b.spd - a.spd).map(u => u.id);

  return {
    units: allUnits,
    turnQueue: initialQueue,
    currentActorId: initialQueue[0],
    battleLog: [t('challengeModeStart', language), t('defeatDemonLord', language)],
    lastEnemyKeys: challengeKeys
  };
};

/**
 * Start Hell Mode - Creates Trump boss with Droid guards
 * @param {Object} params
 * @param {Array} params.units - Current units array
 * @param {Function} params.t - Translation function
 * @param {string} params.language - Current language
 * @returns {Object} - Hell mode data
 */
export const startHellMode = ({ units, t, language }) => {
  const healedPlayerTeam = units.filter(u => u.isPlayer).map(u => ({
    ...u,
    currentHp: u.maxHp,
    currentMp: u.maxMp,
    isGuarding: u.role === 'Guardian',
    isSentinel: false,
    status: null,
    buffs: [],
    anim: null,
    totalDmgDealt: 0,
    isChanting: false,
    currentSentinelCharges: u.maxSentinelCharges
  }));

  // Create Trump (center position, index 2)
  const trumpUnit = createUnit('TRUMP', false, 'trump', {}, true, {});
  trumpUnit.name = "Donald Trump";
  trumpUnit.isTrump = true; // Flag for Guard mechanic

  // Create 4 Droids (positions 0, 1, 3, 4)
  const droidUnits = [0, 1, 3, 4].map((pos, i) => {
    const droid = createUnit('DROID', false, `droid_${i}`, {}, false, {});
    droid.name = `Droid-${i+1}`;
    droid.isDroid = true;
    droid.guardsTrump = true; // Flag for Guard mechanic
    return droid;
  });

  // Assemble enemy team: [Droid, Droid, Trump, Droid, Droid]
  const enemyTeam = [
    droidUnits[0],
    droidUnits[1],
    trumpUnit,
    droidUnits[2],
    droidUnits[3]
  ];

  const allUnits = [...healedPlayerTeam, ...enemyTeam];
  const initialQueue = [...allUnits].sort((a, b) => b.spd - a.spd).map(u => u.id);

  return {
    units: allUnits,
    turnQueue: initialQueue,
    currentActorId: initialQueue[0],
    battleLog: [t('hellModeActivated', language), t('defeatTrump', language)],
    lastEnemyKeys: ['DROID', 'DROID', 'TRUMP', 'DROID', 'DROID']
  };
};
