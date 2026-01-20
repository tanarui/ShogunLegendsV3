import { useCallback } from 'react';
import { calculateFactorScores } from '../modules/quiz.js';

/**
 * Custom hook for quiz logic
 */
export const useQuiz = ({
  quizAnswers,
  quizIndex,
  quizQuestions,
  setQuizAnswers,
  setQuizIndex,
  setFactorScores,
  setUserMBTI,
  setPhase
}) => {

  const handleQuizAnswer = useCallback((value) => {
    const currentQ = quizQuestions[quizIndex];
    setQuizAnswers({ ...quizAnswers, [currentQ.id]: value });
    
    if (quizIndex < quizQuestions.length - 1) {
      setTimeout(() => setQuizIndex(quizIndex + 1), 150);
    } else {
      // Quiz complete - calculate results
      const results = calculateFactorScores(quizAnswers, quizQuestions);
      setFactorScores(results.factorScores);
      setUserMBTI(results.mbti);
      
      // Don't generate factor returns yet - wait until deployment
      
      setPhase('quiz_result');
    }
  }, [quizQuestions, quizIndex, quizAnswers, setQuizAnswers, setQuizIndex, setFactorScores, setUserMBTI, setPhase]);

  const handleMBTISelect = useCallback((type) => { 
    setUserMBTI(type);
    // Set neutral factor scores when bypassing quiz (5.0 for all factors)
    const neutralFactorScores = {
      Quality: 5.0,
      Momentum: 5.0,
      Value: 5.0,
      Growth: 5.0,
      LowVol: 5.0,
      Size: 5.0,
      Yield: 5.0,
      Liquidity: 5.0
    };
    setFactorScores(neutralFactorScores);
    setPhase('quiz_result'); 
  }, [setUserMBTI, setFactorScores, setPhase]);

  return {
    handleQuizAnswer,
    handleMBTISelect
  };
};
