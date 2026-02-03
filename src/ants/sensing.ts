/**
 * Ant Sensing System
 *
 * Implements the three-sensor pheromone detection used by ants
 * to navigate toward food and back to the nest.
 */

import type { Vector2D } from './types.js';

// Default sensing parameters
export const DEFAULT_SENSOR_ANGLE = Math.PI / 4; // 45 degrees
export const DEFAULT_SENSOR_DISTANCE = 15;

/**
 * Normalize a vector to unit length.
 */
export function normalize(v: Vector2D): Vector2D {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

/**
 * Get the heading angle of a vector.
 */
export function heading(v: Vector2D): number {
  return Math.atan2(v.y, v.x);
}

/**
 * Create a vector from an angle.
 */
export function fromAngle(angle: number): Vector2D {
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

/**
 * Calculate three sensor positions relative to an ant.
 *
 * Sensors are positioned:
 * - Ahead: in the direction of movement
 * - Left: rotated -45° from heading
 * - Right: rotated +45° from heading
 *
 * @param pos - Ant's current position
 * @param vel - Ant's velocity (determines heading)
 * @param sensorDistance - Distance to sensor positions
 * @param sensorAngle - Angle offset for left/right sensors (radians)
 * @returns Three sensor positions: { ahead, left, right }
 */
export function calculateSensorPositions(
  pos: Vector2D,
  vel: Vector2D,
  sensorDistance: number = DEFAULT_SENSOR_DISTANCE,
  sensorAngle: number = DEFAULT_SENSOR_ANGLE
): { ahead: Vector2D; left: Vector2D; right: Vector2D } {
  const h = heading(vel);

  const ahead = {
    x: pos.x + Math.cos(h) * sensorDistance,
    y: pos.y + Math.sin(h) * sensorDistance,
  };

  const left = {
    x: pos.x + Math.cos(h - sensorAngle) * sensorDistance,
    y: pos.y + Math.sin(h - sensorAngle) * sensorDistance,
  };

  const right = {
    x: pos.x + Math.cos(h + sensorAngle) * sensorDistance,
    y: pos.y + Math.sin(h + sensorAngle) * sensorDistance,
  };

  return { ahead, left, right };
}

/**
 * Choose direction based on three pheromone sensor readings.
 *
 * The ant turns toward the sensor with the highest reading.
 * If center is highest (or tied), continue straight ahead.
 *
 * @param centerSense - Pheromone level at ahead sensor
 * @param leftSense - Pheromone level at left sensor
 * @param rightSense - Pheromone level at right sensor
 * @param currentHeading - Current heading angle (radians)
 * @param sensorAngle - Angle offset for left/right (radians)
 * @returns Direction to move (unit vector)
 */
export function chooseSensorDirection(
  centerSense: number,
  leftSense: number,
  rightSense: number,
  currentHeading: number,
  sensorAngle: number = DEFAULT_SENSOR_ANGLE
): Vector2D {
  let chosenAngle: number;

  if (leftSense > centerSense && leftSense > rightSense) {
    // Turn left
    chosenAngle = currentHeading - sensorAngle;
  } else if (rightSense > centerSense && rightSense > leftSense) {
    // Turn right
    chosenAngle = currentHeading + sensorAngle;
  } else {
    // Go straight (center is highest or tied)
    chosenAngle = currentHeading;
  }

  return normalize(fromAngle(chosenAngle));
}

/**
 * Calculate direction toward a target (for returning to nest).
 *
 * @param antPos - Ant's current position
 * @param targetPos - Target position (e.g., nest)
 * @returns Normalized direction vector toward target
 */
export function directionToTarget(antPos: Vector2D, targetPos: Vector2D): Vector2D {
  const dx = targetPos.x - antPos.x;
  const dy = targetPos.y - antPos.y;
  return normalize({ x: dx, y: dy });
}

/**
 * Calculate attraction force toward a food source.
 *
 * Attraction decreases with distance and scales with food amount.
 *
 * @param antPos - Ant's current position
 * @param foodPos - Food source position
 * @param distance - Distance to food
 * @param maxDistance - Maximum attraction range
 * @param foodAmount - Current food amount (0-1 normalized)
 * @returns Attraction vector (not normalized)
 */
export function calculateFoodAttraction(
  antPos: Vector2D,
  foodPos: Vector2D,
  distance: number,
  maxDistance: number,
  foodAmount: number
): Vector2D {
  if (distance >= maxDistance || distance === 0) {
    return { x: 0, y: 0 };
  }

  const direction = normalize({
    x: foodPos.x - antPos.x,
    y: foodPos.y - antPos.y,
  });

  // Attraction decreases linearly with distance
  const strength = ((maxDistance - distance) / maxDistance) * foodAmount;

  return {
    x: direction.x * strength,
    y: direction.y * strength,
  };
}

/**
 * Blend pheromone direction with random wander direction.
 *
 * @param pheromoneDir - Direction from pheromone sensing
 * @param wanderDir - Random wander direction
 * @param explorationBias - Weight for wander direction (0-1)
 * @returns Blended direction vector
 */
export function blendDirections(
  pheromoneDir: Vector2D,
  wanderDir: Vector2D,
  explorationBias: number
): Vector2D {
  const t = Math.max(0, Math.min(1, explorationBias));
  return normalize({
    x: pheromoneDir.x * (1 - t) + wanderDir.x * t,
    y: pheromoneDir.y * (1 - t) + wanderDir.y * t,
  });
}

/**
 * Check if a position is within range of a target.
 *
 * @param pos - Current position
 * @param target - Target position
 * @param range - Range threshold
 * @returns true if within range
 */
export function isWithinRange(pos: Vector2D, target: Vector2D, range: number): boolean {
  const dx = pos.x - target.x;
  const dy = pos.y - target.y;
  return dx * dx + dy * dy < range * range;
}
