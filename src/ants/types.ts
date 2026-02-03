/**
 * Ant Colony Types for Stigmergic Emergence Simulation
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface PheromoneParams {
  diffusionRate: number;   // 0-1, how much pheromone spreads to neighbors
  evaporationRate: number; // 0-1, decay multiplier per step (1 = no decay)
  maxPheromone: number;    // Maximum pheromone level in a cell
  pheromoneStrength: number; // Amount deposited per ant
}

export interface SensingResult {
  direction: Vector2D;
  pheromoneLevel: number;
}
