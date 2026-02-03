/**
 * Chemical Equilibrium Calculations
 *
 * Core thermodynamic functions for Le Chatelier's Principle simulator.
 * These functions implement scientifically accurate calculations for
 * equilibrium constants, reaction quotients, and pressure effects.
 */

import type { Reaction, EquilibriumFractions, Species } from './types.js';

// Physical constants
export const R_JOULES = 8.314;  // J/(mol·K) - Gas constant for Van't Hoff
export const R_ATM = 0.0821;   // L·atm/(mol·K) - Gas constant for Kp
export const T_REFERENCE = 298; // K - Reference temperature

/**
 * Calculate equilibrium constant Kc at a given temperature using Van't Hoff equation.
 *
 * The Van't Hoff equation relates the change in equilibrium constant to temperature:
 * ln(K2/K1) = -ΔH°/R × (1/T2 - 1/T1)
 *
 * @param reaction - Reaction object with Kc298 and deltaH values
 * @param T - Temperature in Kelvin
 * @returns Equilibrium constant Kc at temperature T
 *
 * @example
 * const haber = { Kc298: 6.0e5, deltaH: -92 };
 * const Kc500 = calculateKcAtTemperature(haber, 500); // ~0.18
 */
export function calculateKcAtTemperature(
  reaction: Pick<Reaction, 'Kc298' | 'deltaH'>,
  T: number
): number {
  const Kc298 = reaction.Kc298;
  const deltaH = reaction.deltaH * 1000; // Convert kJ/mol to J/mol

  // Van't Hoff equation: ln(K2/K1) = -ΔH°/R × (1/T2 - 1/T1)
  const lnK2_K1 = (-deltaH / R_JOULES) * (1 / T - 1 / T_REFERENCE);

  return Kc298 * Math.exp(lnK2_K1);
}

/**
 * Convert Kc to equilibrium fractions for visualization.
 *
 * Maps the vast range of K values (10^-25 to 10^25) to visible fractions (0.1 to 0.9)
 * using a logarithmic scale with hyperbolic tangent for smooth transitions.
 *
 * The mapping ensures:
 * - logK = -10 → ~10% products
 * - logK = 0 → 50% products
 * - logK = +10 → ~90% products
 *
 * @param Kc - Equilibrium constant (any positive value)
 * @returns Object with reactantFrac and productFrac (sum to 1.0)
 *
 * @example
 * calculateEquilibriumFractions(1.0);    // { reactantFrac: 0.5, productFrac: 0.5 }
 * calculateEquilibriumFractions(1e10);   // { reactantFrac: ~0.1, productFrac: ~0.9 }
 * calculateEquilibriumFractions(1e-10);  // { reactantFrac: ~0.9, productFrac: ~0.1 }
 */
export function calculateEquilibriumFractions(Kc: number): EquilibriumFractions {
  // Protect against log of zero/negative
  const logK = Math.log10(Math.max(Kc, 1e-30));

  // Map logK to product fraction using hyperbolic tangent
  // The divisor of 6 determines the spread (higher = wider range)
  let productFrac = 0.5 + 0.4 * Math.tanh(logK / 6);

  // Clamp to reasonable visual range
  productFrac = Math.max(0.1, Math.min(0.9, productFrac));
  const reactantFrac = 1 - productFrac;

  return { reactantFrac, productFrac };
}

/**
 * Calculate Kp (pressure equilibrium constant) from Kc.
 *
 * For gas-phase reactions: Kp = Kc(RT)^Δn
 * where Δn = (moles of gas products) - (moles of gas reactants)
 *
 * @param Kc - Equilibrium constant in concentration terms
 * @param T - Temperature in Kelvin
 * @param deltaN - Change in moles of gas (products - reactants)
 * @returns Equilibrium constant in pressure terms (Kp)
 *
 * @example
 * // Haber process: N₂ + 3H₂ ⇌ 2NH₃ (Δn = 2 - 4 = -2)
 * calculateKp(6.0e5, 298, -2); // Kp at 298K
 */
export function calculateKp(Kc: number, T: number, deltaN: number): number {
  return Kc * Math.pow(R_ATM * T, deltaN);
}

