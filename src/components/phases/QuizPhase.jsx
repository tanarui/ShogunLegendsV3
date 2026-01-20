import React from 'react';
import { LIKERT, AXIS_META } from '../../modules/quiz.js';
import { t, getQuizQuestion } from '../../modules/translations.js';

const QuizPhase = ({
  phase,
  quizQuestions,
  quizIndex,
  quizAnswers,
  language,
  setQuizIndex,
  handleQuizAnswer
}) => {
  if (phase !== 'quiz' || quizQuestions.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
      <div className="bg-slate-900 rounded-3xl shadow-lg p-6 sm:p-8 w-full">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-mono text-slate-400">{quizIndex + 1} / {quizQuestions.length}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300">
            {AXIS_META[quizQuestions[quizIndex]?.axis]?.label || quizQuestions[quizIndex]?.axis}
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold leading-snug mb-6 text-white">
          {getQuizQuestion(quizQuestions[quizIndex]?.id, language)}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {LIKERT.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleQuizAnswer(opt.value)}
              className={`px-3 py-3 rounded-xl border text-sm sm:text-base transition-all ${
                quizAnswers[quizQuestions[quizIndex]?.id] === opt.value
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-800 border-slate-700 hover:border-emerald-400 text-white'
              }`}
            >
              {t(opt.value === 1 ? 'stronglyDisagree' : opt.value === 2 ? 'disagree' : opt.value === 3 ? 'neutral' : opt.value === 4 ? 'agree' : 'stronglyAgree', language)}
            </button>
          ))}
        </div>
        <div className="mt-6">
          <button
            onClick={() => setQuizIndex(Math.max(0, quizIndex - 1))}
            disabled={quizIndex === 0}
            className={`px-4 py-2 rounded-xl border ${
              quizIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:border-slate-400'
            } bg-slate-800 border-slate-700 text-white`}
          >
            {t('back', language)}
          </button>
        </div>
        <div className="mt-4">
          <div className="h-2 rounded bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPhase;
