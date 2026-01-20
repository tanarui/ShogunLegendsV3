import React from 'react';
import { 
  Sword, Shield, Zap, Skull, Star, Crown, Heart, Flame, 
  TrendingUp, TrendingDown, Hourglass, Target 
} from 'lucide-react';
import { getRoleColor } from '../utils/gameUtils';
import { getHeroName } from '../modules/translations';
import { getEffectiveStats } from '../utils/unitUtils';

const getRoleIcon = (role) => {
  switch(role) {
    case 'Guardian': return <Shield size={14} className={getRoleColor(role, false)} />;
    case 'Tactician': return <Star size={14} className={getRoleColor(role, false)} />;
    case 'Duelist': return <Zap size={14} className={getRoleColor(role, false)} />;
    default: return <Sword size={14} className={getRoleColor(role, false)} />;
  }
};

const UnitCard = ({ unit, onClick, currentActorId, selectedAction, processing, units, showAura = false, activeUnit = null, language }) => {
  if(!unit) return <div className="w-1/5"></div>;
  const isActor = unit.id === currentActorId;

  // Sentinel Locking
  const isEnemy = !unit.isPlayer;
  const activeSentinel = units.find(u => !u.isPlayer && u.isSentinel && u.currentHp > 0);
  const isLocked = selectedAction === 'attack' && !processing && activeSentinel && isEnemy && unit.id !== activeSentinel.id;
  const isTargetable = selectedAction && !processing && !isLocked;

  const isDead = unit.currentHp <= 0;
  const hpRatio = unit.currentHp / unit.maxHp;

  const allies = units.filter(u => u.isPlayer === unit.isPlayer);
  const idx = allies.findIndex(u => u.id === unit.id);
  const protectedByGuard = !unit.isGuarding && !isDead && (
     (idx > 0 && allies[idx-1].isGuarding && allies[idx-1].role === 'Guardian' && allies[idx-1].currentHp > 0) ||
     (idx < allies.length-1 && allies[idx+1].isGuarding && allies[idx+1].role === 'Guardian' && allies[idx+1].currentHp > 0)
  );

  // Calculate if attack would kill this enemy unit
  let wouldKill = false;
  if (selectedAction === 'attack' && activeUnit && activeUnit.isPlayer && isEnemy && !isDead && !processing) {
    const actorStats = getEffectiveStats(activeUnit);
    const targetStats = getEffectiveStats(unit);
    
    // Calculate base damage (using average multiplier 1.0 instead of random 0.9-1.1)
    let rawDmg = (actorStats.atk * 1.0) - (targetStats.def * 0.4);
    
    // Apply role-based multipliers
    if (unit.role === 'Duelist' && (activeUnit.role === 'Guardian' || activeUnit.role === 'Tactician')) {
      rawDmg = Math.floor(rawDmg * 1.5);
    }
    if (activeUnit.role === 'Duelist' && unit.role === 'Warlord') {
      rawDmg = Math.floor(rawDmg * 0.7);
    }
    
    // Apply guard/sentinel reductions
    if (unit.isSentinel) {
      // Sentinel takes no reduction (already handled in getEffectiveStats)
    } else if (unit.isGuarding) {
      rawDmg *= 0.5;
    } else if (protectedByGuard) {
      rawDmg *= 0.6;
    }
    
    const finalDmg = Math.max(1, Math.floor(rawDmg));
    wouldKill = (unit.currentHp - finalDmg) <= 0;
  }

  // Calculate Factor Resonance (Factor Impact Score)
  let factorImpact = 0;
  if (unit.factorMods) {
    factorImpact = (unit.factorMods.atk || 0) + 
                   (unit.factorMods.def || 0) + 
                   (unit.factorMods.spd || 0) + 
                   ((unit.factorMods.hp || 0) / 10) + 
                   ((unit.factorMods.mp || 0) / 10);
  }

  // Determine Aura Class based on Factor Impact (sequential animation)
  let auraClass = '';
  let auraText = '';
  if (showAura) {
    const isGreatFit = factorImpact > 15;
    const isGoodFit = factorImpact > 0;
    const isBadFit = factorImpact < -5;

    if (isGreatFit) {
      auraClass = 'shadow-[0_0_15px_rgba(250,204,21,0.8)] border-yellow-400 ring-1 ring-yellow-300';
      auraText = 'Up';
    } else if (isGoodFit) {
      auraClass = 'shadow-[0_0_10px_rgba(52,211,153,0.5)] border-emerald-400';
      auraText = 'Up';
    } else if (isBadFit) {
      auraClass = 'shadow-none border-red-900 opacity-90';
      auraText = 'Dwn';
    } else {
      // Neutral - no aura but might want to show something
      auraText = '';
    }
  }

  return (
    <div
      onClick={isLocked ? undefined : onClick}
      className={`
         relative w-1/5 ${unit.isPlayer && unit.factorMods && (unit.factorMods.hp !== 0 || unit.factorMods.atk !== 0 || unit.factorMods.def !== 0 || unit.factorMods.spd !== 0 || unit.factorMods.mp !== 0) ? 'h-36' : 'h-28'} border md:border-2 rounded flex flex-col items-center justify-between p-1 transition-all duration-500 select-none
         ${unit.isPlayer ? 'bg-slate-900 border-blue-900' : 'bg-slate-800 border-red-900'}
         ${isActor ? 'ring-2 ring-yellow-400 scale-105 z-10 shadow-lg' : ''}
         ${isTargetable ? 'cursor-pointer hover:bg-slate-700 hover:border-white animate-pulse' : ''}
         ${isLocked ? 'opacity-30 cursor-not-allowed grayscale' : ''}
         ${isDead ? 'opacity-20 grayscale' : ''}
         ${unit.anim === 'shake' ? 'animate-bounce text-red-500' : ''}
         ${unit.status === 'stun' ? 'ring-2 ring-yellow-300' : ''}
         ${unit.isSentinel ? 'ring-2 ring-orange-500' : ''}
         ${auraClass}
      `}
    >
      {unit.isChanting && <div className="absolute top-1 right-1 z-20"><Hourglass size={14} className="text-purple-400 animate-spin"/></div>}
      {unit.isSentinel && <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 text-orange-500 bg-black rounded-full p-1 border border-orange-500"><Target size={16} className="animate-ping"/></div>}

      {wouldKill && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 bg-red-900/90 border-2 border-red-500 rounded-full px-2 py-0.5 flex items-center gap-1 animate-pulse">
              <Skull size={12} className="text-red-400"/>
              <span className="text-[8px] font-bold text-red-200">KILL</span>
          </div>
      )}
      {unit.isDemonLord ? (
          <div className="absolute -top-3 right-0 z-20 text-red-500"><Skull size={16} fill="currentColor"/></div>
      ) : unit.isLeader && (
          <div className="absolute -top-3 right-0 z-20 text-yellow-400"><Crown size={16} fill="currentColor"/></div>
      )}

      {unit.role === 'Guardian' && (
          <div className="absolute top-1 left-1 flex gap-0.5">
              {Array(unit.maxSentinelCharges).fill(0).map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < unit.currentSentinelCharges ? 'bg-blue-400' : 'bg-gray-700'}`}></div>
              ))}
          </div>
      )}

      {unit.anim === 'slash' && <div className="absolute inset-0 flex items-center justify-center text-4xl z-20 animate-ping">⚔️</div>}
      {unit.anim === 'heal' && <div className="absolute inset-0 flex items-center justify-center text-4xl z-20 animate-bounce">💚</div>}
      {unit.anim === 'buff' && <div className="absolute inset-0 flex items-center justify-center text-4xl z-20 animate-pulse">⬆️</div>}

      <div className="flex w-full justify-between items-start text-[10px]">
         {getRoleIcon(unit.role)}
         {unit.hasHyped && <Flame size={12} className="text-orange-500 animate-pulse"/>}
      </div>

      <div className="text-center w-full overflow-hidden relative">
          <div className="text-[9px] md:text-[10px] font-bold truncate leading-tight text-white flex items-center justify-center gap-1">
            {unit.mbti ? (unit.name.startsWith('Elite ') ? `Elite ${getHeroName(unit.mbti, language)}` : unit.name.startsWith('👹 ') ? `👹 ${getHeroName(unit.mbti, language)}` : getHeroName(unit.mbti, language)) : unit.name}
            {showAura && factorImpact > 15 && <span className="text-yellow-400 animate-pulse" title="In the Zone - Great Factor Resonance">⚡</span>}
          </div>
          {/* Aura Stat Text - Shows temporarily during sequential animation */}
          {showAura && auraText && (
            <div className={`absolute -top-6 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse ${
              auraText === 'Up' ? 'bg-green-500/90 text-white border-2 border-green-300' : 'bg-red-500/90 text-white border-2 border-red-300'
            }`}>
              {auraText}
            </div>
          )}
          {unit.isGuarding && <Shield size={12} className="text-blue-400 inline"/>}
          {protectedByGuard && <div className="text-[8px] text-blue-300">🛡️ Guarded</div>}
          {unit.status === 'stun' && <div className="text-[8px] bg-yellow-500 text-black px-1 rounded inline-block">STUN</div>}
      </div>

      <div className="w-full flex justify-center gap-1 text-[8px] mt-1 text-gray-400">
          {hpRatio < 0.5 && <TrendingDown size={10} className="text-red-500"/>}
          {unit.buffs.length > 0 && <TrendingUp size={10} className="text-green-500"/>}
      </div>

      <div className="w-full space-y-0.5">
          <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
              <div className={`h-full ${hpRatio < 0.3 ? 'bg-red-500' : (hpRatio < 0.6 ? 'bg-yellow-500' : 'bg-green-500')}`} style={{width: `${hpRatio*100}%`}}></div>
          </div>
          <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full" style={{width: `${(unit.currentMp/unit.maxMp)*100}%`}}></div>
          </div>
          <div className="text-[8px] text-center text-gray-400">
            {unit.currentHp}/{unit.maxHp}
          </div>
          
          {/* Stats Display with Omyo Impact */}
          {unit.baseAtk !== undefined && (
            <div className="mt-1 space-y-0.5 text-[7px] text-left">
              <div className="flex items-center gap-1">
                <span className="text-gray-400">ATK:</span>
                <span className="text-white font-bold">{unit.baseAtk}</span>
                {unit.factorMods && unit.factorMods.atk !== 0 && (
                  <span className={`${unit.factorMods.atk > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {unit.factorMods.atk > 0 ? '+' : ''}{unit.factorMods.atk}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">DEF:</span>
                <span className="text-white font-bold">{unit.baseDef}</span>
                {unit.factorMods && unit.factorMods.def !== 0 && (
                  <span className={`${unit.factorMods.def > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {unit.factorMods.def > 0 ? '+' : ''}{unit.factorMods.def}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">SPD:</span>
                <span className="text-white font-bold">{unit.baseSpd}</span>
                {unit.factorMods && unit.factorMods.spd !== 0 && (
                  <span className={`${unit.factorMods.spd > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {unit.factorMods.spd > 0 ? '+' : ''}{unit.factorMods.spd}
                  </span>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default UnitCard;
