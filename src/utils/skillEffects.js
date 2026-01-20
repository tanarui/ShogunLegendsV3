import { getEffectiveStats } from './unitUtils.js';
import { getHeroName, getSkillName, t } from '../modules/translations.js';

/**
 * Execute skill effects
 */
export const executeSkillEffect = ({
  actor,
  skillName,
  target,
  unitsRef,
  language,
  setUnits,
  setBattleLog,
  setPhase,
  setTurnQueue,
  applyDamage,
  nextTurn
}) => {
  const actorName = actor.mbti ? getHeroName(actor.mbti, language) : actor.name;
  const translatedSkillName = actor.mbti ? getSkillName(actor.mbti, language) : skillName;
  let log = `${actorName}: ${translatedSkillName}!`;
  let killed = false;
  const effStats = getEffectiveStats(actor);
  const targetEff = target ? getEffectiveStats(target) : {};

  if (["Tenka Fubu", "Death Charge", "Dragon Roar", "Assassinate", "Bishamonten"].includes(skillName)) {
    if(!target) return;
    setUnits(prev => prev.map(u => u.id === target.id ? { ...u, anim: 'slash' } : u));
    let mult = 1.8;
    if (skillName === "Assassinate") mult = 2.2;
    const targetDef = (skillName === "Assassinate" || skillName === "Bishamonten") ? 0 : targetEff.def;
    const res = applyDamage(actor, target, (effStats.atk * mult) - (targetDef * 0.3));
    log += ` ${t('hitFor', language)} ${res.dmg}${t('damage', language)}`;
    killed = res.killed;
  }
  else if (skillName === "Two Heavens") {
    if(!target) return;
    setUnits(prev => prev.map(u => u.id === target.id ? { ...u, anim: 'slash' } : u));
    const hit1 = applyDamage(actor, target, (effStats.atk * 0.7) - (targetEff.def * 0.3));
    const hit2 = applyDamage(actor, target, (effStats.atk * 0.7) - (targetEff.def * 0.3));
    log += ` ${t('doubleSlash', language)}`;
    killed = hit1.killed || hit2.killed;
  }
  else if (skillName === "Honno-ji Fire") {
    const enemies = unitsRef.current.filter(u => u.isPlayer !== actor.isPlayer && u.currentHp > 0);
    let killCount = 0;
    enemies.forEach(e => {
      const res = applyDamage(actor, e, 25);
      if(res.killed) { killed = true; killCount++; }
    });
    log += ` ${t('burnsAllEnemies', language)}`;
    if (killCount === enemies.length) { setPhase(actor.isPlayer ? 'victory' : 'defeat'); return; }
  }
  else if (skillName === "Make America Great Again") {
    const playerUnits = unitsRef.current.filter(u => u.isPlayer && u.currentHp > 0);
    let killCount = 0;
    playerUnits.forEach(p => {
      const res = applyDamage(actor, p, 40);
      if(res.killed) { killCount++; }
    });
    setUnits(prev => prev.map(u => {
      if (u.id === actor.id && u.currentHp > 0) {
        return { ...u, currentHp: Math.min(u.maxHp, u.currentHp + 30), anim: 'heal' };
      }
      return u;
    }));
    log += ` ${t('dmgToAllEnemies', language)}`;
    if (killCount === playerUnits.length) { setPhase('defeat'); return; }
  }
  else if (["Sunomata", "Furinkazan", "Dragon Roar", "Great Peace", "Matsuri Beat"].includes(skillName)) {
    const stat = ["Sunomata", "Dragon Roar"].includes(skillName) ? 'atk' : (skillName === "Matsuri Beat" ? 'spd' : 'def');
    const BUFF_AMT = 5;

    setUnits(prev => {
      let newUnits = prev.map(u => {
        if (u.isPlayer === actor.isPlayer) {
          let newBuffs = [...u.buffs, stat];
          let currentVal = u[stat];
          if (newBuffs.length > 5) {
            const removed = newBuffs.shift();
            if (['atk','def','spd'].includes(removed)) currentVal -= 5;
          }
          return { ...u, [stat]: currentVal + BUFF_AMT, buffs: newBuffs, anim: 'buff' };
        }
        return u;
      });
      if (stat === 'spd') {
        unitsRef.current = newUnits;
      }
      return newUnits;
    });

    if (stat === 'spd') {
      setTimeout(() => {
        setTurnQueue(prev => {
          const waiting = prev.filter(id => id !== actor.id);
          const sortedWaiting = waiting.sort((a,b) => {
            const ua = unitsRef.current.find(u=>u.id===a);
            const ub = unitsRef.current.find(u=>u.id===b);
            return (ub?.spd || 0) - (ua?.spd || 0);
          });
          const actorUnit = unitsRef.current.find(u => u.id === actor.id);
          const actorSpd = actorUnit?.spd || 0;
          let insertIndex = sortedWaiting.findIndex(id => {
            const u = unitsRef.current.find(unit => unit.id === id);
            return (u?.spd || 0) < actorSpd;
          });
          if (insertIndex === -1) insertIndex = sortedWaiting.length;
          sortedWaiting.splice(insertIndex, 0, actor.id);
          return sortedWaiting;
        });
      }, 100);
    }
    log += ` ${t('armyUp', language)} ${stat.toUpperCase()} ${t('up', language)}`;
  }
  else if (["Supply Lines", "Mother's Love", "Kamakura Law"].includes(skillName)) {
    const isTeam = skillName !== "Kamakura Law";
    setUnits(prev => prev.map(u => {
      if (u.isPlayer === actor.isPlayer && (isTeam || u.id === actor.id) && u.currentHp > 0) {
        return { ...u, currentHp: Math.min(u.maxHp, u.currentHp + 30), anim: 'heal' };
      }
      return u;
    }));
    log += ` ${t('vitalityRestored', language)}`;
  }
  else if (skillName === "Wabi-Sabi") {
    setUnits(prev => prev.map(u => {
      if (u.isPlayer === actor.isPlayer && u.currentHp > 0) {
        return {
          ...u,
          currentHp: Math.min(u.maxHp, u.currentHp + 25),
          currentMp: Math.min(u.maxMp, u.currentMp + 15),
          anim: 'heal'
        };
      }
      return u;
    }));
    log += ` ${t('teaCalms', language)}`;
  }
  else if (skillName === "Eight Gates") {
    if(target) {
      setUnits(prev => prev.map(u => u.id === target.id ? { ...u, status: 'stun', anim: 'shake' } : u));
      const targetName = target.mbti ? getHeroName(target.mbti, language) : target.name;
      log += ` ${t('stunned', language)} ${targetName}${language === 'ja' ? '！' : '!'}`;
    }
  }

  setBattleLog(p => [...p, log]);
  setTimeout(() => setUnits(prev => prev.map(u => ({ ...u, anim: null }))), 600);

  // Victory Check for Skills
  const currentUnits = unitsRef.current;
  const enemiesAlive = currentUnits.filter(u =>
    u.isPlayer !== actor.isPlayer &&
    u.currentHp > 0 &&
    (u.id !== target?.id || !killed)
  ).length;

  if (killed && enemiesAlive === 0) {
    setPhase(actor.isPlayer ? 'victory' : 'defeat');
    return;
  }

  if (killed && !actor.hasHyped && enemiesAlive > 0) {
    setUnits(prev => prev.map(u => u.id === actor.id ? { ...u, hasHyped: true } : u));
    setTimeout(() => nextTurn(actor.id), 1200);
  } else {
    setTimeout(nextTurn, 1000);
  }
};
