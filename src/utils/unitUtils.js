// Unit creation and management utilities

import { CHARACTERS } from '../data/gameData.js';

export const createUnit = (mbtiKey, isPlayer, idOverride, waStats = {}, isLeader = false, factorMods = {}) => {
  const template = CHARACTERS[mbtiKey];

  // Sentinel Charges logic
  const isGuardian = template.role === 'Guardian';
  const isTokugawa = template.name.includes("Tokugawa");
  const maxSentinelCharges = isGuardian ? (isTokugawa ? 3 : 2) : 0;

  // Calculate base stats (before factor mods, but after Wa bonuses)
  const baseHp = template.hp + (waStats.hp || 0);
  const baseAtk = template.atk + (waStats.atk || 0);
  const baseDef = template.def + (waStats.def || 0);
  const baseSpd = template.spd;
  const baseMp = template.mp;

  // Apply factor modifications
  const finalHp = Math.max(1, baseHp + (factorMods.hp || 0));
  const finalAtk = Math.max(1, baseAtk + (factorMods.atk || 0));
  const finalDef = Math.max(0, baseDef + (factorMods.def || 0));
  const finalSpd = Math.max(1, baseSpd + (factorMods.spd || 0));
  const finalMp = Math.max(0, baseMp + (factorMods.mp || 0));

  return {
    ...template,
    id: idOverride || `${isPlayer ? 'p' : 'e'}_${Math.random().toString(36).substr(2, 9)}`,
    mbti: mbtiKey,
    maxHp: finalHp,
    currentHp: finalHp,
    maxMp: finalMp,
    currentMp: finalMp,
    baseHp: baseHp, // Store base HP before factor mods
    baseMp: baseMp, // Store base MP before factor mods
    baseAtk: baseAtk, // Store base ATK before factor mods
    baseDef: baseDef, // Store base DEF before factor mods
    baseSpd: baseSpd, // Store base SPD before factor mods
    atk: finalAtk,
    def: finalDef,
    spd: finalSpd,
    isPlayer,
    isLeader,
    isDemonLord: false,
    isGuarding: false,
    isSentinel: false,
    maxSentinelCharges, // MAX
    currentSentinelCharges: maxSentinelCharges, // CURRENT
    hasHyped: false,
    status: null,
    buffs: [],
    totalDmgDealt: 0,
    anim: null,
    isChanting: false,
    factorMods // Store for display
  };
};

export const getEffectiveStats = (unit) => {
  const hpRatio = unit.currentHp / unit.maxHp;
  let multiplier = 0.5 + (0.5 * hpRatio);

  const isPerceiver = unit.mbti.endsWith('P');
  const isBerserker = unit.name.includes("Sanada");

  if (isBerserker) {
    multiplier = 1.0 + (0.5 * (1 - hpRatio));
  } else if (isPerceiver) {
    multiplier = 0.8 + (0.2 * hpRatio);
  }

  let def = Math.floor(unit.def * multiplier);

  if (unit.isSentinel) {
    def = Math.floor(def * 0.5);
  }

  return {
    atk: Math.floor(unit.atk * multiplier),
    def: def,
    spd: unit.spd,
    multiplier
  };
};

