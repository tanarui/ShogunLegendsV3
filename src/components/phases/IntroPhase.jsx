import React from 'react';
import { Save } from 'lucide-react';
import { CHARACTERS, MBTI_TYPES } from '../../data/gameData.js';
import { hasProfile, loadProfile } from '../../modules/profile.js';
import { t, getHeroName, getHeroTitle } from '../../modules/translations.js';

const IntroPhase = ({
  phase,
  language,
  setLanguage,
  setPhase,
  userMBTI,
  placedUnits,
  factorScores,
  pvpHashcode,
  setPvpHashcode,
  pvpPlayerHashcode,
  setPvpPlayerHashcode,
  setIsPvPMode,
  setFactorReturns,
  setUnits,
  setShowOmyoReveal,
  handleLoadProfile,
  handleClearProfile,
  handleMBTISelect,
  startRecruit
}) => {
  if (!['intro', 'select_mbti', 'test', 'result'].includes(phase)) return null;

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
      {phase === 'intro' && (
        <div className="text-center space-y-6">
          {/* Language Toggle */}
          <div className="flex justify-end w-full max-w-md mx-auto mb-4">
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                  language === 'en' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('english', language)}
              </button>
              <button
                onClick={() => setLanguage('ja')}
                className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                  language === 'ja' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('japanese', language)}
              </button>
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">{t('title', language)}</h1>
          <p className="text-slate-400 text-lg">{t('subtitle', language)}</p>
          
          {hasProfile() && (() => {
            const profile = loadProfile();
            const hasTeam = profile?.placedUnits && profile.placedUnits.length >= 5;
            const hasPersonality = !!profile?.mbti;
            
            return (
              <div className="bg-slate-800 p-6 rounded-lg mb-4 max-w-md mx-auto">
                <div className="text-sm text-slate-300 mb-3">{t('savedProfile', language)}</div>
                <div className="text-lg font-mono text-yellow-400 mb-4">#{profile?.hashcode || 'N/A'}</div>
                
                <div className="text-left mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {hasPersonality ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-gray-500">✗</span>
                    )}
                    <span className={hasPersonality ? "text-slate-200" : "text-slate-500"}>
                      {t('personalityType', language)}: {hasPersonality ? CHARACTERS[profile.mbti]?.name || profile.mbti : t('notSet', language)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {hasTeam ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-gray-500">✗</span>
                    )}
                    <span className={hasTeam ? "text-slate-200" : "text-slate-500"}>
                      {t('teamFormation', language)}: {hasTeam ? `${profile.placedUnits.length} ${t('unitsPlaced', language)}` : t('notSet', language)}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={handleLoadProfile}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-bold"
                  >
                    {t('loadProfile', language)} {hasTeam ? `(${t('continueGame', language)})` : `(${t('personalityOnly', language)})`}
                  </button>
                  <button 
                    onClick={() => setPhase('pvp_entry')}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-bold"
                  >
                    PvP (Auto Battle) Mode
                  </button>
                  <button 
                    onClick={handleClearProfile}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
                  >
                    Clear Profile
                  </button>
                </div>
              </div>
            );
          })()}
          
          <div className="flex flex-col gap-3 max-w-md mx-auto">
            <button onClick={() => setPhase('quiz')} className="bg-red-600 px-8 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors">{t('newGame', language)}</button>
            <button onClick={() => setPhase('select_mbti')} className="bg-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors">{t('iKnowMyType', language)}</button>
          </div>
        </div>
      )}
      {phase === 'select_mbti' && (
        <div className="w-full space-y-4">
          <h2 className="text-2xl font-bold text-center mb-4">{t('personalityType', language)}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MBTI_TYPES.map(t => {
              const char = CHARACTERS[t];
              return (
                <button 
                  key={t} 
                  onClick={() => handleMBTISelect(t)} 
                  className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-all text-left"
                >
                  <div className="font-mono text-xs text-slate-400 mb-1">{t}</div>
                  <div className="font-bold text-sm text-white">{getHeroName(t, language)}</div>
                  <div className="text-xs text-slate-300 mt-1">{getHeroTitle(t, language)}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {phase === 'result' && userMBTI && (
        <div className="text-center">
          <h2 className="text-4xl font-black mb-4">{getHeroName(userMBTI, language)}</h2>
          <div className="bg-slate-900 p-4 rounded mb-6">{t('skillDesc', language)}</div>
          <button onClick={startRecruit} className="bg-white text-black px-8 py-3 rounded-full font-bold">{t('enterWarCouncil', language)}</button>
        </div>
      )}
    </div>
  );
};

export default IntroPhase;
