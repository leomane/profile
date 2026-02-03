/**
 * Boid Steering Behaviors
 *
 * Implementation of Craig Reynolds' three rules for flocking:
 * 1. Separation: Steer to avoid crowding neighbors
 * 2. Alignment: Steer toward average heading of neighbors
 * 3. Cohesion: Steer toward average position of neighbors
 */

import type { Vector2D, Boid } from './types.js';

// Default parameters
export const DEFAULT_MAX_SPEED = 4;
export const DEFAULT_MAX_FORCE = 0.15;
export const DEFAULT_DESIRED_SEPARATION = 25;
export const DEFAULT_PERCEPTION = 100;

/**
 * Calculate the Euclidean distance between two points.
 */
export function distance(a: Vector2D, b: Vector2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the magnitude of a vector.
 */
export function magnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Normalize a vector to unit length.
 */
export function normalize(v: Vector2D): Vector2D {
  const m = magnitude(v);
  if (m === 0) return { x: 0, y: 0 };
  return { x: v.x / m, y: v.y / m };
}

/**
 * Set the magnitude of a vector.
 */
export function setMagnitude(v: Vector2D, mag: number): Vector2D {
  const normalized = normalize(v);
  return { x: normalized.x * mag, y: normalized.y * mag };
}

/**
 * Limit the magnitude of a vector.
 */
export function limit(v: Vector2D, max: number): Vector2D {
  const m = magnitude(v);
  if (m > max) {
    return setMagnitude(v, max);
  }
  return { x: v.x, y: v.y };
}

/**
 * Add two vectors.
 */
export function add(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtract vector b from vector a.
 */
export function subtract(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Divide a vector by a scalar.
 */
export function divide(v: Vector2D, n: number): Vector2D {
  if (n === 0) return { x: 0, y: 0 };
  return { x: v.x / n, y: v.y / n };
}

/**
 * Multiply a vector by a scalar.
 */
export function multiply(v: Vector2D, n: number): Vector2D {
  return { x: v.x * n, y: v.y * n };
}

/**
 * Separation: Steer to avoid crowding local flockmates.
 *
 * For each neighbor within desiredSeparation:
 * - Calculate a vector pointing away from the neighbor
 * - Weight it by inverse distance (closer = stronger repulsion)
 * - Average all these vectors
 * - Apply Reynolds steering (desired - current velocity)
 *
 * @param boid - The boid to calculate separation for
 * @param neighbors - All potential neighbors (from spatial hash)
 * @param desiredSeparation - Minimum comfortable distance (default: 25)
 * @returns Separation steering force vector
 */
export function separate(
  boid: Boid,
  neighbors: Boid[],
  desiredSeparation: number = DEFAULT_DESIRED_SEPARATION
): Vector2D {
  let steer: Vector2D = { x: 0, y: 0 };
  let count = 0;

  for (const other of neighbors) {
    const d = distance(boid.pos, other.pos);

    // Ignore self (d = 0) and boids outside separation distance
    if (d > 0 && d < desiredSeparation) {
      // Vector pointing away from neighbor
      let diff = subtract(boid.pos, other.pos);
      diff = normalize(diff);
      // Weight by inverse distance (closer = stronger repulsion)
      diff = divide(diff, d);
      steer = add(steer, diff);
      count++;
    }
  }

  if (count > 0) {
    // Average the steering forces
    steer = divide(steer, count);
    // Reynolds steering: desired - current
    steer = setMagnitude(steer, boid.maxSpeed);
    steer = subtract(steer, boid.vel);
    steer = limit(steer, boid.maxForce);
  }

  return steer;
}

/**
 * Alignment: Steer toward the average heading of local flockmates.
 *
 * For each neighbor within perception range:
 * - Sum their velocity vectors
 * - Average to get desired velocity
 * - Apply Reynolds steering (desired - current velocity)
 *
 * @param boid - The boid to calculate alignment for
 * @param neighbors - All potential neighbors (from spatial hash)
 * @param perception - Maximum distance to consider (default: 100)
 * @returns Alignment steering force vector
 */
export function align(
  boid: Boid,
  neighbors: Boid[],
  perception: number = DEFAULT_PERCEPTION
): Vector2D {
  let sum: Vector2D = { x: 0, y: 0 };
  let count = 0;

  for (const other of neighbors) {
    const d = distance(boid.pos, other.pos);

    // Ignore self (d = 0) and boids outside perception range
    if (d > 0 && d < perception) {
      sum = add(sum, other.vel);
      count++;
    }
  }

  if (count > 0) {
    // Average velocity
    sum = divide(sum, count);
    // Reynolds steering
    sum = setMagnitude(sum, boid.maxSpeed);
    const steer = subtract(sum, boid.vel);
    return limit(steer, boid.maxForce);
  }

  return { x: 0, y: 0 };
}

/**
 * Cohesion: Steer toward the average position of local flockmates.
 *
 * For each neighbor within perception range:
 * - Sum their positions
 * - Average to get center of mass
 * - Seek that position using Reynolds steering
 *
 * @param boid - The boid to calculate cohesion for
 * @param neighbors - All potential neighbors (from spatial hash)
 * @param perception - Maximum distance to consider (default: 100)
 * @returns Cohesion steering force vector
 */
export function cohere(
  boid: Boid,
  neighbors: Boid[],
  perception: number = DEFAULT_PERCEPTION
): Vector2D {
  let sum: Vector2D = { x: 0, y: 0 };
  let count = 0;

  for (const other of neighbors) {
    const d = distance(boid.pos, other.pos);

    // Ignore self (d = 0) and boids outside perception range
    if (d > 0 && d < perception) {
      sum = add(sum, other.pos);
      count++;
    }
  }

  if (count > 0) {
    // Center of mass
    const centerOfMass = divide(sum, count);
    // Seek the center
    return seek(boid, centerOfMass);
  }

  return { x: 0, y: 0 };
}

/**
 * Seek: Calculate steering force toward a target.
 *
 * Classic Reynolds steering:
 * desired = normalize(target - position) * maxSpeed
 * steering = desired - velocity
 * steering = limit(steering, maxForce)
 *
 * @param boid - The boid seeking the target
 * @param target - Target position to seek
 * @returns Steering force toward target
 */
export function seek(boid: Boid, target: Vector2D): Vector2D {
  let desired = subtract(target, boid.pos);
  desired = setMagnitude(desired, boid.maxSpeed);
  let steer = subtract(desired, boid.vel);
  steer = limit(steer, boid.maxForce);
  return steer;
}

/**
 * Flee: Calculate steering force away from a target.
 *
 * Opposite of seek.
 *
 * @param boid - The boid fleeing from the target
 * @param target - Target position to flee from
 * @returns Steering force away from target
 */
export function flee(boid: Boid, target: Vector2D): Vector2D {
  const seekForce = seek(boid, target);
  return { x: -seekForce.x, y: -seekForce.y };
}

/**
 * Apply all three flocking rules and return combined steering force.
 *
 * @param boid - The boid to calculate flocking for
 * @param neighbors - All potential neighbors
 * @param weights - Weights for each behavior { separation, alignment, cohesion }
 * @param params - Parameters { desiredSeparation, perception }
 * @returns Combined steering force
 */
export function flock(
  boid: Boid,
  neighbors: Boid[],
  weights: { separation: number; alignment: number; cohesion: number },
  params: { desiredSeparation: number; perception: number }
): Vector2D {
  const sep = separate(boid, neighbors, params.desiredSeparation);
  const ali = align(boid, neighbors, params.perception);
  const coh = cohere(boid, neighbors, params.perception);

  // Apply weights
  const weightedSep = multiply(sep, weights.separation);
  const weightedAli = multiply(ali, weights.alignment);
  const weightedCoh = multiply(coh, weights.cohesion);

  // Combine forces
  let force = add(weightedSep, weightedAli);
  force = add(force, weightedCoh);

  return force;
}
