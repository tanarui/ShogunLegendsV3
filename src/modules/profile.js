// Profile module - handles saving/loading user profiles with hashcode
// Uses lazy initialization for localStorage access

import { CHARACTERS, HERO_ID_TO_MBTI } from '../data/gameData.js';

// Lazy initialization: Check if localStorage is available
const getLocalStorage = () => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }
  try {
    // Test localStorage availability
    const test = '__localStorage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return window.localStorage;
  } catch (e) {
    // localStorage is not available (e.g., private browsing mode)
    return null;
  }
};

// Cache for lazy initialization
let localStorageCache = null;

// Get localStorage with lazy initialization
const getStorage = () => {
  if (localStorageCache === null) {
    localStorageCache = getLocalStorage();
  }
  return localStorageCache;
};

// Generate a simple hashcode from profile data
export const generateHashcode = (profile) => {
  const str = JSON.stringify({
    mbti: profile.mbti,
    factorScores: profile.factorScores,
    placedUnits: profile.placedUnits?.map(u => u.mbti).sort() || []
  });
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 8).toUpperCase();
};

// Save profile to localStorage (with lazy initialization)
export const saveProfile = (profile) => {
  try {
    const storage = getStorage();
    if (!storage) {
      console.warn('localStorage is not available');
      return null;
    }

    const hashcode = generateHashcode(profile);
    // Don't save factor returns - they should be generated fresh on each deployment
    const { factorReturns, ...profileToSave } = profile;
    const profileData = {
      ...profileToSave,
      hashcode,
      savedAt: Date.now()
    };
    storage.setItem('shogun_profile', JSON.stringify(profileData));
    return hashcode;
  } catch (error) {
    console.error('Failed to save profile:', error);
    return null;
  }
};

// Load profile from localStorage (with lazy initialization)
// Returns null if profile doesn't exist, is invalid, or incompatible with current version
export const loadProfile = () => {
  try {
    const storage = getStorage();
    if (!storage) {
      return null;
    }

    const saved = storage.getItem('shogun_profile');
    if (!saved) return null;
    
    let profile;
    try {
      profile = JSON.parse(saved);
    } catch (parseError) {
      console.error('Failed to parse saved profile (corrupted data):', parseError);
      // Clear corrupted data
      try {
        storage.removeItem('shogun_profile');
      } catch (clearError) {
        console.error('Failed to clear corrupted profile:', clearError);
      }
      return null;
    }
    
    // Validate profile structure - check for required fields
    if (!profile || typeof profile !== 'object') {
      console.warn('Invalid profile structure: not an object');
      return null;
    }
    
    // Check for required fields
    if (!profile.mbti || !profile.factorScores || !profile.hashcode) {
      console.warn('Invalid profile structure: missing required fields', {
        hasMBTI: !!profile.mbti,
        hasFactorScores: !!profile.factorScores,
        hasHashcode: !!profile.hashcode
      });
      return null;
    }
    
    // Validate MBTI format (should be 4 characters)
    if (typeof profile.mbti !== 'string' || profile.mbti.length !== 4) {
      console.warn('Invalid MBTI format in saved profile:', profile.mbti);
      return null;
    }
    
    // Validate factorScores is an object with numeric values
    if (typeof profile.factorScores !== 'object' || profile.factorScores === null) {
      console.warn('Invalid factorScores in saved profile');
      return null;
    }
    
    // Check if placedUnits exist and validate structure
    if (profile.placedUnits && !Array.isArray(profile.placedUnits)) {
      console.warn('Invalid placedUnits in saved profile: not an array');
      // Don't fail completely, just remove invalid placedUnits
      profile.placedUnits = [];
    }
    
    // Check if recruitGrid exists and validate structure
    if (profile.recruitGrid && !Array.isArray(profile.recruitGrid)) {
      console.warn('Invalid recruitGrid in saved profile: not an array');
      // Don't fail completely, just remove invalid recruitGrid
      profile.recruitGrid = null;
    }
    
    return profile;
  } catch (error) {
    console.error('Failed to load profile (unexpected error):', error);
    // Try to clear potentially corrupted data
    try {
      const storage = getStorage();
      if (storage) {
        storage.removeItem('shogun_profile');
      }
    } catch (clearError) {
      console.error('Failed to clear profile after error:', clearError);
    }
    return null;
  }
};

// Clear saved profile (with lazy initialization)
export const clearProfile = () => {
  try {
    const storage = getStorage();
    if (!storage) {
      return false;
    }
    storage.removeItem('shogun_profile');
    return true;
  } catch (error) {
    console.error('Failed to clear profile:', error);
    return false;
  }
};

// Check if profile exists (with lazy initialization)
export const hasProfile = () => {
  return loadProfile() !== null;
};

