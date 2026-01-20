import React from 'react';
import { Save } from 'lucide-react';
import { AXIS_META } from '../../modules/quiz.js';
import { t, getHeroName, getSkillDesc } from '../../modules/translations.js';

const QuizResultPhase = ({
  phase,
  userMBTI,
  factorScores,
  profileHashcode,
  language,
  startRecruit,
  handleSaveProfile
}) => {
  if (phase !== 'quiz_result' || !userMBTI) return null;

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-3xl mx-auto w-full">
      <div className="text-center space-y-6 w-full">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">
          Your Profile
        </h1>
        <div className="bg-slate-900 rounded-xl p-6 mb-4">
          <h2 className="text-2xl font-bold mb-2 text-white">MBTI Type: <span className="text-yellow-400">{userMBTI}</span></h2>
          <h3 className="text-xl font-semibold mb-4 text-emerald-400">{getHeroName(userMBTI, language)}</h3>
          <p className="text-slate-300 mb-4">{getSkillDesc(userMBTI, language)}</p>
        </div>
        
        <div className="bg-slate-900 rounded-xl p-6 mb-4">
          <h3 className="text-xl font-bold mb-4 text-white">{t('factorExposureScores', language)}</h3>
          <p className="text-sm text-slate-400 mb-4 italic">
            {t('factorExposureDescription', language)}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {Object.entries(factorScores).map(([factor, score]) => (
              <div key={factor} className="bg-slate-800 p-3 rounded border border-slate-700">
                <div className="font-medium text-slate-300">{AXIS_META[factor]?.label || factor}</div>
                <div className="text-emerald-400 font-bold">{score.toFixed(1)} / 10</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={startRecruit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg"
          >
            {t('enterWarCouncil', language)}
          </button>
          <button
            onClick={handleSaveProfile}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
          >
            <Save size={16} /> {t('saveProfile', language)}
          </button>
          {profileHashcode && (
            <div className="text-xs text-slate-400 mt-2">
              {t('profile', language)}: #{profileHashcode}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizResultPhase;
