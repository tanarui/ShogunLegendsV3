import { useCallback } from 'react';
import { getEffectiveStats } from '../utils/unitUtils.js';
import { getHeroName, getSkillName, t } from '../modules/translations.js';

/**
 * Custom hook for battle logic
 */
export const useBattleLogic = ({
  units,
  unitsRef,
  turnQueueRef,
  isHellMode,
  language,
  setUnits,
  setBattleLog,
  setScreenShake,
  setPhase,
  setIsPlayerDemoralized,
  setTurnQueue,
  setCurrentActorId,
  setSelectedAction,
  setProcessing,
  setBattleStats,
  setTurnToken
}) => {

  const triggerAnim = useCallback((id, type) => {
    setUnits(prev => prev.map(u => u.id === id ? { ...u, anim: type } : u));
    setTimeout(() => {
      setUnits(prev => prev.map(u => u.id === id ? { ...u, anim: null } : u));
    }, 600);
  }, [setUnits]);

  const applyDamage = useCallback((source, target, rawDmg) => {
    const currentUnits = unitsRef.current;
    
    // Hell Mode: Droids guard attacks on Trump
    if (isHellMode && target.isTrump && source.isPlayer) {
      const aliveDroids = currentUnits.filter(u => u.isDroid && u.currentHp > 0 && u.guardsTrump);
      if (aliveDroids.length > 0) {
        const guardingDroid = aliveDroids[Math.floor(Math.random() * aliveDroids.length)];
        setBattleLog(prev => [...prev, `🛡️ ${guardingDroid.mbti ? getHeroName(guardingDroid.mbti, language) : guardingDroid.name} ${t('interceptsAttack', language)}`]);
        
        const droidDmg = Math.floor(rawDmg * 0.8);
        const freshDroid = currentUnits.find(u => u.id === guardingDroid.id);
        const newDroidHp = Math.max(0, freshDroid.currentHp - droidDmg);
        
        setUnits(prev => prev.map(u => 
          u.id === guardingDroid.id 
            ? { ...u, currentHp: newDroidHp, anim: 'slash' }
            : u
        ));
        
        setTimeout(() => setUnits(prev => prev.map(u => u.id === guardingDroid.id ? { ...u, anim: null } : u)), 500);
        
        if (newDroidHp <= 0) {
          setBattleLog(prev => [...prev, `${guardingDroid.mbti ? getHeroName(guardingDroid.mbti, language) : guardingDroid.name} ${t('isDestroyed', language)}`]);
        }
        
        return { dmg: droidDmg, killed: newDroidHp <= 0 };
      }
    }

    let finalDmg = rawDmg;

    const allies = currentUnits.filter(u => u.isPlayer === target.isPlayer);
    const idx = allies.findIndex(u => u.id === target.id);
    let guarded = false;
    const neighbors = [];
    if (idx > 0) neighbors.push(allies[idx-1]);
    if (idx < allies.length - 1) neighbors.push(allies[idx+1]);
    neighbors.forEach(n => { if (n.role === 'Guardian' && n.isGuarding && n.currentHp > 0) guarded = true; });

    // Duelist Weakness Logic
    if (target.role === 'Duelist' && (source.role === 'Guardian' || source.role === 'Tactician')) {
      finalDmg = Math.floor(finalDmg * 1.5);
    }
    if (source.role === 'Duelist' && target.role === 'Warlord') {
      finalDmg = Math.floor(finalDmg * 0.7);
    }

    if (target.isSentinel) { }
    else if (target.isGuarding) finalDmg *= 0.5;
    else if (guarded) finalDmg *= 0.6;

    finalDmg = Math.floor(finalDmg);
    if (finalDmg < 1) finalDmg = 1;

    const freshTarget = unitsRef.current.find(u => u.id === target.id);
    const newHp = Math.max(0, freshTarget.currentHp - finalDmg);
    const isDead = newHp <= 0;
    const isLeaderDeath = isDead && freshTarget.isLeader;

    // Trigger screen shake for impactful damage or death
    if (finalDmg > 20 || isDead) {
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 200);
    }

    setUnits(prev => {
      let newUnits = prev.map(u => {
        if (u.id === target.id) {
          return {
            ...u,
            currentHp: newHp,
            isSentinel: isDead ? false : false,
            isGuarding: isDead ? false : u.isGuarding,
            isChanting: isDead ? false : u.isChanting,
            anim: 'shake'
          };
        }
        if (u.id === source.id) return { ...u, totalDmgDealt: u.totalDmgDealt + finalDmg };
        return u;
      });

      if (isLeaderDeath) {
        newUnits = newUnits.map(u => {
          if (u.isPlayer === freshTarget.isPlayer && u.currentHp > 0) {
            return { ...u, atk: Math.max(1, u.atk - 15), def: Math.max(0, u.def - 15), anim: 'shake' };
          }
          return u;
        });
      }
      return newUnits;
    });

    if (isLeaderDeath) {
      setBattleLog(p => [...p, `${t('leaderFallen', language)} ${freshTarget.mbti ? getHeroName(freshTarget.mbti, language) : freshTarget.name}${t('armyDemoralized', language)}`]);
      if (freshTarget.isPlayer) setIsPlayerDemoralized(true);
    }

    setTimeout(() => setUnits(prev => prev.map(u => u.id === target.id ? { ...u, anim: null } : u)), 500);
    return { dmg: finalDmg, killed: isDead };
  }, [unitsRef, isHellMode, language, setUnits, setBattleLog, setScreenShake, setIsPlayerDemoralized]);

  const nextTurn = useCallback((forceActorId = null) => {
    const currentUnits = unitsRef.current;

    // Check Victory
    const pAlive = currentUnits.filter(u => u.isPlayer && u.currentHp > 0).length;
    const eAlive = currentUnits.filter(u => !u.isPlayer && u.currentHp > 0).length;
    if (pAlive === 0) { setPhase('defeat'); return; }
    if (eAlive === 0) { setPhase('victory'); return; }

    if (forceActorId) {
      setCurrentActorId(forceActorId);
      setProcessing(false);
      setSelectedAction(null);
      setTurnToken(prev => prev + 1);
      return;
    }
    
    setBattleStats(prev => ({ ...prev, turns: prev.turns + 1 }));

    let newQueue = [...turnQueueRef.current];
    const finished = newQueue.shift();
    if (currentUnits.find(u => u.id === finished && u.currentHp > 0)) newQueue.push(finished);

    newQueue = newQueue.filter(uid => {
      const u = currentUnits.find(unit => unit.id === uid);
      return u && u.currentHp > 0;
    });

    if(newQueue.length === 0) {
      newQueue = currentUnits.filter(u => u.currentHp > 0).sort((a,b) => b.spd - a.spd).map(u => u.id);
    }

    setTurnQueue(newQueue);
    setCurrentActorId(newQueue[0]);
    setSelectedAction(null);
    setProcessing(false);
    setTurnToken(prev => prev + 1);

    // Clear Guard/Status for NEW actor
    setUnits(prev => prev.map(u => u.id === newQueue[0] ? {
      ...u,
      isGuarding: false,
      hasHyped: false,
      status: u.status === 'taunt' ? null : u.status
    } : u));
  }, [unitsRef, turnQueueRef, setPhase, setCurrentActorId, setProcessing, setSelectedAction, setTurnToken, setBattleStats, setTurnQueue, setUnits]);

  const executeAttack = useCallback((actor, target) => {
    if (!actor || !target) {
      console.error('executeAttack called with invalid actor or target:', { actor, target });
      return;
    }
    
    setUnits(prev => prev.map(u => u.id === actor.id ? { ...u, anim: 'slash' } : u));
    setTimeout(() => setUnits(prev => prev.map(u => u.id === actor.id ? { ...u, anim: null } : u)), 500);

    const effStats = getEffectiveStats(actor);
    const targetEff = getEffectiveStats(target);
    const dmg = (effStats.atk * (0.9 + Math.random() * 0.2)) - (targetEff.def * 0.4);

    const res = applyDamage(actor, target, dmg);
    setBattleLog(p => [...p, `${actor.mbti ? getHeroName(actor.mbti, language) : actor.name} ${t('attacksFor', language)} ${target.mbti ? getHeroName(target.mbti, language) : target.name} ${t('attacksForDmg', language)} ${res.dmg}${t('damage', language)}`]);

    // Counter
    if (!res.killed && target.role === 'Warlord') {
      setTimeout(() => {
        const freshTarget = unitsRef.current.find(u => u.id === target.id);
        const freshActor = unitsRef.current.find(u => u.id === actor.id);
        if (freshTarget && freshTarget.currentHp > 0 && freshActor && freshActor.currentHp > 0) {
          const tStats = getEffectiveStats(freshTarget);
          const aStats = getEffectiveStats(freshActor);
          const counterDmg = Math.max(1, Math.floor((tStats.atk * 0.7) - (aStats.def * 0.4)));
          setBattleLog(p => [...p, `${t('counters', language)} ${freshTarget.mbti ? getHeroName(freshTarget.mbti, language) : freshTarget.name} ${t('countersExclamation', language)}`]);
          triggerAnim(freshTarget.id, 'slash');
          applyDamage(freshTarget, freshActor, counterDmg);
          setTurnToken(prev => prev + 1);
        }
      }, 600);
    }

    const currentUnits = unitsRef.current;
    const enemiesAlive = currentUnits.filter(u => u.isPlayer !== actor.isPlayer && u.id !== target.id && u.currentHp > 0).length;

    if (res.killed && enemiesAlive === 0) {
      setPhase(actor.isPlayer ? 'victory' : 'defeat');
      return;
    }

    if (res.killed && !actor.hasHyped && enemiesAlive > 0) {
      setBattleLog(p => [...p, `${t('hypeAttacksAgain', language)} ${actor.mbti ? getHeroName(actor.mbti, language) : actor.name} ${t('attacksAgain', language)}`]);
      setUnits(prev => prev.map(u => u.id === actor.id ? { ...u, hasHyped: true } : u));
      setTimeout(() => nextTurn(actor.id), 1200);
    } else {
      setTimeout(nextTurn, 1200);
    }
  }, [setUnits, applyDamage, setBattleLog, language, unitsRef, triggerAnim, setTurnToken, setPhase, nextTurn]);

  const runAI = useCallback((actor, executeSkill) => {
    if (!actor) {
      console.error('runAI called with undefined actor');
      return;
    }
    
    const currentUnits = unitsRef.current;
    // Verify actor still exists in current units
    const currentActor = currentUnits.find(u => u.id === actor.id);
    if (!currentActor || currentActor.currentHp <= 0) {
      console.warn('runAI: Actor not found or dead in current units:', actor.id);
      setTimeout(nextTurn, 600);
      return;
    }
    
    // Use current actor from units array to ensure we have latest data
    const activeActor = currentActor;
    const targets = currentUnits.filter(u => u.isPlayer !== activeActor.isPlayer && u.currentHp > 0);
    const sentinels = targets.filter(t => t.isSentinel);

    // Check if there are any valid targets
    if (targets.length === 0) {
      console.warn('runAI: No valid targets found for actor:', activeActor);
      // Check if this means victory/defeat condition
      const enemiesAlive = currentUnits.filter(u => u.isPlayer !== activeActor.isPlayer && u.currentHp > 0).length;
      const playersAlive = currentUnits.filter(u => u.isPlayer === activeActor.isPlayer && u.currentHp > 0).length;
      
      console.log('runAI: Battle state check:', { 
        enemiesAlive, 
        playersAlive, 
        actorIsPlayer: activeActor.isPlayer,
        totalUnits: currentUnits.length,
        allUnits: currentUnits.map(u => ({ id: u.id, name: u.name, isPlayer: u.isPlayer, currentHp: u.currentHp }))
      });
      
      // If no enemies alive, player wins; if no players alive, player loses
      if (enemiesAlive === 0) {
        console.log('runAI: All enemies defeated - Victory!');
        setPhase('victory');
        return;
      } else if (playersAlive === 0) {
        console.log('runAI: All players defeated - Defeat!');
        setPhase('defeat');
        return;
      }
      
      // This shouldn't happen - if we have no targets but enemies are still alive, there's a logic issue
      console.error('runAI: No targets found but enemies still alive - this should not happen');
      // Force a victory/defeat check via nextTurn
      setTimeout(() => {
        nextTurn();
      }, 600);
      return;
    }

    let move = 'attack';
    let target = null;

    if (activeActor.role === 'Guardian' && !activeActor.isSentinel && activeActor.currentSentinelCharges > 0 && Math.random() > 0.25) {
      move = 'defend';
    } else if (activeActor.currentMp >= activeActor.skillCost && Math.random() > 0.6) {
      move = 'skill';
      target = targets[Math.floor(Math.random() * targets.length)];
    } else {
      move = 'attack';
      if (sentinels.length > 0) {
        target = sentinels[0];
      } else {
        target = targets[Math.floor(Math.random() * targets.length)];
      }
    }

    // Validate target before proceeding
    if ((move === 'attack' || move === 'skill') && !target) {
      console.error('runAI: No target selected for', move, 'action. Actor:', activeActor, 'Targets:', targets);
      setTimeout(nextTurn, 600);
      return;
    }

    if (move === 'defend') {
      const isGuardian = activeActor.role === 'Guardian';
      let activatesSentinel = false;
      let newCharges = activeActor.currentSentinelCharges;
      if (isGuardian && activeActor.currentSentinelCharges > 0) {
        activatesSentinel = true;
        newCharges -= 1;
      }
      setUnits(prev => prev.map(u => u.id === activeActor.id ? {
        ...u,
        isGuarding: true,
        isSentinel: activatesSentinel,
        currentSentinelCharges: newCharges,
        currentMp: Math.min(u.maxMp, u.currentMp + 15)
      } : u));
      const msg = activatesSentinel ? `${activeActor.name} enters Sentinel Stance!` : `${activeActor.name} takes a defensive stance.`;
      setBattleLog(prev => [...prev, msg]);
      setTimeout(nextTurn, 600);
    } else if (move === 'skill') {
      if (!target) {
        console.error('runAI: Skill move selected but no target available');
        setTimeout(nextTurn, 600);
        return;
      }
      if (executeSkill) {
        executeSkill(activeActor, target);
      } else {
        // Return action for parent to handle
        return { action: 'skill', actor: activeActor, target };
      }
    } else {
      if (!target) {
        console.error('runAI: Attack move selected but no target available');
        setTimeout(nextTurn, 600);
        return;
      }
      executeAttack(activeActor, target);
    }
  }, [unitsRef, setUnits, setBattleLog, nextTurn, executeAttack]);

  const executeSkillEffect = useCallback((actor, skillName, target) => {
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

    const currentUnits = unitsRef.current;
    const enemiesAlive = currentUnits.filter(u =>
      u.isPlayer !== actor.isPlayer &&
      u.currentHp > 0 &&
      (u.id !== target.id || !killed)
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
  }, [applyDamage, setUnits, setBattleLog, setPhase, nextTurn, unitsRef, setTurnQueue, language]);

  const executeSkill = useCallback((actor, target) => {
    setUnits(prev => prev.map(u => u.id === actor.id ? { ...u, currentMp: u.currentMp - actor.skillCost } : u));
    executeSkillEffect(actor, actor.skillName, target);
    setTimeout(nextTurn, 1000);
  }, [setUnits, executeSkillEffect, nextTurn]);

  const handleAction = useCallback((type, targetId, units, currentActorId) => {
    const actor = units.find(u => u.id === currentActorId);

    if (type === 'defend') {
      setProcessing(true);
      const isGuardian = actor.role === 'Guardian';
      let activatesSentinel = false;
      let newCharges = actor.currentSentinelCharges;

      if (isGuardian && actor.currentSentinelCharges > 0) {
        activatesSentinel = true;
        newCharges -= 1;
      }

      setUnits(prev => prev.map(u => u.id === actor.id ? {
        ...u,
        isGuarding: true,
        isSentinel: activatesSentinel,
        currentSentinelCharges: newCharges,
        currentMp: Math.min(u.maxMp, u.currentMp + 15)
      } : u));

      const msg = activatesSentinel
        ? `${actor.name} enters Sentinel Stance! (${newCharges} left)`
        : `${actor.name} takes a defensive stance.`;
      setBattleLog(prev => [...prev, msg]);
      setTimeout(nextTurn, 600);
      return;
    }

    if (!targetId) { setSelectedAction(type); return; }

    const target = units.find(u => u.id === targetId);
    setProcessing(true);
    if (type === 'attack') executeAttack(actor, target);
    if (type === 'skill') executeSkill(actor, target);
  }, [setProcessing, setUnits, setBattleLog, nextTurn, setSelectedAction, executeAttack, executeSkill]);

  return {
    triggerAnim,
    applyDamage,
    nextTurn,
    executeAttack,
    executeSkill,
    executeSkillEffect,
    runAI,
    handleAction
  };
};
