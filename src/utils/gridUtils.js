// Grid placement utilities
export const rotatePoints = (points) => points.map(([x, y]) => [-y, x]);

export const canPlace = (grid, points, cx, cy, gridSize = 5) => {
  return points.every(([dx, dy]) => {
    const x = cx + dx;
    const y = cy + dy;
    return x >= 0 && x < gridSize && y >= 0 && y < gridSize && grid[y][x] === null;
  });
};

export const getRotatedPoints = (char, rotCount, shapes) => {
  let points = shapes[char.shape];
  for(let i=0; i<rotCount; i++) points = rotatePoints(points);
  return points;
};
