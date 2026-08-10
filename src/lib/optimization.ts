export interface SurveyPointData {
  pointId: number;
  x: number;
  y: number;
  z: number;
}

export interface CutFillDetail {
  pointId: number;
  x: number;
  y: number;
  z: number;
  cutDepth: number;
  fillDepth: number;
  depthType: 'cut' | 'fill' | 'grade';
}

export interface OptimizationResult {
  optimalTargetZ: number;
  avgGroundHeight: number;
  totalCutVolumeCf: number;
  totalCutVolumeCy: number;
  totalFillVolumeCf: number;
  totalFillVolumeCy: number;
  netBalanceCf: number;
  netBalanceCy: number;
  gridArea: number;
  elevationRangeWarning: boolean;
  minZ: number;
  maxZ: number;
  details: CutFillDetail[];
}

/**
 * Calculates the cut or fill depth at a point, constrained between 0 and 5 feet.
 */
export function calculateDepths(pointZ: number, targetZ: number) {
  const diff = pointZ - targetZ;
  let cutDepth = 0;
  let fillDepth = 0;

  if (diff > 0) {
    // Cut needed
    cutDepth = Math.min(5, diff);
  } else if (diff < 0) {
    // Fill needed
    fillDepth = Math.min(5, Math.abs(diff));
  }

  const depthType: 'cut' | 'fill' | 'grade' = 
    cutDepth > 0 ? 'cut' : (fillDepth > 0 ? 'fill' : 'grade');

  return { cutDepth, fillDepth, depthType };
}

/**
 * Estimates the area represented by each grid point.
 * Bounding Area / Number of Points
 */
export function estimateGridArea(points: SurveyPointData[]): number {
  if (points.length <= 1) return 1.0;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const area = width * height;

  if (area <= 0) return 1.0;
  return area / points.length;
}

/**
 * Optimizes the target elevation (Target Z) using the Bisection Method
 * such that Cut Volume equals Fill Volume (net balance is minimized).
 */
export function optimizeTargetGrade(
  points: SurveyPointData[],
  customGridArea?: number
): OptimizationResult {
  const n = points.length;
  if (n === 0) {
    return {
      optimalTargetZ: 0,
      avgGroundHeight: 0,
      totalCutVolumeCf: 0,
      totalCutVolumeCy: 0,
      totalFillVolumeCf: 0,
      totalFillVolumeCy: 0,
      netBalanceCf: 0,
      netBalanceCy: 0,
      gridArea: 0,
      elevationRangeWarning: false,
      minZ: 0,
      maxZ: 0,
      details: [],
    };
  }

  let sumZ = 0;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const p of points) {
    sumZ += p.z;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }

  const avgGroundHeight = sumZ / n;
  
  // Warning flag if topographic range exceeds 10 feet (meaning cut/fill constraint will cap)
  const elevationRangeWarning = (maxZ - minZ) > 10;

  // Grid area
  const gridArea = customGridArea && customGridArea > 0 
    ? customGridArea 
    : estimateGridArea(points);

  // Objective function: sum of Cut depths minus sum of Fill depths
  // We want to find T where this is 0
  const evaluateNetDepth = (T: number): number => {
    let net = 0;
    for (const p of points) {
      const { cutDepth, fillDepth } = calculateDepths(p.z, T);
      net += cutDepth - fillDepth;
    }
    return net;
  };

  // Bisection search interval [minZ, maxZ]
  let low = minZ;
  let high = maxZ;
  let optimalTargetZ = avgGroundHeight; // default fallback

  // Run bisection search for 50 iterations (extremely high precision)
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const netDepth = evaluateNetDepth(mid);

    if (Math.abs(netDepth) < 1e-9) {
      optimalTargetZ = mid;
      break;
    }

    if (netDepth > 0) {
      // Cut is greater than fill -> raise target Z to decrease cut and increase fill
      low = mid;
    } else {
      // Fill is greater than cut -> lower target Z to increase cut and decrease fill
      high = mid;
    }
    optimalTargetZ = (low + high) / 2;
  }

  // Calculate final metrics using optimized target Z
  let totalCutDepth = 0;
  let totalFillDepth = 0;
  const details: CutFillDetail[] = [];

  for (const p of points) {
    const { cutDepth, fillDepth, depthType } = calculateDepths(p.z, optimalTargetZ);
    totalCutDepth += cutDepth;
    totalFillDepth += fillDepth;

    details.push({
      pointId: p.pointId,
      x: p.x,
      y: p.y,
      z: p.z,
      cutDepth,
      fillDepth,
      depthType,
    });
  }

  const totalCutVolumeCf = totalCutDepth * gridArea;
  const totalFillVolumeCf = totalFillDepth * gridArea;
  const netBalanceCf = totalCutVolumeCf - totalFillVolumeCf;

  // Cubic Yards conversion (divided by 27)
  const totalCutVolumeCy = totalCutVolumeCf / 27;
  const totalFillVolumeCy = totalFillVolumeCf / 27;
  const netBalanceCy = netBalanceCf / 27;

  return {
    optimalTargetZ,
    avgGroundHeight,
    totalCutVolumeCf,
    totalCutVolumeCy,
    totalFillVolumeCf,
    totalFillVolumeCy,
    netBalanceCf,
    netBalanceCy,
    gridArea,
    elevationRangeWarning,
    minZ,
    maxZ,
    details,
  };
}
