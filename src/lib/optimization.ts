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
  targetZ: number;       // Optimized sloped target Z at this coordinate (m)
  flatTargetZ: number;   // Baseline flat target Z (m)
  cutDepth: number;      // Depth of excavation (m) (sloped)
  fillDepth: number;     // Depth of embankment (m) (sloped)
  depthType: 'cut' | 'fill' | 'grade'; // Sloped status
  flatCutDepth: number;  // Flat cut depth (m)
  flatFillDepth: number; // Flat fill depth (m)
  flatDepthType: 'cut' | 'fill' | 'grade'; // Flat status
  distanceAlongBar?: number; // Distance along the 1D bar (m)
}

export interface OptimizationResult {
  optimalTargetZ: number; // Intercept (Z0) of optimized sloped plane at the center (m)
  optimalSlopeX: number;  // Slope gradient in X (m/m)
  optimalSlopeY: number;  // Slope gradient in Y (m/m)
  optimalSlopeAngleDeg: number;     // Total slope angle (degrees, 0 to 5)
  optimalSlopeDirectionDeg: number; // Direction of slope (degrees, 0 to 360)
  avgGroundHeight: number;          // Average original terrain height (m)
  
  // Sloped Plane/Bar Metrics (m³)
  totalCutVolumeM3: number;
  totalFillVolumeM3: number;
  netBalanceM3: number;
  
  // Flat Plane/Bar Metrics (m³) for comparison
  flatTargetZ: number;
  flatCutVolumeM3: number;
  flatFillVolumeM3: number;
  flatNetBalanceM3: number;
  
  gridArea: number; // Area of grid cell (m²)
  elevationRangeWarning: boolean;
  minZ: number; // Minimum terrain elevation (m)
  maxZ: number; // Maximum terrain elevation (m)
  details: CutFillDetail[];
  
  // 1D Bar Mode details
  is1DBarMode?: boolean;
  barLength?: number;
  barWidth?: number;
}

/**
 * Calculates the cut or fill depth at a point, constrained between 0 and 1.5 meters.
 */
export function calculateDepths(pointZ: number, targetZ: number) {
  const diff = pointZ - targetZ;
  let cutDepth = 0;
  let fillDepth = 0;

  if (diff > 0) {
    // Cut needed (uncapped)
    cutDepth = diff;
  } else if (diff < 0) {
    // Fill needed (uncapped)
    fillDepth = Math.abs(diff);
  }

  const depthType: 'cut' | 'fill' | 'grade' = 
    cutDepth > 0 ? 'cut' : (fillDepth > 0 ? 'fill' : 'grade');

  return { cutDepth, fillDepth, depthType };
}

/**
 * Estimates the area represented by each grid point (in square meters).
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
 * Optimizes the target elevation (Target Z) using a double optimization algorithm:
 * 1. Flat Plane (baseline) using Bisection Method.
 * 2. Sloped Plane (0 to 5 degrees) using 2D grid search and bisection.
 */
