/**
 * Spatial Hash Grid Tests
 *
 * Tests for efficient O(1) neighbor lookup in boid simulations.
 */

import { describe, it, expect } from 'vitest';
import {
  buildSpatialHash,
  getNeighbors,
  getCellKey,
  getCellCount,
  getAllBoids,
} from '../../src/boids/spatial-hash.js';
import type { Boid } from '../../src/boids/types.js';

// Helper to create a boid at given position
function createBoid(x: number, y: number): Boid {
  return {
    pos: { x, y },
    vel: { x: 0, y: 0 },
    acc: { x: 0, y: 0 },
    maxSpeed: 4,
    maxForce: 0.15,
  };
}

describe('buildSpatialHash', () => {
  it('correctly assigns boids to grid cells', () => {
    const cellSize = 50;
    const boids = [
      createBoid(25, 25),   // Cell (0,0)
      createBoid(75, 25),   // Cell (1,0)
      createBoid(25, 75),   // Cell (0,1)
    ];

    const grid = buildSpatialHash(boids, cellSize);

    expect(grid.get('0,0')).toHaveLength(1);
    expect(grid.get('1,0')).toHaveLength(1);
    expect(grid.get('0,1')).toHaveLength(1);
  });

  it('groups multiple boids in same cell', () => {
    const cellSize = 100;
    const boids = [
      createBoid(10, 10),
      createBoid(20, 20),
      createBoid(30, 30),
    ];

    const grid = buildSpatialHash(boids, cellSize);

    // All in cell (0,0)
    expect(grid.get('0,0')).toHaveLength(3);
  });

  it('handles empty boid array', () => {
    const grid = buildSpatialHash([], 50);
    expect(grid.size).toBe(0);
  });

  it('handles boids at negative coordinates', () => {
    const cellSize = 50;
    const boids = [
      createBoid(-25, -25), // Cell (-1,-1)
      createBoid(25, 25),   // Cell (0,0)
    ];

    const grid = buildSpatialHash(boids, cellSize);

    expect(grid.get('-1,-1')).toHaveLength(1);
    expect(grid.get('0,0')).toHaveLength(1);
  });

  it('handles boids exactly on cell boundaries', () => {
    const cellSize = 50;
    const boids = [
      createBoid(0, 0),     // Cell (0,0)
      createBoid(50, 0),    // Cell (1,0)
      createBoid(50, 50),   // Cell (1,1)
    ];

    const grid = buildSpatialHash(boids, cellSize);

    expect(grid.get('0,0')).toHaveLength(1);
    expect(grid.get('1,0')).toHaveLength(1);
    expect(grid.get('1,1')).toHaveLength(1);
  });
});

describe('getNeighbors', () => {
  it('returns boids from same cell', () => {
    const cellSize = 100;
    const target = createBoid(50, 50);
    const neighbor = createBoid(60, 60);

    const grid = buildSpatialHash([target, neighbor], cellSize);
    const neighbors = getNeighbors(target, grid, cellSize);

    expect(neighbors).toContain(target); // Includes self
    expect(neighbors).toContain(neighbor);
    expect(neighbors).toHaveLength(2);
  });

  it('returns boids from adjacent cells', () => {
    const cellSize = 50;
    const target = createBoid(50, 50);      // Cell (1,1)
    const neighbor = createBoid(100, 100);  // Cell (2,2) - adjacent

    const grid = buildSpatialHash([target, neighbor], cellSize);
    const neighbors = getNeighbors(target, grid, cellSize);

    expect(neighbors).toContain(target);
    expect(neighbors).toContain(neighbor);
  });

  it('does not return boids from distant cells', () => {
    const cellSize = 50;
    const target = createBoid(50, 50);      // Cell (1,1)
    const farBoid = createBoid(200, 200);   // Cell (4,4) - not adjacent

    const grid = buildSpatialHash([target, farBoid], cellSize);
    const neighbors = getNeighbors(target, grid, cellSize);

    expect(neighbors).toContain(target);
    expect(neighbors).not.toContain(farBoid);
  });

  it('checks all 9 cells (3x3 grid)', () => {
    const cellSize = 100;
    // Place boids in all 8 surrounding cells plus center
    const center = createBoid(150, 150);    // Cell (1,1)
    const surroundingBoids = [
      createBoid(50, 50),    // (0,0)
      createBoid(150, 50),   // (1,0)
      createBoid(250, 50),   // (2,0)
      createBoid(50, 150),   // (0,1)
      createBoid(250, 150),  // (2,1)
      createBoid(50, 250),   // (0,2)
      createBoid(150, 250),  // (1,2)
      createBoid(250, 250),  // (2,2)
    ];

    const allBoids = [center, ...surroundingBoids];
    const grid = buildSpatialHash(allBoids, cellSize);
    const neighbors = getNeighbors(center, grid, cellSize);

    expect(neighbors).toHaveLength(9); // All 9 cells
    for (const boid of allBoids) {
      expect(neighbors).toContain(boid);
    }
  });

  it('handles empty cells gracefully', () => {
    const cellSize = 50;
    const target = createBoid(50, 50);

    const grid = buildSpatialHash([target], cellSize);
    const neighbors = getNeighbors(target, grid, cellSize);

    // Should only find self
    expect(neighbors).toHaveLength(1);
    expect(neighbors).toContain(target);
  });
});

