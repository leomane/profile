/**
 * Pheromone Diffusion and Evaporation Tests
 *
 * Tests for the heat equation approximation used for pheromone spreading.
 */

import { describe, it, expect } from 'vitest';
import {
  diffusePheromones,
  evaporatePheromones,
  depositPheromone,
  getPheromoneAt,
  getTotalPheromone,
  createPheromoneField,
  worldToGrid,
} from '../../src/ants/pheromone.js';

describe('diffusePheromones', () => {
  describe('Heat Equation Approximation', () => {
    it('pheromone spreads to neighboring cells', () => {
      const cols = 5;
      const rows = 5;
      const field = new Float32Array(cols * rows).fill(0);

      // Place pheromone at center
      const centerIdx = 2 + 2 * cols;
      field[centerIdx] = 100;

      const diffusionRate = 0.15;
      const result = diffusePheromones(field, cols, rows, diffusionRate, 1.0);

      // Center should decrease
      expect(result[centerIdx]).toBeLessThan(100);
      // Neighbors should increase
      expect(result[centerIdx - 1]).toBeGreaterThan(0); // left
      expect(result[centerIdx + 1]).toBeGreaterThan(0); // right
      expect(result[centerIdx - cols]).toBeGreaterThan(0); // up
      expect(result[centerIdx + cols]).toBeGreaterThan(0); // down
    });

    it('total pheromone approximately conserved during pure diffusion', () => {
      const cols = 10;
      const rows = 10;
      const field = new Float32Array(cols * rows).fill(0);
      field[5 + 5 * cols] = 1000;

      const totalBefore = getTotalPheromone(field);
      // Pure diffusion, no evaporation
      const result = diffusePheromones(field, cols, rows, 0.15, 1.0);
      const totalAfter = getTotalPheromone(result);

      // Should be approximately conserved (small loss at edges)
      expect(totalAfter).toBeGreaterThan(totalBefore * 0.95);
      expect(totalAfter).toBeLessThanOrEqual(totalBefore);
    });

    it('higher diffusion rate spreads faster', () => {
      const cols = 5;
      const rows = 5;
      const field1 = new Float32Array(cols * rows).fill(0);
      const field2 = new Float32Array(cols * rows).fill(0);
      field1[2 + 2 * cols] = 100;
      field2[2 + 2 * cols] = 100;

      const slowDiffuse = diffusePheromones(field1, cols, rows, 0.1, 1.0);
      const fastDiffuse = diffusePheromones(field2, cols, rows, 0.3, 1.0);

      // Center should decrease more with faster diffusion
      const centerIdx = 2 + 2 * cols;
      expect(fastDiffuse[centerIdx]).toBeLessThan(slowDiffuse[centerIdx]);
      // Neighbors should have more with faster diffusion
      expect(fastDiffuse[centerIdx - 1]).toBeGreaterThan(slowDiffuse[centerIdx - 1]);
    });

    it('zero diffusion rate leaves center unchanged', () => {
      const cols = 5;
      const rows = 5;
      const field = new Float32Array(cols * rows).fill(0);
      field[2 + 2 * cols] = 100;

      const result = diffusePheromones(field, cols, rows, 0, 1.0);

      expect(result[2 + 2 * cols]).toBeCloseTo(100, 5);
    });
  });

  describe('Evaporation', () => {
    it('pheromone decays with evaporation rate', () => {
      const cols = 3;
      const rows = 3;
      const field = new Float32Array(cols * rows).fill(100);

      const evapRate = 0.995;
      const result = diffusePheromones(field, cols, rows, 0, evapRate);

      // Each cell should decay
      expect(result[4]).toBeCloseTo(100 * evapRate, 1);
    });

    it('lower evaporation rate causes faster decay', () => {
      const field1 = new Float32Array(9).fill(100);
      const field2 = new Float32Array(9).fill(100);

      const slowDecay = diffusePheromones(field1, 3, 3, 0, 0.999);
      const fastDecay = diffusePheromones(field2, 3, 3, 0, 0.990);

      expect(fastDecay[4]).toBeLessThan(slowDecay[4]);
    });

    it('evaporation rate of 1.0 means no decay', () => {
      const cols = 3;
      const rows = 3;
      const field = new Float32Array(cols * rows).fill(100);

      const result = diffusePheromones(field, cols, rows, 0, 1.0);

      expect(result[4]).toBeCloseTo(100, 5);
    });

    it('evaporation rate of 0 removes all pheromone', () => {
      const cols = 3;
      const rows = 3;
      const field = new Float32Array(cols * rows).fill(100);

      const result = diffusePheromones(field, cols, rows, 0, 0);

      for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBe(0);
      }
    });
  });

  describe('Edge Handling', () => {
    it('handles boundary cells without crashing', () => {
      const cols = 3;
      const rows = 3;
      const field = new Float32Array(cols * rows);
      field[0] = 100; // Corner

      expect(() => diffusePheromones(field, cols, rows, 0.15, 0.99)).not.toThrow();
    });

    it('corner cells only decay, do not diffuse to interior', () => {
      const cols = 5;
      const rows = 5;
      const field = new Float32Array(cols * rows).fill(0);
      field[0] = 100; // Top-left corner

      const result = diffusePheromones(field, cols, rows, 0.5, 1.0);

      // Corner should just evaporate, not spread into interior
      expect(result[0]).toBeCloseTo(100, 0); // No evaporation in this test
    });
  });
});

