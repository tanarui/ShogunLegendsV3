import { saveProfile, loadProfile, clearProfile } from '../modules/profile.js';
import { GRID_SIZE } from '../data/gameData.js';
import { canPlace, getRotatedPoints } from '../utils/gridUtils.js';
import { CHARACTERS, SHAPES } from '../data/gameData.js';
import { t } from '../modules/translations.js';

/**
 * Custom hook for profile management
 */
export const useProfile = ({
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
}) => {
  const handleSaveProfile = (userMBTI, factorScores, factorReturns, quizAnswers, placedUnits, recruitGrid) => {
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
              const points = getRotatedPoints(currentChar, rotation, SHAPES);
              
              // Validate placement is still valid with new shape
              if (canPlace(fixedRecruitGrid, points, savedUnit.coreX, savedUnit.coreY, GRID_SIZE)) {
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
      if (setPvpPlayerHashcode) setPvpPlayerHashcode('');
    }
  };

  return {
    handleSaveProfile,
    handleLoadProfile,
    handleClearProfile
  };
};
