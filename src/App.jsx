import React, { useState, useEffect, useRef } from 'react';
import {
  Sword, Shield, Zap, Skull, Trophy, Users, RefreshCw,
  ChevronRight, Activity, Heart, Flame, Wind, Crosshair, Star,
  ChevronsRight, MousePointerClick, RotateCw, Grid3X3, Info, AlertCircle, Lock, TrendingUp, TrendingDown, HelpCircle, Target, Crown, HeartCrack, Bot, Repeat, Hourglass, Save, Download
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';

// Import modules
import { 
  LIKERT, MBTI_DEF, FACTOR_DEF, AXIS_META, 
  calculateFactorScores, generateQuizQuestions 
} from './modules/quiz.js';
import { generateFactorReturns, applyFactorReturns } from './modules/factorReturns.js';
import { saveProfile, loadProfile, clearProfile, hasProfile, getProfileHashcode, encodeTeamHashcode, loadTeamByHashcode } from './modules/profile.js';
import { shuffleArray, getRoleColor, getWaBonus, getFactorScoresFromMBTI } from './utils/gameUtils.js';
import { createUnit, getEffectiveStats } from './utils/unitUtils.js';
import { canPlace, getRotatedPoints } from './utils/gridUtils.js';
import { CHARACTERS, SHAPES, MBTI_TYPES, GRID_SIZE } from './data/gameData.js';
import { t, getTranslations, getQuizQuestion, getHeroName, getHeroTitle, getSkillName, getSkillDesc } from './modules/translations.js';

// Import phase components
import IntroPhase from './components/phases/IntroPhase.jsx';
import QuizPhase from './components/phases/QuizPhase.jsx';
import QuizResultPhase from './components/phases/QuizResultPhase.jsx';
import RecruitmentPhase from './components/phases/RecruitmentPhase.jsx';
import OmyoRevealPhase from './components/phases/OmyoRevealPhase.jsx';
import BattlePhase from './components/phases/BattlePhase.jsx';
import VictoryDefeatPhase from './components/phases/VictoryDefeatPhase.jsx';
import PvPEntryPhase from './components/phases/PvPEntryPhase.jsx';

// Import hooks
import { useProfile } from './hooks/useProfile.js';
import { useBattleLogic } from './hooks/useBattleLogic.js';

export default function ShogunLegendsV3() {
  // Always start with intro/title screen - don't auto-load saved profile on refresh
  const initialPhase = 'intro';
  
  // Language state - load from localStorage or default to English
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem('shogun_language');
      return saved === 'ja' ? 'ja' : 'en';
    } catch {
      return 'en';
    }
  });
  
  // Save language preference
  useEffect(() => {
    try {
      localStorage.setItem('shogun_language', language);
    } catch (e) {
      console.warn('Failed to save language preference:', e);
    }
  }, [language]);
  
  const [phase, setPhase] = useState(initialPhase);
  const [userMBTI, setUserMBTI] = useState(null);
  const [profileHashcode, setProfileHashcode] = useState(null);
  
  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [factorScores, setFactorScores] = useState({});
  const [factorReturns, setFactorReturns] = useState(null);

  // Recruitment State
  const [recruitGrid, setRecruitGrid] = useState(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );
  const [placedUnits, setPlacedUnits] = useState([]);
  const [availablePool, setAvailablePool] = useState([]);
  const [selectedRecruit, setSelectedRecruit] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [hoverCell, setHoverCell] = useState(null);
  const [showRecruitExplanation, setShowRecruitExplanation] = useState(true);
  const [showOmyoReveal, setShowOmyoReveal] = useState(false);

  // Battle State
  const [units, setUnits] = useState([]);
  const unitsRef = useRef(units);
  const [turnQueue, setTurnQueue] = useState([]);
  const turnQueueRef = useRef(turnQueue);
  const [currentActorId, setCurrentActorId] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [selectedAction, setSelectedAction] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [battleStats, setBattleStats] = useState({ turns: 0, startTime: 0 });
  const [showStartOverlay, setShowStartOverlay] = useState(false);
  const [showOmyoImpact, setShowOmyoImpact] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isChallengeMode, setIsChallengeMode] = useState(false);
  const [isHellMode, setIsHellMode] = useState(false);
  const [isPvPMode, setIsPvPMode] = useState(false);
  const [pvpHashcode, setPvpHashcode] = useState('');
  const [pvpPlayerHashcode, setPvpPlayerHashcode] = useState('');
  const [isPlayerDemoralized, setIsPlayerDemoralized] = useState(false);
  const [isAutoBattle, setIsAutoBattle] = useState(false);
  const [turnToken, setTurnToken] = useState(0);
  const [lastEnemyKeys, setLastEnemyKeys] = useState([]);
  const [screenShake, setScreenShake] = useState(false);

  const logRef = useRef(null);

  // Sync Refs
  useEffect(() => { unitsRef.current = units; }, [units]);
  useEffect(() => { turnQueueRef.current = turnQueue; }, [turnQueue]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [battleLog]);

  // Initialize Quiz
  useEffect(() => {
    if (phase === 'quiz' && quizQuestions.length === 0) {
      const questions = generateQuizQuestions(shuffleArray, 30);
      setQuizQuestions(questions);
    }
  }, [phase]);

  // Load saved profile data if available
  useEffect(() => {
    // Don't load factor returns - they should be generated fresh on each deployment
    // This ensures the environmental revelation happens after strategy is set
  }, []);

  // Profile management hook
  const { handleSaveProfile: handleSaveProfileBase, handleLoadProfile, handleClearProfile } = useProfile({
    setUserMBTI,
    setFactorScores,
    setFactorReturns,
    setQuizAnswers,
    setPlacedUnits,
    setRecruitGrid,
    setProfileHashcode,
    setPhase,
    setIsPvPMode,
    setPvpHashcode,
    setPvpPlayerHashcode,
    language
  });

  // Wrapper to pass current values
  const handleSaveProfile = () => {
    handleSaveProfileBase(userMBTI, factorScores, factorReturns, quizAnswers, placedUnits, recruitGrid);
  };

  // Battle logic hook
  const {
    triggerAnim,
    applyDamage,
    nextTurn,
    executeAttack,
    executeSkill,
    executeSkillEffect,
    runAI: runAIFromHook,
    handleAction: handleActionFromHook
  } = useBattleLogic({
    units,
    unitsRef,
    turnQueueRef,
    isHellMode,
    language,
    setUnits,
    setBattleLog,
    setScreenShake,
    setPhase,
    setIsPlayerDemoralized,
    setTurnQueue,
    setCurrentActorId,
    setSelectedAction,
    setProcessing,
    setBattleStats,
    setTurnToken
  });

  // --- INIT ---
  const handleQuizAnswer = (value) => {
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
  };

  const handleMBTISelect = (type) => { 
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
  };

  const startRecruit = () => {
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
  };

  // --- RECRUIT LOGIC ---
  const handleGridClick = (gx, gy) => {
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
  };

  const removeUnit = (unit) => {
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
  };

  const hasLeader = placedUnits.some(u => u.mbti === userMBTI);

  // --- BATTLE LOGIC ---
  const handleDeploy = () => {
    // Generate factor returns when deploying (environmental revelation)
    const returns = generateFactorReturns();
    setFactorReturns(returns);
    
    // Create units for Omyo reveal phase (to calculate exposures from hero MBTI types)
    const sortedMyTeam = [...placedUnits].sort((a, b) => a.coreX - b.coreX);
    const myBattleUnits = sortedMyTeam.map(u => {
      const wa = getWaBonus(userMBTI, u.mbti);
      // Apply factor returns using individual hero's MBTI-based factor scores
      const heroFactorScores = getFactorScoresFromMBTI(u.mbti);
      const factorMods = returns ? applyFactorReturns(u, returns, heroFactorScores) : {};
      const unit = createUnit(u.mbti, true, null, wa.stats, u.isLeader, factorMods);
      if (unit.role === 'Guardian') unit.isGuarding = true;
      return unit;
    });

    // Generate enemies for Omyo reveal
    const enemyKeys = shuffleArray(Object.keys(CHARACTERS).filter(k => k !== 'TRUMP' && k !== 'DROID')).slice(0, 5);
    const enemies = enemyKeys.map((k, i) => {
      // Apply factor returns using individual hero's MBTI-based factor scores
      const heroFactorScores = getFactorScoresFromMBTI(k);
      const factorMods = returns ? applyFactorReturns({mbti: k}, returns, heroFactorScores) : {};
      const unit = createUnit(k, false, `enemy_${i}`, {}, i===2, factorMods);
      if (unit.role === 'Guardian') unit.isGuarding = true;
      return unit;
    });

    // Set units for Omyo reveal display
    setUnits([...myBattleUnits, ...enemies]);
    setLastEnemyKeys(enemyKeys);
    
    setPhase('omyo_reveal');
    setShowOmyoReveal(true);
  };
  
  // Generate team hashcode for sharing (encodes team data directly)
  const getTeamHashcode = () => {
    if (placedUnits.length >= 5) {
      const teamHashcode = encodeTeamHashcode({
        placedUnits,
        mbti: userMBTI,
        factorScores
      });
      return teamHashcode;
    }
    return null;
  };

  const proceedToBattle = () => {
    // If units already exist (from Omyo reveal), use them; otherwise create new ones
    if (units.length > 0 && phase === 'omyo_reveal') {
      // Units already created in handleDeploy, just proceed to battle
      console.log('Proceeding to battle with units:', units.length, 'Player units:', units.filter(u => u.isPlayer).length, 'Enemy units:', units.filter(u => !u.isPlayer).length);
      const allUnits = units;
      const initialQueue = [...allUnits].sort((a, b) => b.spd - a.spd).map(u => u.id);
      setTurnQueue(initialQueue);
      setCurrentActorId(initialQueue[0]);
      setBattleStats({ turns: 0, startTime: Date.now() });
      setBattleLog([]);
      setShowOmyoImpact(true);
      setShowStartOverlay(false);
      setIsChallengeMode(false);
      setIsHellMode(false);
      setIsPlayerDemoralized(false);
      // Force auto battle in PvP mode (spectator mode)
      setIsAutoBattle(isPvPMode);
      setProcessing(false);
      setSelectedAction(null);
      setPhase('battle');
      return;
    }
    
    // Otherwise, create units (for rematch or other cases)
    let myBattleUnits = [];
    let enemies = [];
    
    // PvP Mode: Load both teams from hashcodes
    if (isPvPMode && pvpHashcode && pvpPlayerHashcode) {
      // Load player team from hashcode
      const normalizedPlayerHashcode = pvpPlayerHashcode.trim();
      const playerTeamData = loadTeamByHashcode(normalizedPlayerHashcode);
      console.log('Loading PvP player team with hashcode:', normalizedPlayerHashcode, 'Result:', playerTeamData);
      if (!playerTeamData || !playerTeamData.placedUnits || playerTeamData.placedUnits.length < 5) {
        alert(`Could not load player team with hashcode: ${normalizedPlayerHashcode}.\n\nMake sure:\n1. The hashcode is correct\n2. The team has been deployed at least once\n3. You're using the exact hashcode`);
        setIsPvPMode(false);
        setPvpHashcode('');
        setPvpPlayerHashcode('');
        return;
      }
      
      // Load enemy team from hashcode
      const normalizedHashcode = pvpHashcode.trim();
      const enemyTeamData = loadTeamByHashcode(normalizedHashcode);
      console.log('Loading PvP enemy team with hashcode:', normalizedHashcode, 'Result:', enemyTeamData);
      if (!enemyTeamData || !enemyTeamData.placedUnits || enemyTeamData.placedUnits.length < 5) {
        alert(`Could not load enemy team with hashcode: ${normalizedHashcode}.\n\nMake sure:\n1. The hashcode is correct\n2. The team has been deployed at least once\n3. You're using the exact hashcode`);
        setIsPvPMode(false);
        setPvpHashcode('');
        setPvpPlayerHashcode('');
        return;
      }
      
      // Create player units from hashcode
      const sortedPlayerTeam = [...playerTeamData.placedUnits].sort((a, b) => a.coreX - b.coreX);
      myBattleUnits = sortedPlayerTeam.map(u => {
        const wa = getWaBonus(playerTeamData.mbti, u.mbti);
        const heroFactorScores = getFactorScoresFromMBTI(u.mbti);
        const factorMods = factorReturns ? applyFactorReturns(u, factorReturns, heroFactorScores) : {};
        const unit = createUnit(u.mbti, true, null, wa.stats, u.isLeader, factorMods);
        if (unit.role === 'Guardian') unit.isGuarding = true;
        return unit;
      });
      
      // Create enemy units from hashcode
      const sortedEnemyTeam = [...enemyTeamData.placedUnits].sort((a, b) => a.coreX - b.coreX);
      enemies = sortedEnemyTeam.map((u, i) => {
        const wa = getWaBonus(enemyTeamData.mbti, u.mbti);
        const heroFactorScores = getFactorScoresFromMBTI(u.mbti);
        const factorMods = factorReturns ? applyFactorReturns(u, factorReturns, heroFactorScores) : {};
        const unit = createUnit(u.mbti, false, `enemy_${i}`, wa.stats, u.isLeader, factorMods);
        if (unit.role === 'Guardian') unit.isGuarding = true;
        return unit;
      });
      
      setLastEnemyKeys(enemyTeamData.placedUnits.map(u => u.mbti));
    } else if (isPvPMode && pvpHashcode) {
      // Legacy PvP mode: Load only enemy team from hashcode, use profile for player team
      const sortedMyTeam = [...placedUnits].sort((a, b) => a.coreX - b.coreX);
      myBattleUnits = sortedMyTeam.map(u => {
        const wa = getWaBonus(userMBTI, u.mbti);
        const heroFactorScores = getFactorScoresFromMBTI(u.mbti);
        const factorMods = factorReturns ? applyFactorReturns(u, factorReturns, heroFactorScores) : {};
        const unit = createUnit(u.mbti, true, null, wa.stats, u.isLeader, factorMods);
        if (unit.role === 'Guardian') unit.isGuarding = true;
        return unit;
      });
      
      const normalizedHashcode = pvpHashcode.trim();
      const enemyTeamData = loadTeamByHashcode(normalizedHashcode);
      console.log('Loading PvP team with hashcode:', normalizedHashcode, 'Result:', enemyTeamData);
      if (enemyTeamData && enemyTeamData.placedUnits && enemyTeamData.placedUnits.length >= 5) {
        const sortedEnemyTeam = [...enemyTeamData.placedUnits].sort((a, b) => a.coreX - b.coreX);
        enemies = sortedEnemyTeam.map((u, i) => {
          const wa = getWaBonus(enemyTeamData.mbti, u.mbti);
          const heroFactorScores = getFactorScoresFromMBTI(u.mbti);
          const factorMods = factorReturns ? applyFactorReturns(u, factorReturns, heroFactorScores) : {};
          const unit = createUnit(u.mbti, false, `enemy_${i}`, wa.stats, u.isLeader, factorMods);
          if (unit.role === 'Guardian') unit.isGuarding = true;
          return unit;
        });
        setLastEnemyKeys(enemyTeamData.placedUnits.map(u => u.mbti));
      } else {
        alert(`Could not load team with hashcode: ${normalizedHashcode}.\n\nMake sure:\n1. The hashcode is correct (${normalizedHashcode})\n2. The team has been deployed at least once by the owner\n3. You're using the exact hashcode shown in the profile`);
        setIsPvPMode(false);
        setPvpHashcode('');
        return;
      }
    } else {
      // Normal Mode: Use placed units for player team
      const sortedMyTeam = [...placedUnits].sort((a, b) => a.coreX - b.coreX);
      myBattleUnits = sortedMyTeam.map(u => {
        const wa = getWaBonus(userMBTI, u.mbti);
        const heroFactorScores = getFactorScoresFromMBTI(u.mbti);
        const factorMods = factorReturns ? applyFactorReturns(u, factorReturns, heroFactorScores) : {};
        const unit = createUnit(u.mbti, true, null, wa.stats, u.isLeader, factorMods);
        if (unit.role === 'Guardian') unit.isGuarding = true;
        return unit;
      });
      // Normal Mode: Generate fresh enemies (exclude TRUMP and DROID - Hell Mode only)
      const enemyKeys = shuffleArray(Object.keys(CHARACTERS).filter(k => k !== 'TRUMP' && k !== 'DROID')).slice(0, 5);
      setLastEnemyKeys(enemyKeys);

      // Apply Omyo impact to enemies (using neutral factor scores)
      const neutralFactorScores = {
        Quality: 5.0, Momentum: 5.0, Value: 5.0, Growth: 5.0,
        LowVol: 5.0, Size: 5.0, Yield: 5.0, Liquidity: 5.0
      };

      enemies = enemyKeys.map((k, i) => {
          // Apply factor returns using individual hero's MBTI-based factor scores
          const heroFactorScores = getFactorScoresFromMBTI(k);
          const factorMods = factorReturns ? applyFactorReturns({mbti: k}, factorReturns, heroFactorScores) : {};
          const unit = createUnit(k, false, `enemy_${i}`, {}, i===2, factorMods);
          if (unit.role === 'Guardian') unit.isGuarding = true;
          return unit;
      });
    }

    const allUnits = [...myBattleUnits, ...enemies];
    setUnits(allUnits);
    const initialQueue = [...allUnits].sort((a, b) => b.spd - a.spd).map(u => u.id);
    setTurnQueue(initialQueue);
    setCurrentActorId(initialQueue[0]);
    setBattleStats({ turns: 0, startTime: Date.now() });
    setBattleLog([]);
    setShowOmyoImpact(true);
    setShowStartOverlay(false);
    setIsChallengeMode(false);
    setIsHellMode(false);
    setIsPlayerDemoralized(false);
    setIsAutoBattle(false);
    // Note: Don't reset isPvPMode here - it should persist through the battle
    setProcessing(false);
    setSelectedAction(null);
    setPhase('battle');
  };

  const initBattle = () => {
    proceedToBattle();
  };

  const handleRematch = () => {
    // Generate new factor returns for rematch (environment changes)
    const returns = generateFactorReturns();
    setFactorReturns(returns);
    setPhase('omyo_reveal');
    setShowOmyoReveal(true);
  };

  const handlePvPRematch = () => {
    // For PvP rematch, recreate units from hashcodes with new factor returns
    const returns = generateFactorReturns();
    setFactorReturns(returns);
    
    // Declare variables for team data
    let playerTeamData = null;
    let enemyTeamData = null;
    
    // Load teams from hashcodes
    if (pvpPlayerHashcode && pvpPlayerHashcode.trim()) {
      // Load player team from hashcode
      const normalizedPlayerHashcode = pvpPlayerHashcode.trim();
      playerTeamData = loadTeamByHashcode(normalizedPlayerHashcode);
      if (!playerTeamData || !playerTeamData.placedUnits || playerTeamData.placedUnits.length < 5) {
        alert(`Could not load player team with hashcode: ${normalizedPlayerHashcode} for rematch.`);
        return;
      }
    } else {
      // Use profile for player team
      const profileData = loadProfile();
      if (!profileData || !profileData.placedUnits || profileData.placedUnits.length < 5) {
        alert('Could not load profile for rematch. Please go back to PvP Entry.');
        return;
      }
      playerTeamData = profileData;
    }
    
    // Load enemy team from hashcode
    const normalizedEnemyHashcode = pvpHashcode.trim();
    enemyTeamData = loadTeamByHashcode(normalizedEnemyHashcode);
    if (!enemyTeamData || !enemyTeamData.placedUnits || enemyTeamData.placedUnits.length < 5) {
      alert(`Could not load enemy team with hashcode: ${normalizedEnemyHashcode} for rematch.`);
      return;
    }
    
    // Create player units from hashcode/profile
    const sortedPlayerTeam = [...playerTeamData.placedUnits].sort((a, b) => a.coreX - b.coreX);
    const myBattleUnits = sortedPlayerTeam.map(u => {
      const wa = getWaBonus(playerTeamData.mbti, u.mbti);
      const heroFactorScores = getFactorScoresFromMBTI(u.mbti);
      const factorMods = returns ? applyFactorReturns(u, returns, heroFactorScores) : {};
      const unit = createUnit(u.mbti, true, null, wa.stats, u.isLeader, factorMods);
      if (unit.role === 'Guardian') unit.isGuarding = true;
      return unit;
    });
    
    // Create enemy units from hashcode
    const sortedEnemyTeam = [...enemyTeamData.placedUnits].sort((a, b) => a.coreX - b.coreX);
    const enemies = sortedEnemyTeam.map((u, i) => {
      const wa = getWaBonus(enemyTeamData.mbti, u.mbti);
      const heroFactorScores = getFactorScoresFromMBTI(u.mbti);
      const factorMods = returns ? applyFactorReturns(u, returns, heroFactorScores) : {};
      const unit = createUnit(u.mbti, false, `enemy_${i}`, wa.stats, u.isLeader, factorMods);
      if (unit.role === 'Guardian') unit.isGuarding = true;
      return unit;
    });
    
    console.log('PvP Rematch - Player units:', myBattleUnits.length, 'Enemy units:', enemies.length);
    setUnits([...myBattleUnits, ...enemies]);
    setPhase('omyo_reveal');
    setShowOmyoReveal(true);
  };

  const proceedToRematch = () => {
    const sortedMyTeam = [...placedUnits].sort((a, b) => a.coreX - b.coreX);
    const myBattleUnits = sortedMyTeam.map(u => {
      const wa = getWaBonus(userMBTI, u.mbti);
      // Apply factor returns using individual hero's MBTI-based factor scores
      const heroFactorScores = getFactorScoresFromMBTI(u.mbti);
      const factorMods = factorReturns ? applyFactorReturns(u, factorReturns, heroFactorScores) : {};
      const unit = createUnit(u.mbti, true, null, wa.stats, u.isLeader, factorMods);
      if (unit.role === 'Guardian') unit.isGuarding = true;
      return unit;
    });

    let enemies = [];

    // Hell Mode: Recreate Trump and Droids
    if (isHellMode) {
        // Create Trump (center position, index 2)
        const trumpUnit = createUnit('TRUMP', false, 'trump', {}, true, {});
        trumpUnit.name = "Donald Trump";
        trumpUnit.isTrump = true;

        // Create 4 Droids (positions 0, 1, 3, 4)
        const droidUnits = [0, 1, 3, 4].map((pos, i) => {
            const droid = createUnit('DROID', false, `droid_${i}`, {}, false, {});
            droid.name = `Droid ${i + 1}`;
            droid.isDroid = true;
            droid.guardsTrump = true;
            return droid;
        });

        // Arrange: Droid, Droid, Trump, Droid, Droid
        enemies = [
            droidUnits[0],
            droidUnits[1],
            trumpUnit,
            droidUnits[2],
            droidUnits[3]
        ];
    } else {
        // Normal/Challenge Mode: Use lastEnemyKeys
        // Apply Omyo impact to enemies (using neutral factor scores)
        const neutralFactorScores = {
          Quality: 5.0, Momentum: 5.0, Value: 5.0, Growth: 5.0,
          LowVol: 5.0, Size: 5.0, Yield: 5.0, Liquidity: 5.0
        };

        // Filter out TRUMP and DROID from rematch (shouldn't be there, but safety check)
        const validEnemyKeys = lastEnemyKeys.filter(k => k !== 'TRUMP' && k !== 'DROID');
        enemies = validEnemyKeys.map((k, i) => {
            const isLeader = i === 2;
            // Apply factor returns using individual hero's MBTI-based factor scores
            const heroFactorScores = getFactorScoresFromMBTI(k);
            let factorMods = factorReturns ? applyFactorReturns({mbti: k}, factorReturns, heroFactorScores) : {};
            
            // Apply Omyo Hedge in challenge mode: zero out negative impacts
            if (isChallengeMode && factorMods) {
                factorMods = {
                    atk: Math.max(0, factorMods.atk || 0),
                    def: Math.max(0, factorMods.def || 0),
                    spd: Math.max(0, factorMods.spd || 0),
                    hp: Math.max(0, factorMods.hp || 0),
                    mp: Math.max(0, factorMods.mp || 0)
                };
            }
            
            const unit = createUnit(k, false, `enemy_${i}`, {}, isLeader, factorMods);
            if(isChallengeMode) {
                 unit.name = `Elite ${unit.name}`;
                 // Re-apply buffs for rematch if challenge mode
                 if(i===2) {
                     unit.isDemonLord = true;
                     unit.maxHp *= 2; unit.currentHp *= 2; unit.atk *= 2; unit.def *= 2;
                     unit.name = `👹 ${unit.name}`;
                 }
            }
            if (unit.role === 'Guardian') unit.isGuarding = true;
            return unit;
        });
    }

    const allUnits = [...myBattleUnits, ...enemies];
    setUnits(allUnits);
    const initialQueue = [...allUnits].sort((a, b) => b.spd - a.spd).map(u => u.id);
    setTurnQueue(initialQueue);
    setCurrentActorId(initialQueue[0]);
    setBattleStats({ turns: 0, startTime: Date.now() });
    setBattleLog(isHellMode ? [t('rematchHellMode', language)] : (isChallengeMode ? [t('rematchChallengeMode', language)] : [t('rematchStarted', language)]));
    setShowOmyoImpact(true);
    setShowStartOverlay(false);
    setIsPlayerDemoralized(false);
    // Force auto battle in PvP mode (spectator mode)
    setIsAutoBattle(isPvPMode);
    setProcessing(false);
    setSelectedAction(null);
    setPhase('battle');
  };

  const startChallengeMode = () => {
    const healedPlayerTeam = units.filter(u => u.isPlayer).map(u => ({
        ...u,
        currentHp: u.maxHp,
        currentMp: u.maxMp,
        isGuarding: u.role === 'Guardian',
        isSentinel: false,
        status: null,
        buffs: [],
        anim: null,
        totalDmgDealt: 0,
        isChanting: false,
        currentSentinelCharges: u.maxSentinelCharges // Reset Charges
    }));

    const sRankKeys = Object.keys(CHARACTERS).filter(k => CHARACTERS[k].rank === 'S' && k !== 'TRUMP' && k !== 'DROID');
    const challengeKeys = [];

    // Apply Omyo impact to challenge enemies (using neutral factor scores)
    const neutralFactorScores = {
      Quality: 5.0, Momentum: 5.0, Value: 5.0, Growth: 5.0,
      LowVol: 5.0, Size: 5.0, Yield: 5.0, Liquidity: 5.0
    };

    const challengeEnemies = Array(5).fill(null).map((_, i) => {
        const key = sRankKeys[Math.floor(Math.random() * sRankKeys.length)];
        challengeKeys.push(key);
        // Apply factor returns using individual hero's MBTI-based factor scores
        const heroFactorScores = getFactorScoresFromMBTI(key);
        let factorMods = factorReturns ? applyFactorReturns({mbti: key}, factorReturns, heroFactorScores) : {};
        
        // Apply Omyo Hedge: zero out negative impacts in challenge mode
        if (factorMods) {
            factorMods = {
                atk: Math.max(0, factorMods.atk || 0),
                def: Math.max(0, factorMods.def || 0),
                spd: Math.max(0, factorMods.spd || 0),
                hp: Math.max(0, factorMods.hp || 0),
                mp: Math.max(0, factorMods.mp || 0)
            };
        }
        
        const unit = createUnit(key, false, `boss_${i}`, {}, i===2, factorMods);
        unit.name = `Elite ${unit.name}`;
        if (unit.role === 'Guardian') unit.isGuarding = true;

        // CHALLENGE BOSS BUFF
        if (i === 2) {
            unit.isDemonLord = true;
            unit.maxHp *= 2;
            unit.currentHp *= 2;
            unit.atk *= 2;
            unit.def *= 2;
            unit.name = `👹 ${unit.name}`;
        }
        return unit;
    });

    setLastEnemyKeys(challengeKeys);

    const allUnits = [...healedPlayerTeam, ...challengeEnemies];
    setUnits(allUnits);
    const initialQueue = [...allUnits].sort((a, b) => b.spd - a.spd).map(u => u.id);
    setTurnQueue(initialQueue);
    setCurrentActorId(initialQueue[0]);

    setBattleStats({ turns: 0, startTime: Date.now() });
    setBattleLog([t('challengeModeStart', language), t('defeatDemonLord', language)]);
    setShowOmyoImpact(true);
    setShowStartOverlay(false);
    setIsChallengeMode(true);
    setIsPlayerDemoralized(false);
    setIsAutoBattle(false);
    setProcessing(false);
    setSelectedAction(null);
    setPhase('battle');
  };

  const startHellMode = () => {
    const healedPlayerTeam = units.filter(u => u.isPlayer).map(u => ({
        ...u,
        currentHp: u.maxHp,
        currentMp: u.maxMp,
        isGuarding: u.role === 'Guardian',
        isSentinel: false,
        status: null,
        buffs: [],
        anim: null,
        totalDmgDealt: 0,
        isChanting: false,
        currentSentinelCharges: u.maxSentinelCharges
    }));

    // Create Trump (center position, index 2)
    const trumpUnit = createUnit('TRUMP', false, 'trump', {}, true, {});
    trumpUnit.name = "Donald Trump";
    trumpUnit.isTrump = true; // Flag for Guard mechanic

    // Create 4 Droids (positions 0, 1, 3, 4)
    const droidUnits = [0, 1, 3, 4].map((pos, i) => {
        const droid = createUnit('DROID', false, `droid_${i}`, {}, false, {});
        droid.name = `Droid ${i + 1}`;
        droid.isDroid = true; // Flag for Guard mechanic
        droid.guardsTrump = true; // Active guard flag
        return droid;
    });

    // Arrange: Droid, Droid, Trump, Droid, Droid
    const hellEnemies = [
        droidUnits[0],
        droidUnits[1],
        trumpUnit,
        droidUnits[2],
        droidUnits[3]
    ];

    setLastEnemyKeys(['DROID', 'DROID', 'TRUMP', 'DROID', 'DROID']);

    const allUnits = [...healedPlayerTeam, ...hellEnemies];
    setUnits(allUnits);
    const initialQueue = [...allUnits].sort((a, b) => b.spd - a.spd).map(u => u.id);
    setTurnQueue(initialQueue);
    setCurrentActorId(initialQueue[0]);

    setBattleStats({ turns: 0, startTime: Date.now() });
    setBattleLog([t('hellModeActivated', language), t('defeatTrump', language)]);
    setShowOmyoImpact(false);
    setShowStartOverlay(false);
    setIsHellMode(true);
    setIsChallengeMode(false);
    setIsPlayerDemoralized(false);
    setIsAutoBattle(false);
    setProcessing(false);
    setSelectedAction(null);
    setPhase('battle');
  };

  // --- ENGINE ---

  // Main Action Loop
  useEffect(() => {
    if (phase !== 'battle' || processing || showStartOverlay || showOmyoImpact) return;
    const actor = unitsRef.current.find(u => u.id === currentActorId);
    if (!actor) return;

    if (actor.status === 'stun') {
        setProcessing(true);
        setBattleLog(p => [...p, `${actor.mbti ? getHeroName(actor.mbti, language) : actor.name} ${t('isStunned', language)}`]);
        setTimeout(() => {
            setUnits(prev => prev.map(u => u.id === actor.id ? { ...u, status: null } : u));
            nextTurn();
        }, 1000);
        return;
    }

    const isDemoralizedAI = actor.isPlayer && isPlayerDemoralized;
    const isAutoBattleAI = actor.isPlayer && isAutoBattle;
    // In PvP mode, both teams are AI-controlled (spectator mode)
    const isPvPAI = isPvPMode;

    if (!actor.isPlayer || isDemoralizedAI || isAutoBattleAI || isPvPAI) {
      setProcessing(true);
      setTimeout(() => {
        runAIFromHook(actor, executeSkill);
      }, 800);
    }
  }, [turnToken, phase, showStartOverlay, runAIFromHook, executeSkill, isPlayerDemoralized, isAutoBattle, isPvPMode]);

  const handleAction = (type, targetId) => {
    if (processing) return;
    if (isPlayerDemoralized) return;
    if (isAutoBattle) return;
    if (isPvPMode) return; // PvP is spectator mode - no manual actions
    handleActionFromHook(type, targetId, units, currentActorId);
  };

  // --- ACTIONS ---
  // (All battle actions are now handled by useBattleLogic hook)

  const activeUnit = units.find(u => u.id === currentActorId);
  const activeEff = activeUnit ? getEffectiveStats(activeUnit) : null;

  // Screen shake animation CSS
  const shakeStyle = `
    @keyframes screenShake {
      0%, 100% { transform: translate(0, 0); }
      10% { transform: translate(-2px, -1px) rotate(-0.5deg); }
      20% { transform: translate(2px, 1px) rotate(0.5deg); }
      30% { transform: translate(-1px, 2px) rotate(-0.5deg); }
      40% { transform: translate(1px, -2px) rotate(0.5deg); }
      50% { transform: translate(-2px, 1px) rotate(-0.5deg); }
      60% { transform: translate(2px, -1px) rotate(0.5deg); }
      70% { transform: translate(-1px, -2px) rotate(-0.5deg); }
      80% { transform: translate(1px, 2px) rotate(0.5deg); }
      90% { transform: translate(-2px, -1px) rotate(-0.5deg); }
    }
    .screen-shake {
      animation: screenShake 0.2s ease-in-out;
    }
  `;

  return (
    <>
      <style>{shakeStyle}</style>
      <div className={`h-screen w-full bg-slate-950 text-white font-sans flex flex-col overflow-hidden ${phase === 'battle' && screenShake ? 'screen-shake' : ''}`}>

      {/* --- RECRUIT PHASE --- */}
      <RecruitmentPhase
        phase={phase}
        language={language}
        userMBTI={userMBTI}
        placedUnits={placedUnits}
        factorScores={factorScores}
        selectedRecruit={selectedRecruit}
        rotation={rotation}
        setRotation={setRotation}
        recruitGrid={recruitGrid}
        hoverCell={hoverCell}
        setHoverCell={setHoverCell}
        availablePool={availablePool}
        showRecruitExplanation={showRecruitExplanation}
        setShowRecruitExplanation={setShowRecruitExplanation}
        hasLeader={hasLeader}
        handleGridClick={handleGridClick}
        removeUnit={removeUnit}
        handleDeploy={handleDeploy}
        setSelectedRecruit={setSelectedRecruit}
        handleSaveProfile={handleSaveProfile}
      />

      {/* --- QUIZ PHASE --- */}
      <QuizPhase
        phase={phase}
        quizQuestions={quizQuestions}
        quizIndex={quizIndex}
        quizAnswers={quizAnswers}
        language={language}
        setQuizIndex={setQuizIndex}
        handleQuizAnswer={handleQuizAnswer}
      />

      {/* --- QUIZ RESULT PHASE --- */}
      <QuizResultPhase
        phase={phase}
        userMBTI={userMBTI}
        factorScores={factorScores}
        profileHashcode={profileHashcode}
        language={language}
        startRecruit={startRecruit}
        handleSaveProfile={handleSaveProfile}
      />

      {/* --- INTRO / SELECT / RESULT (Standard) --- */}
      <IntroPhase
        phase={phase}
        language={language}
        setLanguage={setLanguage}
        setPhase={setPhase}
        userMBTI={userMBTI}
        placedUnits={placedUnits}
        factorScores={factorScores}
        pvpHashcode={pvpHashcode}
        setPvpHashcode={setPvpHashcode}
        pvpPlayerHashcode={pvpPlayerHashcode}
        setPvpPlayerHashcode={setPvpPlayerHashcode}
        setIsPvPMode={setIsPvPMode}
        setFactorReturns={setFactorReturns}
        setUnits={setUnits}
        setShowOmyoReveal={setShowOmyoReveal}
        handleLoadProfile={handleLoadProfile}
        handleClearProfile={handleClearProfile}
        handleMBTISelect={handleMBTISelect}
        startRecruit={startRecruit}
      />

      {/* --- PvP ENTRY PHASE --- */}
      <PvPEntryPhase
        phase={phase}
        language={language}
        pvpHashcode={pvpHashcode}
        setPvpHashcode={setPvpHashcode}
        pvpPlayerHashcode={pvpPlayerHashcode}
        setPvpPlayerHashcode={setPvpPlayerHashcode}
        setIsPvPMode={setIsPvPMode}
        setFactorReturns={setFactorReturns}
        setUnits={setUnits}
        setShowOmyoReveal={setShowOmyoReveal}
        handleLoadProfile={handleLoadProfile}
        setPhase={setPhase}
      />

      {/* --- OMYO REVEAL PHASE --- */}
      <OmyoRevealPhase
        phase={phase}
        factorReturns={factorReturns}
        factorScores={factorScores}
        battleStats={battleStats}
        language={language}
        setShowOmyoReveal={setShowOmyoReveal}
        proceedToBattle={proceedToBattle}
        proceedToRematch={proceedToRematch}
      />

      {/* --- BATTLE PHASE --- */}
      <BattlePhase
        phase={phase}
        units={units}
        factorReturns={factorReturns}
        factorScores={factorScores}
        showOmyoImpact={showOmyoImpact}
        setShowOmyoImpact={setShowOmyoImpact}
        showStartOverlay={showStartOverlay}
        setShowStartOverlay={setShowStartOverlay}
        showHelp={showHelp}
        setShowHelp={setShowHelp}
        isChallengeMode={isChallengeMode}
        isHellMode={isHellMode}
        selectedAction={selectedAction}
        handleAction={handleAction}
        battleLog={battleLog}
        turnQueue={turnQueue}
        activeUnit={activeUnit}
        activeEff={activeEff}
        isPlayerDemoralized={isPlayerDemoralized}
        isAutoBattle={isAutoBattle}
        setIsAutoBattle={setIsAutoBattle}
        currentActorId={currentActorId}
        battleStats={battleStats}
        isPvPMode={isPvPMode}
        language={language}
      />

      {/* --- RESULTS SCREEN --- */}
      <VictoryDefeatPhase
        phase={phase}
        battleStats={battleStats}
        units={units}
        isChallengeMode={isChallengeMode}
        isHellMode={isHellMode}
        isPvPMode={isPvPMode}
        language={language}
        setPhase={setPhase}
        handleRematch={handleRematch}
        handlePvPRematch={handlePvPRematch}
        initBattle={initBattle}
        startChallengeMode={startChallengeMode}
        startHellMode={startHellMode}
      />
      </div>
    </>
  );
}
