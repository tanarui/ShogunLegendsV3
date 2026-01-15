// Game utility functions

export const shuffleArray = (array) => {
  return [...array].sort(() => Math.random() - 0.5);
};

export const getRoleColor = (role, isBg = true) => {
  switch(role) {
    case 'Guardian': return isBg ? 'bg-blue-600 border-blue-400' : 'text-blue-400';
    case 'Warlord': return isBg ? 'bg-red-600 border-red-400' : 'text-red-400';
    case 'Duelist': return isBg ? 'bg-orange-500 border-orange-400' : 'text-orange-400';
    case 'Tactician': return isBg ? 'bg-purple-600 border-purple-400' : 'text-purple-400';
    default: return isBg ? 'bg-gray-600' : 'text-gray-400';
  }
};

export const getWaBonus = (leaderType, unitType) => {
  if (!leaderType) return { text: "Leader", color: "text-white", stats: {} };
  if (leaderType === unitType) return { text: "Perfect Wa", color: "text-green-400", stats: { hp: 15, atk: 3, def: 3 } };

  let matches = 0;
  for(let i=0; i<4; i++) if(leaderType[i] === unitType[i]) matches++;

  if (matches >= 3) return { text: "Great Wa", color: "text-blue-400", stats: { hp: 10, atk: 2 } };
  if (matches <= 1) return { text: "Bad Wa", color: "text-red-400", stats: { hp: -5, atk: -1 } };
  return { text: "Neutral", color: "text-gray-400", stats: {} };
};

// Get factor scores from MBTI type (for individual hero exposures)
export const getFactorScoresFromMBTI = (mbti) => {
  if (!mbti || mbti.length !== 4) {
    // Return neutral scores if invalid MBTI
    return {
      Quality: 5.0, Momentum: 5.0, Value: 5.0, Growth: 5.0,
      LowVol: 5.0, Size: 5.0, Yield: 5.0, Liquidity: 5.0
    };
  }
  
  // Start with base scores that vary by MBTI type
  const scores = {
    Quality: 4.0, Momentum: 4.0, Value: 4.0, Growth: 4.0,
    LowVol: 4.0, Size: 4.0, Yield: 4.0, Liquidity: 4.0
  };
  
  // E vs I: Extraverts favor Momentum/Liquidity, Introverts favor Quality/LowVol
  if (mbti[0] === 'E') {
    scores.Momentum += 3.0;
    scores.Liquidity += 3.0;
    scores.Quality -= 2.0;
    scores.LowVol -= 2.0;
    scores.Value -= 1.0;
    scores.Yield -= 1.0;
  } else {
    scores.Quality += 3.0;
    scores.LowVol += 3.0;
    scores.Momentum -= 2.0;
    scores.Liquidity -= 2.0;
    scores.Size -= 1.0;
    scores.Growth -= 1.0;
  }
  
  // S vs N: Sensors favor Value/Quality, Intuitives favor Growth/Momentum
  if (mbti[1] === 'S') {
    scores.Value += 3.0;
    scores.Quality += 2.0;
    scores.Growth -= 2.5;
    scores.Momentum -= 2.5;
  } else {
    scores.Growth += 3.0;
    scores.Momentum += 2.0;
    scores.Value -= 2.5;
    scores.Quality -= 2.5;
  }
  
  // T vs F: Thinkers favor Value/Quality, Feelers favor Yield/Liquidity
  if (mbti[2] === 'T') {
    scores.Value += 2.5;
    scores.Quality += 2.0;
    scores.Yield -= 2.5;
    scores.Liquidity -= 2.0;
  } else {
    scores.Yield += 2.5;
    scores.Liquidity += 2.5;
    scores.Value -= 2.5;
    scores.Quality -= 2.5;
  }
  
  // J vs P: Judgers favor Quality/LowVol, Perceivers favor Momentum/Size
  if (mbti[3] === 'J') {
    scores.Quality += 2.0;
    scores.LowVol += 3.0;
    scores.Momentum -= 2.5;
    scores.Size -= 2.5;
  } else {
    scores.Momentum += 2.5;
    scores.Size += 3.0;
    scores.Quality -= 2.5;
    scores.LowVol -= 3.0;
  }
  
  // Normalize to 0-10 range
  Object.keys(scores).forEach(k => {
    scores[k] = Math.max(0, Math.min(10, scores[k]));
  });
  
  return scores;
};



