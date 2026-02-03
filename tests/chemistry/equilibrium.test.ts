/**
 * Equilibrium Calculation Tests
 *
 * Tests for Kc to fraction mapping, Kp calculations, and reaction quotient.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateEquilibriumFractions,
  calculateKp,
  calculateQoverK,
  calculatePartialPressure,
  calculateTotalCoefficients,
  determineShiftDirection,
  predictTemperatureEffect,
  predictPressureEffect,
  R_ATM,
} from '../../src/chemistry/equilibrium.js';
import { reactions, getReactionByName } from '../../src/chemistry/reactions.js';

describe('Equilibrium Fractions', () => {
  describe('Logarithmic Mapping', () => {
    it('K = 1 maps to 50% products', () => {
      const result = calculateEquilibriumFractions(1.0);
      expect(result.productFrac).toBeCloseTo(0.5, 2);
      expect(result.reactantFrac).toBeCloseTo(0.5, 2);
    });

    it('fractions always sum to 1.0', () => {
      const testValues = [1e-25, 1e-10, 1e-5, 0.1, 1, 10, 1e5, 1e10, 1e25];

      testValues.forEach(K => {
        const result = calculateEquilibriumFractions(K);
        expect(result.reactantFrac + result.productFrac).toBeCloseTo(1.0, 10);
      });
    });

    it('large K (products favored) maps to high product fraction', () => {
      const result = calculateEquilibriumFractions(1e10);
      expect(result.productFrac).toBeGreaterThan(0.8);
      expect(result.productFrac).toBeLessThanOrEqual(0.9);
    });

    it('small K (reactants favored) maps to low product fraction', () => {
      const result = calculateEquilibriumFractions(1e-10);
      expect(result.productFrac).toBeLessThan(0.2);
      expect(result.productFrac).toBeGreaterThanOrEqual(0.1);
    });

    it('product fraction is clamped to [0.1, 0.9] range', () => {
      // Even for extreme K values
      const extremeLarge = calculateEquilibriumFractions(1e50);
      const extremeSmall = calculateEquilibriumFractions(1e-50);

      expect(extremeLarge.productFrac).toBeLessThanOrEqual(0.9);
      expect(extremeLarge.productFrac).toBeGreaterThanOrEqual(0.1);
      expect(extremeSmall.productFrac).toBeGreaterThanOrEqual(0.1);
      expect(extremeSmall.productFrac).toBeLessThanOrEqual(0.9);
    });

    it('handles zero safely (treated as very small K)', () => {
      const result = calculateEquilibriumFractions(0);
      expect(result.productFrac).toBeCloseTo(0.1, 2);
      expect(result.reactantFrac).toBeCloseTo(0.9, 2);
    });

    it('handles negative values safely', () => {
      const result = calculateEquilibriumFractions(-1);
      expect(Number.isFinite(result.productFrac)).toBe(true);
      expect(result.productFrac).toBeGreaterThanOrEqual(0.1);
    });

    it('is monotonically increasing with K', () => {
      const testValues = [1e-20, 1e-10, 1e-5, 0.01, 1, 100, 1e5, 1e10, 1e20];
      const fractions = testValues.map(K => calculateEquilibriumFractions(K).productFrac);

      for (let i = 1; i < fractions.length; i++) {
        expect(fractions[i]).toBeGreaterThanOrEqual(fractions[i - 1]);
      }
    });
  });

  describe('Symmetry', () => {
    it('K and 1/K give symmetric fractions', () => {
      const pairs = [
        [1e-5, 1e5],
        [0.01, 100],
        [0.1, 10],
      ];

      pairs.forEach(([K1, K2]) => {
        const result1 = calculateEquilibriumFractions(K1);
        const result2 = calculateEquilibriumFractions(K2);

        // Product fraction of K should equal reactant fraction of 1/K
        expect(result1.productFrac).toBeCloseTo(result2.reactantFrac, 2);
        expect(result1.reactantFrac).toBeCloseTo(result2.productFrac, 2);
      });
    });
  });
});

describe('Kp Calculation', () => {
  describe('Formula: Kp = Kc(RT)^Δn', () => {
    it('Kp equals Kc when Δn = 0', () => {
      const Kc = 100;
      const T = 400;
      const result = calculateKp(Kc, T, 0);
      expect(result).toBeCloseTo(Kc, 10);
    });

    it('Kp > Kc when Δn > 0 (gas moles increase)', () => {
      const Kc = 1.0;
      const T = 500;
      const deltaN = 2;

      const result = calculateKp(Kc, T, deltaN);
      const expected = Kc * Math.pow(R_ATM * T, deltaN);

      expect(result).toBeCloseTo(expected, 5);
      expect(result).toBeGreaterThan(Kc);
    });

    it('Kp < Kc when Δn < 0 (gas moles decrease)', () => {
      const Kc = 1.0;
      const T = 500;
      const deltaN = -2;

      const result = calculateKp(Kc, T, deltaN);
      expect(result).toBeLessThan(Kc);
    });

    it('uses correct gas constant R = 0.0821 L·atm/(mol·K)', () => {
      expect(R_ATM).toBe(0.0821);

      const Kc = 1.0;
      const T = 298;
      const deltaN = 1;

      const result = calculateKp(Kc, T, deltaN);
      const expected = 1.0 * 0.0821 * 298;

      expect(result).toBeCloseTo(expected, 5);
    });
  });

  describe('Real Reaction Tests', () => {
    it('Haber Process: Δn = -2, Kp < Kc', () => {
      const haber = getReactionByName('Haber Process')!;
      const Kc = haber.Kc298;
      const Kp = calculateKp(Kc, 298, haber.gasChange);

      expect(haber.gasChange).toBe(-2);
      expect(Kp).toBeLessThan(Kc);
    });

    it('Methane Steam Reforming: Δn = 2, Kp > Kc', () => {
      const msr = getReactionByName('Methane Steam Reforming')!;
      const Kc = msr.Kc298;
      const Kp = calculateKp(Kc, 298, msr.gasChange);

      expect(msr.gasChange).toBe(2);
      expect(Kp).toBeGreaterThan(Kc);
    });

    it('Water-Gas Shift: Δn = 0, Kp = Kc', () => {
      const wgs = getReactionByName('Water-Gas Shift')!;
      const Kc = wgs.Kc298;
      const Kp = calculateKp(Kc, 298, wgs.gasChange);

      expect(wgs.gasChange).toBe(0);
      expect(Kp).toBeCloseTo(Kc, 5);
    });
  });
});

describe('Reaction Quotient Q/K', () => {
  describe('calculateQoverK', () => {
    it('Q/K = 1 when at equilibrium (both ratios = 1)', () => {
      const result = calculateQoverK(1, 1, 2, 2);
      expect(result).toBeCloseTo(1, 10);
    });

    it('Q/K < 1 when reactant excess (forward shift)', () => {
      // More reactants than equilibrium (reactantRatio > 1)
      const result = calculateQoverK(2, 1, 2, 2);
      expect(result).toBeLessThan(1);
    });

    it('Q/K > 1 when product excess (reverse shift)', () => {
      // More products than equilibrium (productRatio > 1)
      const result = calculateQoverK(1, 2, 2, 2);
      expect(result).toBeGreaterThan(1);
    });

    it('respects stoichiometric coefficients', () => {
      // With higher product coefficients, product ratio has more effect
      const result1 = calculateQoverK(1, 2, 1, 1); // coeffs 1:1
      const result2 = calculateQoverK(1, 2, 1, 3); // coeffs 1:3

      // Same ratio but different coeffs should give different Q/K
      expect(result2).toBeGreaterThan(result1);
    });
  });

  describe('determineShiftDirection', () => {
    it('returns 0 when logQ ≈ logK (at equilibrium)', () => {
      expect(determineShiftDirection(2.0, 2.05)).toBe(0);
      expect(determineShiftDirection(5.0, 5.0)).toBe(0);
    });

    it('returns 1 when logQ < logK (forward shift)', () => {
      expect(determineShiftDirection(1.0, 3.0)).toBe(1);
    });

    it('returns -1 when logQ > logK (reverse shift)', () => {
      expect(determineShiftDirection(5.0, 2.0)).toBe(-1);
    });

    it('respects custom threshold', () => {
      // logQ = 2.0, logK = 2.15, diff = -0.15
      // With threshold 0.1: |diff| > threshold, Q < K → forward (1)
      expect(determineShiftDirection(2.0, 2.15, 0.1)).toBe(1);
      // With threshold 0.2: |diff| < threshold → equilibrium (0)
      expect(determineShiftDirection(2.0, 2.15, 0.2)).toBe(0);
    });
  });
});

describe('Partial Pressure', () => {
  it('calculates partial pressure from mole fraction', () => {
    const result = calculatePartialPressure(0.5, 2.0);
    expect(result).toBeCloseTo(1.0, 10);
  });

  it('zero mole fraction gives zero partial pressure', () => {
    const result = calculatePartialPressure(0, 10);
    expect(result).toBe(0);
  });

  it('full mole fraction equals total pressure', () => {
    const result = calculatePartialPressure(1.0, 5.0);
    expect(result).toBeCloseTo(5.0, 10);
  });
});

describe('Total Coefficients', () => {
  it('sums coefficients for gas and aqueous species only', () => {
    const haber = getReactionByName('Haber Process')!;

    const reactantCoeffs = calculateTotalCoefficients(haber.reactants);
    const productCoeffs = calculateTotalCoefficients(haber.products);

    // N₂(g) + 3H₂(g) = 4
    expect(reactantCoeffs).toBe(4);
    // 2NH₃(g) = 2
    expect(productCoeffs).toBe(2);
  });

  it('excludes pure liquids and solids', () => {
    const ester = getReactionByName('Esterification')!;

    // CH₃COOH(aq) = 1 (C₂H₅OH is liquid, excluded)
    const reactantCoeffs = calculateTotalCoefficients(ester.reactants);
    expect(reactantCoeffs).toBe(1);

    // Products are all liquids
    const productCoeffs = calculateTotalCoefficients(ester.products);
    expect(productCoeffs).toBe(1); // Default to 1 when none
  });

  it('returns 1 when no gas/aqueous species', () => {
    const emptySpecies: any[] = [];
    expect(calculateTotalCoefficients(emptySpecies)).toBe(1);

    const onlyLiquids = [
      { formula: 'H₂O', coeff: 2, state: 'l' as const, color: '#fff' },
    ];
    expect(calculateTotalCoefficients(onlyLiquids)).toBe(1);
  });
});

describe('Le Chatelier Predictions', () => {
  describe('Temperature Effect', () => {
    it('exothermic + heating → reverse shift', () => {
      expect(predictTemperatureEffect(-50, true)).toBe('reverse');
    });

    it('exothermic + cooling → forward shift', () => {
      expect(predictTemperatureEffect(-50, false)).toBe('forward');
    });

    it('endothermic + heating → forward shift', () => {
      expect(predictTemperatureEffect(100, true)).toBe('forward');
    });

    it('endothermic + cooling → reverse shift', () => {
      expect(predictTemperatureEffect(100, false)).toBe('reverse');
    });

    it('deltaH = 0 → no effect', () => {
      expect(predictTemperatureEffect(0, true)).toBe('none');
      expect(predictTemperatureEffect(0, false)).toBe('none');
    });
  });

  describe('Pressure Effect', () => {
    it('Δn < 0, pressure increase → forward shift', () => {
      expect(predictPressureEffect(-2, true)).toBe('forward');
    });

    it('Δn < 0, pressure decrease → reverse shift', () => {
      expect(predictPressureEffect(-2, false)).toBe('reverse');
    });

    it('Δn > 0, pressure increase → reverse shift', () => {
      expect(predictPressureEffect(2, true)).toBe('reverse');
    });

    it('Δn > 0, pressure decrease → forward shift', () => {
      expect(predictPressureEffect(2, false)).toBe('forward');
    });

    it('Δn = 0 → no effect', () => {
      expect(predictPressureEffect(0, true)).toBe('none');
      expect(predictPressureEffect(0, false)).toBe('none');
    });
  });

  describe('Real Reaction Predictions', () => {
    it('Haber Process: heating shifts reverse (exothermic)', () => {
      const haber = getReactionByName('Haber Process')!;
      expect(haber.deltaH).toBeLessThan(0);
      expect(predictTemperatureEffect(haber.deltaH, true)).toBe('reverse');
    });

    it('Haber Process: compression shifts forward (Δn = -2)', () => {
      const haber = getReactionByName('Haber Process')!;
      expect(haber.gasChange).toBe(-2);
      expect(predictPressureEffect(haber.gasChange, true)).toBe('forward');
    });

    it('Methane Steam Reforming: heating shifts forward (endothermic)', () => {
      const msr = getReactionByName('Methane Steam Reforming')!;
      expect(msr.deltaH).toBeGreaterThan(0);
      expect(predictTemperatureEffect(msr.deltaH, true)).toBe('forward');
    });

    it('Water-Gas Shift: pressure has no effect (Δn = 0)', () => {
      const wgs = getReactionByName('Water-Gas Shift')!;
      expect(wgs.gasChange).toBe(0);
      expect(predictPressureEffect(wgs.gasChange, true)).toBe('none');
    });
  });
});
