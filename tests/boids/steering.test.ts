/**
 * Boid Steering Behavior Tests
 *
 * Tests for Craig Reynolds' three flocking rules:
 * - Separation: avoid crowding
 * - Alignment: steer toward average heading
 * - Cohesion: steer toward average position
 */

import { describe, it, expect } from 'vitest';
import {
  separate,
  align,
  cohere,
  seek,
  flee,
  flock,
  distance,
  magnitude,
  normalize,
  setMagnitude,
  limit,
  add,
  subtract,
  DEFAULT_MAX_SPEED,
  DEFAULT_MAX_FORCE,
  DEFAULT_DESIRED_SEPARATION,
  DEFAULT_PERCEPTION,
} from '../../src/boids/steering.js';
import type { Boid, Vector2D } from '../../src/boids/types.js';

// Helper to create a boid at given position with velocity
function createBoid(
  x: number,
  y: number,
  vx: number = 0,
  vy: number = 0,
  maxSpeed: number = DEFAULT_MAX_SPEED,
  maxForce: number = DEFAULT_MAX_FORCE
): Boid {
  return {
    pos: { x, y },
    vel: { x: vx, y: vy },
    acc: { x: 0, y: 0 },
    maxSpeed,
    maxForce,
  };
}

describe('Vector Operations', () => {
  describe('distance', () => {
    it('calculates distance between two points', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5, 10);
    });

    it('distance to self is zero', () => {
      expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
    });
  });

  describe('magnitude', () => {
    it('calculates vector length', () => {
      expect(magnitude({ x: 3, y: 4 })).toBeCloseTo(5, 10);
    });

    it('zero vector has zero magnitude', () => {
      expect(magnitude({ x: 0, y: 0 })).toBe(0);
    });
  });

  describe('normalize', () => {
    it('returns unit vector', () => {
      const v = normalize({ x: 3, y: 4 });
      expect(magnitude(v)).toBeCloseTo(1, 10);
    });

    it('preserves direction', () => {
      const v = normalize({ x: 10, y: 0 });
      expect(v.x).toBeCloseTo(1, 10);
      expect(v.y).toBeCloseTo(0, 10);
    });

    it('handles zero vector', () => {
      const v = normalize({ x: 0, y: 0 });
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });
  });

  describe('setMagnitude', () => {
    it('sets vector to specified length', () => {
      const v = setMagnitude({ x: 3, y: 4 }, 10);
      expect(magnitude(v)).toBeCloseTo(10, 10);
    });

    it('preserves direction', () => {
      const original = { x: 3, y: 4 };
      const scaled = setMagnitude(original, 10);
      // Direction should be the same (same ratio)
      expect(scaled.x / scaled.y).toBeCloseTo(original.x / original.y, 10);
    });
  });

  describe('limit', () => {
    it('limits vector to max length', () => {
      const v = limit({ x: 30, y: 40 }, 5);
      expect(magnitude(v)).toBeCloseTo(5, 10);
    });

    it('does not affect vectors under limit', () => {
      const v = limit({ x: 3, y: 4 }, 100);
      expect(v.x).toBeCloseTo(3, 10);
      expect(v.y).toBeCloseTo(4, 10);
    });
  });

  describe('add/subtract', () => {
    it('adds vectors correctly', () => {
      const result = add({ x: 1, y: 2 }, { x: 3, y: 4 });
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('subtracts vectors correctly', () => {
      const result = subtract({ x: 5, y: 7 }, { x: 2, y: 3 });
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });
  });
});

