/**
 * Spatial Hash Grid for Efficient Neighbor Lookup
 *
 * Provides O(1) neighbor lookup instead of O(n²) brute force.
 * Divides space into cells based on perception radius.
 */

import type { Vector2D, Boid, SpatialGrid } from './types.js';

/**
 * Build a spatial hash grid from a list of boids.
 *
 * Each boid is placed in a cell based on its position.
 * The cell size equals the perception radius to ensure
 * all neighbors are in adjacent cells.
 *
 * @param boids - Array of boids to hash
 * @param cellSize - Size of each grid cell (typically perception radius)
 * @returns Map from cell key to list of boids in that cell
 */
export function buildSpatialHash(boids: Boid[], cellSize: number): SpatialGrid {
  const grid: SpatialGrid = new Map();

  for (const boid of boids) {
    const cellX = Math.floor(boid.pos.x / cellSize);
    const cellY = Math.floor(boid.pos.y / cellSize);
    const key = `${cellX},${cellY}`;

    if (!grid.has(key)) {
      grid.set(key, []);
    }
    grid.get(key)!.push(boid);
  }

  return grid;
}

/**
 * Get all potential neighbors for a boid.
 *
 * Checks the boid's cell and all 8 adjacent cells.
 * This ensures all boids within perception radius are found.
 *
 * @param boid - The boid to find neighbors for
 * @param grid - The spatial hash grid
 * @param cellSize - Size of each grid cell
 * @returns Array of potential neighbor boids (includes self)
 */
export function getNeighbors(boid: Boid, grid: SpatialGrid, cellSize: number): Boid[] {
  const cellX = Math.floor(boid.pos.x / cellSize);
  const cellY = Math.floor(boid.pos.y / cellSize);
  const neighbors: Boid[] = [];

  // Check 3x3 grid of cells centered on boid's cell
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const key = `${cellX + dx},${cellY + dy}`;
      if (grid.has(key)) {
        neighbors.push(...grid.get(key)!);
      }
    }
  }

  return neighbors;
}

/**
 * Get the cell key for a given position.
 *
 * @param pos - Position vector
 * @param cellSize - Size of each grid cell
 * @returns Cell key string "x,y"
 */
export function getCellKey(pos: Vector2D, cellSize: number): string {
  const cellX = Math.floor(pos.x / cellSize);
  const cellY = Math.floor(pos.y / cellSize);
  return `${cellX},${cellY}`;
}

/**
 * Calculate the number of unique cells in a grid.
 *
 * @param grid - The spatial hash grid
 * @returns Number of non-empty cells
 */
export function getCellCount(grid: SpatialGrid): number {
  return grid.size;
}

/**
 * Get all boids from the grid.
 *
 * @param grid - The spatial hash grid
 * @returns Flat array of all boids
 */
export function getAllBoids(grid: SpatialGrid): Boid[] {
  const boids: Boid[] = [];
  for (const cellBoids of grid.values()) {
    boids.push(...cellBoids);
  }
  return boids;
}
