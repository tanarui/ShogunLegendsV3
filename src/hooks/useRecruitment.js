import { useCallback } from 'react';
import { CHARACTERS, SHAPES, GRID_SIZE } from '../data/gameData.js';
import { shuffleArray, getWaBonus, getFactorScoresFromMBTI } from '../utils/gameUtils.js';
import { createUnit } from '../utils/unitUtils.js';
import { applyFactorReturns, generateFactorReturns } from '../modules/factorReturns.js';
import { canPlace, getRotatedPoints } from '../utils/gridUtils.js';

/**
 * Custom hook for recruitment logic
 */
export const useRecruitment = ({
  userMBTI,
  placedUnits,
  availablePool,
  recruitGrid,
  rotation,
  selectedRecruit,
  setAvailablePool,
  setRecruitGrid,
  setPlacedUnits,
  setSelectedRecruit,
  setRotation,
  setHoverCell,
  setPhase,
  setFactorReturns,
  setUnits,
  setLastEnemyKeys
}) => {

  const startRecruit = useCallback(() => {
    const leaderKey = userMBTI;
    const pool = shuffleArray(Object.keys(CHARACTERS).filter(k => k !== leaderKey && k !== 'TRUMP' && k !== 'DROID')).map(k => ({...CHARACTERS[k], mbti: k}));
    const leaderChar = { ...CHARACTERS[leaderKey], mbti: leaderKey, isLeader: true };
    const fullPool = [leaderChar, ...pool];

    setAvailablePool(fullPool);
    
    // Only reset grid/units if not loading from profile
    if (placedUnits.length === 0) {
      setRecruitGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
      setPlacedUnits([]);
    }
    
    setSelectedRecruit(leaderChar);
    setPhase('recruit');
  }, [userMBTI, placedUnits.length, setAvailablePool, setRecruitGrid, setPlacedUnits, setSelectedRecruit, setPhase]);

  const handleGridClick = useCallback((gx, gy) => {
    if (!selectedRecruit) return;
    const points = getRotatedPoints(selectedRecruit, rotation, SHAPES);
    if (canPlace(recruitGrid, points, gx, gy, GRID_SIZE)) {
      const newGrid = recruitGrid.map(row => [...row]);
      points.forEach(([dx, dy]) => { newGrid[gy + dy][gx + dx] = selectedRecruit.mbti; });
      setRecruitGrid(newGrid);
      setPlacedUnits([...placedUnits, { ...selectedRecruit, coreX: gx, coreY: gy, points, rotation }]);
      setAvailablePool(availablePool.filter(c => c.mbti !== selectedRecruit.mbti));
      setSelectedRecruit(null);
      setRotation(0);
      setHoverCell(null);
    }
  }, [selectedRecruit, rotation, recruitGrid, placedUnits, availablePool, setRecruitGrid, setPlacedUnits, setAvailablePool, setSelectedRecruit, setRotation, setHoverCell]);

  const removeUnit = useCallback((unit) => {
    const newGrid = recruitGrid.map(row => [...row]);
    unit.points.forEach(([dx, dy]) => { if (newGrid[unit.coreY + dy]) newGrid[unit.coreY + dy][unit.coreX + dx] = null; });
    setRecruitGrid(newGrid);
    setPlacedUnits(placedUnits.filter(u => u.mbti !== unit.mbti));
    const charData = { ...CHARACTERS[unit.mbti], mbti: unit.mbti, isLeader: unit.mbti === userMBTI };
    if (charData.isLeader) {
      setAvailablePool([charData, ...availablePool]);
      setSelectedRecruit(charData);
    } else {
      setAvailablePool([...availablePool, charData]);
    }
  }, [recruitGrid, placedUnits, availablePool, userMBTI, setRecruitGrid, setPlacedUnits, setAvailablePool, setSelectedRecruit]);

  const handleDeploy = useCallback(() => {
    // Generate factor returns when deploying
    const returns = generateFactorReturns();
    setFactorReturns(returns);
    
    // Create units for Omyo reveal phase
    const sortedMyTeam = [...placedUnits].sort((a, b) => a.coreX - b.coreX);
    const myBattleUnits = sortedMyTeam.map(u => {
      const wa = getWaBonus(userMBTI, u.mbti);
      const heroFactorScores = getFactorScoresFromMBTI(u.mbti);
      const factorMods = returns ? applyFactorReturns(u, returns, heroFactorScores) : {};
      const unit = createUnit(u.mbti, true, null, wa.stats, u.isLeader, factorMods);
      if (unit.role === 'Guardian') unit.isGuarding = true;
      return unit;
    });

    // Generate enemies for Omyo reveal
    const enemyKeys = shuffleArray(Object.keys(CHARACTERS).filter(k => k !== 'TRUMP' && k !== 'DROID')).slice(0, 5);
    const enemies = enemyKeys.map((k, i) => {
      const heroFactorScores = getFactorScoresFromMBTI(k);
      const factorMods = returns ? applyFactorReturns({mbti: k}, returns, heroFactorScores) : {};
      const unit = createUnit(k, false, `enemy_${i}`, {}, i===2, factorMods);
      if (unit.role === 'Guardian') unit.isGuarding = true;
      return unit;
    });

    setUnits([...myBattleUnits, ...enemies]);
    setLastEnemyKeys(enemyKeys);
    setPhase('omyo_reveal');
  }, [placedUnits, userMBTI, setFactorReturns, setUnits, setLastEnemyKeys, setPhase]);

  const hasLeader = placedUnits.some(u => u.mbti === userMBTI);

  return {
    startRecruit,
    handleGridClick,
    removeUnit,
    handleDeploy,
    hasLeader
  };
};