describe('evaporatePheromones', () => {
  it('applies uniform decay to all cells', () => {
    const field = new Float32Array([100, 200, 50, 75]);
    const result = evaporatePheromones(field, 0.5);

    expect(result[0]).toBeCloseTo(50, 5);
    expect(result[1]).toBeCloseTo(100, 5);
    expect(result[2]).toBeCloseTo(25, 5);
    expect(result[3]).toBeCloseTo(37.5, 5);
  });

  it('evaporation is exponential over multiple steps', () => {
    let field = new Float32Array([100]);
    const rate = 0.9;

    for (let i = 0; i < 10; i++) {
      field = evaporatePheromones(field, rate);
    }

    expect(field[0]).toBeCloseTo(100 * Math.pow(rate, 10), 1);
  });
});

describe('depositPheromone', () => {
  it('adds pheromone at specified location', () => {
    const field = new Float32Array(25).fill(0);
    depositPheromone(field, 5, 5, 2, 2, 50, 100);

    expect(field[2 + 2 * 5]).toBe(50);
  });

  it('accumulates when depositing multiple times', () => {
    const field = new Float32Array(25).fill(0);
    depositPheromone(field, 5, 5, 2, 2, 30, 100);
    depositPheromone(field, 5, 5, 2, 2, 30, 100);

    expect(field[2 + 2 * 5]).toBe(60);
  });

  it('clamps to maximum pheromone level', () => {
    const field = new Float32Array(25).fill(0);
    depositPheromone(field, 5, 5, 2, 2, 80, 100);
    depositPheromone(field, 5, 5, 2, 2, 50, 100);

    expect(field[2 + 2 * 5]).toBe(100);
  });

  it('returns false for out-of-bounds coordinates', () => {
    const field = new Float32Array(25).fill(0);

    expect(depositPheromone(field, 5, 5, -1, 2, 50, 100)).toBe(false);
    expect(depositPheromone(field, 5, 5, 2, -1, 50, 100)).toBe(false);
    expect(depositPheromone(field, 5, 5, 5, 2, 50, 100)).toBe(false);
    expect(depositPheromone(field, 5, 5, 2, 5, 50, 100)).toBe(false);
  });

  it('returns true for valid coordinates', () => {
    const field = new Float32Array(25).fill(0);
    expect(depositPheromone(field, 5, 5, 2, 2, 50, 100)).toBe(true);
  });
});

describe('getPheromoneAt', () => {
  it('returns pheromone level at location', () => {
    const field = new Float32Array(25).fill(0);
    field[2 + 2 * 5] = 75;

    expect(getPheromoneAt(field, 5, 5, 2, 2)).toBe(75);
  });

  it('returns 0 for out-of-bounds coordinates', () => {
    const field = new Float32Array(25).fill(100);

    expect(getPheromoneAt(field, 5, 5, -1, 2)).toBe(0);
    expect(getPheromoneAt(field, 5, 5, 5, 2)).toBe(0);
    expect(getPheromoneAt(field, 5, 5, 2, -1)).toBe(0);
    expect(getPheromoneAt(field, 5, 5, 2, 5)).toBe(0);
  });
});

describe('getTotalPheromone', () => {
  it('sums all pheromone values', () => {
    const field = new Float32Array([10, 20, 30, 40]);
    expect(getTotalPheromone(field)).toBe(100);
  });

  it('returns 0 for empty field', () => {
    const field = new Float32Array(25).fill(0);
    expect(getTotalPheromone(field)).toBe(0);
  });
});

describe('createPheromoneField', () => {
  it('creates zero-initialized field of correct size', () => {
    const field = createPheromoneField(10, 20);

    expect(field.length).toBe(200);
    expect(getTotalPheromone(field)).toBe(0);
  });
});

describe('worldToGrid', () => {
  it('converts world coordinates to grid coordinates', () => {
    expect(worldToGrid(75, 125, 50)).toEqual({ gx: 1, gy: 2 });
  });

  it('handles exact boundaries', () => {
    expect(worldToGrid(50, 100, 50)).toEqual({ gx: 1, gy: 2 });
  });

  it('handles origin', () => {
    expect(worldToGrid(0, 0, 50)).toEqual({ gx: 0, gy: 0 });
  });

  it('handles coordinates just under boundary', () => {
    expect(worldToGrid(49.9, 99.9, 50)).toEqual({ gx: 0, gy: 1 });
  });
});
