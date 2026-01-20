import React from 'react';
import { AXIS_META } from '../../modules/quiz.js';
import { t } from '../../modules/translations.js';

const OmyoRevealPhase = ({
  phase,
  factorReturns,
  factorScores,
  battleStats,
  language,
  setShowOmyoReveal,
  proceedToBattle,
  proceedToRematch
}) => {
  if (phase !== 'omyo_reveal' || !factorReturns) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center max-w-4xl mx-auto w-full relative">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-slate-900 to-emerald-900/20 animate-pulse"></div>
      
      <div className="relative z-10 bg-slate-900/95 rounded-3xl shadow-2xl p-4 sm:p-8 border border-purple-500/30 w-full">
        {/* Omyo Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="text-4xl sm:text-6xl mb-2">⚡</div>
          <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 mb-2">
            {t('omyoRevelation', language)}
          </h1>
          <p className="text-slate-400 italic text-sm sm:text-base">{t('omyoSubtitle', language)}</p>
        </div>

        {/* Story Text */}
        <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700">
          <p className="text-slate-300 leading-relaxed mb-4 text-lg">
            {t('omyoStory1', language)}
          </p>
          <p className="text-slate-300 leading-relaxed text-lg">
            {t('omyoStory2', language)}
          </p>
        </div>

        {/* Factor Returns Display */}
        <div className="bg-gradient-to-br from-purple-900/30 to-emerald-900/30 rounded-xl p-6 mb-6 border border-purple-500/20">
          <h2 className="text-2xl font-bold text-center mb-4 text-yellow-300">{t('environmentalForcesManifest', language)}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(factorReturns).map(([factor, returns]) => {
              const ret = parseFloat(returns);
              const isPositive = ret >= 0;
              const absRet = Math.abs(ret * 100);
              
              // Get environmental element description
              const elementDesc = {
                Quality: t('earthStability', language),
                Momentum: t('windSwiftness', language),
                Value: t('stoneEndurance', language),
                Growth: t('flameAmbition', language),
                LowVol: t('waterCalm', language),
                Size: t('thunderBoldness', language),
                Yield: t('lightNurturing', language),
                Liquidity: t('mistFlow', language)
              }[factor] || factor;

              return (
                <div 
                  key={factor} 
                  className={`bg-slate-800/80 p-4 rounded-lg border-2 ${
                    isPositive ? 'border-green-500/50 bg-green-900/20' : 'border-red-500/50 bg-red-900/20'
                  } transition-all hover:scale-105`}
                >
                  <div className="text-xs text-slate-400 mb-1">{elementDesc}</div>
                  <div className="font-bold text-sm text-slate-300 mb-1">{AXIS_META[factor]?.label || factor}</div>
                  <div className={`text-2xl font-black ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : '−'}{absRet.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {isPositive ? t('favorable', language) : t('challenging', language)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Impact Preview */}
        <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700">
          <h3 className="text-xl font-bold mb-3 text-yellow-300">{t('impactOnFormation', language)}</h3>
          <div className="space-y-2 text-sm text-slate-300">
            {Object.entries(factorReturns).some(([factor]) => {
              const ret = parseFloat(factorReturns[factor]);
              return ret !== 0 && factorScores[factor] > 0;
            }) ? (
              <div>
                {Object.entries(factorReturns).map(([factor, returns]) => {
                  const ret = parseFloat(returns);
                  const score = factorScores[factor] || 0;
                  if (ret === 0 || score === 0) return null;
                  
                  const isPositive = ret >= 0;
                  const impact = (score / 10) * ret * 100;
                  
                  return (
                    <div key={factor} className="flex items-center justify-between py-1">
                      <span className="text-slate-400">{AXIS_META[factor]?.label || factor}</span>
                      <span className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{impact.toFixed(1)}% {t('statImpact', language)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 italic">{t('elementsNeutral', language)}</p>
            )}
          </div>
        </div>

        {/* Continue Button - Sticky at bottom for mobile */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-purple-500/30 -mx-4 sm:-mx-8 px-4 sm:px-8 py-4 mt-6 text-center">
          <button
            onClick={() => {
              setShowOmyoReveal(false);
              // Check if this is a rematch (battleStats exists and has turns > 0)
              if (battleStats && battleStats.turns > 0) {
                proceedToRematch();
              } else {
                proceedToBattle();
              }
            }}
            className="bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg shadow-lg transform hover:scale-105 transition-all w-full sm:w-auto"
          >
            {t('enterBattlefield', language)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OmyoRevealPhase;