export function optimizeTargetGrade(
  points: SurveyPointData[],
  customGridArea?: number,
  is1DBarMode: boolean = false,
  barLength: number = 20,
  barWidth: number = 1
): OptimizationResult {
  const n = points.length;
  if (n === 0) {
    return {
      optimalTargetZ: 0,
      optimalSlopeX: 0,
      optimalSlopeY: 0,
      optimalSlopeAngleDeg: 0,
      optimalSlopeDirectionDeg: 0,
      avgGroundHeight: 0,
      totalCutVolumeM3: 0,
      totalFillVolumeM3: 0,
      netBalanceM3: 0,
      flatTargetZ: 0,
      flatCutVolumeM3: 0,
      flatFillVolumeM3: 0,
      flatNetBalanceM3: 0,
      gridArea: 0,
      elevationRangeWarning: false,
      minZ: 0,
      maxZ: 0,
      details: [],
      is1DBarMode,
      barLength,
      barWidth,
    };
  }

  if (is1DBarMode) {
    // 1D Bar / Beam Leveling Mode
    // 1. Calculate centroid
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const p of points) {
      sumX += p.x;
      sumY += p.y;
      sumZ += p.z;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }
    const meanX = sumX / n;
    const meanY = sumY / n;
    const avgGroundHeight = sumZ / n;
    const elevationRangeWarning = (maxZ - minZ) > 3.0;

    // 2. PCA to find direction vector of the bar axis
    let covXX = 0;
    let covXY = 0;
    let covYY = 0;
    for (const p of points) {
      const dx = p.x - meanX;
      const dy = p.y - meanY;
      covXX += dx * dx;
      covXY += dx * dy;
      covYY += dy * dy;
    }

    let vx = 1;
    let vy = 0;
    if (covXX + covYY > 0) {
      const diff = covXX - covYY;
      const term = Math.sqrt(diff * diff + 4 * covXY * covXY);
      const lambda = (covXX + covYY + term) / 2; // Largest eigenvalue

      if (Math.abs(covXY) > 1e-9) {
        vx = covXY;
        vy = lambda - covXX;
        const len = Math.sqrt(vx * vx + vy * vy);
        vx /= len;
        vy /= len;
      } else {
        if (covXX > covYY) {
          vx = 1;
          vy = 0;
        } else {
          vx = 0;
          vy = 1;
        }
      }
    }

    // 3. Project and scale
    const projPoints = points.map((p, idx) => {
      const dx = p.x - meanX;
      const dy = p.y - meanY;
      const projDist = dx * vx + dy * vy;
      return { p, idx, projDist, dPrime: 0, deltaL: 0 };
    });

    let minDist = Infinity;
    let maxDist = -Infinity;
    for (const p of projPoints) {
      if (p.projDist < minDist) minDist = p.projDist;
      if (p.projDist > maxDist) maxDist = p.projDist;
    }

    const distSpan = maxDist - minDist;
    for (const p of projPoints) {
      if (distSpan > 0) {
        p.dPrime = -barLength / 2 + ((p.projDist - minDist) / distSpan) * barLength;
      } else {
        p.dPrime = 0;
      }
    }

    // Sort to compute segment lengths (deltaL)
    projPoints.sort((a, b) => a.dPrime - b.dPrime);
    for (let i = 0; i < projPoints.length; i++) {
      let deltaL = 0;
      if (projPoints.length <= 1) {
        deltaL = barLength;
      } else if (i === 0) {
        deltaL = (projPoints[0].dPrime + projPoints[1].dPrime) / 2 - (-barLength / 2);
      } else if (i === projPoints.length - 1) {
        deltaL = barLength / 2 - (projPoints[projPoints.length - 2].dPrime + projPoints[projPoints.length - 1].dPrime) / 2;
      } else {
        deltaL = (projPoints[i + 1].dPrime - projPoints[i - 1].dPrime) / 2;
      }
      projPoints[i].deltaL = deltaL;
    }

    // Restore index order
    projPoints.sort((a, b) => a.idx - b.idx);

    // OPTIMIZATION 1: Baseline Perfectly Flat Bar (0° Slope)
    const evaluateFlatNetDepth = (T: number): number => {
      let net = 0;
      for (const p of projPoints) {
        const { cutDepth, fillDepth } = calculateDepths(p.p.z, T);
        net += (cutDepth - fillDepth) * p.deltaL;
      }
      return net;
    };

    let lowFlat = minZ;
    let highFlat = maxZ;
    let flatTargetZ = avgGroundHeight;

    for (let i = 0; i < 50; i++) {
      const mid = (lowFlat + highFlat) / 2;
      const netDepth = evaluateFlatNetDepth(mid);
      if (Math.abs(netDepth) < 1e-9) {
        flatTargetZ = mid;
        break;
      }
      if (netDepth > 0) {
        lowFlat = mid;
      } else {
        highFlat = mid;
      }
      flatTargetZ = (lowFlat + highFlat) / 2;
    }

    let totalFlatCutVolume = 0;
    let totalFlatFillVolume = 0;
    for (const p of projPoints) {
      const { cutDepth, fillDepth } = calculateDepths(p.p.z, flatTargetZ);
      totalFlatCutVolume += cutDepth * p.deltaL * barWidth;
      totalFlatFillVolume += fillDepth * p.deltaL * barWidth;
    }
    const flatNetBalanceM3 = totalFlatCutVolume - totalFlatFillVolume;

    // OPTIMIZATION 2: Sloped Bar (-5° to +5°)
    let bestVolume = Infinity;
    let optimalTargetZ = flatTargetZ;
    let optimalTheta = 0;

    const thetaCandidates: number[] = [];
    for (let t = -5.0; t <= 5.0; t = Number((t + 0.1).toFixed(1))) {
      thetaCandidates.push(t);
    }

    for (const theta of thetaCandidates) {
      const s = Math.tan(theta * Math.PI / 180);

      const evaluateNetDepth = (Z0: number): number => {
        let net = 0;
        for (const p of projPoints) {
          const targetElevation = Z0 + s * p.dPrime;
          const { cutDepth, fillDepth } = calculateDepths(p.p.z, targetElevation);
          net += (cutDepth - fillDepth) * p.deltaL;
        }
        return net;
      };

      let low = minZ - 5;
      let high = maxZ + 5;
      let optimalZ0 = avgGroundHeight;

      for (let iter = 0; iter < 40; iter++) {
        const mid = (low + high) / 2;
        const netDepth = evaluateNetDepth(mid);
        if (Math.abs(netDepth) < 1e-9) {
          optimalZ0 = mid;
          break;
        }
        if (netDepth > 0) {
          low = mid;
        } else {
          high = mid;
        }
        optimalZ0 = (low + high) / 2;
      }

      let currentTotalVolume = 0;
      for (const p of projPoints) {
        const targetElevation = optimalZ0 + s * p.dPrime;
        const { cutDepth, fillDepth } = calculateDepths(p.p.z, targetElevation);
        currentTotalVolume += (cutDepth + fillDepth) * p.deltaL * barWidth;
      }

      if (currentTotalVolume < bestVolume) {
        bestVolume = currentTotalVolume;
        optimalTargetZ = optimalZ0;
        optimalTheta = theta;
      }
    }

    const optimalSlopeMag = Math.tan(optimalTheta * Math.PI / 180);
    const optimalSlopeX = optimalSlopeMag * vx;
    const optimalSlopeY = optimalSlopeMag * vy;
    const optimalSlopeAngleDeg = Math.abs(optimalTheta);
    
    let optimalSlopeDirectionDeg = Math.atan2(vy, vx) * 180 / Math.PI;
    if (optimalSlopeDirectionDeg < 0) optimalSlopeDirectionDeg += 360;
    if (optimalTheta < 0) {
      optimalSlopeDirectionDeg = (optimalSlopeDirectionDeg + 180) % 360;
    }

    let totalCutVolumeM3 = 0;
    let totalFillVolumeM3 = 0;
    const details: CutFillDetail[] = [];

    for (const p of projPoints) {
      const targetZAtPoint = optimalTargetZ + optimalSlopeMag * p.dPrime;
      const { cutDepth, fillDepth, depthType } = calculateDepths(p.p.z, targetZAtPoint);
      totalCutVolumeM3 += cutDepth * p.deltaL * barWidth;
      totalFillVolumeM3 += fillDepth * p.deltaL * barWidth;

      const { cutDepth: flatCutDepth, fillDepth: flatFillDepth, depthType: flatDepthType } = calculateDepths(p.p.z, flatTargetZ);

      details.push({
        pointId: p.p.pointId,
        x: p.p.x,
        y: p.p.y,
        z: p.p.z,
        targetZ: targetZAtPoint,
        flatTargetZ: flatTargetZ,
        cutDepth,
        fillDepth,
        depthType,
        flatCutDepth,
        flatFillDepth,
        flatDepthType,
        distanceAlongBar: p.dPrime + barLength / 2,
      });
    }

    const netBalanceM3 = totalCutVolumeM3 - totalFillVolumeM3;

    return {
      optimalTargetZ,
      optimalSlopeX,
      optimalSlopeY,
      optimalSlopeAngleDeg,
      optimalSlopeDirectionDeg,
      avgGroundHeight,
      
      totalCutVolumeM3,
      totalFillVolumeM3,
      netBalanceM3,
      
      flatTargetZ,
      flatCutVolumeM3: totalFlatCutVolume,
      flatFillVolumeM3: totalFlatFillVolume,
      flatNetBalanceM3,
      
      gridArea: barWidth,
      elevationRangeWarning,
      minZ,
      maxZ,
      details,
      is1DBarMode,
      barLength,
      barWidth,
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
  
  // Warning flag if topographic range exceeds 3.0 meters (meaning cut/fill constraints cap)
  const elevationRangeWarning = (maxZ - minZ) > 3.0;

  // Grid area
  const gridArea = customGridArea && customGridArea > 0 
    ? customGridArea 
    : estimateGridArea(points);

  // ----------------------------------------------------
  // OPTIMIZATION 1: Baseline Perfectly Flat Plane (0° Slope)
  // ----------------------------------------------------
  const evaluateFlatNetDepth = (T: number): number => {
    let net = 0;
    for (const p of points) {
      const { cutDepth, fillDepth } = calculateDepths(p.z, T);
      net += cutDepth - fillDepth;
    }
    return net;
  };

  let lowFlat = minZ;
  let highFlat = maxZ;
  let flatTargetZ = avgGroundHeight;

  for (let i = 0; i < 50; i++) {
    const mid = (lowFlat + highFlat) / 2;
    const netDepth = evaluateFlatNetDepth(mid);

    if (Math.abs(netDepth) < 1e-9) {
      flatTargetZ = mid;
      break;
    }

    if (netDepth > 0) {
      lowFlat = mid;
    } else {
      highFlat = mid;
    }
    flatTargetZ = (lowFlat + highFlat) / 2;
  }

  let totalFlatCutDepth = 0;
  let totalFlatFillDepth = 0;
  for (const p of points) {
    const { cutDepth, fillDepth } = calculateDepths(p.z, flatTargetZ);
    totalFlatCutDepth += cutDepth;
    totalFlatFillDepth += fillDepth;
  }
  const flatCutVolumeM3 = totalFlatCutDepth * gridArea;
  const flatFillVolumeM3 = totalFlatFillDepth * gridArea;
  const flatNetBalanceM3 = flatCutVolumeM3 - flatFillVolumeM3;

  // ----------------------------------------------------
  // OPTIMIZATION 2: Sloped Plane (0 to 5 degrees)
  // ----------------------------------------------------
  // Find bounding box center to rotate the plane stably around
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
  const xc = (minX + maxX) / 2;
  const yc = (minY + maxY) / 2;

  let bestVolume = Infinity;
  let optimalTargetZ = flatTargetZ; // Fallback
  let optimalSlopeX = 0;
  let optimalSlopeY = 0;
  let optimalSlopeAngleDeg = 0;
  let optimalSlopeDirectionDeg = 0;

  // Theta: slope angle in degrees (0 to 5 degrees in steps of 0.5)
  const thetaCandidates = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
  // Phi: direction angle in degrees (0 to 360 in 15 degree steps)
  const phiCandidates = Array.from({ length: 24 }, (_, idx) => idx * 15);

  for (const theta of thetaCandidates) {
    const M = Math.tan(theta * Math.PI / 180); // Slope magnitude
    const directions = theta === 0 ? [0] : phiCandidates;

    for (const phi of directions) {
      const rad = phi * Math.PI / 180;
      const sx = M * Math.cos(rad);
      const sy = M * Math.sin(rad);

      // Find optimal Z0 (intercept at center) using bisection
      const evaluateNetDepth = (Z0: number): number => {
        let net = 0;
        for (const p of points) {
          const targetElevation = Z0 + sx * (p.x - xc) + sy * (p.y - yc);
          const { cutDepth, fillDepth } = calculateDepths(p.z, targetElevation);
          net += cutDepth - fillDepth;
        }
        return net;
      };

      let low = minZ - 5;
      let high = maxZ + 5;
      let optimalZ0 = avgGroundHeight;

      for (let iter = 0; iter < 40; iter++) {
        const mid = (low + high) / 2;
        const netDepth = evaluateNetDepth(mid);
        if (Math.abs(netDepth) < 1e-9) {
          optimalZ0 = mid;
          break;
        }
        if (netDepth > 0) {
          low = mid;
        } else {
          high = mid;
        }
        optimalZ0 = (low + high) / 2;
      }

      // Calculate total earthwork volume (Total Cut + Total Fill) for this sloped plane
      let currentTotalVolume = 0;
      for (const p of points) {
        const targetElevation = optimalZ0 + sx * (p.x - xc) + sy * (p.y - yc);
        const { cutDepth, fillDepth } = calculateDepths(p.z, targetElevation);
        currentTotalVolume += (cutDepth + fillDepth) * gridArea;
      }

      // Select slope parameters that yield the absolute minimum total volume
      if (currentTotalVolume < bestVolume) {
        bestVolume = currentTotalVolume;
        optimalTargetZ = optimalZ0;
        optimalSlopeX = sx;
        optimalSlopeY = sy;
        optimalSlopeAngleDeg = theta;
        optimalSlopeDirectionDeg = phi;
      }
    }
  }

  // ----------------------------------------------------
  // Finalize Metrics using the optimal sloped parameters
  // ----------------------------------------------------
  let totalCutDepth = 0;
  let totalFillDepth = 0;
  const details: CutFillDetail[] = [];

  for (const p of points) {
    const targetZAtPoint = optimalTargetZ + optimalSlopeX * (p.x - xc) + optimalSlopeY * (p.y - yc);
    const { cutDepth, fillDepth, depthType } = calculateDepths(p.z, targetZAtPoint);
    totalCutDepth += cutDepth;
    totalFillDepth += fillDepth;

    // Calculate flat target grade depths for comparative data table display
    const { cutDepth: flatCutDepth, fillDepth: flatFillDepth, depthType: flatDepthType } = calculateDepths(p.z, flatTargetZ);

    details.push({
      pointId: p.pointId,
      x: p.x,
      y: p.y,
      z: p.z,
      targetZ: targetZAtPoint,
      flatTargetZ: flatTargetZ,
      cutDepth,
      fillDepth,
      depthType,
      flatCutDepth,
      flatFillDepth,
      flatDepthType,
    });
  }

  const totalCutVolumeM3 = totalCutDepth * gridArea;
  const totalFillVolumeM3 = totalFillDepth * gridArea;
  const netBalanceM3 = totalCutVolumeM3 - totalFillVolumeM3;

  return {
    optimalTargetZ,
    optimalSlopeX,
    optimalSlopeY,
    optimalSlopeAngleDeg,
    optimalSlopeDirectionDeg,
    avgGroundHeight,
    
    totalCutVolumeM3,
    totalFillVolumeM3,
    netBalanceM3,
    
    flatTargetZ,
    flatCutVolumeM3,
    flatFillVolumeM3,
    flatNetBalanceM3,
    
    gridArea,
    elevationRangeWarning,
    minZ,
    maxZ,
    details,
    is1DBarMode,
    barLength,
    barWidth,
  };
}