/**
 * Calculate the reaction quotient ratio Q/K.
 *
 * Determines how far the system is from equilibrium:
 * - Q/K < 1: System shifts forward (toward products)
 * - Q/K = 1: At equilibrium
 * - Q/K > 1: System shifts reverse (toward reactants)
 *
 * @param reactantRatio - Current reactant concentration / equilibrium reactant concentration
 * @param productRatio - Current product concentration / equilibrium product concentration
 * @param totalReactantCoeffs - Sum of stoichiometric coefficients for reactants
 * @param totalProductCoeffs - Sum of stoichiometric coefficients for products
 * @returns Q/K ratio
 */
export function calculateQoverK(
  reactantRatio: number,
  productRatio: number,
  totalReactantCoeffs: number,
  totalProductCoeffs: number
): number {
  // Q/K = (product excess)^productCoeffs / (reactant excess)^reactantCoeffs
  return Math.pow(productRatio, totalProductCoeffs) / Math.pow(reactantRatio, totalReactantCoeffs);
}

/**
 * Calculate partial pressure from mole fraction and total pressure.
 *
 * Uses Dalton's Law: P_i = x_i × P_total
 * where x_i is the mole fraction of component i
 *
 * @param moleFraction - Mole fraction of the species (0 to 1)
 * @param totalPressure - Total pressure in atm
 * @returns Partial pressure in atm
 */
export function calculatePartialPressure(moleFraction: number, totalPressure: number): number {
  return moleFraction * totalPressure;
}

/**
 * Calculate total stoichiometric coefficients for species that appear in equilibrium expression.
 *
 * Only gases (g) and aqueous (aq) species are included in Kc expressions.
 * Pure solids (s) and liquids (l) are excluded.
 *
 * @param species - Array of species in the reaction
 * @returns Sum of coefficients for species included in K expression
 */
export function calculateTotalCoefficients(species: Species[]): number {
  return species
    .filter(s => s.state === 'g' || s.state === 'aq')
    .reduce((sum, s) => sum + s.coeff, 0) || 1;
}

/**
 * Determine the direction of equilibrium shift.
 *
 * @param logQ - Log base 10 of reaction quotient
 * @param logK - Log base 10 of equilibrium constant
 * @param threshold - Threshold for considering at equilibrium (default 0.1)
 * @returns -1 for reverse shift, 0 for equilibrium, 1 for forward shift
 */
export function determineShiftDirection(
  logQ: number,
  logK: number,
  threshold: number = 0.1
): -1 | 0 | 1 {
  const diff = logQ - logK;

  if (Math.abs(diff) < threshold) {
    return 0; // At equilibrium
  } else if (logQ < logK) {
    return 1; // Q < K, shift forward
  } else {
    return -1; // Q > K, shift reverse
  }
}

/**
 * Predict the effect of temperature change on equilibrium.
 *
 * For exothermic reactions (ΔH < 0): increasing T decreases K
 * For endothermic reactions (ΔH > 0): increasing T increases K
 *
 * @param deltaH - Enthalpy change in kJ/mol
 * @param temperatureIncreases - Whether temperature is increasing
 * @returns 'forward' | 'reverse' | 'none' - Direction of shift
 */
export function predictTemperatureEffect(
  deltaH: number,
  temperatureIncreases: boolean
): 'forward' | 'reverse' | 'none' {
  if (deltaH === 0) return 'none';

  const isExothermic = deltaH < 0;

  if (temperatureIncreases) {
    // Heating favors endothermic direction
    return isExothermic ? 'reverse' : 'forward';
  } else {
    // Cooling favors exothermic direction
    return isExothermic ? 'forward' : 'reverse';
  }
}

/**
 * Predict the effect of pressure/volume change on equilibrium.
 *
 * When pressure increases (volume decreases), equilibrium shifts toward fewer gas moles.
 * When pressure decreases (volume increases), equilibrium shifts toward more gas moles.
 *
 * @param gasChange - Δn = gas moles products - gas moles reactants
 * @param pressureIncreases - Whether pressure is increasing (or volume decreasing)
 * @returns 'forward' | 'reverse' | 'none' - Direction of shift
 */
export function predictPressureEffect(
  gasChange: number,
  pressureIncreases: boolean
): 'forward' | 'reverse' | 'none' {
  if (gasChange === 0) return 'none';

  if (pressureIncreases) {
    // System shifts toward fewer moles of gas
    return gasChange < 0 ? 'forward' : 'reverse';
  } else {
    // System shifts toward more moles of gas
    return gasChange > 0 ? 'forward' : 'reverse';
  }
}
