import React from 'react';
import { Star } from 'lucide-react';
import { getRoleColor } from '../utils/gameUtils';
import { rotatePoints } from '../utils/gridUtils';

const ShapePreview = ({ shapeName, role, rotation = 0, isInteractive = false, onRotate, shapes }) => {
    let points = shapes[shapeName];
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

export default ShapePreview;
