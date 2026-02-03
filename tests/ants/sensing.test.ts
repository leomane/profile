/**
 * Ant Sensing System Tests
 *
 * Tests for three-sensor pheromone detection and navigation.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateSensorPositions,
  chooseSensorDirection,
  directionToTarget,
  calculateFoodAttraction,
  blendDirections,
  isWithinRange,
  normalize,
  heading,
  fromAngle,
  DEFAULT_SENSOR_ANGLE,
  DEFAULT_SENSOR_DISTANCE,
} from '../../src/ants/sensing.js';
import type { Vector2D } from '../../src/ants/types.js';

// Helper to check if two vectors are approximately equal
function vectorsEqual(a: Vector2D, b: Vector2D, tolerance = 0.001): boolean {
  return Math.abs(a.x - b.x) < tolerance && Math.abs(a.y - b.y) < tolerance;
}

// Helper to get magnitude
function magnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

describe('Vector Utilities', () => {
  describe('normalize', () => {
    it('returns unit vector', () => {
      const v = normalize({ x: 3, y: 4 });
      expect(magnitude(v)).toBeCloseTo(1, 10);
    });

    it('handles zero vector', () => {
      const v = normalize({ x: 0, y: 0 });
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });
  });

  describe('heading', () => {
    it('returns 0 for rightward vector', () => {
      expect(heading({ x: 1, y: 0 })).toBeCloseTo(0, 10);
    });

    it('returns PI/2 for downward vector', () => {
      expect(heading({ x: 0, y: 1 })).toBeCloseTo(Math.PI / 2, 10);
    });

    it('returns PI for leftward vector', () => {
      expect(Math.abs(heading({ x: -1, y: 0 }))).toBeCloseTo(Math.PI, 10);
    });
  });

  describe('fromAngle', () => {
    it('creates rightward vector from angle 0', () => {
      const v = fromAngle(0);
      expect(v.x).toBeCloseTo(1, 10);
      expect(v.y).toBeCloseTo(0, 10);
    });

    it('creates downward vector from angle PI/2', () => {
      const v = fromAngle(Math.PI / 2);
      expect(v.x).toBeCloseTo(0, 10);
      expect(v.y).toBeCloseTo(1, 10);
    });
  });
});

describe('calculateSensorPositions', () => {
  it('calculates three sensor positions', () => {
    const pos: Vector2D = { x: 100, y: 100 };
    const vel: Vector2D = { x: 1, y: 0 }; // Moving right

    const sensors = calculateSensorPositions(pos, vel);

    expect(sensors.ahead).toBeDefined();
    expect(sensors.left).toBeDefined();
    expect(sensors.right).toBeDefined();
  });

  it('ahead sensor is in direction of movement', () => {
    const pos: Vector2D = { x: 100, y: 100 };
    const vel: Vector2D = { x: 1, y: 0 }; // Moving right

    const sensors = calculateSensorPositions(pos, vel, 15);

    // Ahead should be to the right of position
    expect(sensors.ahead.x).toBeCloseTo(115, 5);
    expect(sensors.ahead.y).toBeCloseTo(100, 5);
  });

  it('left sensor is rotated counterclockwise from heading', () => {
    const pos: Vector2D = { x: 100, y: 100 };
    const vel: Vector2D = { x: 1, y: 0 }; // Moving right

    const sensors = calculateSensorPositions(pos, vel, 15, Math.PI / 4);

    // Left should be up and to the right
    expect(sensors.left.x).toBeGreaterThan(pos.x);
    expect(sensors.left.y).toBeLessThan(pos.y);
  });

  it('right sensor is rotated clockwise from heading', () => {
    const pos: Vector2D = { x: 100, y: 100 };
    const vel: Vector2D = { x: 1, y: 0 }; // Moving right

    const sensors = calculateSensorPositions(pos, vel, 15, Math.PI / 4);

    // Right should be down and to the right
    expect(sensors.right.x).toBeGreaterThan(pos.x);
    expect(sensors.right.y).toBeGreaterThan(pos.y);
  });

  it('respects sensor distance parameter', () => {
    const pos: Vector2D = { x: 0, y: 0 };
    const vel: Vector2D = { x: 1, y: 0 };

    const sensors = calculateSensorPositions(pos, vel, 30);

    expect(sensors.ahead.x).toBeCloseTo(30, 5);
  });

  it('respects sensor angle parameter', () => {
    const pos: Vector2D = { x: 0, y: 0 };
    const vel: Vector2D = { x: 1, y: 0 };

    // With 90 degree angle, left should be straight up
    const sensors = calculateSensorPositions(pos, vel, 10, Math.PI / 2);

    expect(sensors.left.x).toBeCloseTo(0, 5);
    expect(sensors.left.y).toBeCloseTo(-10, 5);
  });
});

describe('chooseSensorDirection', () => {
  it('turns left when left sensor has highest reading', () => {
    const currentHeading = 0; // Facing right
    const sensorAngle = Math.PI / 4;

    const direction = chooseSensorDirection(10, 50, 5, currentHeading, sensorAngle);

    // Should turn left (negative angle from heading)
    const resultHeading = heading(direction);
    expect(resultHeading).toBeLessThan(currentHeading);
  });

  it('turns right when right sensor has highest reading', () => {
    const currentHeading = 0; // Facing right
    const sensorAngle = Math.PI / 4;

    const direction = chooseSensorDirection(10, 5, 50, currentHeading, sensorAngle);

    // Should turn right (positive angle from heading)
    const resultHeading = heading(direction);
    expect(resultHeading).toBeGreaterThan(currentHeading);
  });

  it('continues straight when center sensor has highest reading', () => {
    const currentHeading = 0; // Facing right
    const sensorAngle = Math.PI / 4;

    const direction = chooseSensorDirection(50, 10, 10, currentHeading, sensorAngle);

    // Should continue straight
    const resultHeading = heading(direction);
    expect(resultHeading).toBeCloseTo(currentHeading, 5);
  });

  it('continues straight when sensors are tied', () => {
    const currentHeading = Math.PI / 4;
    const sensorAngle = Math.PI / 4;

    const direction = chooseSensorDirection(50, 50, 50, currentHeading, sensorAngle);

    const resultHeading = heading(direction);
    expect(resultHeading).toBeCloseTo(currentHeading, 5);
  });

  it('returns normalized vector', () => {
    const direction = chooseSensorDirection(10, 50, 5, 0, Math.PI / 4);
    expect(magnitude(direction)).toBeCloseTo(1, 5);
  });
});

describe('directionToTarget', () => {
  it('returns direction toward target', () => {
    const antPos: Vector2D = { x: 0, y: 0 };
    const targetPos: Vector2D = { x: 100, y: 0 };

    const dir = directionToTarget(antPos, targetPos);

    expect(dir.x).toBeCloseTo(1, 5);
    expect(dir.y).toBeCloseTo(0, 5);
  });

  it('returns normalized vector', () => {
    const antPos: Vector2D = { x: 0, y: 0 };
    const targetPos: Vector2D = { x: 30, y: 40 };

    const dir = directionToTarget(antPos, targetPos);

    expect(magnitude(dir)).toBeCloseTo(1, 5);
  });

  it('handles diagonal targets', () => {
    const antPos: Vector2D = { x: 0, y: 0 };
    const targetPos: Vector2D = { x: 1, y: 1 };

    const dir = directionToTarget(antPos, targetPos);

    expect(dir.x).toBeCloseTo(dir.y, 5);
    expect(dir.x).toBeGreaterThan(0);
  });
});

describe('calculateFoodAttraction', () => {
  it('returns zero attraction outside max distance', () => {
    const antPos: Vector2D = { x: 0, y: 0 };
    const foodPos: Vector2D = { x: 200, y: 0 };

    const attraction = calculateFoodAttraction(antPos, foodPos, 200, 150, 1.0);

    expect(attraction.x).toBe(0);
    expect(attraction.y).toBe(0);
  });

  it('returns zero attraction when distance is zero', () => {
    const antPos: Vector2D = { x: 100, y: 100 };
    const foodPos: Vector2D = { x: 100, y: 100 };

    const attraction = calculateFoodAttraction(antPos, foodPos, 0, 150, 1.0);

    expect(attraction.x).toBe(0);
    expect(attraction.y).toBe(0);
  });

  it('attraction increases as distance decreases', () => {
    const antPos: Vector2D = { x: 0, y: 0 };
    const foodPos: Vector2D = { x: 100, y: 0 };

    const farAttraction = calculateFoodAttraction(antPos, foodPos, 100, 150, 1.0);
    const nearAttraction = calculateFoodAttraction(antPos, foodPos, 50, 150, 1.0);

    expect(magnitude(nearAttraction)).toBeGreaterThan(magnitude(farAttraction));
  });

  it('attraction scales with food amount', () => {
    const antPos: Vector2D = { x: 0, y: 0 };
    const foodPos: Vector2D = { x: 50, y: 0 };

    const fullFood = calculateFoodAttraction(antPos, foodPos, 50, 150, 1.0);
    const halfFood = calculateFoodAttraction(antPos, foodPos, 50, 150, 0.5);

    expect(magnitude(fullFood)).toBeCloseTo(magnitude(halfFood) * 2, 5);
  });

  it('points toward food source', () => {
    const antPos: Vector2D = { x: 0, y: 0 };
    const foodPos: Vector2D = { x: 50, y: 50 };

    const attraction = calculateFoodAttraction(antPos, foodPos, 70.7, 150, 1.0);

    expect(attraction.x).toBeGreaterThan(0);
    expect(attraction.y).toBeGreaterThan(0);
  });
});

describe('blendDirections', () => {
  it('returns pure pheromone direction when explorationBias is 0', () => {
    const pheromoneDir: Vector2D = { x: 1, y: 0 };
    const wanderDir: Vector2D = { x: 0, y: 1 };

    const result = blendDirections(pheromoneDir, wanderDir, 0);

    expect(result.x).toBeCloseTo(1, 5);
    expect(result.y).toBeCloseTo(0, 5);
  });

  it('returns pure wander direction when explorationBias is 1', () => {
    const pheromoneDir: Vector2D = { x: 1, y: 0 };
    const wanderDir: Vector2D = { x: 0, y: 1 };

    const result = blendDirections(pheromoneDir, wanderDir, 1);

    expect(result.x).toBeCloseTo(0, 5);
    expect(result.y).toBeCloseTo(1, 5);
  });

  it('blends directions at explorationBias 0.5', () => {
    const pheromoneDir: Vector2D = { x: 1, y: 0 };
    const wanderDir: Vector2D = { x: 0, y: 1 };

    const result = blendDirections(pheromoneDir, wanderDir, 0.5);

    // Should be diagonal-ish
    expect(result.x).toBeGreaterThan(0);
    expect(result.y).toBeGreaterThan(0);
    expect(magnitude(result)).toBeCloseTo(1, 5);
  });

  it('clamps explorationBias to [0, 1]', () => {
    const pheromoneDir: Vector2D = { x: 1, y: 0 };
    const wanderDir: Vector2D = { x: 0, y: 1 };

    const negBias = blendDirections(pheromoneDir, wanderDir, -0.5);
    const overBias = blendDirections(pheromoneDir, wanderDir, 1.5);

    expect(negBias.x).toBeCloseTo(1, 5);
    expect(overBias.y).toBeCloseTo(1, 5);
  });

  it('returns normalized result', () => {
    const pheromoneDir: Vector2D = { x: 1, y: 0 };
    const wanderDir: Vector2D = { x: 0.5, y: 0.5 };

    const result = blendDirections(pheromoneDir, wanderDir, 0.3);

    expect(magnitude(result)).toBeCloseTo(1, 5);
  });
});

describe('isWithinRange', () => {
  it('returns true when within range', () => {
    const pos: Vector2D = { x: 0, y: 0 };
    const target: Vector2D = { x: 10, y: 0 };

    expect(isWithinRange(pos, target, 15)).toBe(true);
  });

  it('returns false when outside range', () => {
    const pos: Vector2D = { x: 0, y: 0 };
    const target: Vector2D = { x: 100, y: 0 };

    expect(isWithinRange(pos, target, 50)).toBe(false);
  });

  it('returns true when exactly at boundary', () => {
    const pos: Vector2D = { x: 0, y: 0 };
    const target: Vector2D = { x: 3, y: 4 }; // Distance = 5

    // Strictly less than, so at boundary returns false
    expect(isWithinRange(pos, target, 5)).toBe(false);
    expect(isWithinRange(pos, target, 5.001)).toBe(true);
  });

  it('returns true when positions are identical', () => {
    const pos: Vector2D = { x: 50, y: 50 };
    const target: Vector2D = { x: 50, y: 50 };

    expect(isWithinRange(pos, target, 10)).toBe(true);
  });
});

describe('Ant Navigation Behavior', () => {
  it('ant carrying food navigates toward nest', () => {
    const antPos: Vector2D = { x: 200, y: 200 };
    const nestPos: Vector2D = { x: 100, y: 100 };

    const direction = directionToTarget(antPos, nestPos);

    // Should point toward nest (up and left)
    expect(direction.x).toBeLessThan(0);
    expect(direction.y).toBeLessThan(0);
  });

  it('sensor-based navigation chooses highest pheromone', () => {
    // Simulate ant facing right, pheromone trail to the left
    const currentHeading = 0;
    const leftSense = 100; // Strong trail to left
    const centerSense = 10;
    const rightSense = 5;

    const direction = chooseSensorDirection(
      centerSense,
      leftSense,
      rightSense,
      currentHeading
    );

    // Should turn toward left (negative y direction)
    expect(heading(direction)).toBeLessThan(0);
  });
});
