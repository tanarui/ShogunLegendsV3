// Quiz module - handles quiz questions, answers, and MBTI/factor calculations

export const LIKERT = [
  {value: 1, label: "Strongly Disagree"},
  {value: 2, label: "Disagree"},
  {value: 3, label: "Neutral"},
  {value: 4, label: "Agree"},
  {value: 5, label: "Strongly Agree"}
];

export const MBTI_DEF = [
  ["EI1", "I feel energized after meeting new people.", "EI", 1],
  ["EI2", "I prefer deep, solitary work to group sessions.", "EI", -1],
  ["EI3", "I talk through ideas to clarify my thinking.", "EI", 1],
  ["EI4", "I need quiet time alone most days to recharge.", "EI", -1],
  ["EI5", "I enjoy being the one to start conversations.", "EI", 1],
  ["EI6", "Large social events drain me quickly.", "EI", -1],
  ["EI7", "I make friends easily in new settings.", "EI", 1],
  ["EI8", "I'd rather text than hop on a spontaneous call.", "EI", -1],
  ["SN1", "I trust concrete facts over hunches.", "SN", 1],
  ["SN2", "I often think about big-picture possibilities.", "SN", -1],
  ["SN3", "I like step-by-step instructions.", "SN", 1],
  ["SN4", "I enjoy exploring patterns more than details.", "SN", -1],
  ["SN5", "I prefer proven methods to experimental ones.", "SN", 1],
  ["SN6", "I focus on what could be rather than what is.", "SN", -1],
  ["SN7", "I notice practical details others miss.", "SN", 1],
  ["SN8", "I get excited by abstract theories.", "SN", -1],
  ["TF1", "I make decisions by analyzing pros and cons.", "TF", 1],
  ["TF2", "I prioritize harmony even if logic says otherwise.", "TF", -1],
  ["TF3", "I value fairness over personal circumstances.", "TF", 1],
  ["TF4", "I weigh people's feelings heavily in choices.", "TF", -1],
  ["TF5", "I'm comfortable giving blunt, objective feedback.", "TF", 1],
  ["TF6", "I avoid conflict even when I disagree.", "TF", -1],
  ["TF7", "I prefer criteria to vibes when judging options.", "TF", 1],
  ["TF8", "I decide with my heart more than my head.", "TF", -1],
  ["JP1", "I like schedules and to-do lists.", "JP", 1],
  ["JP2", "I keep plans flexible and open-ended.", "JP", -1],
  ["JP3", "I feel better once decisions are finalized.", "JP", 1],
  ["JP4", "I'm comfortable delaying decisions to gather more info.", "JP", -1],
  ["JP5", "I prefer clear structure over spontaneity.", "JP", 1],
  ["JP6", "I work best when I can adapt plans on the fly.", "JP", -1],
  ["JP7", "I plan my work and work my plan.", "JP", 1],
  ["JP8", "I like to keep options open as long as possible.", "JP", -1]
];

export const FACTOR_DEF = [
  ["FQ1", "I double-check my work for accuracy and consistency.", "Quality", 1],
  ["FQ2", "I act quickly on opportunities that seem to be gaining traction.", "Momentum", 1],
  ["FQ3", "I look for undervalued ideas that others ignore.", "Value", 1],
  ["FQ4", "I focus on long-term vision over short-term outcomes.", "Growth", 1],
  ["FQ5", "I prefer steady progress and avoid unnecessary risk.", "LowVol", 1],
  ["FQ6", "I like taking bold initiatives independently.", "Size", 1],
  ["FQ7", "I enjoy providing stable, predictable support.", "Yield", 1],
  ["FQ8", "I thrive when connecting and collaborating with others.", "Liquidity", 1],
  ["FQ9", "I enjoy working in fast-paced, evolving environments.", "Momentum", 1],
  ["FQ10", "I am cautious with risks and think about downside protection.", "LowVol", 1],
  ["FQ11", "I think about compounding effects over time.", "Growth", 1],
  ["FQ12", "I take pride in being dependable and consistent.", "Yield", 1],
  ["FQ13", "I move fluidly across different teams and ideas.", "Liquidity", 1]
];

export const AXIS_META = {
  EI: { label: "Extraversion vs Introversion", sides: ["E", "I"] },
  SN: { label: "Sensing vs iNtuition", sides: ["S", "N"] },
  TF: { label: "Thinking vs Feeling", sides: ["T", "F"] },
  JP: { label: "Judging vs Perceiving", sides: ["J", "P"] },
  Quality: { label: "Quality" },
  Momentum: { label: "Momentum" },
  Value: { label: "Value" },
  Growth: { label: "Growth" },
  LowVol: { label: "Low Volatility" },
  Size: { label: "Size (Small)" },
  Yield: { label: "Yield" },
  Liquidity: { label: "Liquidity" }
};

// Quiz helpers
export const responseToScore = (answer, weight) => {
  const diff = answer - 3;
  if (diff === 0) return 0;
  if (diff > 0) return diff === 1 ? 1 : 2;
  return diff === -1 ? -1 : -2;
};

export const toMBTI = (margins) => {
  const getSide = (axis) => margins[axis] >= 0 ? AXIS_META[axis].sides[0] : AXIS_META[axis].sides[1];
  return getSide('EI') + getSide('SN') + getSide('TF') + getSide('JP');
};

export const normalize = (scores) => {
  const total = Object.values(scores).reduce((a, b) => a + Math.abs(b), 0);
  const out = {};
  for (const [k, v] of Object.entries(scores)) {
    out[k] = total ? Math.round((Math.abs(v) / total) * 1000) / 10 : 0;
  }
  return out;
};

// Calculate factor scores from quiz answers
export const calculateFactorScores = (quizAnswers, quizQuestions) => {
  const margins = {
    EI: 0, SN: 0, TF: 0, JP: 0,
    Quality: 0, Momentum: 0, Value: 0, Growth: 0,
    LowVol: 0, Size: 0, Yield: 0, Liquidity: 0
  };

  quizQuestions.forEach(q => {
    const answer = quizAnswers[q.id];
    if (answer) {
      margins[q.axis] += responseToScore(answer, q.weight);
    }
  });

  // Normalize factor scores
  const factorMix = normalize({
    Quality: margins.Quality,
    Momentum: margins.Momentum,
    Value: margins.Value,
    Growth: margins.Growth,
    LowVol: margins.LowVol,
    Size: margins.Size,
    Yield: margins.Yield,
    Liquidity: margins.Liquidity
  });

  // Convert to 0-10 scale
  const fScores = {};
  Object.entries(factorMix).forEach(([k, p]) => {
    fScores[k] = Math.round((p * 10 / 100) * 10) / 10;
  });

  return { margins, factorScores: fScores, mbti: toMBTI(margins) };
};

// Generate quiz questions
export const generateQuizQuestions = (shuffleArray, count = 30) => {
  const mbtiQs = MBTI_DEF.map(([id, text, axis, weight]) => ({ id, text, axis, weight }));
  const factorQs = FACTOR_DEF.map(([id, text, axis, weight]) => ({ id, text, axis, weight }));
  const allQs = shuffleArray([...mbtiQs, ...factorQs]).slice(0, count);
  return allQs;
};



