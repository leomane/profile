/**
 * Chemistry Types for Le Chatelier Simulator
 * Defines the core data structures for chemical equilibrium calculations
 */

export type PhaseState = 'g' | 'aq' | 'l' | 's';

export interface Species {
  formula: string;
  coeff: number;
  state: PhaseState;
  color: string;
}

export interface Reaction {
  name: string;
  reactants: Species[];
  products: Species[];
  deltaH: number;        // kJ/mol (negative = exothermic)
  gasChange: number;     // Δn for gas moles (products - reactants)
  description: string;
  Kc298: number;         // Equilibrium constant at 298K
  maxTemp: number;       // Maximum temperature for this reaction
}

export interface EquilibriumFractions {
  reactantFrac: number;
  productFrac: number;
}

export interface ConcentrationData {
  conc: number;
  coeff: number;
}