// Get profile hashcode (with lazy initialization)
export const getProfileHashcode = () => {
  const profile = loadProfile();
  return profile?.hashcode || null;
};

// Encode team data into a compact hashcode string
// Format: 4 chars (Player MBTI) + 5 chars (Hero IDs with positions)
// Each hero char encodes: Hero ID + X position + Y position using base62
// Total: 9 characters (alphanumeric, case-sensitive for future expansion)
export const encodeTeamHashcode = (teamData) => {
  try {
    if (!teamData.placedUnits || teamData.placedUnits.length < 5) {
      return null;
    }
    
    // CHARACTERS is already imported at the top
    
    // Simple encoding: Use hero ID char directly (base62: 0-9, a-z, A-Z)
    // Battle positions are implicit: 0,1,2,3,4 based on char order
    // This supports up to 62 heroes (can expand with more base62 chars)
    
    // 1. Player's MBTI (4 chars) - keep as is for readability
    const playerMBTI = teamData.mbti;
    
    // 2. Sort units by battle position (coreX) for consistency
    const sortedUnits = [...teamData.placedUnits].sort((a, b) => a.coreX - b.coreX);
    
    // 3. Encode each hero using their heroId char directly
    const heroCodes = sortedUnits.map(u => {
      const char = CHARACTERS[u.mbti];
      if (!char || !char.heroId) {
        throw new Error(`No hero ID found for ${u.mbti}`);
      }
      return char.heroId; // Use heroId char directly (already base62)
    }).join('');
    
    // Final hashcode: 4 chars (MBTI) + 5 chars (hero IDs) = 9 chars
    // Battle positions are implicit: positions 0-4 correspond to chars 0-4
    return playerMBTI + heroCodes;
  } catch (error) {
    console.error('Failed to encode team hashcode:', error);
    return null;
  }
};

// Decode team hashcode back to team data
// Format: 4 chars (Player MBTI) + 5 chars (Hero IDs with positions)
export const decodeTeamHashcode = (hashcode) => {
  try {
    if (!hashcode || hashcode.length !== 9) {
      return null;
    }
    
    // CHARACTERS and HERO_ID_TO_MBTI are already imported at the top
    
    // Normalize: MBTI part should be uppercase, hero IDs can be any case
    const normalizedHashcode = hashcode.toUpperCase().substring(0, 4) + hashcode.substring(4, 9);
    
    // Extract player MBTI (first 4 chars) - uppercase
    const mbti = normalizedHashcode.substring(0, 4);
    
    // Extract hero ID chars (last 5 chars) - preserve original case for lookup
    const heroCodes = hashcode.substring(4, 9);
    const placedUnits = [];
    
    // Decode: Each char is a hero ID, position is implicit (0-4 based on index)
    for (let i = 0; i < 5; i++) {
      const heroIdChar = heroCodes[i];
      
      // Convert hero ID char to MBTI (try original case first, then try both cases)
      // Hero IDs are: '0'-'9', 'a'-'f' (lowercase), 'Z', 'Y' (uppercase)
      let mbtiForHero = HERO_ID_TO_MBTI[heroIdChar];
      if (!mbtiForHero) {
        // Try uppercase (for 'Z' and 'Y')
        mbtiForHero = HERO_ID_TO_MBTI[heroIdChar.toUpperCase()];
      }
      if (!mbtiForHero) {
        // Try lowercase (for 'a'-'f')
        mbtiForHero = HERO_ID_TO_MBTI[heroIdChar.toLowerCase()];
      }
      if (!mbtiForHero) {
        throw new Error(`No MBTI found for hero ID: ${heroIdChar}`);
      }
      
      // Battle position is implicit: coreX = i (0-4), coreY = 0 (units in a line)
      placedUnits.push({
        mbti: mbtiForHero,
        coreX: i,
        coreY: 0
      });
    }
    
    if (placedUnits.length !== 5) {
      return null;
    }
    
    // Factor scores are calculated from hero MBTI types, not stored
    return {
      mbti,
      placedUnits
    };
  } catch (error) {
    console.error('Failed to decode team hashcode:', error);
    return null;
  }
};

// Legacy function names for compatibility (now just use encode/decode)
export const saveTeamByHashcode = (hashcode, teamData) => {
  // No longer needed - hashcode IS the team data
  return true;
};

// Load team data by hashcode (for PvP) - now decodes from hashcode itself
export const loadTeamByHashcode = (hashcode) => {
  try {
    const teamData = decodeTeamHashcode(hashcode);
    if (teamData && teamData.placedUnits && teamData.placedUnits.length >= 5) {
      return teamData;
    }
    return null;
  } catch (error) {
    console.error('Failed to load team by hashcode:', error);
    return null;
  }
};

