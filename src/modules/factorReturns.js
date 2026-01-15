// Factor Returns module - handles factor return generation and stat modifications

import { AXIS_META } from './quiz.js';

// Factor returns system (randomized for now, to be replaced with real data)
export const generateFactorReturns = () => {
  // Generate random returns averaging 3% (0.03) with randomization around this value
  // Range: 0.03 ± 0.15, so values between -0.12 and +0.18
  const average = 0.03;
  const spread = 0.15;
  
  return {
    Quality: (average + (Math.random() * 2 - 1) * spread).toFixed(3),
    Momentum: (average + (Math.random() * 2 - 1) * spread).toFixed(3),
    Value: (average + (Math.random() * 2 - 1) * spread).toFixed(3),
    Growth: (average + (Math.random() * 2 - 1) * spread).toFixed(3),
    LowVol: (average + (Math.random() * 2 - 1) * spread).toFixed(3),
    Size: (average + (Math.random() * 2 - 1) * spread).toFixed(3),
    Yield: (average + (Math.random() * 2 - 1) * spread).toFixed(3),
    Liquidity: (average + (Math.random() * 2 - 1) * spread).toFixed(3)
  };
};

// Map factor returns to stat modifications
// Each factor return affects different stats based on the hero's role
export const applyFactorReturns = (unit, factorReturns, factorScores) => {
  const mods = { hp: 0, atk: 0, def: 0, spd: 0, mp: 0 };
  
  // Calculate weighted impact based on factor scores
  const factors = ['Quality', 'Momentum', 'Value', 'Growth', 'LowVol', 'Size', 'Yield', 'Liquidity'];
  
  factors.forEach(factor => {
    const score = factorScores[factor] || 0; // 0-10 scale
    const returns = parseFloat(factorReturns[factor] || 0); // Average 0.03, range approximately -0.12 to +0.18
    const impact = (score / 10) * returns * 200; // Scale to meaningful stat changes (doubled impact)
    
    // Different factors affect different stats based on role
    switch(factor) {
      case 'Quality':
        mods.def += impact * 0.8;
        mods.hp += impact * 0.5;
        break;
      case 'Momentum':
        mods.spd += impact * 0.6;
        mods.atk += impact * 0.4;
        break;
      case 'Value':
        mods.hp += impact * 0.7;
        mods.def += impact * 0.3;
        break;
      case 'Growth':
        mods.atk += impact * 0.7;
        mods.mp += impact * 0.3;
        break;
      case 'LowVol':
        mods.def += impact * 0.6;
        mods.hp += impact * 0.4;
        break;
      case 'Size':
        mods.spd += impact * 0.7;
        mods.atk += impact * 0.3;
        break;
      case 'Yield':
        mods.mp += impact * 0.6;
        mods.hp += impact * 0.4;
        break;
      case 'Liquidity':
        mods.spd += impact * 0.5;
        mods.mp += impact * 0.5;
        break;
    }
  });
  
  // Round and apply
  return {
    hp: Math.round(mods.hp),
    atk: Math.round(mods.atk),
    def: Math.round(mods.def),
    spd: Math.round(mods.spd),
    mp: Math.round(mods.mp)
  };
};

