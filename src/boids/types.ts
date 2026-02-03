/**
 * Boid Types for Murmuration Simulation
 * Based on Craig Reynolds' Boid algorithm
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface Boid {
  pos: Vector2D;
  vel: Vector2D;
  acc: Vector2D;
  maxSpeed: number;
  maxForce: number;
}

export interface FlockingParams {
  separation: number;
  alignment: number;
  cohesion: number;
  perception: number;
  desiredSeparation: number;
}

export type SpatialGrid = Map<string, Boid[]>;
