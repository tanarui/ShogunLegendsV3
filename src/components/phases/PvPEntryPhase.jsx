import React from 'react';
import { ArrowLeft, Bot } from 'lucide-react';
import { hasProfile, loadProfile, encodeTeamHashcode, loadTeamByHashcode } from '../../modules/profile.js';
import { generateFactorReturns, applyFactorReturns } from '../../modules/factorReturns.js';
import { getWaBonus, getFactorScoresFromMBTI } from '../../utils/gameUtils.js';
import { createUnit } from '../../utils/unitUtils.js';
import { t } from '../../modules/translations.js';

const PvPEntryPhase = ({
  phase,
  language,
  pvpHashcode,
  setPvpHashcode,
  pvpPlayerHashcode,
  setPvpPlayerHashcode,
  setIsPvPMode,
  setFactorReturns,
  setUnits,
  setShowOmyoReveal,
  handleLoadProfile,
  setPhase
}) => {
  if (phase !== 'pvp_entry') return null;

  const profile = hasProfile() ? loadProfile() : null;
  const hasTeam = profile?.placedUnits && profile.placedUnits.length >= 5;

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => setPhase('intro')}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>{t('backToTitle', language)}</span>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Bot size={32} className="text-purple-400" />
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
              PvP Mode (Auto Battle)
            </h1>
          </div>
          <p className="text-slate-400 text-sm">Spectator Mode - Watch two teams battle automatically</p>
        </div>

        {/* Profile Info */}
        {hasProfile() && (
          <div className="bg-slate-800 p-4 rounded-lg mb-4">
            <div className="text-sm text-slate-300 mb-2">{t('savedProfile', language)}</div>
            <div className="text-lg font-mono text-yellow-400 mb-2">#{profile?.hashcode || 'N/A'}</div>
            {hasTeam && (() => {
              const teamHashcode = encodeTeamHashcode({
                placedUnits: profile.placedUnits,
                mbti: profile.mbti,
                factorScores: profile.factorScores
              });
              return teamHashcode ? (
                <div className="text-xs text-slate-400">
                  <div className="text-yellow-400 font-mono font-bold mt-1">
                    Team Hashcode: {teamHashcode}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Hashcode Inputs */}
        <div className="bg-slate-800 p-6 rounded-lg space-y-4">
          {/* Player Team Hashcode Input */}
          <div>
            <div className="text-xs text-slate-300 mb-2">
              Player Team Hashcode <span className="text-slate-500">(Optional - leave empty to use your profile)</span>
            </div>
            <input
              type="text"
              value={pvpPlayerHashcode || ''}
              onChange={(e) => setPvpPlayerHashcode(e.target.value)}
              placeholder="Enter player team hashcode (optional)"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm font-mono text-center focus:border-purple-500 focus:outline-none"
              maxLength={9}
            />
          </div>
          
          {/* Enemy Team Hashcode Input */}
          <div>
            <div className="text-xs text-slate-300 mb-2">{t('enterEnemyHashcode', language)}</div>
            <input
              type="text"
              value={pvpHashcode || ''}
              onChange={(e) => setPvpHashcode(e.target.value)}
              placeholder={t('enterHashcodePlaceholder', language)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm font-mono text-center focus:border-purple-500 focus:outline-none"
              maxLength={9}
            />
          </div>
          
          {/* Start Battle Button */}
          <button 
            onClick={() => {
              console.log('PvP Entry - Starting battle with hashcodes:', { 
                pvpHashcode, 
                pvpPlayerHashcode,
                pvpHashcodeType: typeof pvpHashcode,
                pvpPlayerHashcodeType: typeof pvpPlayerHashcode
              });
              
              const normalizedEnemyHashcode = (pvpHashcode || '').trim();
              if (!normalizedEnemyHashcode || normalizedEnemyHashcode.length !== 9) {
                alert('Please enter a valid enemy team hashcode (9 characters)');
                return;
              }
              
              // Declare variables in outer scope so they're accessible in setTimeout
              let playerTeamData = null;
              let enemyTeamData = null;
              
              // If player hashcode is provided, validate it
              const normalizedPlayerHashcode = (pvpPlayerHashcode || '').trim();
              if (normalizedPlayerHashcode) {
                if (normalizedPlayerHashcode.length !== 9) {
                  alert('Player team hashcode must be 9 characters');
                  return;
                }
                
                // Validate player team hashcode
                playerTeamData = loadTeamByHashcode(normalizedPlayerHashcode);
                console.log('Loading player team hashcode:', normalizedPlayerHashcode, 'Result:', playerTeamData);
                if (!playerTeamData || !playerTeamData.placedUnits || playerTeamData.placedUnits.length < 5) {
                  alert(`Invalid player team hashcode: "${normalizedPlayerHashcode}"`);
                  return;
                }
              }
              
              // Validate enemy team hashcode
              enemyTeamData = loadTeamByHashcode(normalizedEnemyHashcode);
              console.log('Decoding enemy hashcode:', normalizedEnemyHashcode, 'Result:', enemyTeamData);
              if (!enemyTeamData || !enemyTeamData.placedUnits || enemyTeamData.placedUnits.length < 5) {
                alert(`${t('invalidHashcode', language)}: "${normalizedEnemyHashcode}"`);
                return;
              }
              
              // If player hashcode is provided, use it; otherwise use profile
              if (normalizedPlayerHashcode && playerTeamData) {
                setIsPvPMode(true);
                setPvpHashcode(normalizedEnemyHashcode);
                setPvpPlayerHashcode(normalizedPlayerHashcode);
                // Use setTimeout to ensure state is updated before proceeding
                setTimeout(() => {
                  // Generate factor returns for PvP battle
                  const returns = generateFactorReturns();
                  setFactorReturns(returns);
                  
                  // Create player units from hashcode
                  const sortedPlayerTeam = [...playerTeamData.placedUnits].sort((a, b) => a.coreX - b.coreX);
                  const myBattleUnits = sortedPlayerTeam.map(u => {
                    const wa = getWaBonus(playerTeamData.mbti, u.mbti);
                    const heroFactorScores = getFactorScoresFromMBTI(u.mbti);
                    const factorMods = returns ? applyFactorReturns(u, returns, heroFactorScores) : {};
                    const unit = createUnit(u.mbti, true, null, wa.stats, u.isLeader, factorMods);
                    if (unit.role === 'Guardian') unit.isGuarding = true;
                    return unit;
                  });
                  
                  // Create enemy units from hashcode
                  const sortedEnemyTeam = [...enemyTeamData.placedUnits].sort((a, b) => a.coreX - b.coreX);
                  const enemies = sortedEnemyTeam.map((u, i) => {
                    const wa = getWaBonus(enemyTeamData.mbti, u.mbti);
                    const heroFactorScores = getFactorScoresFromMBTI(u.mbti);
                    const factorMods = returns ? applyFactorReturns(u, returns, heroFactorScores) : {};
                    const unit = createUnit(u.mbti, false, `enemy_${i}`, wa.stats, u.isLeader, factorMods);
                    if (unit.role === 'Guardian') unit.isGuarding = true;
                    return unit;
                  });
                  
                  console.log('PvP Both Hashcodes - Player units:', myBattleUnits.length, 'Enemy units:', enemies.length);
                  setUnits([...myBattleUnits, ...enemies]);
                  setPhase('omyo_reveal');
                  setShowOmyoReveal(true);
                }, 200);
              } else {
                // Legacy mode: use profile for player team
                // Load profile directly to get fresh data (don't rely on async state updates)
                const profileData = loadProfile();
                console.log('Loading profile for PvP:', profileData);
                if (!profileData || !profileData.placedUnits || profileData.placedUnits.length < 5) {
                  alert('Please load your profile first or provide a player team hashcode. Your profile must have a deployed team.');
                  return;
                }
                
                // Update state for UI consistency
                handleLoadProfile();
                setIsPvPMode(true);
                setPvpHashcode(normalizedEnemyHashcode);
                // Clear player hashcode if it was set but invalid
                if (normalizedPlayerHashcode) {
                  setPvpPlayerHashcode('');
                }
                
                // Use setTimeout to ensure state is updated before proceeding
                setTimeout(() => {
                  // Generate factor returns for PvP battle
                  const returns = generateFactorReturns();
                  setFactorReturns(returns);
                  
                  // Create units for Omyo reveal using profile data directly
                  const sortedMyTeam = [...profileData.placedUnits].sort((a, b) => a.coreX - b.coreX);
                  const myBattleUnits = sortedMyTeam.map(u => {
                    const wa = getWaBonus(profileData.mbti, u.mbti);
                    const heroFactorScores = getFactorScoresFromMBTI(u.mbti);
                    const factorMods = returns ? applyFactorReturns(u, returns, heroFactorScores) : {};
                    const unit = createUnit(u.mbti, true, null, wa.stats, u.isLeader, factorMods);
                    if (unit.role === 'Guardian') unit.isGuarding = true;
                    return unit;
                  });
                  
                  // Create enemy units from hashcode
                  const sortedEnemyTeam = [...enemyTeamData.placedUnits].sort((a, b) => a.coreX - b.coreX);
                  const enemies = sortedEnemyTeam.map((u, i) => {
                    const wa = getWaBonus(enemyTeamData.mbti, u.mbti);
                    const heroFactorScores = getFactorScoresFromMBTI(u.mbti);
                    const factorMods = returns ? applyFactorReturns(u, returns, heroFactorScores) : {};
                    const unit = createUnit(u.mbti, false, `enemy_${i}`, wa.stats, u.isLeader, factorMods);
                    if (unit.role === 'Guardian') unit.isGuarding = true;
                    return unit;
                  });
                  
                  console.log('PvP Legacy Mode - Player units:', myBattleUnits.length, 'Enemy units:', enemies.length);
                  setUnits([...myBattleUnits, ...enemies]);
                  setPhase('omyo_reveal');
                  setShowOmyoReveal(true);
                }, 200);
              }
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg text-sm font-bold transition-colors"
          >
            {t('startPvPBattle', language)} (Auto Battle)
          </button>
        </div>
      </div>
    </div>
  );
};

export default PvPEntryPhase;
