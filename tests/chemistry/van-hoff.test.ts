/**
 * Van't Hoff Equation Tests
 *
 * Tests for the temperature dependence of equilibrium constants.
 * The Van't Hoff equation: ln(K2/K1) = -ΔH°/R × (1/T2 - 1/T1)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateKcAtTemperature,
  R_JOULES,
  T_REFERENCE,
} from '../../src/chemistry/equilibrium.js';
import { reactions, getReactionByName } from '../../src/chemistry/reactions.js';

describe('Van\'t Hoff Equation', () => {
  describe('Mathematical Correctness', () => {
    it('returns Kc298 at reference temperature (298K)', () => {
      reactions.forEach(reaction => {
        const result = calculateKcAtTemperature(reaction, 298);
        expect(result).toBeCloseTo(reaction.Kc298, 5);
      });
    });

    it('correctly applies Van\'t Hoff formula for Haber Process at 500K', () => {
      // Manual calculation:
      // Kc298 = 6.0e5, ΔH = -92 kJ/mol = -92000 J/mol
      // lnK2/K1 = -(-92000)/8.314 × (1/500 - 1/298)
      //         = 11065.67 × (-0.001356)
      //         = -15.01
      // K2 = 6.0e5 × e^(-15.01) = 6.0e5 × 3.01e-7 ≈ 0.181
      const haber = getReactionByName('Haber Process')!;
      const result = calculateKcAtTemperature(haber, 500);

      // Calculate expected value manually
      const deltaH = haber.deltaH * 1000;
      const lnRatio = (-deltaH / R_JOULES) * (1 / 500 - 1 / T_REFERENCE);
      const expected = haber.Kc298 * Math.exp(lnRatio);

      expect(result).toBeCloseTo(expected, 5);
      // Also check it's in the right ballpark (~0.1 to ~1)
      expect(result).toBeGreaterThan(0.01);
      expect(result).toBeLessThan(10);
    });

    it('correctly calculates for endothermic reaction (Methane Steam Reforming)', () => {
      const msr = getReactionByName('Methane Steam Reforming')!;

      // At 1000K, the highly endothermic reaction should have much larger K
      const K298 = calculateKcAtTemperature(msr, 298);
      const K1000 = calculateKcAtTemperature(msr, 1000);

      // Verify the calculation
      const deltaH = msr.deltaH * 1000;
      const lnRatio = (-deltaH / R_JOULES) * (1 / 1000 - 1 / T_REFERENCE);
      const expected = msr.Kc298 * Math.exp(lnRatio);

      expect(K1000).toBeCloseTo(expected, 5);
      expect(K1000).toBeGreaterThan(K298);
    });

    it('uses correct gas constant R = 8.314 J/(mol·K)', () => {
      expect(R_JOULES).toBe(8.314);
    });

    it('uses correct reference temperature T1 = 298 K', () => {
      expect(T_REFERENCE).toBe(298);
    });
  });

  describe('Thermodynamic Behavior - Exothermic Reactions', () => {
    const exothermicReactions = reactions.filter(r => r.deltaH < 0);

    exothermicReactions.forEach(reaction => {
      it(`${reaction.name}: K decreases with increasing temperature`, () => {
        const K298 = calculateKcAtTemperature(reaction, 298);
        const K400 = calculateKcAtTemperature(reaction, 400);
        const K500 = calculateKcAtTemperature(reaction, 500);

        expect(K400).toBeLessThan(K298);
        expect(K500).toBeLessThan(K400);
      });
    });

    it('Haber Process K decreases dramatically with temperature', () => {
      const haber = getReactionByName('Haber Process')!;
      const K298 = calculateKcAtTemperature(haber, 298);
      const K700 = calculateKcAtTemperature(haber, 700);

      // Should decrease by many orders of magnitude
      expect(K298 / K700).toBeGreaterThan(1e6);
    });
  });

  describe('Thermodynamic Behavior - Endothermic Reactions', () => {
    const endothermicReactions = reactions.filter(r => r.deltaH > 0);

    endothermicReactions.forEach(reaction => {
      it(`${reaction.name}: K increases with increasing temperature`, () => {
        const K298 = calculateKcAtTemperature(reaction, 298);
        const K400 = calculateKcAtTemperature(reaction, 400);
        const K500 = calculateKcAtTemperature(reaction, 500);

        expect(K400).toBeGreaterThan(K298);
        expect(K500).toBeGreaterThan(K400);
      });
    });

    it('Methane Steam Reforming becomes favorable at high temperatures', () => {
      const msr = getReactionByName('Methane Steam Reforming')!;

      // At 298K, K is tiny (~10^-25)
      const K298 = calculateKcAtTemperature(msr, 298);
      expect(K298).toBeLessThan(1e-20);

      // At 1200K (industrial conditions), K should be significant
      const K1200 = calculateKcAtTemperature(msr, 1200);
      expect(K1200).toBeGreaterThan(1);
    });

    it('PCl₅ Decomposition favors products at higher temperatures', () => {
      const pcl5 = getReactionByName('PCl₅ Decomposition')!;

      const K298 = calculateKcAtTemperature(pcl5, 298);
      const K600 = calculateKcAtTemperature(pcl5, 600);

      expect(K298).toBeLessThan(1); // Favors reactants at 298K
      expect(K600).toBeGreaterThan(K298);
    });
  });

  describe('Edge Cases', () => {
    it('handles very small K values (K < 1e-20) without underflow', () => {
      const msr = getReactionByName('Methane Steam Reforming')!;
      const result = calculateKcAtTemperature(msr, 298);

      expect(result).toBeLessThan(1e-20);
      expect(result).toBeGreaterThan(0);
      expect(Number.isFinite(result)).toBe(true);
      expect(Number.isNaN(result)).toBe(false);
    });

    it('handles very large K values (K > 1e20) without overflow', () => {
      const contact = getReactionByName('Contact Process')!;
      const result = calculateKcAtTemperature(contact, 298);

      expect(result).toBeGreaterThan(1e20);
      expect(Number.isFinite(result)).toBe(true);
      expect(Number.isNaN(result)).toBe(false);
    });

    it('handles extreme low temperatures without errors', () => {
      const haber = getReactionByName('Haber Process')!;
      const result = calculateKcAtTemperature(haber, 100);

      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    });

    it('handles extreme high temperatures without errors', () => {
      const haber = getReactionByName('Haber Process')!;
      const result = calculateKcAtTemperature(haber, 2000);

      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    });

    it('handles deltaH = 0 (isothermal case) - K remains constant', () => {
      // Create a mock reaction with zero enthalpy change
      const isothermal = { Kc298: 100, deltaH: 0 };

      const K298 = calculateKcAtTemperature(isothermal, 298);
      const K500 = calculateKcAtTemperature(isothermal, 500);
      const K1000 = calculateKcAtTemperature(isothermal, 1000);

      expect(K298).toBeCloseTo(100, 5);
      expect(K500).toBeCloseTo(100, 5);
      expect(K1000).toBeCloseTo(100, 5);
    });
  });

  describe('Consistency Checks', () => {
    it('K is always positive', () => {
      reactions.forEach(reaction => {
        for (let T = 200; T <= 1500; T += 100) {
          const K = calculateKcAtTemperature(reaction, T);
          expect(K).toBeGreaterThan(0);
        }
      });
    });

    it('monotonic temperature dependence for all reactions', () => {
      reactions.forEach(reaction => {
        const temps = [250, 300, 350, 400, 450, 500, 600, 700];
        const Ks = temps.map(T => calculateKcAtTemperature(reaction, T));

        for (let i = 1; i < Ks.length; i++) {
          if (reaction.deltaH < 0) {
            // Exothermic: K should decrease with T
            expect(Ks[i]).toBeLessThan(Ks[i - 1]);
          } else if (reaction.deltaH > 0) {
            // Endothermic: K should increase with T
            expect(Ks[i]).toBeGreaterThan(Ks[i - 1]);
          }
        }
      });
    });
  });
});
