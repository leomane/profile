/**
 * Pheromone Field Management
 *
 * Implements diffusion and evaporation of pheromones on a grid.
 * Uses a discrete approximation of the heat equation for diffusion.
 */

import type { PheromoneParams } from './types.js';

/**
 * Diffuse and evaporate pheromones on a grid.
 *
 * Diffusion follows a discrete approximation of the heat equation:
 * - Each cell spreads a fraction of its pheromone to 8 neighbors
 * - Center retains (1 - diffusionRate) of original value
 * - Receives diffusionRate/8 from each neighbor
 *
 * Evaporation applies exponential decay:
 * - New value = old value * evaporationRate
 *
 * @param field - Current pheromone field (1D array, row-major order)
 * @param cols - Number of columns in the grid
 * @param rows - Number of rows in the grid
 * @param diffusionRate - Fraction of pheromone that spreads (0-1)
 * @param evaporationRate - Decay multiplier (0-1, where 1 = no decay)
 * @returns New pheromone field after diffusion and evaporation
 */
export function diffusePheromones(
  field: Float32Array | number[],
  cols: number,
  rows: number,
  diffusionRate: number,
  evaporationRate: number
): Float32Array {
  const next = new Float32Array(field.length);

  // Copy edges (no diffusion at boundaries)
  for (let x = 0; x < cols; x++) {
    next[x] = field[x] * evaporationRate;
    next[x + (rows - 1) * cols] = field[x + (rows - 1) * cols] * evaporationRate;
  }
  for (let y = 0; y < rows; y++) {
    next[y * cols] = field[y * cols] * evaporationRate;
    next[cols - 1 + y * cols] = field[cols - 1 + y * cols] * evaporationRate;
  }

  // Diffuse interior cells
  for (let x = 1; x < cols - 1; x++) {
    for (let y = 1; y < rows - 1; y++) {
      const idx = x + y * cols;

      // Sum of all 8 neighbors
      const sum =
        field[idx - 1] +           // left
        field[idx + 1] +           // right
        field[idx - cols] +        // up
        field[idx + cols] +        // down
        field[idx - 1 - cols] +    // top-left
        field[idx + 1 - cols] +    // top-right
        field[idx - 1 + cols] +    // bottom-left
        field[idx + 1 + cols];     // bottom-right

      const center = field[idx];
      // Diffuse: center keeps (1-rate), receives rate/8 from each neighbor
      const diffused = center * (1 - diffusionRate) + (sum / 8) * diffusionRate;
      // Evaporate
      next[idx] = diffused * evaporationRate;
    }
  }

  return next;
}

/**
 * Apply only evaporation to a pheromone field (no diffusion).
 *
 * @param field - Current pheromone field
 * @param evaporationRate - Decay multiplier (0-1)
 * @returns New field after evaporation
 */
export function evaporatePheromones(
  field: Float32Array | number[],
  evaporationRate: number
): Float32Array {
  const next = new Float32Array(field.length);
  for (let i = 0; i < field.length; i++) {
    next[i] = field[i] * evaporationRate;
  }
  return next;
}

/**
 * Deposit pheromone at a grid position.
 *
 * @param field - Current pheromone field (modified in place)
 * @param cols - Number of columns
 * @param rows - Number of rows
 * @param x - Grid x coordinate
 * @param y - Grid y coordinate
 * @param amount - Amount to deposit
 * @param maxPheromone - Maximum allowed pheromone level
 * @returns true if deposit was successful (within bounds)
 */
export function depositPheromone(
  field: Float32Array | number[],
  cols: number,
  rows: number,
  x: number,
  y: number,
  amount: number,
  maxPheromone: number
): boolean {
  if (x < 0 || x >= cols || y < 0 || y >= rows) {
    return false;
  }

  const idx = x + y * cols;
  field[idx] = Math.min(field[idx] + amount, maxPheromone);
  return true;
}

/**
 * Get pheromone level at a grid position.
 *
 * @param field - Pheromone field
 * @param cols - Number of columns
 * @param rows - Number of rows
 * @param x - Grid x coordinate
 * @param y - Grid y coordinate
 * @returns Pheromone level, or 0 if out of bounds
 */
export function getPheromoneAt(
  field: Float32Array | number[],
  cols: number,
  rows: number,
  x: number,
  y: number
): number {
  if (x < 0 || x >= cols || y < 0 || y >= rows) {
    return 0;
  }
  return field[x + y * cols];
}

/**
 * Calculate total pheromone in the field.
 *
 * @param field - Pheromone field
 * @returns Sum of all pheromone values
 */
export function getTotalPheromone(field: Float32Array | number[]): number {
  let total = 0;
  for (let i = 0; i < field.length; i++) {
    total += field[i];
  }
  return total;
}

/**
 * Create an empty pheromone field.
 *
 * @param cols - Number of columns
 * @param rows - Number of rows
 * @returns Zero-initialized pheromone field
 */
export function createPheromoneField(cols: number, rows: number): Float32Array {
  return new Float32Array(cols * rows);
}

/**
 * Convert world coordinates to grid coordinates.
 *
 * @param worldX - World x position
 * @param worldY - World y position
 * @param gridSize - Size of each grid cell in world units
 * @returns Grid coordinates { gx, gy }
 */
export function worldToGrid(
  worldX: number,
  worldY: number,
  gridSize: number
): { gx: number; gy: number } {
  return {
    gx: Math.floor(worldX / gridSize),
    gy: Math.floor(worldY / gridSize),
  };
}
