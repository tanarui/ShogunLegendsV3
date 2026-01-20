// BattlePhase.jsx - Battle phase component
// Note: This is a large component (~740 lines). Consider splitting into sub-components if it grows further.
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sword, Shield, Star, HelpCircle, HeartCrack, Bot, TrendingUp, Play, Pause
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { AXIS_META } from '../../modules/quiz.js';
import { getFactorScoresFromMBTI } from '../../utils/gameUtils.js';
import { t, getHeroName, getSkillName, getSkillDesc } from '../../modules/translations.js';
import UnitCard from '../UnitCard.jsx';

const BattlePhase = ({
  phase,
  units,
  factorReturns,
  factorScores,
  showOmyoImpact,
  setShowOmyoImpact,
  showStartOverlay,
  setShowStartOverlay,
  showHelp,
  setShowHelp,
  isChallengeMode,
  isHellMode,
  selectedAction,
  handleAction,
  battleLog,
  turnQueue,
  activeUnit,
  activeEff,
  isPlayerDemoralized,
  isAutoBattle,
  setIsAutoBattle,
  currentActorId,
  battleStats,
  isPvPMode,
  language
}) => {
  if (phase !== 'battle') return null;

  // Sequential aura animation - show each unit's aura one by one (one-time at battle start)
  const [auraSequence, setAuraSequence] = useState({});
  const battleStartTime = battleStats?.startTime || 0;
  const auraSequenceRef = useRef(null);

  useEffect(() => {
    // Reset if battle hasn't started
    if (battleStartTime === 0) {
      setAuraSequence({});
      auraSequenceRef.current = null;
      return;
    }

    // Don't start sequence while overlays are showing
    if (showOmyoImpact || showStartOverlay) {
      return;
    }

    // Only run once per battle start (after overlays close)
    const sequenceKey = `${battleStartTime}_${showOmyoImpact}_${showStartOverlay}`;
    if (auraSequenceRef.current === sequenceKey) {
      return;
    }
    auraSequenceRef.current = sequenceKey;

    // Wait a bit for units to be ready, then start sequence
    const startSequence = () => {
      // Get all units (player first, then enemy) sorted by position (top-left to bottom-right)
      const playerUnits = units.filter(u => u.isPlayer && u.currentHp > 0);
      const enemyUnits = units.filter(u => !u.isPlayer && u.currentHp > 0);
      const allUnits = [...playerUnits, ...enemyUnits];
      
      if (allUnits.length === 0) return;
      
      // Reset and start sequence
      setAuraSequence({});
      
      // Show aura for each unit sequentially with 0.3s delay
      allUnits.forEach((unit, index) => {
        setTimeout(() => {
          setAuraSequence(prev => ({ ...prev, [unit.id]: true }));
          
          // Hide after showing (for the "Up"/"Down" text)
          setTimeout(() => {
            setAuraSequence(prev => ({ ...prev, [unit.id]: false }));
          }, 1500); // Show for 1.5 seconds total
        }, index * 300); // 0.3 seconds between each
      });
    };

    // Small delay to ensure units are ready and overlays are closed
    const timer = setTimeout(startSequence, 200);
    return () => clearTimeout(timer);
  }, [battleStartTime, units, showOmyoImpact, showStartOverlay]);

  return (
    <div className="flex-col h-full relative flex">
      {/* Omyo Impact Sequence - This could be extracted to a separate component */}
      {showOmyoImpact && units.length > 0 && factorReturns && (
        <div className="absolute inset-0 z-50 bg-black/95 overflow-y-auto">
          <div className="max-w-5xl w-full mx-auto p-4 space-y-4 min-h-full">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">⚡</div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 mb-1">
                {t('omyoForcesImpacting', language)}
              </h1>
              <p className="text-slate-400 italic text-sm">{t('omyoForcesSubtitle', language)}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Factor Returns Radar Chart */}
              <div className="bg-slate-900 rounded-xl p-4 border border-purple-500/30">
                <h2 className="text-lg font-bold mb-3 text-purple-400">{t('factorReturnsExposures', language)}</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={(() => {
                    const playerUnits = units.filter(u => u.isPlayer);
                    const enemyUnits = units.filter(u => !u.isPlayer);
                    
                    const playerExposureTotals = {
                      Quality: 0, Momentum: 0, Value: 0, Growth: 0,
                      LowVol: 0, Size: 0, Yield: 0, Liquidity: 0
                    };
                    
                    playerUnits.forEach(u => {
                      const scores = getFactorScoresFromMBTI(u.mbti);
                      Object.keys(playerExposureTotals).forEach(factor => {
                        playerExposureTotals[factor] += scores[factor] || 0;
                      });
                    });
                    
                    const playerCount = playerUnits.length || 1;
                    const playerExposure = {
                      Quality: playerExposureTotals.Quality / playerCount,
                      Momentum: playerExposureTotals.Momentum / playerCount,
                      Value: playerExposureTotals.Value / playerCount,
                      Growth: playerExposureTotals.Growth / playerCount,
                      LowVol: playerExposureTotals.LowVol / playerCount,
                      Size: playerExposureTotals.Size / playerCount,
                      Yield: playerExposureTotals.Yield / playerCount,
                      Liquidity: playerExposureTotals.Liquidity / playerCount
                    };
                    
                    const enemyExposureTotals = {
                      Quality: 0, Momentum: 0, Value: 0, Growth: 0,
                      LowVol: 0, Size: 0, Yield: 0, Liquidity: 0
                    };
                    
                    enemyUnits.forEach(u => {
                      const scores = getFactorScoresFromMBTI(u.mbti);
                      Object.keys(enemyExposureTotals).forEach(factor => {
                        enemyExposureTotals[factor] += scores[factor] || 0;
                      });
                    });
                    
                    const enemyCount = enemyUnits.length || 1;
                    const enemyExposure = {
                      Quality: enemyExposureTotals.Quality / enemyCount,
                      Momentum: enemyExposureTotals.Momentum / enemyCount,
                      Value: enemyExposureTotals.Value / enemyCount,
                      Growth: enemyExposureTotals.Growth / enemyCount,
                      LowVol: enemyExposureTotals.LowVol / enemyCount,
                      Size: enemyExposureTotals.Size / enemyCount,
                      Yield: enemyExposureTotals.Yield / enemyCount,
                      Liquidity: enemyExposureTotals.Liquidity / enemyCount
                    };
                    
                    return Object.entries(factorReturns).map(([factor, ret]) => {
                      const returnPercent = parseFloat(ret) * 100;
                      const returnScaled = ((returnPercent + 15) / 35) * 10;
                      
                      return {
                        factor: AXIS_META[factor]?.label || factor,
                        returnValue: returnScaled,
                        returnPercent: returnPercent,
                        playerExposure: playerExposure[factor] || 0,
                        enemyExposure: enemyExposure[factor] || 0,
                        zero: 0
                      };
                    });
                  })()}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis 
                      dataKey="factor" 
                      tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      className="text-xs"
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 10]}
                      tick={{ fill: '#6B7280', fontSize: 9 }}
                    />
                    <Radar
                      name={t('yourTeamExposure', language)}
                      dataKey="playerExposure"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.2}
                      strokeWidth={2}
                      strokeDasharray="5 3"
                    />
                    <Radar
                      name={t('enemyTeamExposure', language)}
                      dataKey="enemyExposure"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.2}
                      strokeWidth={2}
                      strokeDasharray="3 5"
                    />
                    <Radar
                      name={t('factorReturn', language)}
                      dataKey="returnValue"
                      stroke="none"
                      fill="none"
                      strokeWidth={0}
                      dot={(props) => {
                        const { payload, cx, cy } = props;
                        const returnPercent = payload.returnPercent;
                        const isPositive = returnPercent > 0.5;
                        const isNegative = returnPercent < -0.5;
                        const color = isPositive ? '#10B981' : isNegative ? '#EF4444' : '#6B7280';
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={5}
                            fill={color}
                            stroke={color}
                            strokeWidth={2}
                          />
                        );
                      }}
                      connectNulls={false}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        if (name === 'Factor Return') {
                          const percent = props.payload?.returnPercent;
                          return percent !== undefined ? `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%` : `${value.toFixed(1)}`;
                        }
                        return `${value.toFixed(1)} / 10`;
                      }}
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                      iconType="line"
                      formatter={(value, entry) => (
                        <span style={{ 
                          color: entry.color, 
                          fontSize: '12px'
                        }}>
                          {value}
                        </span>
                      )}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Stat Impact Horizontal Bar Chart */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                <h2 className="text-lg font-bold mb-3 text-yellow-300">
                  {t('statImpactSummary', language)}
                  {isChallengeMode && <span className="text-xs text-purple-400 ml-2">({t('omyoHedgeActive', language)})</span>}
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    layout="vertical"
                    data={(() => {
                      const playerUnits = units.filter(u => u.isPlayer);
                      const enemyUnits = units.filter(u => !u.isPlayer);
                      
                      const playerTotals = { atk: 0, def: 0, spd: 0, hp: 0, mp: 0 };
                      const enemyTotals = { atk: 0, def: 0, spd: 0, hp: 0, mp: 0 };
                      
                      playerUnits.forEach(u => {
                        if (u.factorMods) {
                          playerTotals.atk += u.factorMods.atk || 0;
                          playerTotals.def += u.factorMods.def || 0;
                          playerTotals.spd += u.factorMods.spd || 0;
                          playerTotals.hp += u.factorMods.hp || 0;
                          playerTotals.mp += u.factorMods.mp || 0;
                        }
                      });
                      
                      enemyUnits.forEach(u => {
                        if (u.factorMods) {
                          const atk = isChallengeMode ? Math.max(0, u.factorMods.atk || 0) : (u.factorMods.atk || 0);
                          const def = isChallengeMode ? Math.max(0, u.factorMods.def || 0) : (u.factorMods.def || 0);
                          const spd = isChallengeMode ? Math.max(0, u.factorMods.spd || 0) : (u.factorMods.spd || 0);
                          const hp = isChallengeMode ? Math.max(0, u.factorMods.hp || 0) : (u.factorMods.hp || 0);
                          const mp = isChallengeMode ? Math.max(0, u.factorMods.mp || 0) : (u.factorMods.mp || 0);
                          
                          enemyTotals.atk += atk;
                          enemyTotals.def += def;
                          enemyTotals.spd += spd;
                          enemyTotals.hp += hp;
                          enemyTotals.mp += mp;
                        }
                      });
                      
                      return [
                        { stat: 'ATK', player: playerTotals.atk, enemy: enemyTotals.atk, zero: 0 },
                        { stat: 'DEF', player: playerTotals.def, enemy: enemyTotals.def, zero: 0 },
                        { stat: 'SPD', player: playerTotals.spd, enemy: enemyTotals.spd, zero: 0 },
                        { stat: 'HP', player: playerTotals.hp, enemy: enemyTotals.hp, zero: 0 },
                        { stat: 'MP', player: playerTotals.mp, enemy: enemyTotals.mp, zero: 0 }
                      ];
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      type="number"
                      tick={{ fill: '#6B7280', fontSize: 10 }}
                      domain={['auto', 'auto']}
                    />
                    <YAxis 
                      type="category"
                      dataKey="stat"
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      width={60}
                    />
                    <ReferenceLine x={0} stroke="#6B7280" strokeWidth={2} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'zero') return '0';
                        return `${value > 0 ? '+' : ''}${value}`;
                      }}
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                      iconType="square"
                    />
                    <Bar 
                      name="Your Forces" 
                      dataKey="player" 
                      fill="#3B82F6" 
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar 
                      name={isChallengeMode ? "Enemy Forces (Hedged)" : "Enemy Forces"} 
                      dataKey="enemy" 
                      fill="#EF4444" 
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar 
                      name="Zero" 
                      dataKey="zero" 
                      fill="#6B7280" 
                      radius={0}
                      barSize={2}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Active Factors Quick View */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
              <h2 className="text-sm font-bold mb-2 text-slate-300">Active Factors</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(factorReturns)
                  .filter(([_, ret]) => parseFloat(ret) !== 0)
                  .map(([factor, ret]) => {
                    const value = parseFloat(ret) * 100;
                    const isPositive = value >= 0;
                    return (
                      <div 
                        key={factor}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isPositive 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {AXIS_META[factor]?.label || factor}: {isPositive ? '+' : ''}{value.toFixed(1)}%
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Hero Factor Impact Matrix */}
            {units.filter(u => u.isPlayer).length > 0 && (
              <div className="bg-slate-900 rounded-xl p-4 border border-emerald-500/30">
                <h2 className="text-lg font-bold mb-4 text-emerald-400">{t('heroFactorImpactMatrix', language) || 'Hero Factor Impact Matrix'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {units.filter(u => u.isPlayer).map((unit) => {
                    const heroScores = getFactorScoresFromMBTI(unit.mbti);
                    const radarData = Object.entries(factorReturns).map(([factor, ret]) => {
                      const returnPercent = parseFloat(ret) * 100;
                      const returnScaled = ((returnPercent + 15) / 35) * 10;
                      const exposure = heroScores[factor] || 0;
                      return {
                        factor: AXIS_META[factor]?.label || factor,
                        returnValue: returnScaled,
                        returnPercent: returnPercent,
                        heroExposure: exposure,
                        zero: 0
                      };
                    });

                    return (
                      <div key={unit.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                        <h3 className="text-sm font-bold mb-2 text-center text-white truncate">
                          {unit.mbti ? getHeroName(unit.mbti, language) : unit.name}
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="#374151" />
                            <PolarAngleAxis 
                              dataKey="factor" 
                              tick={{ fill: '#9CA3AF', fontSize: 8 }}
                            />
                            <PolarRadiusAxis 
                              angle={90} 
                              domain={[0, 10]}
                              tick={{ fill: '#6B7280', fontSize: 7 }}
                            />
                            <Radar
                              name="Exposure"
                              dataKey="heroExposure"
                              stroke="#3B82F6"
                              fill="#3B82F6"
                              fillOpacity={0.3}
                              strokeWidth={1.5}
                            />
                            <Radar
                              name="Factor Return"
                              dataKey="returnValue"
                              stroke="none"
                              fill="none"
                              strokeWidth={0}
                              dot={(props) => {
                                const { payload, cx, cy } = props;
                                const returnPercent = payload.returnPercent;
                                const isPositive = returnPercent > 0.5;
                                const isNegative = returnPercent < -0.5;
                                const color = isPositive ? '#10B981' : isNegative ? '#EF4444' : '#6B7280';
                                return (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={4}
                                    fill={color}
                                    stroke={color}
                                    strokeWidth={1.5}
                                  />
                                );
                              }}
                              connectNulls={false}
                            />
                            <Tooltip 
                              formatter={(value, name, props) => {
                                if (name === 'Factor Return') {
                                  const percent = props.payload?.returnPercent;
                                  return percent !== undefined ? `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%` : `${value.toFixed(1)}`;
                                }
                                return `${value.toFixed(1)} / 10`;
                              }}
                              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px', fontSize: '10px' }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                        {/* Stat Modifications */}
                        {unit.factorMods && (unit.factorMods.hp !== 0 || unit.factorMods.atk !== 0 || unit.factorMods.def !== 0 || unit.factorMods.spd !== 0 || unit.factorMods.mp !== 0) && (
                          <div className="mt-2 pt-2 border-t border-slate-600 space-y-1">
                            <div className="text-[9px] font-bold text-slate-400 mb-1">Stat Modifications:</div>
                            <div className="flex flex-wrap gap-1 text-[8px]">
                              {unit.factorMods.atk !== 0 && (
                                <span className={`px-1.5 py-0.5 rounded ${unit.factorMods.atk > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                  ATK {unit.factorMods.atk > 0 ? '+' : ''}{unit.factorMods.atk}
                                </span>
                              )}
                              {unit.factorMods.def !== 0 && (
                                <span className={`px-1.5 py-0.5 rounded ${unit.factorMods.def > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                  DEF {unit.factorMods.def > 0 ? '+' : ''}{unit.factorMods.def}
                                </span>
                              )}
                              {unit.factorMods.spd !== 0 && (
                                <span className={`px-1.5 py-0.5 rounded ${unit.factorMods.spd > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                  SPD {unit.factorMods.spd > 0 ? '+' : ''}{unit.factorMods.spd}
                                </span>
                              )}
                              {unit.factorMods.hp !== 0 && (
                                <span className={`px-1.5 py-0.5 rounded ${unit.factorMods.hp > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                  HP {unit.factorMods.hp > 0 ? '+' : ''}{unit.factorMods.hp}
                                </span>
                              )}
                              {unit.factorMods.mp !== 0 && (
                                <span className={`px-1.5 py-0.5 rounded ${unit.factorMods.mp > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                  MP {unit.factorMods.mp > 0 ? '+' : ''}{unit.factorMods.mp}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Continue Button */}
            <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-purple-500/30 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 text-center mt-4">
              <button
                onClick={() => {
                  setShowOmyoImpact(false);
                  setShowStartOverlay(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white px-8 sm:px-12 py-3 rounded-full font-bold text-base sm:text-lg shadow-lg transform hover:scale-105 transition-all w-full sm:w-auto"
              >
                {t('beginBattle', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStartOverlay && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer" onClick={() => setShowStartOverlay(false)}>
          <div className="text-center animate-bounce">
            <h1 className="text-6xl font-black text-red-600 mb-2">
              {isHellMode ? t('hellMode', language) : (isChallengeMode ? t('challengeMode', language) : t('battleStart', language))}
            </h1>
            <p className="text-white text-xl blink">{t('tapToBegin', language)}</p>
          </div>
        </div>
      )}

      {/* BATTLE KEY POPUP */}
      {showHelp && (
        <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center p-4 text-xs text-gray-300" onClick={() => setShowHelp(false)}>
          <div className="max-w-md space-y-4">
            <h3 className="font-bold text-white text-lg border-b pb-2">BATTLE KEY</h3>
            <p><b className="text-yellow-400">Sentinel Stance:</b> Guardians Taunt enemies when Defending. <b>DEF is Halved</b>. Stance breaks on hit. Skills bypass Taunt.</p>
            <p><b className="text-yellow-400">Holy DMG:</b> Ignores Defense entirely.</p>
            <p><b className="text-red-400">Fatigue:</b> As HP drops, ATK/DEF decrease to 50%.</p>
            <p><b className="text-blue-400">Resilience:</b> 'P' Types (e.g. INFP) resist Fatigue.</p>
            <p><b className="text-red-600">Demoralize:</b> When a Leader dies, their team loses stats.</p>
            <div className="text-center pt-4 text-gray-500">Tap to close</div>
          </div>
        </div>
      )}

      {/* Factor Returns Impact Banner */}
      {factorReturns && units.filter(u => u.isPlayer).length > 0 && (
        <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-b border-yellow-700/50 px-4 py-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-yellow-400" />
              <span className="text-xs font-bold text-yellow-300">FACTOR RETURNS IMPACT:</span>
            </div>
            <div className="flex gap-4 text-[10px]">
              {Object.entries(factorReturns).map(([factor, returns]) => {
                const ret = parseFloat(returns);
                const isPositive = ret >= 0;
                const impact = units.filter(u => u.isPlayer).some(u => u.factorMods && (
                  (factor === 'Quality' && (u.factorMods.def !== 0 || u.factorMods.hp !== 0)) ||
                  (factor === 'Momentum' && (u.factorMods.spd !== 0 || u.factorMods.atk !== 0)) ||
                  (factor === 'Value' && (u.factorMods.hp !== 0 || u.factorMods.def !== 0)) ||
                  (factor === 'Growth' && (u.factorMods.atk !== 0 || u.factorMods.mp !== 0)) ||
                  (factor === 'LowVol' && (u.factorMods.def !== 0 || u.factorMods.hp !== 0)) ||
                  (factor === 'Size' && (u.factorMods.spd !== 0 || u.factorMods.atk !== 0)) ||
                  (factor === 'Yield' && (u.factorMods.mp !== 0 || u.factorMods.hp !== 0)) ||
                  (factor === 'Liquidity' && (u.factorMods.spd !== 0 || u.factorMods.mp !== 0))
                ));
                if (!impact) return null;
                return (
                  <div key={factor} className={`${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {AXIS_META[factor]?.label || factor}: {isPositive ? '+' : ''}{(ret * 100).toFixed(1)}%
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-[9px] text-yellow-200/80 mt-1">
            Check hero cards below for stat modifications. Green = boosted, Red = weakened.
          </div>
        </div>
      )}

      <div className="flex-1 bg-slate-900/50 p-2 flex items-center justify-center gap-2 border-b border-slate-800 relative">
        {/* Help Icon */}
        <div className="absolute top-2 right-2 cursor-pointer z-20 text-gray-500 hover:text-white" onClick={() => setShowHelp(!showHelp)}>
          <HelpCircle size={20}/>
        </div>
        {units.filter(u => !u.isPlayer).map((u, i) => (
          <UnitCard key={u.id} unit={u} onClick={() => { if(selectedAction) handleAction(selectedAction, u.id); }} currentActorId={currentActorId} selectedAction={selectedAction} processing={false} units={units} showAura={auraSequence[u.id] || false} activeUnit={activeUnit} language={language} />
        ))}
      </div>

      <div className="bg-black flex flex-col border-y border-slate-800 shrink-0">
        <div className="h-20 px-4 py-1 flex flex-col justify-end gap-0.5 text-xs text-green-400 font-mono overflow-hidden bg-black/50 border-b border-white/10">
          {battleLog.slice(-4).map((log, idx) => (
            <div key={idx} className="truncate opacity-75" style={{ opacity: idx === 3 ? 1 : 0.5 + (idx * 0.15) }}>
              {`> ${log}`}
            </div>
          ))}
        </div>
        <div className="h-10 px-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <span className="text-[10px] text-gray-500 font-bold uppercase sticky left-0 bg-black z-10 pr-2">NEXT:</span>
          {turnQueue.slice(0, 10).map((id, i) => {
            const u = units.find(x => x.id === id);
            return u ? (
              <div key={i} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border ${u.isPlayer?'bg-blue-900 border-blue-500':'bg-red-900 border-red-500'}`}>{u.role[0]}</div>
            ) : null;
          })}
        </div>
      </div>

      <div className="flex-1 bg-slate-900/50 p-2 flex items-center justify-center gap-2 border-t border-slate-800 relative">
        {units.filter(u => u.isPlayer).map((u, i) => (
          <UnitCard key={u.id} unit={u} onClick={() => { if(selectedAction && u.isPlayer) handleAction(selectedAction, u.id); }} currentActorId={currentActorId} selectedAction={selectedAction} processing={false} units={units} showAura={auraSequence[u.id] || false} activeUnit={activeUnit} language={language} />
        ))}
        
        {/* Auto Battle Toggle Button - Center Right below player cards (hidden in PvP mode) */}
        {activeUnit?.isPlayer && !isPlayerDemoralized && !isPvPMode && (
          <div className="absolute bottom-2 right-2 z-30">
            <button
              onClick={() => setIsAutoBattle(!isAutoBattle)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                isAutoBattle 
                  ? 'bg-green-600 hover:bg-green-700 text-white border-2 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                  : 'bg-slate-700 hover:bg-slate-600 text-gray-300 border-2 border-slate-600'
              }`}
              title={isAutoBattle ? 'Disable Auto Battle' : 'Enable Auto Battle'}
            >
              {isAutoBattle ? <Pause size={14} /> : <Play size={14} />}
              <span>{isAutoBattle ? 'AUTO' : 'AUTO'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="h-36 bg-slate-900 border-t border-slate-800 p-2">

        {isPvPMode ? (
          <div className="h-full flex flex-col items-center justify-center text-purple-400 border border-purple-900 bg-black/50 rounded">
            <Bot size={32} className="mb-2"/>
            <div className="font-black text-xl">SPECTATOR MODE</div>
            <div className="text-xs text-gray-400">PvP Auto Battle - Both teams controlled by AI</div>
          </div>
        ) : isPlayerDemoralized && activeUnit?.isPlayer ? (
          <div className="h-full flex flex-col items-center justify-center text-red-500 animate-pulse border border-red-900 bg-black/50 rounded">
            <HeartCrack size={32} className="mb-2"/>
            <div className="font-black text-xl">DEMORALIZED</div>
            <div className="text-xs text-gray-400">AUTO BATTLE ACTIVE</div>
          </div>
        ) : isAutoBattle && activeUnit?.isPlayer ? (
          <div className="h-full flex flex-col items-center justify-center text-green-400 animate-pulse border border-green-900 bg-black/50 rounded">
            <Bot size={32} className="mb-2"/>
            <div className="font-black text-xl">AUTO BATTLE</div>
            <div className="text-xs text-gray-400">AI is controlling your units</div>
            <button
              onClick={() => setIsAutoBattle(false)}
              className="mt-2 px-4 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold transition-all"
            >
              Disable Auto
            </button>
          </div>
        ) : activeUnit?.isPlayer ? (
          <div className="h-full flex gap-2 max-w-lg mx-auto relative">
            <div className="w-28 bg-slate-800 rounded p-2 flex flex-col justify-center items-center border border-slate-700">
              <span className="font-bold text-sm text-center truncate w-full">{activeUnit.mbti ? getHeroName(activeUnit.mbti, language) : activeUnit.name}</span>
              <span className="text-xs text-blue-400 mt-1">{activeUnit.currentMp} MP</span>

              {/* LIVE STATS DISPLAY */}
              <div className="w-full mt-2 pt-2 border-t border-slate-600 text-[9px] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">ATK</span>
                  <div className="flex items-center gap-1">
                    <span className={activeEff.atk < activeUnit.atk ? 'text-red-400' : 'text-green-400'}>
                      {activeEff.atk}
                    </span>
                    <span className="text-gray-500">/</span>
                    <span className="text-gray-400">{activeUnit.atk}</span>
                    {activeUnit.baseAtk !== undefined && activeUnit.baseAtk !== activeUnit.atk && (
                      <>
                        <span className="text-gray-600">/</span>
                        <span className="text-blue-400" title="Base stat (before factor mods)">{activeUnit.baseAtk}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">DEF</span>
                  <div className="flex items-center gap-1">
                    <span className={activeEff.def < activeUnit.def ? 'text-red-400' : 'text-green-400'}>
                      {activeEff.def}
                    </span>
                    <span className="text-gray-500">/</span>
                    <span className="text-gray-400">{activeUnit.def}</span>
                    {activeUnit.baseDef !== undefined && activeUnit.baseDef !== activeUnit.def && (
                      <>
                        <span className="text-gray-600">/</span>
                        <span className="text-blue-400" title="Base stat (before factor mods)">{activeUnit.baseDef}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">SPD</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">{activeUnit.spd}</span>
                    {activeUnit.baseSpd !== undefined && activeUnit.baseSpd !== activeUnit.spd && (
                      <>
                        <span className="text-gray-600">/</span>
                        <span className="text-blue-400" title="Base stat (before factor mods)">{activeUnit.baseSpd}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">HP</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">{activeUnit.maxHp}</span>
                    {activeUnit.baseHp !== undefined && activeUnit.baseHp !== activeUnit.maxHp && (
                      <>
                        <span className="text-gray-600">/</span>
                        <span className="text-blue-400" title="Base stat (before factor mods)">{activeUnit.baseHp}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-[8px] text-center text-yellow-500 mt-1">
                  {Math.floor(activeEff.multiplier * 100)}% Effectiveness
                </div>
                {activeUnit.isPlayer && (activeUnit.baseAtk !== activeUnit.atk || activeUnit.baseDef !== activeUnit.def || activeUnit.baseSpd !== activeUnit.spd || activeUnit.baseHp !== activeUnit.maxHp) && (
                  <div className="text-[8px] text-center text-blue-400 mt-1 border-t border-slate-600 pt-1">
                    Blue = Base (pre-factor)
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-2">
              <button onClick={() => handleAction('attack')} className={`rounded bg-red-700 font-bold text-sm flex items-center justify-center gap-2 ${selectedAction==='attack'?'ring-2 ring-white':''}`}><Sword size={16}/> {t('attack', language)}</button>
              <button onClick={() => handleAction('defend')} className="rounded bg-blue-800 font-bold text-sm flex items-center justify-center gap-2"><Shield size={16}/> {t('guard', language)}</button>
              <button
                onClick={() => {
                  if(activeUnit.currentMp >= activeUnit.skillCost) handleAction('skill');
                }}
                disabled={activeUnit.currentMp < activeUnit.skillCost}
                className={`col-span-2 rounded bg-purple-700 font-bold text-sm flex flex-col items-center justify-center disabled:opacity-50 ${selectedAction==='skill'?'ring-2 ring-white':''}`}
              >
                <div className="flex items-center gap-2"><Star size={16}/> {activeUnit.mbti ? getSkillName(activeUnit.mbti, language) : activeUnit.skillName}</div>
                {selectedAction === 'skill' && <span className="text-[10px] opacity-90 font-normal">{activeUnit.mbti ? getSkillDesc(activeUnit.mbti, language) : activeUnit.desc}</span>}
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 animate-pulse">
            {activeUnit ? <><Bot size={16} className="mr-2"/> Enemy Turn...</> : "Processing..."}
          </div>
        )}
      </div>
    </div>
  );
};

export default BattlePhase;
