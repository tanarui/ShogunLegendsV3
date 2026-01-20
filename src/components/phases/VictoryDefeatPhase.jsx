import React from 'react';
import { Trophy, Skull, RefreshCw, Repeat, Sword, Crown } from 'lucide-react';
import { t } from '../../modules/translations';

const VictoryDefeatPhase = ({ 
  phase, 
  battleStats, 
  units, 
  isChallengeMode, 
  isHellMode,
  isPvPMode,
  language,
  setPhase,
  handleRematch,
  handlePvPRematch,
  initBattle,
  startChallengeMode,
  startHellMode
}) => {
  // Only render on victory or defeat phase
  if (phase !== 'victory' && phase !== 'defeat') return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-black/90 text-center animate-in zoom-in duration-300">
      {phase === 'victory' ? <Trophy size={80} className="text-yellow-400 mb-4 animate-bounce"/> : <Skull size={80} className="text-gray-500 mb-4"/>}
      <h2 className="text-5xl font-black mb-2">{phase.toUpperCase()}</h2>

      <div className="bg-slate-800 p-6 rounded-xl w-full max-w-md mb-8 border border-slate-700 relative">
        <h3 className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-4">Battle Report</h3>
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <div className="text-gray-500">Turns Taken</div>
            <div className="text-2xl font-bold">{battleStats.turns}</div>
          </div>
          <div>
            <div className="text-gray-500">MVP Damage</div>
            <div className="text-2xl font-bold text-red-400">
              {Math.max(...units.filter(u=>u.isPlayer).map(u=>u.totalDmgDealt), 0)}
            </div>
          </div>
        </div>
        <div className="text-left">
          <div className="text-xs text-gray-500 mb-2">Unit Performance</div>
          {units.filter(u=>u.isPlayer).map(u => (
            <div key={u.id} className="flex justify-between text-xs py-1 border-b border-slate-700 last:border-0">
              <span>{u.name}</span>
              <span className="text-red-400">{u.totalDmgDealt} DMG</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center w-full max-w-md px-4">
        {isPvPMode ? (
          // PvP Mode Options
          <>
            <button onClick={handlePvPRematch} className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 text-sm sm:text-base sm:px-8">
              <Repeat size={18}/> {t('rematch', language)}
            </button>
            <button onClick={() => setPhase('pvp_entry')} className="bg-purple-600 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 text-sm sm:text-base sm:px-8">
              <RefreshCw size={18}/> Back to PvP Entry
            </button>
            <button onClick={() => setPhase('intro')} className="bg-slate-700 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 text-sm sm:text-base sm:px-8">
              <RefreshCw size={18}/> {t('backToTitle', language)}
            </button>
          </>
        ) : (
          // Normal Mode Options
          <>
            <button onClick={() => setPhase('intro')} className="bg-slate-700 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 text-sm sm:text-base sm:px-8">
              <RefreshCw size={18}/> {t('backToTitle', language)}
            </button>
            <button onClick={handleRematch} className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 text-sm sm:text-base sm:px-8">
              <Repeat size={18}/> {t('rematch', language)}
            </button>
            <button onClick={initBattle} className="bg-green-600 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 text-sm sm:text-base sm:px-8">
              <Sword size={18}/> {t('newSkirmish', language)}
            </button>
            {phase === 'victory' && !isChallengeMode && !isHellMode && (
              <button onClick={startChallengeMode} className="bg-red-600 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-red-900/50 flex items-center gap-2 text-sm sm:text-base sm:px-8">
                <Crown size={18} className="text-yellow-400"/> {t('challengeModeButton', language)}
              </button>
            )}
            {phase === 'victory' && isChallengeMode && !isHellMode && (
              <button onClick={startHellMode} className="bg-gradient-to-r from-red-900 to-orange-900 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-red-900/50 flex items-center gap-2 text-sm sm:text-base sm:px-8">
                🔥 {t('hellModeButton', language)}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VictoryDefeatPhase;