describe('Separation', () => {
  it('produces zero force when no neighbors within separation distance', () => {
    const bird = createBoid(100, 100, 1, 0);
    const neighbors = [createBoid(200, 200)]; // Far away
    const force = separate(bird, neighbors, 25);

    expect(force.x).toBe(0);
    expect(force.y).toBe(0);
  });

  it('produces zero force when neighbors is empty', () => {
    const bird = createBoid(100, 100, 1, 0);
    const force = separate(bird, [], 25);

    expect(force.x).toBe(0);
    expect(force.y).toBe(0);
  });

  it('produces force pointing away from nearby neighbor', () => {
    const bird = createBoid(100, 100, 0, 0);
    const neighbor = createBoid(110, 100); // 10 units to the right

    const force = separate(bird, [neighbor], 25);

    // Should steer left (away from neighbor on right)
    expect(force.x).toBeLessThan(0);
  });

  it('force magnitude is limited to maxForce', () => {
    const maxForce = 0.15;
    const bird = createBoid(100, 100, 0, 0, 4, maxForce);
    const neighbor = createBoid(105, 100); // Very close

    const force = separate(bird, [neighbor], 25);

    expect(magnitude(force)).toBeLessThanOrEqual(maxForce + 0.001);
  });

  it('closer neighbors produce stronger relative influence', () => {
    const bird = createBoid(100, 100, 0, 0);

    // Test with single neighbors at different distances
    const nearNeighbor = createBoid(105, 100); // 5 units away
    const farNeighbor = createBoid(120, 100);  // 20 units away

    const forceNear = separate(bird, [nearNeighbor], 25);
    const forceFar = separate(bird, [farNeighbor], 25);

    // Both should steer left, but near should have more influence
    expect(forceNear.x).toBeLessThan(0);
    expect(forceFar.x).toBeLessThan(0);
  });

  it('averages forces from multiple neighbors', () => {
    const bird = createBoid(100, 100, 0, 0);
    const neighbors = [
      createBoid(110, 100), // Right
      createBoid(90, 100),  // Left
    ];

    const force = separate(bird, neighbors, 25);

    // Should roughly cancel out in x direction
    expect(Math.abs(force.x)).toBeLessThan(0.5);
  });

  it('ignores self (d = 0)', () => {
    const bird = createBoid(100, 100, 0, 0);
    const neighbors = [bird]; // Include self

    const force = separate(bird, neighbors, 25);

    // Self should be ignored
    expect(force.x).toBe(0);
    expect(force.y).toBe(0);
  });
});

describe('Alignment', () => {
  it('produces zero force when no neighbors in perception range', () => {
    const bird = createBoid(100, 100, 1, 0);
    const force = align(bird, [], 100);

    expect(force.x).toBe(0);
    expect(force.y).toBe(0);
  });

  it('produces zero force when neighbors are too far', () => {
    const bird = createBoid(100, 100, 1, 0);
    const neighbor = createBoid(300, 300, 0, 1); // Far away
    const force = align(bird, [neighbor], 100);

    expect(force.x).toBe(0);
    expect(force.y).toBe(0);
  });

  it('steers toward average velocity of neighbors', () => {
    const bird = createBoid(100, 100, 1, 0); // Moving right

    const neighbor1 = createBoid(120, 100, 0, 1); // Moving down
    const neighbor2 = createBoid(80, 100, 0, 1);  // Moving down

    const force = align(bird, [neighbor1, neighbor2], 100);

    // Should steer downward (toward neighbors' average velocity)
    expect(force.y).toBeGreaterThan(0);
  });

  it('force is limited to maxForce', () => {
    const maxForce = 0.15;
    const bird = createBoid(100, 100, 1, 0, 4, maxForce);
    const neighbor = createBoid(120, 100, -10, -10); // Very different velocity

    const force = align(bird, [neighbor], 100);

    expect(magnitude(force)).toBeLessThanOrEqual(maxForce + 0.001);
  });
});

