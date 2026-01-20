import React from 'react';
import { Info, ChevronRight, AlertCircle, Lock, Star, Save } from 'lucide-react';
import { SHAPES } from '../../data/gameData.js';
import { getRoleColor, getWaBonus } from '../../utils/gameUtils.js';
import { canPlace, getRotatedPoints } from '../../utils/gridUtils.js';
import { encodeTeamHashcode } from '../../modules/profile.js';
import { t, getHeroName, getSkillName, getSkillDesc } from '../../modules/translations.js';
import ShapePreview from '../ShapePreview.jsx';

const RecruitmentPhase = ({
  phase,
  language,
  userMBTI,
  placedUnits,
  factorScores,
  selectedRecruit,
  rotation,
  setRotation,
  recruitGrid,
  hoverCell,
  setHoverCell,
  availablePool,
  showRecruitExplanation,
  setShowRecruitExplanation,
  hasLeader,
  handleGridClick,
  removeUnit,
  handleDeploy,
  setSelectedRecruit,
  handleSaveProfile
}) => {
  if (phase !== 'recruit') return null;

  return (
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
                    shapes={SHAPES}
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
                    const points = getRotatedPoints(selectedRecruit, rotation, SHAPES);
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
                      <div className="bg-black p-0.5 rounded"><ShapePreview shapeName={u.shape} role={u.role} shapes={SHAPES}/></div>
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
                        <ShapePreview shapeName={c.shape} role={c.role} shapes={SHAPES} />
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
  );
};

export default RecruitmentPhase;
