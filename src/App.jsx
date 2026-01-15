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
import { CHARACTERS, SHAPES, MBTI_TYPES, GRID_SIZE } from './data/gameData.js';
import { t, getTranslations, getQuizQuestion, getHeroName, getHeroTitle, getSkillName, getSkillDesc } from './modules/translations.js';

// --- TETRIS GRID LOGIC ---

const getRoleIcon = (role) => {
  switch(role) {
    case 'Guardian': return <Shield size={14} className={getRoleColor(role, false)} />;
    case 'Tactician': return <Star size={14} className={getRoleColor(role, false)} />;
    case 'Duelist': return <Zap size={14} className={getRoleColor(role, false)} />;
    default: return <Sword size={14} className={getRoleColor(role, false)} />;
  }
};

const rotatePoints = (points) => points.map(([x, y]) => [-y, x]);

const canPlace = (grid, points, cx, cy) => {
  return points.every(([dx, dy]) => {
    const x = cx + dx;
    const y = cy + dy;
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE && grid[y][x] === null;
  });
};

// --- COMPONENTS ---

const ShapePreview = ({ shapeName, role, rotation = 0, isInteractive = false, onRotate }) => {
    let points = SHAPES[shapeName];
    if (rotation > 0) {
        for(let i=0; i<rotation; i++) points = rotatePoints(points);
    }

    const coreX = 2;
    const coreY = 2;

    const listClasses = "w-10 h-10 bg-slate-900 border-slate-700 p-0.5";
    const activeClasses = "w-20 h-20 bg-slate-800 border-yellow-500 cursor-pointer hover:bg-slate-700 p-1";

    return (
        <div
          onClick={isInteractive ? onRotate : undefined}
          className={`grid grid-cols-5 ${isInteractive ? 'gap-0.5' : 'gap-0'} rounded border ${isInteractive ? activeClasses : listClasses}`}
        >
            {Array(5).fill(null).map((_, y) => Array(5).fill(null).map((_, x) => {
                const dx = x - coreX;
                const dy = y - coreY;
                const isBlock = points.some(([px, py]) => px === dx && py === dy);
                const isCore = dx === 0 && dy === 0;

                const colorClass = isBlock ? getRoleColor(role) : 'bg-transparent';

                return (
                    <div key={`${x}-${y}`} className={`
                        w-full h-full flex items-center justify-center
                        ${colorClass}
                        ${!isInteractive && isBlock ? 'border-[0.5px] border-black/20' : 'rounded-[1px]'}
                    `}>
                        {isCore && isBlock && <Star size={isInteractive ? 10 : 6} className="text-white fill-white" />}
                    </div>
                );
            }))}
        </div>
    );
};

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
  const [isPlayerDemoralized, setIsPlayerDemoralized] = useState(false);
  const [turnToken, setTurnToken] = useState(0);
  const [lastEnemyKeys, setLastEnemyKeys] = useState([]);

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

  // Save profile function
  const handleSaveProfile = () => {
    const profile = {
      mbti: userMBTI,
      factorScores,
      factorReturns,
      quizAnswers,
      placedUnits,
      recruitGrid
    };
    const hashcode = saveProfile(profile);
    if (hashcode) {
      setProfileHashcode(hashcode);
      alert(`${t('profileSaved', language)} ${hashcode}`);
    }
  };

  // Load profile function with error handling
  const handleLoadProfile = () => {
    try {
      const profile = loadProfile();
      if (!profile) {
        alert(t('noSavedProfile', language));
        return;
      }
      
      try {
        setUserMBTI(profile.mbti);
        setFactorScores(profile.factorScores || {});
        // Don't load factor returns - they should be generated fresh on deployment
        setFactorReturns(null);
        setQuizAnswers(profile.quizAnswers || {});
        
        // Validate and fix placed units - recalculate points if shapes have changed
        let fixedPlacedUnits = [];
        let fixedRecruitGrid = profile.recruitGrid || Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
        
        if (profile.placedUnits && profile.placedUnits.length > 0) {
          // Rebuild grid from scratch to ensure consistency
          fixedRecruitGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
          
          profile.placedUnits.forEach(savedUnit => {
            try {
              // Validate savedUnit structure
              if (!savedUnit || !savedUnit.mbti) {
                console.warn('Invalid saved unit structure:', savedUnit);
                return;
              }
              
              const currentChar = CHARACTERS[savedUnit.mbti];
              if (!currentChar) {
                console.warn(`Character ${savedUnit.mbti} no longer exists in current version`);
                return;
              }
              
              // Get current shape points (handles shape changes like Akechi)
              const currentShape = SHAPES[currentChar.shape];
              if (!currentShape) {
                console.warn(`Shape ${currentChar.shape} not found for ${currentChar.name}`);
                return;
              }
              
              // Recalculate points based on current shape using the helper function
              const rotation = savedUnit.rotation || 0;
              const points = getRotatedPoints(currentChar, rotation);
              
              // Validate placement is still valid with new shape
              if (canPlace(fixedRecruitGrid, points, savedUnit.coreX, savedUnit.coreY)) {
                // Place on grid
                points.forEach(([dx, dy]) => {
                  const x = savedUnit.coreX + dx;
                  const y = savedUnit.coreY + dy;
                  if (fixedRecruitGrid[y] && fixedRecruitGrid[y][x] !== undefined) {
                    fixedRecruitGrid[y][x] = savedUnit.mbti;
                  }
                });
                
                // Add to placed units with updated shape
                fixedPlacedUnits.push({
                  ...savedUnit,
                  points,
                  shape: currentChar.shape // Update to current shape
                });
              } else {
                // Placement invalid with new shape - skip this unit
                console.warn(`Cannot place ${currentChar.name} at saved position with new shape ${currentChar.shape}`);
              }
            } catch (unitError) {
              console.error(`Error processing saved unit ${savedUnit?.mbti}:`, unitError);
              // Continue with other units
            }
          });
        }
        
        setPlacedUnits(fixedPlacedUnits);
        setRecruitGrid(fixedRecruitGrid);
        setProfileHashcode(profile.hashcode);
        
        if (fixedPlacedUnits.length >= 5) {
          setPhase('recruit'); // Go to recruit if team is already set
        } else if (profile.mbti) {
          setPhase('quiz_result'); // Go to result if quiz is done
        } else {
          setPhase('quiz');
        }
      } catch (loadError) {
        console.error('Error loading profile data:', loadError);
        alert(t('errorLoadingProfile', language));
        // Clear potentially corrupted profile
        clearProfile();
      }
    } catch (error) {
      console.error('Unexpected error in handleLoadProfile:', error);
      alert(t('failedToLoadProfile', language));
    }
  };

  // Clear profile function
  const handleClearProfile = () => {
    if (confirm(t('clearProfileConfirm', language))) {
      clearProfile();
      setProfileHashcode(null);
      setPhase('quiz');
      setUserMBTI(null);
      setFactorScores({});
      setFactorReturns(null);
      setQuizAnswers({});
      setPlacedUnits([]);
      setRecruitGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
      setIsPvPMode(false);
      setPvpHashcode('');
    }
  };

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
  const getRotatedPoints = (char, rotCount) => {
    let points = SHAPES[char.shape];
    for(let i=0; i<rotCount; i++) points = rotatePoints(points);
    return points;
  };

  const handleGridClick = (gx, gy) => {
    if (!selectedRecruit) return;
    const points = getRotatedPoints(selectedRecruit, rotation);
    if (canPlace(recruitGrid, points, gx, gy)) {
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
      setProcessing(false);
      setSelectedAction(null);
      setPhase('battle');
      return;
    }
    
    // Otherwise, create units (for rematch or other cases)
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
    
    // PvP Mode: Load enemy team from hashcode
    if (isPvPMode && pvpHashcode) {
      const normalizedHashcode = pvpHashcode.trim();
      const enemyTeamData = loadTeamByHashcode(normalizedHashcode);
      console.log('Loading PvP team with hashcode:', normalizedHashcode, 'Result:', enemyTeamData);
      if (enemyTeamData && enemyTeamData.placedUnits && enemyTeamData.placedUnits.length >= 5) {
        // Create enemy units from loaded team
        const sortedEnemyTeam = [...enemyTeamData.placedUnits].sort((a, b) => a.coreX - b.coreX);
        
        enemies = sortedEnemyTeam.map((u, i) => {
          const wa = getWaBonus(enemyTeamData.mbti, u.mbti);
          // Apply factor returns using individual hero's MBTI-based factor scores
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
    setProcessing(false);
    setSelectedAction(null);
    setPhase('battle');
  };

  // --- ENGINE ---

  const triggerAnim = (id, type) => {
    setUnits(prev => prev.map(u => u.id === id ? { ...u, anim: type } : u));
    setTimeout(() => {
        setUnits(prev => prev.map(u => u.id === id ? { ...u, anim: null } : u));
    }, 600);
  };

  const nextTurn = (forceActorId = null) => {
    const currentUnits = unitsRef.current;

    // Check Victory
    const pAlive = currentUnits.filter(u => u.isPlayer && u.currentHp > 0).length;
    const eAlive = currentUnits.filter(u => !u.isPlayer && u.currentHp > 0).length;
    if (pAlive === 0) { setPhase('defeat'); return; }
    if (eAlive === 0) { setPhase('victory'); return; }

    if (forceActorId) {
       setCurrentActorId(forceActorId);
       setProcessing(false);
       setSelectedAction(null);
       setTurnToken(prev => prev + 1);
       return;
    }
    setBattleStats(prev => ({ ...prev, turns: prev.turns + 1 }));

    let newQueue = [...turnQueueRef.current];
    const finished = newQueue.shift();
    if (currentUnits.find(u => u.id === finished && u.currentHp > 0)) newQueue.push(finished);

    newQueue = newQueue.filter(uid => {
        const u = currentUnits.find(unit => unit.id === uid);
        return u && u.currentHp > 0;
    });

    if(newQueue.length === 0) {
        newQueue = currentUnits.filter(u => u.currentHp > 0).sort((a,b) => b.spd - a.spd).map(u => u.id);
    }

    setTurnQueue(newQueue);
    setCurrentActorId(newQueue[0]);
    setSelectedAction(null);
    setProcessing(false);
    setTurnToken(prev => prev + 1);

    // Clear Guard/Status for NEW actor
    setUnits(prev => prev.map(u => u.id === newQueue[0] ? {
        ...u,
        isGuarding: false,
        hasHyped: false,
        status: u.status === 'taunt' ? null : u.status
    } : u));
  };

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

    if (!actor.isPlayer || isDemoralizedAI) {
      setProcessing(true);
      setTimeout(() => {
        runAI(actor);
      }, 800);
    }
  }, [turnToken, phase, showStartOverlay]);

  const runAI = (actor) => {
        const currentUnits = unitsRef.current;
        const targets = currentUnits.filter(u => u.isPlayer !== actor.isPlayer && u.currentHp > 0);
        const sentinels = targets.filter(t => t.isSentinel);

        let move = 'attack';
        let target = null;

        if (actor.role === 'Guardian' && !actor.isSentinel && actor.currentSentinelCharges > 0 && Math.random() > 0.25) {
             move = 'defend';
        } else if (actor.currentMp >= actor.skillCost && Math.random() > 0.6) {
            move = 'skill';
            target = targets[Math.floor(Math.random() * targets.length)];
        } else {
            move = 'attack';
            if (sentinels.length > 0) {
                target = sentinels[0];
            } else {
                target = targets[Math.floor(Math.random() * targets.length)];
            }
        }

        if (move === 'defend') {
             const isGuardian = actor.role === 'Guardian';
             let activatesSentinel = false;
             let newCharges = actor.currentSentinelCharges;
             if (isGuardian && actor.currentSentinelCharges > 0) {
                 activatesSentinel = true;
                 newCharges -= 1;
             }
             setUnits(prev => prev.map(u => u.id === actor.id ? {
                ...u,
                isGuarding: true,
                isSentinel: activatesSentinel,
                currentSentinelCharges: newCharges,
                currentMp: Math.min(u.maxMp, u.currentMp + 15)
             } : u));
             const msg = activatesSentinel ? `${actor.name} enters Sentinel Stance!` : `${actor.name} takes a defensive stance.`;
             setBattleLog(prev => [...prev, msg]);
             setTimeout(nextTurn, 600);
        } else if (move === 'skill') {
             executeSkill(actor, target);
        } else {
             executeAttack(actor, target);
        }
  };

  const handleAction = (type, targetId) => {
    if (processing) return;
    if (isPlayerDemoralized) return;

    const actor = units.find(u => u.id === currentActorId);

    if (type === 'defend') {
        setProcessing(true);
        const isGuardian = actor.role === 'Guardian';
        let activatesSentinel = false;
        let newCharges = actor.currentSentinelCharges;

        // LIMIT CHECK
        if (isGuardian && actor.currentSentinelCharges > 0) {
            activatesSentinel = true;
            newCharges -= 1;
        }

        setUnits(prev => prev.map(u => u.id === actor.id ? {
            ...u,
            isGuarding: true,
            isSentinel: activatesSentinel,
            currentSentinelCharges: newCharges,
            currentMp: Math.min(u.maxMp, u.currentMp + 15)
        } : u));

        const msg = activatesSentinel
            ? `${actor.name} enters Sentinel Stance! (${newCharges} left)`
            : `${actor.name} takes a defensive stance.`;
        setBattleLog(prev => [...prev, msg]);
        setTimeout(nextTurn, 600);
        return;
    }

    if (!targetId) { setSelectedAction(type); return; }

    const target = units.find(u => u.id === targetId);
    setProcessing(true);
    if (type === 'attack') executeAttack(actor, target);
    if (type === 'skill') executeSkill(actor, target);
  };

  // --- ACTIONS ---

  const applyDamage = (source, target, rawDmg) => {
    const currentUnits = unitsRef.current;
    
    // Hell Mode: Droids guard attacks on Trump (check before normal damage calculation)
    if (isHellMode && target.isTrump && source.isPlayer) {
        // Check if any Droid is alive to intercept
        const aliveDroids = currentUnits.filter(u => u.isDroid && u.currentHp > 0 && u.guardsTrump);
        if (aliveDroids.length > 0) {
            // Randomly select a Droid to take the hit
            const guardingDroid = aliveDroids[Math.floor(Math.random() * aliveDroids.length)];
            setBattleLog(prev => [...prev, `🛡️ ${guardingDroid.mbti ? getHeroName(guardingDroid.mbti, language) : guardingDroid.name} ${t('interceptsAttack', language)}`]);
            // Apply damage to the Droid instead
            const droidDmg = Math.floor(rawDmg * 0.8); // Droids take 80% of the damage
            const freshDroid = currentUnits.find(u => u.id === guardingDroid.id);
            const newDroidHp = Math.max(0, freshDroid.currentHp - droidDmg);
            setUnits(prev => prev.map(u => 
                u.id === guardingDroid.id 
                    ? { ...u, currentHp: newDroidHp, anim: 'slash' }
                    : u
            ));
            setTimeout(() => setUnits(prev => prev.map(u => u.id === guardingDroid.id ? { ...u, anim: null } : u)), 500);
            if (newDroidHp <= 0) {
                setBattleLog(prev => [...prev, `${guardingDroid.mbti ? getHeroName(guardingDroid.mbti, language) : guardingDroid.name} ${t('isDestroyed', language)}`]);
            }
            return { dmg: droidDmg, killed: newDroidHp <= 0 };
        }
    }

    let finalDmg = rawDmg;

    const allies = currentUnits.filter(u => u.isPlayer === target.isPlayer);
    const idx = allies.findIndex(u => u.id === target.id);
    let guarded = false;
    const neighbors = [];
    if (idx > 0) neighbors.push(allies[idx-1]);
    if (idx < allies.length - 1) neighbors.push(allies[idx+1]);
    neighbors.forEach(n => { if (n.role === 'Guardian' && n.isGuarding && n.currentHp > 0) guarded = true; });

    // Duelist Weakness Logic
    if (target.role === 'Duelist' && (source.role === 'Guardian' || source.role === 'Tactician')) {
        finalDmg = Math.floor(finalDmg * 1.5);
    }
    if (source.role === 'Duelist' && target.role === 'Warlord') {
        finalDmg = Math.floor(finalDmg * 0.7);
    }

    if (target.isSentinel) { }
    else if (target.isGuarding) finalDmg *= 0.5;
    else if (guarded) finalDmg *= 0.6;

    finalDmg = Math.floor(finalDmg);
    if (finalDmg < 1) finalDmg = 1;

    const freshTarget = unitsRef.current.find(u => u.id === target.id);
    const newHp = Math.max(0, freshTarget.currentHp - finalDmg);
    const isDead = newHp <= 0;
    const isLeaderDeath = isDead && freshTarget.isLeader;

    setUnits(prev => {
        let newUnits = prev.map(u => {
            if (u.id === target.id) {
                return {
                    ...u,
                    currentHp: newHp,
                    isSentinel: isDead ? false : false,
                    isGuarding: isDead ? false : u.isGuarding,
                    isChanting: isDead ? false : u.isChanting,
                    anim: 'shake'
                };
            }
            if (u.id === source.id) return { ...u, totalDmgDealt: u.totalDmgDealt + finalDmg };
            return u;
        });

        if (isLeaderDeath) {
            newUnits = newUnits.map(u => {
                if (u.isPlayer === freshTarget.isPlayer && u.currentHp > 0) {
                    return { ...u, atk: Math.max(1, u.atk - 15), def: Math.max(0, u.def - 15), anim: 'shake' };
                }
                return u;
            });
        }
        return newUnits;
    });

    if (isLeaderDeath) {
        setBattleLog(p => [...p, `${t('leaderFallen', language)} ${freshTarget.mbti ? getHeroName(freshTarget.mbti, language) : freshTarget.name}${t('armyDemoralized', language)}`]);
        if (freshTarget.isPlayer) setIsPlayerDemoralized(true);
    }

    setTimeout(() => setUnits(prev => prev.map(u => u.id === target.id ? { ...u, anim: null } : u)), 500);
    return { dmg: finalDmg, killed: isDead };
  };

  const executeAttack = (actor, target) => {
    setUnits(prev => prev.map(u => u.id === actor.id ? { ...u, anim: 'slash' } : u));
    setTimeout(() => setUnits(prev => prev.map(u => u.id === actor.id ? { ...u, anim: null } : u)), 500);

    const effStats = getEffectiveStats(actor);
    const targetEff = getEffectiveStats(target);
    const dmg = (effStats.atk * (0.9 + Math.random() * 0.2)) - (targetEff.def * 0.4);

    const res = applyDamage(actor, target, dmg);
    setBattleLog(p => [...p, `${actor.mbti ? getHeroName(actor.mbti, language) : actor.name} ${t('attacksFor', language)} ${target.mbti ? getHeroName(target.mbti, language) : target.name} ${t('attacksForDmg', language)} ${res.dmg}${t('damage', language)}`]);

    // Counter
    if (!res.killed && target.role === 'Warlord') {
        setTimeout(() => {
            const freshTarget = unitsRef.current.find(u => u.id === target.id);
            const freshActor = unitsRef.current.find(u => u.id === actor.id);
            if (freshTarget && freshTarget.currentHp > 0 && freshActor && freshActor.currentHp > 0) {
                const tStats = getEffectiveStats(freshTarget);
                const aStats = getEffectiveStats(freshActor);
                const counterDmg = Math.max(1, Math.floor((tStats.atk * 0.7) - (aStats.def * 0.4)));
                setBattleLog(p => [...p, `${t('counters', language)} ${freshTarget.mbti ? getHeroName(freshTarget.mbti, language) : freshTarget.name} ${t('countersExclamation', language)}`]);
                triggerAnim(freshTarget.id, 'slash');
                applyDamage(freshTarget, freshActor, counterDmg);
                setTurnToken(prev => prev + 1);
            }
        }, 600);
    }

    const currentUnits = unitsRef.current;
    const enemiesAlive = currentUnits.filter(u => u.isPlayer !== actor.isPlayer && u.id !== target.id && u.currentHp > 0).length;

    if (res.killed && enemiesAlive === 0) {
        setPhase(actor.isPlayer ? 'victory' : 'defeat');
        return;
    }

    if (res.killed && !actor.hasHyped && enemiesAlive > 0) {
        setBattleLog(p => [...p, `${t('hypeAttacksAgain', language)} ${actor.mbti ? getHeroName(actor.mbti, language) : actor.name} ${t('attacksAgain', language)}`]);
        setUnits(prev => prev.map(u => u.id === actor.id ? { ...u, hasHyped: true } : u));
        setTimeout(() => nextTurn(actor.id), 1200);
    } else {
        setTimeout(nextTurn, 1200);
    }
  };

  const executeSkill = (actor, target) => {
    setUnits(prev => prev.map(u => u.id === actor.id ? { ...u, currentMp: u.currentMp - actor.skillCost } : u));
    executeSkillEffect(actor, actor.skillName, target);
    setTimeout(nextTurn, 1000);
  };

  const executeSkillEffect = (actor, skillName, target) => {
    const actorName = actor.mbti ? getHeroName(actor.mbti, language) : actor.name;
    const translatedSkillName = actor.mbti ? getSkillName(actor.mbti, language) : skillName;
    let log = `${actorName}: ${translatedSkillName}!`;
    let killed = false;
    const effStats = getEffectiveStats(actor);
    const targetEff = target ? getEffectiveStats(target) : {};

    if (["Tenka Fubu", "Death Charge", "Dragon Roar", "Assassinate", "Bishamonten"].includes(skillName)) {
        if(!target) return;
        setUnits(prev => prev.map(u => u.id === target.id ? { ...u, anim: 'slash' } : u));
        let mult = 1.8;
        if (skillName === "Assassinate") mult = 2.2;
        const targetDef = (skillName === "Assassinate" || skillName === "Bishamonten") ? 0 : targetEff.def;
        const res = applyDamage(actor, target, (effStats.atk * mult) - (targetDef * 0.3));
        log += ` ${t('hitFor', language)} ${res.dmg}${t('damage', language)}`;
        killed = res.killed;
    }
    else if (skillName === "Two Heavens") {
        if(!target) return;
        setUnits(prev => prev.map(u => u.id === target.id ? { ...u, anim: 'slash' } : u));
        const hit1 = applyDamage(actor, target, (effStats.atk * 0.7) - (targetEff.def * 0.3));
        const hit2 = applyDamage(actor, target, (effStats.atk * 0.7) - (targetEff.def * 0.3));
        log += ` ${t('doubleSlash', language)}`;
        killed = hit1.killed || hit2.killed;
    }
    else if (skillName === "Honno-ji Fire") {
        const enemies = unitsRef.current.filter(u => u.isPlayer !== actor.isPlayer && u.currentHp > 0);
        let killCount = 0;
        enemies.forEach(e => {
            const res = applyDamage(actor, e, 25);
            if(res.killed) { killed = true; killCount++; }
        });
        log += ` ${t('burnsAllEnemies', language)}`;
        if (killCount === enemies.length) { setPhase(actor.isPlayer ? 'victory' : 'defeat'); return; }
    }
    else if (skillName === "Make America Great Again") {
        // Deal 40 damage to all player units
        const playerUnits = unitsRef.current.filter(u => u.isPlayer && u.currentHp > 0);
        let killCount = 0;
        playerUnits.forEach(p => {
            const res = applyDamage(actor, p, 40);
            if(res.killed) { killCount++; }
        });
        // Heal Trump for 30 HP
        setUnits(prev => prev.map(u => {
            if (u.id === actor.id && u.currentHp > 0) {
                return { ...u, currentHp: Math.min(u.maxHp, u.currentHp + 30), anim: 'heal' };
            }
            return u;
        }));
        log += ` ${t('dmgToAllEnemies', language)}`;
        if (killCount === playerUnits.length) { setPhase('defeat'); return; }
    }
    else if (["Sunomata", "Furinkazan", "Dragon Roar", "Great Peace", "Matsuri Beat"].includes(skillName)) {
        const stat = ["Sunomata", "Dragon Roar"].includes(skillName) ? 'atk' : (skillName === "Matsuri Beat" ? 'spd' : 'def');
        const BUFF_AMT = 5;

        // Update units with buff
        setUnits(prev => {
            let newUnits = prev.map(u => {
                 if (u.isPlayer === actor.isPlayer) {
                    let newBuffs = [...u.buffs, stat];
                    let currentVal = u[stat];
                    if (newBuffs.length > 5) {
                        const removed = newBuffs.shift();
                        if (['atk','def','spd'].includes(removed)) currentVal -= 5;
                    }
                    return { ...u, [stat]: currentVal + BUFF_AMT, buffs: newBuffs, anim: 'buff' };
                 }
                 return u;
            });
            // Update ref immediately for turn queue calculation
            if (stat === 'spd') {
                unitsRef.current = newUnits;
            }
            return newUnits;
        });

        // For speed changes, re-sort turn queue after units are updated
        if (stat === 'spd') {
             setTimeout(() => {
                 setTurnQueue(prev => {
                     const waiting = prev.filter(id => id !== actor.id);
                     const sortedWaiting = waiting.sort((a,b) => {
                          const ua = unitsRef.current.find(u=>u.id===a);
                          const ub = unitsRef.current.find(u=>u.id===b);
                          return (ub?.spd || 0) - (ua?.spd || 0);
                     });
                     // Re-insert actor at correct position based on new speed
                     const actorUnit = unitsRef.current.find(u => u.id === actor.id);
                     const actorSpd = actorUnit?.spd || 0;
                     let insertIndex = sortedWaiting.findIndex(id => {
                         const u = unitsRef.current.find(unit => unit.id === id);
                         return (u?.spd || 0) < actorSpd;
                     });
                     if (insertIndex === -1) insertIndex = sortedWaiting.length;
                     sortedWaiting.splice(insertIndex, 0, actor.id);
                     return sortedWaiting;
                 });
             }, 100);
        }
        log += ` ${t('armyUp', language)} ${stat.toUpperCase()} ${t('up', language)}`;
    }
    else if (["Supply Lines", "Mother's Love", "Kamakura Law"].includes(skillName)) {
        const isTeam = skillName !== "Kamakura Law";
        setUnits(prev => prev.map(u => {
            if (u.isPlayer === actor.isPlayer && (isTeam || u.id === actor.id) && u.currentHp > 0) {
                return { ...u, currentHp: Math.min(u.maxHp, u.currentHp + 30), anim: 'heal' };
            }
            return u;
        }));
        log += ` ${t('vitalityRestored', language)}`;
    }
    else if (skillName === "Wabi-Sabi") {
        setUnits(prev => prev.map(u => {
            if (u.isPlayer === actor.isPlayer && u.currentHp > 0) {
                return {
                    ...u,
                    currentHp: Math.min(u.maxHp, u.currentHp + 25),
                    currentMp: Math.min(u.maxMp, u.currentMp + 15),
                    anim: 'heal'
                };
            }
            return u;
        }));
        log += ` ${t('teaCalms', language)}`;
    }
    else if (skillName === "Eight Gates") {
        if(target) {
            setUnits(prev => prev.map(u => u.id === target.id ? { ...u, status: 'stun', anim: 'shake' } : u));
            const targetName = target.mbti ? getHeroName(target.mbti, language) : target.name;
            log += ` ${t('stunned', language)} ${targetName}${language === 'ja' ? '！' : '!'}`;
        }
    }

    setBattleLog(p => [...p, log]);
    setTimeout(() => setUnits(prev => prev.map(u => ({ ...u, anim: null }))), 600);

    // Victory Check for Skills (using Ref + current kill)
    const currentUnits = unitsRef.current;
    const enemiesAlive = currentUnits.filter(u =>
        u.isPlayer !== actor.isPlayer &&
        u.currentHp > 0 &&
        (u.id !== target.id || !killed)
    ).length;

    if (killed && enemiesAlive === 0) {
        setPhase(actor.isPlayer ? 'victory' : 'defeat');
        return;
    }

    if (killed && !actor.hasHyped && enemiesAlive > 0) {
         setUnits(prev => prev.map(u => u.id === actor.id ? { ...u, hasHyped: true } : u));
         setTimeout(() => nextTurn(actor.id), 1200);
    } else {
         setTimeout(nextTurn, 1000);
    }
  };

  // --- RENDERERS ---

  const UnitCard = ({ unit, onClick }) => {
    if(!unit) return <div className="w-1/5"></div>;
    const isActor = unit.id === currentActorId;

    // Sentinel Locking
    const isEnemy = !unit.isPlayer;
    const activeSentinel = units.find(u => !u.isPlayer && u.isSentinel && u.currentHp > 0);
    const isLocked = selectedAction === 'attack' && !processing && activeSentinel && isEnemy && unit.id !== activeSentinel.id;
    const isTargetable = selectedAction && !processing && !isLocked;

    const isDead = unit.currentHp <= 0;
    const hpRatio = unit.currentHp / unit.maxHp;

    const allies = units.filter(u => u.isPlayer === unit.isPlayer);
    const idx = allies.findIndex(u => u.id === unit.id);
    const protectedByGuard = !unit.isGuarding && !isDead && (
       (idx > 0 && allies[idx-1].isGuarding && allies[idx-1].role === 'Guardian' && allies[idx-1].currentHp > 0) ||
       (idx < allies.length-1 && allies[idx+1].isGuarding && allies[idx+1].role === 'Guardian' && allies[idx+1].currentHp > 0)
    );

    return (
      <div
        onClick={isLocked ? undefined : onClick}
        className={`
           relative w-1/5 ${unit.isPlayer && unit.factorMods && (unit.factorMods.hp !== 0 || unit.factorMods.atk !== 0 || unit.factorMods.def !== 0 || unit.factorMods.spd !== 0 || unit.factorMods.mp !== 0) ? 'h-36' : 'h-28'} border md:border-2 rounded flex flex-col items-center justify-between p-1 transition-all select-none
           ${unit.isPlayer ? 'bg-slate-900 border-blue-900' : 'bg-slate-800 border-red-900'}
           ${isActor ? 'ring-2 ring-yellow-400 scale-105 z-10 shadow-lg' : ''}
           ${isTargetable ? 'cursor-pointer hover:bg-slate-700 hover:border-white animate-pulse' : ''}
           ${isLocked ? 'opacity-30 cursor-not-allowed grayscale' : ''}
           ${isDead ? 'opacity-20 grayscale' : ''}
           ${unit.anim === 'shake' ? 'animate-bounce text-red-500' : ''}
           ${unit.status === 'stun' ? 'ring-2 ring-yellow-300' : ''}
           ${unit.isSentinel ? 'ring-2 ring-orange-500' : ''}
        `}
      >
        {unit.isChanting && <div className="absolute top-1 right-1 z-20"><Hourglass size={14} className="text-purple-400 animate-spin"/></div>}
        {unit.isSentinel && <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 text-orange-500 bg-black rounded-full p-1 border border-orange-500"><Target size={16} className="animate-ping"/></div>}

        {unit.isDemonLord ? (
            <div className="absolute -top-3 right-0 z-20 text-red-500"><Skull size={16} fill="currentColor"/></div>
        ) : unit.isLeader && (
            <div className="absolute -top-3 right-0 z-20 text-yellow-400"><Crown size={16} fill="currentColor"/></div>
        )}

        {unit.role === 'Guardian' && (
            <div className="absolute top-1 left-1 flex gap-0.5">
                {Array(unit.maxSentinelCharges).fill(0).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < unit.currentSentinelCharges ? 'bg-blue-400' : 'bg-gray-700'}`}></div>
                ))}
            </div>
        )}

        {unit.anim === 'slash' && <div className="absolute inset-0 flex items-center justify-center text-4xl z-20 animate-ping">⚔️</div>}
        {unit.anim === 'heal' && <div className="absolute inset-0 flex items-center justify-center text-4xl z-20 animate-bounce">💚</div>}
        {unit.anim === 'buff' && <div className="absolute inset-0 flex items-center justify-center text-4xl z-20 animate-pulse">⬆️</div>}

        <div className="flex w-full justify-between items-start text-[10px]">
           {getRoleIcon(unit.role)}
           {unit.hasHyped && <Flame size={12} className="text-orange-500 animate-pulse"/>}
        </div>

        <div className="text-center w-full overflow-hidden">
            <div className="text-[9px] md:text-[10px] font-bold truncate leading-tight text-white">
              {unit.mbti ? (unit.name.startsWith('Elite ') ? `Elite ${getHeroName(unit.mbti, language)}` : unit.name.startsWith('👹 ') ? `👹 ${getHeroName(unit.mbti, language)}` : getHeroName(unit.mbti, language)) : unit.name}
            </div>
            {unit.isGuarding && <Shield size={12} className="text-blue-400 inline"/>}
            {protectedByGuard && <div className="text-[8px] text-blue-300">🛡️ Guarded</div>}
            {unit.status === 'stun' && <div className="text-[8px] bg-yellow-500 text-black px-1 rounded inline-block">STUN</div>}
        </div>

        <div className="w-full flex justify-center gap-1 text-[8px] mt-1 text-gray-400">
            {hpRatio < 0.5 && <TrendingDown size={10} className="text-red-500"/>}
            {unit.buffs.length > 0 && <TrendingUp size={10} className="text-green-500"/>}
        </div>

        <div className="w-full space-y-0.5">
            <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                <div className={`h-full ${hpRatio < 0.3 ? 'bg-red-500' : (hpRatio < 0.6 ? 'bg-yellow-500' : 'bg-green-500')}`} style={{width: `${hpRatio*100}%`}}></div>
            </div>
            <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{width: `${(unit.currentMp/unit.maxMp)*100}%`}}></div>
            </div>
            <div className="text-[8px] text-center text-gray-400">
              {unit.currentHp}/{unit.maxHp}
            </div>
            
            {/* Stats Display with Omyo Impact */}
            {unit.baseAtk !== undefined && (
              <div className="mt-1 space-y-0.5 text-[7px] text-left">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">ATK:</span>
                  <span className="text-white font-bold">{unit.baseAtk}</span>
                  {unit.factorMods && unit.factorMods.atk !== 0 && (
                    <span className={`${unit.factorMods.atk > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {unit.factorMods.atk > 0 ? '+' : ''}{unit.factorMods.atk}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">DEF:</span>
                  <span className="text-white font-bold">{unit.baseDef}</span>
                  {unit.factorMods && unit.factorMods.def !== 0 && (
                    <span className={`${unit.factorMods.def > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {unit.factorMods.def > 0 ? '+' : ''}{unit.factorMods.def}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">SPD:</span>
                  <span className="text-white font-bold">{unit.baseSpd}</span>
                  {unit.factorMods && unit.factorMods.spd !== 0 && (
                    <span className={`${unit.factorMods.spd > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {unit.factorMods.spd > 0 ? '+' : ''}{unit.factorMods.spd}
                    </span>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    );
  };

  const activeUnit = units.find(u => u.id === currentActorId);
  const activeEff = activeUnit ? getEffectiveStats(activeUnit) : null;

  return (
    <div className="h-screen w-full bg-slate-950 text-white font-sans flex flex-col overflow-hidden">

      {/* --- RECRUIT PHASE --- */}
      {phase === 'recruit' && (
        <div className="flex flex-col h-full">
            {/* Explanation Panel */}
            <div className="bg-slate-800 border-b border-slate-700 shrink-0">
              <button
                onClick={() => setShowRecruitExplanation(!showRecruitExplanation)}
                className="w-full px-4 py-2 flex items-center justify-between hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-blue-400" />
                  <span className="font-bold text-sm">{t('formationGuide', language)}</span>
                </div>
                <ChevronRight 
                  size={16} 
                  className={`text-gray-400 transition-transform ${showRecruitExplanation ? 'rotate-90' : ''}`}
                />
              </button>
              {showRecruitExplanation && (
                <div className="px-4 pb-4 space-y-3 text-sm">
                  <div>
                    <div className="font-bold text-yellow-400 mb-1">{t('ranks', language)}</div>
                    <div className="text-gray-300 space-y-1">
                      <div><span className="text-red-400">{t('sRank', language)}</span>: {t('sRankDesc', language)}</div>
                      <div><span className="text-blue-400">{t('aRank', language)}</span>: {t('aRankDesc', language)}</div>
                      <div><span className="text-purple-400">{t('bRank', language)}</span>: {t('bRankDesc', language)}</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-yellow-400 mb-1">{t('placementStrategy', language)}</div>
                    <div className="text-gray-300 space-y-1">
                      <div>• <span className="text-blue-400">{t('guardians', language)}</span> {t('guardianPlacement', language)}</div>
                      <div>• {t('guardianEffect', language)}</div>
                      <div>• <span className="text-red-400">{t('warlords', language)}</span> {t('warlordDesc', language)}</div>
                      <div>• <span className="text-orange-400">{t('duelists', language)}</span> {t('duelistDesc', language)}</div>
                      <div>• <span className="text-purple-400">{t('tacticians', language)}</span> {t('tacticianDesc', language)}</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-yellow-400 mb-1">{t('formationTips', language)}</div>
                    <div className="text-gray-300 space-y-1">
                      <div>• {t('leaderFirst', language)}</div>
                      <div>• {t('rotateShapes', language)}</div>
                      <div>• {t('perfectWa', language)}</div>
                      <div>• {t('fillAllSlots', language)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border-b border-slate-800 shrink-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <h2 className="font-bold text-yellow-500 text-sm sm:text-base">{t('warCouncil', language)}</h2>
                        <div className="text-xs text-gray-400 flex gap-3 sm:gap-4">
                            <span>UNITS: <b className="text-white">{placedUnits.length}/5</b></span>
                            <span>HP: <b className="text-white">{placedUnits.reduce((a,b)=>a+b.hp,0)}</b></span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        {!hasLeader && <div className="text-xs text-red-500 font-bold flex items-center animate-pulse"><AlertCircle size={14} className="mr-1"/> {t('placeLeaderFirst', language)}</div>}
                        <button
                          onClick={handleSaveProfile}
                          className="px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded font-bold text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
                          title="Save your current team"
                        >
                          <Save size={14} /> <span className="hidden sm:inline">Save</span>
                        </button>
                        <button
                          disabled={placedUnits.length < 5 || !hasLeader}
                          onClick={handleDeploy}
                          className="px-4 sm:px-6 py-2 bg-red-600 disabled:bg-gray-800 disabled:text-gray-500 rounded font-bold text-xs sm:text-sm"
                        >
                          {t('deploy', language)}
                        </button>
                        {placedUnits.length >= 5 && (() => {
                          const teamHashcode = encodeTeamHashcode({
                            placedUnits,
                            mbti: userMBTI,
                            factorScores
                          });
                          return teamHashcode ? (
                            <div className="text-xs border-l border-slate-700 pl-3">
                              <div className="text-slate-400 mb-1">{t('teamHashcode', language)}</div>
                              <div className="text-yellow-400 font-mono font-bold bg-slate-800 px-2 py-1 rounded select-all break-all">
                                {teamHashcode}
                              </div>
                            </div>
                          ) : null;
                        })()}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
                <div className="flex-1 flex flex-col items-center bg-slate-900/50 rounded-lg p-2 gap-4">
                    <div className="flex items-start gap-6">
                        <div className="flex flex-col items-center gap-2 w-36">
                            <div className="text-xs font-bold text-gray-400">ACTIVE UNIT</div>
                            {selectedRecruit ? (
                                <div className="flex flex-col items-center gap-2">
                                    <ShapePreview
                                        shapeName={selectedRecruit.shape}
                                        role={selectedRecruit.role}
                                        rotation={rotation}
                                        isInteractive={true}
                                        onRotate={() => setRotation((r) => (r + 1) % 4)}
                                    />
                                    <div className="text-[10px] text-yellow-500 animate-pulse mb-1">{t('tapToRotate', language)}</div>

                                    <div className="w-full bg-slate-800 p-2 rounded border border-slate-600 text-[10px] shadow-lg">
                                        <div className="font-bold text-white mb-1 flex items-center gap-1">
                                            <Info size={10}/> {t('tacticalAnalysis', language)}
                                        </div>
                                        <div className="mb-2 text-gray-300 italic leading-tight">
                                            "{selectedRecruit.mbti ? getSkillDesc(selectedRecruit.mbti, language) : selectedRecruit.desc}"
                                        </div>
                                        <div className="border-t border-gray-600 pt-1">
                                            <div className="font-bold text-gray-400 mb-1">{t('teamImpact', language)}</div>
                                            <div className="grid grid-cols-3 gap-1">
                                                <div className="bg-black/40 p-1 rounded text-center">
                                                    <div className="text-gray-500">HP</div>
                                                    <div className="text-green-400">+{selectedRecruit.hp}</div>
                                                </div>
                                                <div className="bg-black/40 p-1 rounded text-center">
                                                    <div className="text-gray-500">ATK</div>
                                                    <div className="text-red-400">+{selectedRecruit.atk}</div>
                                                </div>
                                                <div className="bg-black/40 p-1 rounded text-center">
                                                    <div className="text-gray-500">DEF</div>
                                                    <div className="text-blue-400">+{selectedRecruit.def}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-24 h-24 border border-dashed border-gray-700 rounded flex items-center justify-center text-xs text-gray-600 text-center p-2">
                                    Select hero to view tactical data
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-center gap-2">
                             <div className="text-xs font-bold text-gray-400">FORMATION</div>
                             <div
                                className="grid grid-cols-5 gap-px bg-black p-1 rounded border-2 border-slate-700 shadow-2xl"
                                onMouseLeave={() => setHoverCell(null)}
                             >
                                {recruitGrid.map((row, y) => row.map((cellMBTI, x) => {
                                    const unit = placedUnits.find(u => u.mbti === cellMBTI);
                                    const isOccupied = !!unit;
                                    const isCore = unit && unit.coreX === x && unit.coreY === y;

                                    let isGhost = false;
                                    let isGhostCore = false;
                                    let isGhostValid = false;

                                    if(selectedRecruit && hoverCell) {
                                        const points = getRotatedPoints(selectedRecruit, rotation);
                                        isGhost = points.some(([dx, dy]) => (hoverCell.x + dx) === x && (hoverCell.y + dy) === y);
                                        isGhostCore = hoverCell.x === x && hoverCell.y === y;
                                        if (isGhost || isGhostCore) {
                                            isGhostValid = canPlace(recruitGrid, points, hoverCell.x, hoverCell.y);
                                        }
                                    }

                                    return (
                                        <div
                                        key={`${x}-${y}`}
                                        onClick={() => handleGridClick(x, y)}
                                        onMouseEnter={() => setHoverCell({x, y})}
                                        className={`
                                            w-9 h-9 md:w-10 md:h-10 rounded-sm flex items-center justify-center text-[8px] relative transition-all
                                            ${isOccupied ? getRoleColor(unit.role) : 'bg-slate-800 border border-slate-700'}
                                            ${!isOccupied && isGhost ? (isGhostValid ? 'bg-white/20 border-white/40' : 'bg-red-900/40 border-red-500/40') : ''}
                                            ${!isOccupied && !isGhost && selectedRecruit ? 'hover:bg-slate-700 cursor-pointer' : ''}
                                        `}
                                        >
                                            {isCore && <Star size={12} className="text-white fill-white shadow-sm" />}
                                            {isOccupied && !isCore && <div className="w-1.5 h-1.5 bg-black/20 rounded-full"></div>}
                                            {!isOccupied && isGhostCore && <Star size={12} className={`opacity-50 ${isGhostValid ? 'text-white' : 'text-red-500'}`} />}
                                        </div>
                                    );
                                }))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:w-96 flex flex-col gap-2 h-full overflow-hidden">
                    <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest">Available Heroes</h3>
                    <div className="flex-1 overflow-y-auto pr-2">
                         {placedUnits.length > 0 && (
                            <div className="mb-4">
                                <div className="text-xs text-blue-400 font-bold mb-1">DEPLOYED ({placedUnits.length}/5)</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {placedUnits.map(u => (
                                        <div key={u.mbti} onClick={() => removeUnit(u)} className="flex items-center gap-2 bg-blue-900/30 border border-blue-500/50 p-1.5 rounded cursor-pointer hover:bg-red-900/50 group">
                                            <div className="bg-black p-0.5 rounded"><ShapePreview shapeName={u.shape} role={u.role}/></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-bold text-white truncate">{u.name}</div>
                                                <div className="text-[8px] text-gray-400">{u.role}</div>
                                            </div>
                                            <div className="text-[8px] font-bold text-red-400 opacity-0 group-hover:opacity-100">X</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 pb-8">
                            {availablePool.map(c => {
                                const wa = getWaBonus(userMBTI, c.mbti);
                                const isSelected = selectedRecruit?.mbti === c.mbti;
                                const isLocked = !hasLeader && !c.isLeader;
                                return (
                                    <div
                                      key={c.mbti}
                                      onClick={() => {
                                          if(!isLocked) {
                                              setSelectedRecruit(c);
                                              setRotation(0);
                                          }
                                      }}
                                      className={`
                                        flex flex-col p-2 rounded border transition-all relative overflow-hidden
                                        ${isSelected ? 'bg-slate-700 border-white ring-1 ring-white' : 'bg-slate-800 border-slate-700'}
                                        ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:border-gray-500 cursor-pointer'}
                                      `}
                                    >
                                        {isLocked && <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20"><Lock size={16}/></div>}
                                        <div className="flex justify-between items-start mb-1">
                                            <div className={`text-[9px] font-bold px-1 rounded ${getRoleColor(c.role, false)} border border-current`}>{c.role}</div>
                                            <div className={`text-[8px] px-1 rounded bg-black/40 ${wa.color}`}>{wa.text}</div>
                                        </div>
                                        <div className="flex gap-2 items-center mb-1">
                                            <div className="bg-black p-0.5 rounded shrink-0">
                                                <ShapePreview shapeName={c.shape} role={c.role} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-xs truncate leading-tight">{getHeroName(c.mbti, language)}</div>
                                                <div className="text-[9px] text-yellow-500 truncate">{getSkillName(c.mbti, language)}</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 text-[9px] bg-black/20 p-1 rounded">
                                            <div className="text-green-400 text-center">{c.hp}</div>
                                            <div className="text-red-400 text-center">{c.atk}</div>
                                            <div className="text-blue-400 text-center">{c.def}</div>
                                        </div>
                                        {c.isLeader && <div className="absolute top-0 right-0 p-1"><Star size={10} className="text-yellow-400 fill-yellow-400 animate-pulse"/></div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- QUIZ PHASE --- */}
      {phase === 'quiz' && quizQuestions.length > 0 && (
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
      )}

      {/* --- QUIZ RESULT PHASE --- */}
      {phase === 'quiz_result' && userMBTI && (
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
              <h3 className="text-xl font-bold mb-4 text-white">Factor Exposure Scores</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {Object.entries(factorScores).map(([factor, score]) => (
                  <div key={factor} className="bg-slate-800 p-3 rounded border border-slate-700">
                    <div className="font-medium text-slate-300">{AXIS_META[factor]?.label || factor}</div>
                    <div className="text-emerald-400 font-bold">{score.toFixed(1)} / 10</div>
                  </div>
                ))}
              </div>
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
      )}

      {/* --- INTRO / SELECT / RESULT (Standard) --- */}
      {['intro', 'select_mbti', 'test', 'result'].includes(phase) && (
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
                            {hasTeam && (
                              <div className="space-y-2">
                                <div className="text-xs text-slate-400 mb-1">{t('enterEnemyHashcode', language)}</div>
                                <input
                                  type="text"
                                  value={pvpHashcode}
                                  onChange={(e) => setPvpHashcode(e.target.value)}
                                  placeholder={t('enterHashcodePlaceholder', language)}
                                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm font-mono text-center"
                                  maxLength={9}
                                />
                                <button 
                                  onClick={() => {
                                    const normalizedHashcode = pvpHashcode.trim();
                                    if (!normalizedHashcode || normalizedHashcode.length !== 9) {
                                      alert(t('enterHashcodePlaceholder', language));
                                      return;
                                    }
                                    
                                    // Decode team from hashcode
                                    const enemyTeamData = loadTeamByHashcode(normalizedHashcode);
                                    console.log('Decoding hashcode:', normalizedHashcode, 'Result:', enemyTeamData);
                                    if (!enemyTeamData || !enemyTeamData.placedUnits || enemyTeamData.placedUnits.length < 5) {
                                      alert(`${t('invalidHashcode', language)}: "${normalizedHashcode}"`);
                                      return;
                                    }
                                    
                                    handleLoadProfile();
                                    setIsPvPMode(true);
                                    setPvpHashcode(normalizedHashcode);
                                    // Use setTimeout to ensure state is updated before proceeding
                                    setTimeout(() => {
                                      // Generate factor returns for PvP battle
                                      const returns = generateFactorReturns();
                                      setFactorReturns(returns);
                                      
                                      // Create units for Omyo reveal (with individual hero exposures)
                                      const sortedMyTeam = [...placedUnits].sort((a, b) => a.coreX - b.coreX);
                                      const myBattleUnits = sortedMyTeam.map(u => {
                                        const wa = getWaBonus(userMBTI, u.mbti);
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
                                      
                                      setUnits([...myBattleUnits, ...enemies]);
                                      setPhase('omyo_reveal');
                                      setShowOmyoReveal(true);
                                    }, 200);
                                  }}
                                  className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-bold"
                                >
                                  {t('startPvPBattle', language)}
                                </button>
                                <div className="text-xs text-slate-500 text-center space-y-1">
                                  <div>Profile Hashcode: #{profile?.hashcode || 'N/A'}</div>
                                  {hasTeam && (() => {
                                    const teamHashcode = encodeTeamHashcode({
                                      placedUnits: profile.placedUnits,
                                      mbti: profile.mbti,
                                      factorScores: profile.factorScores
                                    });
                                    return teamHashcode ? (
                                      <div className="text-yellow-400 font-mono font-bold mt-1">
                                        Team Hashcode: {teamHashcode}
                                      </div>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                            )}
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
                    <div className="bg-slate-900 p-4 rounded mb-6">{getSkillDesc(userMBTI, language)}</div>
                    <button onClick={startRecruit} className="bg-white text-black px-8 py-3 rounded-full font-bold">{t('enterWarCouncil', language)}</button>
                </div>
             )}
        </div>
      )}

      {/* --- OMYO REVEAL PHASE --- */}
      {phase === 'omyo_reveal' && factorReturns && (
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
      )}

      {/* --- BATTLE PHASE --- */}
      {phase === 'battle' && (
        <div className="flex-col h-full relative flex">
            {/* Omyo Impact Sequence */}
            {showOmyoImpact && units.length > 0 && factorReturns && (
                <div className="absolute inset-0 z-50 bg-black/95 overflow-y-auto">
                    <div className="max-w-5xl w-full mx-auto p-4 space-y-4 min-h-full">
                        {/* Header */}
                        <div className="text-center mb-4">
                            <div className="text-5xl mb-2">⚡</div>
                            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 mb-1">
                                {t('omyoForcesImpacting', language)}
                            </h1>
                            <p className="text-slate-400 italic text-sm">{t('omyoForcesSubtitle', language)}</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Factor Returns Radar Chart */}
                            <div className="bg-slate-900 rounded-xl p-4 border border-purple-500/30">
                                <h2 className="text-lg font-bold mb-3 text-purple-400">{t('factorReturnsExposures', language)}</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RadarChart data={(() => {
                                        const playerUnits = units.filter(u => u.isPlayer);
                                        const enemyUnits = units.filter(u => !u.isPlayer);
                                        
                                        // Calculate team exposures from individual hero MBTI types
                                        // Player team: aggregate from each hero's MBTI
                                        const playerExposureTotals = {
                                            Quality: 0, Momentum: 0, Value: 0, Growth: 0,
                                            LowVol: 0, Size: 0, Yield: 0, Liquidity: 0
                                        };
                                        
                                        playerUnits.forEach(u => {
                                            const scores = getFactorScoresFromMBTI(u.mbti);
                                            Object.keys(playerExposureTotals).forEach(factor => {
                                                playerExposureTotals[factor] += scores[factor] || 0;
                                            });
                                        });
                                        
                                        const playerCount = playerUnits.length || 1;
                                        const playerExposure = {
                                            Quality: playerExposureTotals.Quality / playerCount,
                                            Momentum: playerExposureTotals.Momentum / playerCount,
                                            Value: playerExposureTotals.Value / playerCount,
                                            Growth: playerExposureTotals.Growth / playerCount,
                                            LowVol: playerExposureTotals.LowVol / playerCount,
                                            Size: playerExposureTotals.Size / playerCount,
                                            Yield: playerExposureTotals.Yield / playerCount,
                                            Liquidity: playerExposureTotals.Liquidity / playerCount
                                        };
                                        
                                        // Enemy team: aggregate from each hero's MBTI
                                        const enemyExposureTotals = {
                                            Quality: 0, Momentum: 0, Value: 0, Growth: 0,
                                            LowVol: 0, Size: 0, Yield: 0, Liquidity: 0
                                        };
                                        
                                        enemyUnits.forEach(u => {
                                            const scores = getFactorScoresFromMBTI(u.mbti);
                                            Object.keys(enemyExposureTotals).forEach(factor => {
                                                enemyExposureTotals[factor] += scores[factor] || 0;
                                            });
                                        });
                                        
                                        const enemyCount = enemyUnits.length || 1;
                                        const enemyExposure = {
                                            Quality: enemyExposureTotals.Quality / enemyCount,
                                            Momentum: enemyExposureTotals.Momentum / enemyCount,
                                            Value: enemyExposureTotals.Value / enemyCount,
                                            Growth: enemyExposureTotals.Growth / enemyCount,
                                            LowVol: enemyExposureTotals.LowVol / enemyCount,
                                            Size: enemyExposureTotals.Size / enemyCount,
                                            Yield: enemyExposureTotals.Yield / enemyCount,
                                            Liquidity: enemyExposureTotals.Liquidity / enemyCount
                                        };
                                        
                                        return Object.entries(factorReturns).map(([factor, ret]) => {
                                            // Scale factor returns from percentage (-15% to +20%) to 0-10 scale for display
                                            // Map -15% to 0, +20% to 10, 0% to ~4.3
                                            const returnPercent = parseFloat(ret) * 100;
                                            const returnScaled = ((returnPercent + 15) / 35) * 10; // Normalize to 0-10
                                            
                                            return {
                                                factor: AXIS_META[factor]?.label || factor,
                                                returnValue: returnScaled,
                                                returnPercent: returnPercent, // Keep original for tooltip
                                                playerExposure: playerExposure[factor] || 0,
                                                enemyExposure: enemyExposure[factor] || 0,
                                                zero: 0
                                            };
                                        });
                                    })()}>
                                        <PolarGrid stroke="#374151" />
                                        <PolarAngleAxis 
                                            dataKey="factor" 
                                            tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                            className="text-xs"
                                        />
                                        <PolarRadiusAxis 
                                            angle={90} 
                                            domain={[0, 10]}
                                            tick={{ fill: '#6B7280', fontSize: 9 }}
                                        />
                                        <Radar
                                            name={t('yourTeamExposure', language)}
                                            dataKey="playerExposure"
                                            stroke="#3B82F6"
                                            fill="#3B82F6"
                                            fillOpacity={0.2}
                                            strokeWidth={2}
                                            strokeDasharray="5 3"
                                        />
                                        <Radar
                                            name={t('enemyTeamExposure', language)}
                                            dataKey="enemyExposure"
                                            stroke="#EF4444"
                                            fill="#EF4444"
                                            fillOpacity={0.2}
                                            strokeWidth={2}
                                            strokeDasharray="3 5"
                                        />
                                        <Radar
                                            name={t('factorReturn', language)}
                                            dataKey="returnValue"
                                            stroke="none"
                                            fill="none"
                                            strokeWidth={0}
                                            dot={(props) => {
                                                const { payload, cx, cy } = props;
                                                const returnPercent = payload.returnPercent;
                                                const isPositive = returnPercent > 0.5;
                                                const isNegative = returnPercent < -0.5;
                                                const isNearZero = !isPositive && !isNegative;
                                                
                                                const color = isPositive ? '#10B981' : isNegative ? '#EF4444' : '#6B7280';
                                                
                                                return (
                                                    <circle
                                                        cx={cx}
                                                        cy={cy}
                                                        r={5}
                                                        fill={color}
                                                        stroke={color}
                                                        strokeWidth={2}
                                                    />
                                                );
                                            }}
                                            connectNulls={false}
                                        />
                                        <Tooltip 
                                            formatter={(value, name, props) => {
                                                if (name === 'Factor Return') {
                                                    const percent = props.payload?.returnPercent;
                                                    return percent !== undefined ? `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%` : `${value.toFixed(1)}`;
                                                }
                                                return `${value.toFixed(1)} / 10`;
                                            }}
                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }}
                                        />
                                        <Legend 
                                            wrapperStyle={{ paddingTop: '10px' }}
                                            iconType="line"
                                            formatter={(value, entry) => (
                                                <span style={{ 
                                                    color: entry.color, 
                                                    fontSize: '12px'
                                                }}>
                                                    {value}
                                                </span>
                                            )}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Stat Impact Horizontal Bar Chart */}
                            <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                                <h2 className="text-lg font-bold mb-3 text-yellow-300">
                                    {t('statImpactSummary', language)}
                                    {isChallengeMode && <span className="text-xs text-purple-400 ml-2">({t('omyoHedgeActive', language)})</span>}
                                </h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart 
                                        layout="vertical"
                                        data={(() => {
                                            const playerUnits = units.filter(u => u.isPlayer);
                                            const enemyUnits = units.filter(u => !u.isPlayer);
                                            
                                            const playerTotals = { atk: 0, def: 0, spd: 0, hp: 0, mp: 0 };
                                            const enemyTotals = { atk: 0, def: 0, spd: 0, hp: 0, mp: 0 };
                                            
                                            playerUnits.forEach(u => {
                                                if (u.factorMods) {
                                                    playerTotals.atk += u.factorMods.atk || 0;
                                                    playerTotals.def += u.factorMods.def || 0;
                                                    playerTotals.spd += u.factorMods.spd || 0;
                                                    playerTotals.hp += u.factorMods.hp || 0;
                                                    playerTotals.mp += u.factorMods.mp || 0;
                                                }
                                            });
                                            
                                            enemyUnits.forEach(u => {
                                                if (u.factorMods) {
                                                    // Apply Omyo Hedge in challenge mode: zero out negative impacts
                                                    const atk = isChallengeMode ? Math.max(0, u.factorMods.atk || 0) : (u.factorMods.atk || 0);
                                                    const def = isChallengeMode ? Math.max(0, u.factorMods.def || 0) : (u.factorMods.def || 0);
                                                    const spd = isChallengeMode ? Math.max(0, u.factorMods.spd || 0) : (u.factorMods.spd || 0);
                                                    const hp = isChallengeMode ? Math.max(0, u.factorMods.hp || 0) : (u.factorMods.hp || 0);
                                                    const mp = isChallengeMode ? Math.max(0, u.factorMods.mp || 0) : (u.factorMods.mp || 0);
                                                    
                                                    enemyTotals.atk += atk;
                                                    enemyTotals.def += def;
                                                    enemyTotals.spd += spd;
                                                    enemyTotals.hp += hp;
                                                    enemyTotals.mp += mp;
                                                }
                                            });
                                            
                                            return [
                                                { stat: 'ATK', player: playerTotals.atk, enemy: enemyTotals.atk, zero: 0 },
                                                { stat: 'DEF', player: playerTotals.def, enemy: enemyTotals.def, zero: 0 },
                                                { stat: 'SPD', player: playerTotals.spd, enemy: enemyTotals.spd, zero: 0 },
                                                { stat: 'HP', player: playerTotals.hp, enemy: enemyTotals.hp, zero: 0 },
                                                { stat: 'MP', player: playerTotals.mp, enemy: enemyTotals.mp, zero: 0 }
                                            ];
                                        })()}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis 
                                            type="number"
                                            tick={{ fill: '#6B7280', fontSize: 10 }}
                                            domain={['auto', 'auto']}
                                        />
                                        <YAxis 
                                            type="category"
                                            dataKey="stat"
                                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                            width={60}
                                        />
                                        <ReferenceLine x={0} stroke="#6B7280" strokeWidth={2} />
                                        <Tooltip 
                                            formatter={(value, name) => {
                                                if (name === 'zero') return '0';
                                                return `${value > 0 ? '+' : ''}${value}`;
                                            }}
                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '8px' }}
                                        />
                                        <Legend 
                                            wrapperStyle={{ paddingTop: '10px' }}
                                            iconType="square"
                                        />
                                        <Bar 
                                            name="Your Forces" 
                                            dataKey="player" 
                                            fill="#3B82F6" 
                                            radius={[0, 4, 4, 0]}
                                        />
                                        <Bar 
                                            name={isChallengeMode ? "Enemy Forces (Hedged)" : "Enemy Forces"} 
                                            dataKey="enemy" 
                                            fill="#EF4444" 
                                            radius={[0, 4, 4, 0]}
                                        />
                                        <Bar 
                                            name="Zero" 
                                            dataKey="zero" 
                                            fill="#6B7280" 
                                            radius={0}
                                            barSize={2}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Active Factors Quick View */}
                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                            <h2 className="text-sm font-bold mb-2 text-slate-300">Active Factors</h2>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(factorReturns)
                                    .filter(([_, ret]) => parseFloat(ret) !== 0)
                                    .map(([factor, ret]) => {
                                        const value = parseFloat(ret) * 100;
                                        const isPositive = value >= 0;
                                        return (
                                            <div 
                                                key={factor}
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    isPositive 
                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                }`}
                                            >
                                                {AXIS_META[factor]?.label || factor}: {isPositive ? '+' : ''}{value.toFixed(1)}%
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Continue Button */}
                        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-purple-500/30 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 text-center mt-4">
                            <button
                                onClick={() => {
                                    setShowOmyoImpact(false);
                                    setShowStartOverlay(true);
                                }}
                                className="bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white px-8 sm:px-12 py-3 rounded-full font-bold text-base sm:text-lg shadow-lg transform hover:scale-105 transition-all w-full sm:w-auto"
                            >
                                {t('beginBattle', language)}
                            </button>
                        </div>

                        {/* Hero Factor Impact Matrix */}
                        {(() => {
                            const playerUnits = units.filter(u => u.isPlayer);
                            const factors = ['Quality', 'Momentum', 'Value', 'Growth', 'LowVol', 'Size', 'Yield', 'Liquidity'];
                            const stats = ['ATK', 'DEF', 'SPD', 'HP', 'MP'];
                            
                            // Calculate impact per factor per stat for each hero
                            // Uses individual hero's MBTI-based factor scores
                            const calculateFactorImpact = (unit, factor) => {
                                if (!unit.factorMods || !unit.mbti) return { atk: 0, def: 0, spd: 0, hp: 0, mp: 0 };
                                
                                // Get this hero's individual factor scores from their MBTI
                                const heroFactorScores = getFactorScoresFromMBTI(unit.mbti);
                                const score = heroFactorScores[factor] || 0;
                                const returns = parseFloat(factorReturns[factor] || 0);
                                const impact = (score / 10) * returns * 200;
                                
                                const mods = { atk: 0, def: 0, spd: 0, hp: 0, mp: 0 };
                                
                                switch(factor) {
                                    case 'Quality':
                                        mods.def = Math.round(impact * 0.8);
                                        mods.hp = Math.round(impact * 0.5);
                                        break;
                                    case 'Momentum':
                                        mods.spd = Math.round(impact * 0.6);
                                        mods.atk = Math.round(impact * 0.4);
                                        break;
                                    case 'Value':
                                        mods.hp = Math.round(impact * 0.7);
                                        mods.def = Math.round(impact * 0.3);
                                        break;
                                    case 'Growth':
                                        mods.atk = Math.round(impact * 0.7);
                                        mods.mp = Math.round(impact * 0.3);
                                        break;
                                    case 'LowVol':
                                        mods.def = Math.round(impact * 0.6);
                                        mods.hp = Math.round(impact * 0.4);
                                        break;
                                    case 'Size':
                                        mods.spd = Math.round(impact * 0.7);
                                        mods.atk = Math.round(impact * 0.3);
                                        break;
                                    case 'Yield':
                                        mods.mp = Math.round(impact * 0.6);
                                        mods.hp = Math.round(impact * 0.4);
                                        break;
                                    case 'Liquidity':
                                        mods.spd = Math.round(impact * 0.5);
                                        mods.mp = Math.round(impact * 0.5);
                                        break;
                                }
                                
                                return mods;
                            };
                            
                            // Calculate team totals
                            const teamTotals = { atk: 0, def: 0, spd: 0, hp: 0, mp: 0 };
                            const teamBaseStats = { atk: 0, def: 0, spd: 0, hp: 0, mp: 0 };
                            playerUnits.forEach(u => {
                                if (u.factorMods) {
                                    teamTotals.atk += u.factorMods.atk || 0;
                                    teamTotals.def += u.factorMods.def || 0;
                                    teamTotals.spd += u.factorMods.spd || 0;
                                    teamTotals.hp += u.factorMods.hp || 0;
                                    teamTotals.mp += u.factorMods.mp || 0;
                                }
                                if (u.baseAtk !== undefined) {
                                    teamBaseStats.atk += u.baseAtk;
                                    teamBaseStats.def += u.baseDef;
                                    teamBaseStats.spd += u.baseSpd;
                                    teamBaseStats.hp += u.baseHp || 0;
                                    teamBaseStats.mp += u.baseMp || 0;
                                }
                            });
                            
                            return (
                                <>
                                    {/* Team Summary Matrix */}
                                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 overflow-x-auto">
                                        <h2 className="text-lg font-bold mb-3 text-blue-400">Team Summary Impact Matrix</h2>
                                        <div className="bg-slate-800/50 rounded-lg p-3">
                                            <div className="font-bold text-white mb-2 text-sm">Your Team</div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs border-collapse">
                                                    <thead>
                                                        <tr>
                                                            <th className="text-left p-1 text-gray-400 font-normal">Stat / Factor</th>
                                                            {factors.map(factor => (
                                                                <th key={factor} className="p-1 text-gray-400 font-normal text-center min-w-[70px]">
                                                                    {AXIS_META[factor]?.label?.split(' ')[0] || factor}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                        {factorScores && (
                                                            <tr>
                                                                <td className="p-1 text-gray-500 font-medium text-left">Exposure</td>
                                                                {factors.map(factor => (
                                                                    <td key={factor} className="p-1 text-center text-gray-400">
                                                                        {(factorScores[factor] || 0).toFixed(1)}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        )}
                                                    </thead>
                                                    <tbody>
                                                        {stats.map(stat => {
                                                            const statMap = { 'ATK': 'atk', 'DEF': 'def', 'SPD': 'spd', 'HP': 'hp', 'MP': 'mp' };
                                                            const statKey = statMap[stat];
                                                            return (
                                                                <tr key={stat}>
                                                                    <td className="p-1 text-gray-300 font-medium">
                                                                        {stat} <span className="text-gray-500">({teamBaseStats[statKey]})</span>
                                                                    </td>
                                                                    {factors.map(factor => {
                                                                        // Calculate team total impact for this factor/stat combination
                                                                        let totalImpact = 0;
                                                                        playerUnits.forEach(u => {
                                                                            const impact = calculateFactorImpact(u, factor);
                                                                            totalImpact += impact[statKey] || 0;
                                                                        });
                                                                        return (
                                                                            <td 
                                                                                key={factor}
                                                                                className={`p-1 text-center ${
                                                                                    totalImpact > 0 ? 'text-green-400' : 
                                                                                    totalImpact < 0 ? 'text-red-400' : 
                                                                                    'text-gray-600'
                                                                                }`}
                                                                            >
                                                                                {totalImpact !== 0 ? (totalImpact > 0 ? '+' : '') + totalImpact : '-'}
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Individual Hero Matrices */}
                                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 overflow-x-auto">
                                        <h2 className="text-lg font-bold mb-3 text-blue-400">Hero Factor Impact Matrix</h2>
                                        <div className="space-y-4">
                                            {playerUnits.map(unit => {
                                                const statMap = { 'ATK': 'atk', 'DEF': 'def', 'SPD': 'spd', 'HP': 'hp', 'MP': 'mp' };
                                                return (
                                                    <div key={unit.id} className="bg-slate-800/50 rounded-lg p-3">
                                                        <div className="font-bold text-white mb-2 text-sm">{unit.mbti ? getHeroName(unit.mbti, language) : unit.name}</div>
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs border-collapse">
                                                                <thead>
                                                                    <tr>
                                                                        <th className="text-left p-1 text-gray-400 font-normal">Stat / Factor</th>
                                                                        {factors.map(factor => (
                                                                            <th key={factor} className="p-1 text-gray-400 font-normal text-center min-w-[70px]">
                                                                                {AXIS_META[factor]?.label?.split(' ')[0] || factor}
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                    {(() => {
                                                                        // Get this hero's individual exposure from their MBTI
                                                                        const heroExposure = getFactorScoresFromMBTI(unit.mbti);
                                                                        return (
                                                                            <tr>
                                                                                <td className="p-1 text-gray-500 font-medium text-left">Exposure</td>
                                                                                {factors.map(factor => (
                                                                                    <td key={factor} className="p-1 text-center text-emerald-400 font-bold">
                                                                                        {(heroExposure[factor] || 0).toFixed(1)}
                                                                                    </td>
                                                                                ))}
                                                                            </tr>
                                                                        );
                                                                    })()}
                                                                </thead>
                                                                <tbody>
                                                                    {stats.map(stat => {
                                                                        const statKey = statMap[stat];
                                                                        const baseValue = stat === 'HP' ? (unit.baseHp || 0) :
                                                                                         stat === 'MP' ? (unit.baseMp || 0) :
                                                                                         stat === 'ATK' ? (unit.baseAtk || 0) :
                                                                                         stat === 'DEF' ? (unit.baseDef || 0) :
                                                                                         stat === 'SPD' ? (unit.baseSpd || 0) : 0;
                                                                        return (
                                                                            <tr key={stat}>
                                                                                <td className="p-1 text-gray-300 font-medium">
                                                                                    {stat} <span className="text-gray-500">({baseValue})</span>
                                                                                </td>
                                                                                {factors.map(factor => {
                                                                                    const impact = calculateFactorImpact(unit, factor);
                                                                                    const value = impact[statKey] || 0;
                                                                                    return (
                                                                                        <td 
                                                                                            key={factor}
                                                                                            className={`p-1 text-center ${
                                                                                                value > 0 ? 'text-green-400' : 
                                                                                                value < 0 ? 'text-red-400' : 
                                                                                                'text-gray-600'
                                                                                            }`}
                                                                                        >
                                                                                            {value !== 0 ? (value > 0 ? '+' : '') + value : '-'}
                                                                                        </td>
                                                                                    );
                                                                                })}
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {showStartOverlay && (
                <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer" onClick={() => setShowStartOverlay(false)}>
                    <div className="text-center animate-bounce">
                        <h1 className="text-6xl font-black text-red-600 mb-2">
                            {isHellMode ? t('hellMode', language) : (isChallengeMode ? t('challengeMode', language) : t('battleStart', language))}
                        </h1>
                        <p className="text-white text-xl blink">{t('tapToBegin', language)}</p>
                    </div>
                </div>
            )}

            {/* BATTLE KEY POPUP */}
            {showHelp && (
                <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center p-4 text-xs text-gray-300" onClick={() => setShowHelp(false)}>
                    <div className="max-w-md space-y-4">
                        <h3 className="font-bold text-white text-lg border-b pb-2">BATTLE KEY</h3>
                        <p><b className="text-yellow-400">Sentinel Stance:</b> Guardians Taunt enemies when Defending. <b>DEF is Halved</b>. Stance breaks on hit. Skills bypass Taunt.</p>
                        <p><b className="text-yellow-400">Holy DMG:</b> Ignores Defense entirely.</p>
                        <p><b className="text-red-400">Fatigue:</b> As HP drops, ATK/DEF decrease to 50%.</p>
                        <p><b className="text-blue-400">Resilience:</b> 'P' Types (e.g. INFP) resist Fatigue.</p>
                        <p><b className="text-red-600">Demoralize:</b> When a Leader dies, their team loses stats.</p>
                        <div className="text-center pt-4 text-gray-500">Tap to close</div>
                    </div>
                </div>
            )}

            {/* Factor Returns Impact Banner */}
            {factorReturns && units.filter(u => u.isPlayer).length > 0 && (
              <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-b border-yellow-700/50 px-4 py-2 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-300">FACTOR RETURNS IMPACT:</span>
                  </div>
                  <div className="flex gap-4 text-[10px]">
                    {Object.entries(factorReturns).map(([factor, returns]) => {
                      const ret = parseFloat(returns);
                      const isPositive = ret >= 0;
                      const impact = units.filter(u => u.isPlayer).some(u => u.factorMods && (
                        (factor === 'Quality' && (u.factorMods.def !== 0 || u.factorMods.hp !== 0)) ||
                        (factor === 'Momentum' && (u.factorMods.spd !== 0 || u.factorMods.atk !== 0)) ||
                        (factor === 'Value' && (u.factorMods.hp !== 0 || u.factorMods.def !== 0)) ||
                        (factor === 'Growth' && (u.factorMods.atk !== 0 || u.factorMods.mp !== 0)) ||
                        (factor === 'LowVol' && (u.factorMods.def !== 0 || u.factorMods.hp !== 0)) ||
                        (factor === 'Size' && (u.factorMods.spd !== 0 || u.factorMods.atk !== 0)) ||
                        (factor === 'Yield' && (u.factorMods.mp !== 0 || u.factorMods.hp !== 0)) ||
                        (factor === 'Liquidity' && (u.factorMods.spd !== 0 || u.factorMods.mp !== 0))
                      ));
                      if (!impact) return null;
                      return (
                        <div key={factor} className={`${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {AXIS_META[factor]?.label || factor}: {isPositive ? '+' : ''}{(ret * 100).toFixed(1)}%
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="text-[9px] text-yellow-200/80 mt-1">
                  Check hero cards below for stat modifications. Green = boosted, Red = weakened.
                </div>
              </div>
            )}

            <div className="flex-1 bg-slate-900/50 p-2 flex items-center justify-center gap-2 border-b border-slate-800 relative">
                {/* Help Icon */}
                <div className="absolute top-2 right-2 cursor-pointer z-20 text-gray-500 hover:text-white" onClick={() => setShowHelp(!showHelp)}>
                    <HelpCircle size={20}/>
                </div>
                {units.filter(u => !u.isPlayer).map((u, i) => (
                    <UnitCard key={u.id} unit={u} onClick={() => { if(selectedAction) handleAction(selectedAction, u.id); }} />
                ))}
            </div>

            <div className="bg-black flex flex-col border-y border-slate-800 shrink-0">
                <div className="h-20 px-4 py-1 flex flex-col justify-end gap-0.5 text-xs text-green-400 font-mono overflow-hidden bg-black/50 border-b border-white/10">
                     {battleLog.slice(-4).map((log, idx) => (
                       <div key={idx} className="truncate opacity-75" style={{ opacity: idx === 3 ? 1 : 0.5 + (idx * 0.15) }}>
                         {`> ${log}`}
                       </div>
                     ))}
                </div>
                <div className="h-10 px-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                     <span className="text-[10px] text-gray-500 font-bold uppercase sticky left-0 bg-black z-10 pr-2">NEXT:</span>
                     {turnQueue.slice(0, 10).map((id, i) => {
                        const u = units.find(x => x.id === id);
                        return u ? (
                            <div key={i} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border ${u.isPlayer?'bg-blue-900 border-blue-500':'bg-red-900 border-red-500'}`}>{u.role[0]}</div>
                        ) : null;
                    })}
                </div>
            </div>

            <div className="flex-1 bg-slate-900/50 p-2 flex items-center justify-center gap-2 border-t border-slate-800">
                {units.filter(u => u.isPlayer).map((u, i) => (
                    <UnitCard key={u.id} unit={u} onClick={() => { if(selectedAction && u.isPlayer) handleAction(selectedAction, u.id); }} />
                ))}
            </div>

            <div className="h-36 bg-slate-900 border-t border-slate-800 p-2">
                {isPlayerDemoralized && activeUnit?.isPlayer ? (
                    <div className="h-full flex flex-col items-center justify-center text-red-500 animate-pulse border border-red-900 bg-black/50 rounded">
                        <HeartCrack size={32} className="mb-2"/>
                        <div className="font-black text-xl">DEMORALIZED</div>
                        <div className="text-xs text-gray-400">AUTO BATTLE ACTIVE</div>
                    </div>
                ) : activeUnit?.isPlayer ? (
                    <div className="h-full flex gap-2 max-w-lg mx-auto relative">
                        <div className="w-28 bg-slate-800 rounded p-2 flex flex-col justify-center items-center border border-slate-700">
                            <span className="font-bold text-sm text-center truncate w-full">{activeUnit.mbti ? getHeroName(activeUnit.mbti, language) : activeUnit.name}</span>
                            <span className="text-xs text-blue-400 mt-1">{activeUnit.currentMp} MP</span>

                            {/* LIVE STATS DISPLAY */}
                            <div className="w-full mt-2 pt-2 border-t border-slate-600 text-[9px] space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">ATK</span>
                                    <div className="flex items-center gap-1">
                                        <span className={activeEff.atk < activeUnit.atk ? 'text-red-400' : 'text-green-400'}>
                                            {activeEff.atk}
                                        </span>
                                        <span className="text-gray-500">/</span>
                                        <span className="text-gray-400">{activeUnit.atk}</span>
                                        {activeUnit.baseAtk !== undefined && activeUnit.baseAtk !== activeUnit.atk && (
                                          <>
                                            <span className="text-gray-600">/</span>
                                            <span className="text-blue-400" title="Base stat (before factor mods)">{activeUnit.baseAtk}</span>
                                          </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">DEF</span>
                                    <div className="flex items-center gap-1">
                                        <span className={activeEff.def < activeUnit.def ? 'text-red-400' : 'text-green-400'}>
                                            {activeEff.def}
                                        </span>
                                        <span className="text-gray-500">/</span>
                                        <span className="text-gray-400">{activeUnit.def}</span>
                                        {activeUnit.baseDef !== undefined && activeUnit.baseDef !== activeUnit.def && (
                                          <>
                                            <span className="text-gray-600">/</span>
                                            <span className="text-blue-400" title="Base stat (before factor mods)">{activeUnit.baseDef}</span>
                                          </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">SPD</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-400">{activeUnit.spd}</span>
                                        {activeUnit.baseSpd !== undefined && activeUnit.baseSpd !== activeUnit.spd && (
                                          <>
                                            <span className="text-gray-600">/</span>
                                            <span className="text-blue-400" title="Base stat (before factor mods)">{activeUnit.baseSpd}</span>
                                          </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">HP</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-400">{activeUnit.maxHp}</span>
                                        {activeUnit.baseHp !== undefined && activeUnit.baseHp !== activeUnit.maxHp && (
                                          <>
                                            <span className="text-gray-600">/</span>
                                            <span className="text-blue-400" title="Base stat (before factor mods)">{activeUnit.baseHp}</span>
                                          </>
                                        )}
                                    </div>
                                </div>
                                <div className="text-[8px] text-center text-yellow-500 mt-1">
                                    {Math.floor(activeEff.multiplier * 100)}% Effectiveness
                                </div>
                                {activeUnit.isPlayer && (activeUnit.baseAtk !== activeUnit.atk || activeUnit.baseDef !== activeUnit.def || activeUnit.baseSpd !== activeUnit.spd || activeUnit.baseHp !== activeUnit.maxHp) && (
                                  <div className="text-[8px] text-center text-blue-400 mt-1 border-t border-slate-600 pt-1">
                                    Blue = Base (pre-factor)
                                  </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-2">
                            <button onClick={() => handleAction('attack')} className={`rounded bg-red-700 font-bold text-sm flex items-center justify-center gap-2 ${selectedAction==='attack'?'ring-2 ring-white':''}`}><Sword size={16}/> {t('attack', language)}</button>
                            <button onClick={() => handleAction('defend')} className="rounded bg-blue-800 font-bold text-sm flex items-center justify-center gap-2"><Shield size={16}/> {t('guard', language)}</button>
                            <button
                                onClick={() => {
                                    if(activeUnit.currentMp >= activeUnit.skillCost) handleAction('skill');
                                }}
                                disabled={activeUnit.currentMp < activeUnit.skillCost}
                                className={`col-span-2 rounded bg-purple-700 font-bold text-sm flex flex-col items-center justify-center disabled:opacity-50 ${selectedAction==='skill'?'ring-2 ring-white':''}`}
                            >
                                <div className="flex items-center gap-2"><Star size={16}/> {activeUnit.mbti ? getSkillName(activeUnit.mbti, language) : activeUnit.skillName}</div>
                                {selectedAction === 'skill' && <span className="text-[10px] opacity-90 font-normal">{activeUnit.mbti ? getSkillDesc(activeUnit.mbti, language) : activeUnit.desc}</span>}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 animate-pulse">
                        {activeUnit ? <><Bot size={16} className="mr-2"/> Enemy Turn...</> : "Processing..."}
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- RESULTS SCREEN --- */}
      {(phase === 'victory' || phase === 'defeat') && (
         <div className="flex-1 flex flex-col items-center justify-center p-6 bg-black/90 text-center animate-in zoom-in duration-300">
            {phase === 'victory' ? <Trophy size={80} className="text-yellow-400 mb-4 animate-bounce"/> : <Skull size={80} className="text-gray-500 mb-4"/>}
            <h2 className="text-5xl font-black mb-2">{phase.toUpperCase()}</h2>

            <div className="bg-slate-800 p-6 rounded-xl w-full max-w-md mb-8 border border-slate-700 relative">
                <h3 className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-4">Battle Report</h3>
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div>
                        <div className="text-gray-500">Turns Taken</div>
                        <div className="text-2xl font-bold">{battleStats.turns}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">MVP Damage</div>
                        <div className="text-2xl font-bold text-red-400">
                            {Math.max(...units.filter(u=>u.isPlayer).map(u=>u.totalDmgDealt), 0)}
                        </div>
                    </div>
                </div>
                <div className="text-left">
                    <div className="text-xs text-gray-500 mb-2">Unit Performance</div>
                    {units.filter(u=>u.isPlayer).map(u => (
                        <div key={u.id} className="flex justify-between text-xs py-1 border-b border-slate-700 last:border-0">
                            <span>{u.name}</span>
                            <span className="text-red-400">{u.totalDmgDealt} DMG</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center w-full max-w-md px-4">
                <button onClick={() => setPhase('intro')} className="bg-slate-700 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 text-sm sm:text-base sm:px-8">
                    <RefreshCw size={18}/> {t('backToTitle', language)}
                </button>

                <button onClick={handleRematch} className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 text-sm sm:text-base sm:px-8">
                    <Repeat size={18}/> {t('rematch', language)}
                </button>

                <button onClick={initBattle} className="bg-green-600 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 text-sm sm:text-base sm:px-8">
                    <Sword size={18}/> {t('newSkirmish', language)}
                </button>

                {phase === 'victory' && !isChallengeMode && !isHellMode && (
                    <button onClick={startChallengeMode} className="bg-red-600 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-red-900/50 flex items-center gap-2 text-sm sm:text-base sm:px-8">
                        <Crown size={18} className="text-yellow-400"/> {t('challengeModeButton', language)}
                    </button>
                )}
                {phase === 'victory' && isChallengeMode && !isHellMode && (
                    <button onClick={startHellMode} className="bg-gradient-to-r from-red-900 to-orange-900 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-red-900/50 flex items-center gap-2 text-sm sm:text-base sm:px-8">
                        🔥 {t('hellModeButton', language)}
                    </button>
                )}
            </div>
         </div>
      )}
    </div>
  );
}