describe('Cohesion', () => {
  it('produces zero force when no neighbors in perception range', () => {
    const bird = createBoid(100, 100, 0, 0);
    const force = cohere(bird, [], 100);

    expect(force.x).toBe(0);
    expect(force.y).toBe(0);
  });

  it('produces force toward center of mass of neighbors', () => {
    const bird = createBoid(100, 100, 0, 0);
    const neighbors = [
      createBoid(200, 100), // Right of bird
      createBoid(200, 200), // Right and below
    ];

    const force = cohere(bird, neighbors, 200);

    // Center of mass is at (200, 150), should steer right and down
    expect(force.x).toBeGreaterThan(0);
    expect(force.y).toBeGreaterThan(0);
  });

  it('force is limited to maxForce', () => {
    const maxForce = 0.15;
    const bird = createBoid(100, 100, 0, 0, 4, maxForce);
    const neighbor = createBoid(500, 500); // Far away (but within perception)

    const force = cohere(bird, [neighbor], 1000);

    expect(magnitude(force)).toBeLessThanOrEqual(maxForce + 0.001);
  });
});

describe('Seek', () => {
  it('produces force toward target', () => {
    const bird = createBoid(100, 100, 0, 0);
    const target: Vector2D = { x: 200, y: 100 };

    const force = seek(bird, target);

    expect(force.x).toBeGreaterThan(0);
    expect(force.y).toBeCloseTo(0, 5);
  });

  it('force is limited to maxForce', () => {
    const maxForce = 0.15;
    const bird = createBoid(100, 100, 0, 0, 4, maxForce);
    const target: Vector2D = { x: 1000, y: 1000 };

    const force = seek(bird, target);

    expect(magnitude(force)).toBeLessThanOrEqual(maxForce + 0.001);
  });
});

describe('Flee', () => {
  it('produces force away from target', () => {
    const bird = createBoid(100, 100, 0, 0);
    const target: Vector2D = { x: 200, y: 100 };

    const force = flee(bird, target);

    // Should flee left (away from target on right)
    expect(force.x).toBeLessThan(0);
    expect(force.y).toBeCloseTo(0, 5);
  });

  it('flee is opposite of seek', () => {
    const bird = createBoid(100, 100, 1, 1);
    const target: Vector2D = { x: 200, y: 200 };

    const seekForce = seek(bird, target);
    const fleeForce = flee(bird, target);

    expect(fleeForce.x).toBeCloseTo(-seekForce.x, 10);
    expect(fleeForce.y).toBeCloseTo(-seekForce.y, 10);
  });
});

describe('Flock (Combined Behaviors)', () => {
  it('combines all three steering forces', () => {
    const bird = createBoid(100, 100, 1, 0);
    const neighbors = [
      createBoid(110, 105, 0.5, 0.5),
      createBoid(90, 95, 0.5, 0.5),
    ];

    const force = flock(
      bird,
      neighbors,
      { separation: 1.5, alignment: 1.0, cohesion: 1.0 },
      { desiredSeparation: 25, perception: 100 }
    );

    // Should produce some non-zero force
    expect(magnitude(force)).toBeGreaterThan(0);
  });

  it('zero weights produce zero force', () => {
    const bird = createBoid(100, 100, 1, 0);
    const neighbors = [createBoid(110, 100, 0, 1)];

    const force = flock(
      bird,
      neighbors,
      { separation: 0, alignment: 0, cohesion: 0 },
      { desiredSeparation: 25, perception: 100 }
    );

    expect(force.x).toBe(0);
    expect(force.y).toBe(0);
  });

  it('higher separation weight increases separation influence', () => {
    const bird = createBoid(100, 100, 0, 0);
    const neighbors = [createBoid(110, 100, 1, 0)]; // Close, moving away

    const lowSep = flock(
      bird,
      neighbors,
      { separation: 0.5, alignment: 1.0, cohesion: 1.0 },
      { desiredSeparation: 25, perception: 100 }
    );

    const highSep = flock(
      bird,
      neighbors,
      { separation: 2.0, alignment: 1.0, cohesion: 1.0 },
      { desiredSeparation: 25, perception: 100 }
    );

    // Higher separation should push more to the left (away from neighbor)
    expect(highSep.x).toBeLessThan(lowSep.x);
  });
});