describe('getCellKey', () => {
  it('generates correct key for positive coordinates', () => {
    expect(getCellKey({ x: 75, y: 125 }, 50)).toBe('1,2');
  });

  it('generates correct key for negative coordinates', () => {
    expect(getCellKey({ x: -25, y: -75 }, 50)).toBe('-1,-2');
  });

  it('generates correct key for zero', () => {
    expect(getCellKey({ x: 0, y: 0 }, 50)).toBe('0,0');
  });

  it('handles cell boundary correctly', () => {
    expect(getCellKey({ x: 50, y: 50 }, 50)).toBe('1,1');
    expect(getCellKey({ x: 49.9, y: 49.9 }, 50)).toBe('0,0');
  });
});

describe('getCellCount', () => {
  it('returns number of occupied cells', () => {
    const boids = [
      createBoid(25, 25),   // Cell (0,0)
      createBoid(75, 25),   // Cell (1,0)
      createBoid(75, 75),   // Cell (1,1)
    ];

    const grid = buildSpatialHash(boids, 50);
    expect(getCellCount(grid)).toBe(3);
  });

  it('returns 0 for empty grid', () => {
    const grid = buildSpatialHash([], 50);
    expect(getCellCount(grid)).toBe(0);
  });

  it('counts cells not boids', () => {
    const boids = [
      createBoid(10, 10),
      createBoid(20, 20),
      createBoid(30, 30),
    ];

    const grid = buildSpatialHash(boids, 100);
    expect(getCellCount(grid)).toBe(1); // All in same cell
  });
});

describe('getAllBoids', () => {
  it('returns all boids from grid', () => {
    const boids = [
      createBoid(25, 25),
      createBoid(75, 75),
      createBoid(125, 125),
    ];

    const grid = buildSpatialHash(boids, 50);
    const allBoids = getAllBoids(grid);

    expect(allBoids).toHaveLength(3);
    for (const boid of boids) {
      expect(allBoids).toContain(boid);
    }
  });

  it('returns empty array for empty grid', () => {
    const grid = buildSpatialHash([], 50);
    expect(getAllBoids(grid)).toHaveLength(0);
  });
});

describe('Performance Characteristics', () => {
  it('builds grid in reasonable time for large flock', () => {
    const boids: Boid[] = [];
    for (let i = 0; i < 1000; i++) {
      boids.push(createBoid(Math.random() * 1000, Math.random() * 1000));
    }

    const start = performance.now();
    buildSpatialHash(boids, 50);
    const duration = performance.now() - start;

    // Should complete in under 50ms
    expect(duration).toBeLessThan(50);
  });

  it('getNeighbors is much faster than brute force for large flocks', () => {
    const boids: Boid[] = [];
    for (let i = 0; i < 1000; i++) {
      boids.push(createBoid(Math.random() * 1000, Math.random() * 1000));
    }

    const cellSize = 50;
    const grid = buildSpatialHash(boids, cellSize);
    const target = boids[0];

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      getNeighbors(target, grid, cellSize);
    }
    const duration = performance.now() - start;

    // 100 lookups should complete quickly
    expect(duration).toBeLessThan(10);
  });
});
