/**
 * Chemistry Reaction Database
 *
 * Contains validated reversible reactions with thermodynamic data.
 * All Kc298 and deltaH values are based on literature values.
 *
 * References:
 * - NIST Chemistry WebBook (https://webbook.nist.gov/chemistry/)
 * - Standard thermodynamic tables
 */

import type { Reaction } from './types.js';

export const reactions: Reaction[] = [
  {
    name: 'Haber Process',
    reactants: [
      { formula: 'N₂', coeff: 1, state: 'g', color: '#4a90d9' },
      { formula: 'H₂', coeff: 3, state: 'g', color: '#7cb342' },
    ],
    products: [{ formula: 'NH₃', coeff: 2, state: 'g', color: '#9c27b0' }],
    deltaH: -92, // kJ/mol (exothermic)
    gasChange: -2, // 4 mol gas → 2 mol gas
    description: 'Industrial ammonia synthesis',
    Kc298: 6.0e5, // Literature: 3.5×10⁵ - 6.8×10⁵
    maxTemp: 800,
  },
  {
    name: 'Contact Process',
    reactants: [
      { formula: 'SO₂', coeff: 2, state: 'g', color: '#ff9800' },
      { formula: 'O₂', coeff: 1, state: 'g', color: '#e53935' },
    ],
    products: [{ formula: 'SO₃', coeff: 2, state: 'g', color: '#795548' }],
    deltaH: -198, // kJ/mol (highly exothermic)
    gasChange: -1, // 3 mol gas → 2 mol gas
    description: 'Sulfuric acid production',
    Kc298: 4.0e24, // Very large, highly favors products at 298K
    maxTemp: 1000,
  },
  {
    name: 'Water-Gas Shift',
    reactants: [
      { formula: 'CO', coeff: 1, state: 'g', color: '#607d8b' },
      { formula: 'H₂O', coeff: 1, state: 'g', color: '#03a9f4' },
    ],
    products: [
      { formula: 'CO₂', coeff: 1, state: 'g', color: '#9e9e9e' },
      { formula: 'H₂', coeff: 1, state: 'g', color: '#8bc34a' },
    ],
    deltaH: -41, // kJ/mol (exothermic)
    gasChange: 0, // 2 mol gas → 2 mol gas
    description: 'Hydrogen production',
    Kc298: 1.0e5, // Favors products at 298K
    maxTemp: 1000,
  },
  {
    name: 'Esterification',
    reactants: [
      { formula: 'CH₃COOH', coeff: 1, state: 'aq', color: '#ff5722' },
      { formula: 'C₂H₅OH', coeff: 1, state: 'l', color: '#4caf50' },
    ],
    products: [
      { formula: 'CH₃COOC₂H₅', coeff: 1, state: 'l', color: '#e91e63' },
      { formula: 'H₂O', coeff: 1, state: 'l', color: '#2196f3' },
    ],
    deltaH: -4, // kJ/mol (slightly exothermic)
    gasChange: 0, // No gas involved
    description: 'Ethyl acetate formation',
    Kc298: 4.0, // Literature value ~4
    maxTemp: 400,
  },
  {
    name: 'NO₂ Dimerization',
    reactants: [{ formula: 'NO₂', coeff: 2, state: 'g', color: '#8d6e63' }],
    products: [{ formula: 'N₂O₄', coeff: 1, state: 'g', color: '#ffc107' }],
    deltaH: -57, // kJ/mol (exothermic)
    gasChange: -1, // 2 mol gas → 1 mol gas
    description: 'Brown gas equilibrium',
    Kc298: 170, // Literature: 100-200
    maxTemp: 500,
  },
  {
    name: 'Methane Steam Reforming',
    reactants: [
      { formula: 'CH₄', coeff: 1, state: 'g', color: '#00bcd4' },
      { formula: 'H₂O', coeff: 1, state: 'g', color: '#03a9f4' },
    ],
    products: [
      { formula: 'CO', coeff: 1, state: 'g', color: '#607d8b' },
      { formula: 'H₂', coeff: 3, state: 'g', color: '#8bc34a' },
    ],
    deltaH: 206, // kJ/mol (highly endothermic)
    gasChange: 2, // 2 mol gas → 4 mol gas
    description: 'Syngas production (endothermic)',
    Kc298: 1.0e-25, // Very unfavorable at 298K
    maxTemp: 1500,
  },
  {
    name: 'Carbonic Acid Equilibrium',
    reactants: [
      { formula: 'CO₂', coeff: 1, state: 'aq', color: '#9e9e9e' },
      { formula: 'H₂O', coeff: 1, state: 'l', color: '#2196f3' },
    ],
    products: [{ formula: 'H₂CO₃', coeff: 1, state: 'aq', color: '#ff9800' }],
    deltaH: -20, // kJ/mol (exothermic)
    gasChange: 0, // No gas change (aqueous system)
    description: 'Ocean acidification chemistry',
    Kc298: 1.7e-3, // Slightly favors reactants
    maxTemp: 400,
  },
  {
    name: 'PCl₅ Decomposition',
    reactants: [{ formula: 'PCl₅', coeff: 1, state: 'g', color: '#673ab7' }],
    products: [
      { formula: 'PCl₃', coeff: 1, state: 'g', color: '#3f51b5' },
      { formula: 'Cl₂', coeff: 1, state: 'g', color: '#cddc39' },
    ],
    deltaH: 93, // kJ/mol (endothermic)
    gasChange: 1, // 1 mol gas → 2 mol gas
    description: 'Phosphorus chloride dissociation (endothermic)',
    Kc298: 0.04, // Favors reactants at 298K
    maxTemp: 700,
  },
  {
    name: 'Cobalt Chloride Hydration',
    reactants: [
      { formula: '[CoCl₄]²⁻', coeff: 1, state: 'aq', color: '#2196f3' },
      { formula: 'H₂O', coeff: 6, state: 'l', color: '#03a9f4' },
    ],
    products: [
      { formula: '[Co(H₂O)₆]²⁺', coeff: 1, state: 'aq', color: '#e91e63' },
      { formula: 'Cl⁻', coeff: 4, state: 'aq', color: '#4caf50' },
    ],
    deltaH: -50, // kJ/mol (exothermic)
    gasChange: 0, // Aqueous system
    description: 'Blue to pink color change',
    Kc298: 1.0e4, // Favors pink form at 298K
    maxTemp: 400,
  },
  {
    name: 'Iron(III) Thiocyanate',
    reactants: [
      { formula: 'Fe³⁺', coeff: 1, state: 'aq', color: '#ff9800' },
      { formula: 'SCN⁻', coeff: 1, state: 'aq', color: '#9c27b0' },
    ],
    products: [{ formula: 'FeSCN²⁺', coeff: 1, state: 'aq', color: '#f44336' }],
    deltaH: -3, // kJ/mol (slightly exothermic)
    gasChange: 0, // Aqueous system
    description: 'Blood-red complex formation',
    Kc298: 890, // Formation constant
    maxTemp: 400,
  },
];

/**
 * Get a reaction by name.
 *
 * @param name - Reaction name (case-sensitive)
 * @returns The reaction or undefined if not found
 */
export function getReactionByName(name: string): Reaction | undefined {
  return reactions.find(r => r.name === name);
}

/**
 * Get all exothermic reactions (ΔH < 0).
 */
export function getExothermicReactions(): Reaction[] {
  return reactions.filter(r => r.deltaH < 0);
}

/**
 * Get all endothermic reactions (ΔH > 0).
 */
export function getEndothermicReactions(): Reaction[] {
  return reactions.filter(r => r.deltaH > 0);
}

/**
 * Get reactions involving gas phase species.
 */
export function getGasReactions(): Reaction[] {
  return reactions.filter(
    r =>
      r.reactants.some(s => s.state === 'g') || r.products.some(s => s.state === 'g')
  );
}
