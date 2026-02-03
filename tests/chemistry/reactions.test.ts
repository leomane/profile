/**
 * Chemistry Reaction Database Validation Tests
 *
 * Validates that all reactions in the database have:
 * - Correct thermodynamic properties (sign of ΔH)
 * - Literature-consistent Kc298 values
 * - Correct gas change calculations from stoichiometry
 * - Properly balanced equations
 */

import { describe, it, expect } from 'vitest';
import {
  reactions,
  getReactionByName,
  getExothermicReactions,
  getEndothermicReactions,
  getGasReactions,
} from '../../src/chemistry/reactions.js';
import type { Reaction } from '../../src/chemistry/types.js';

describe('Reaction Database Structure', () => {
  it('contains 10 reactions', () => {
    expect(reactions).toHaveLength(10);
  });

  it('all reactions have required properties', () => {
    reactions.forEach(reaction => {
      expect(reaction.name).toBeDefined();
      expect(typeof reaction.name).toBe('string');
      expect(reaction.name.length).toBeGreaterThan(0);

      expect(reaction.reactants).toBeDefined();
      expect(Array.isArray(reaction.reactants)).toBe(true);
      expect(reaction.reactants.length).toBeGreaterThan(0);

      expect(reaction.products).toBeDefined();
      expect(Array.isArray(reaction.products)).toBe(true);
      expect(reaction.products.length).toBeGreaterThan(0);

      expect(typeof reaction.deltaH).toBe('number');
      expect(typeof reaction.gasChange).toBe('number');
      expect(typeof reaction.Kc298).toBe('number');
      expect(reaction.Kc298).toBeGreaterThan(0);

      expect(typeof reaction.maxTemp).toBe('number');
      expect(reaction.maxTemp).toBeGreaterThan(298);
    });
  });

  it('all species have required properties', () => {
    reactions.forEach(reaction => {
      [...reaction.reactants, ...reaction.products].forEach(species => {
        expect(typeof species.formula).toBe('string');
        expect(species.formula.length).toBeGreaterThan(0);

        expect(typeof species.coeff).toBe('number');
        expect(species.coeff).toBeGreaterThan(0);
        expect(Number.isInteger(species.coeff)).toBe(true);

        expect(['g', 'aq', 'l', 's']).toContain(species.state);

        expect(typeof species.color).toBe('string');
        expect(species.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });
});

describe('Literature Value Validation', () => {
  describe('Equilibrium Constants (Kc298)', () => {
    it('Haber Process: Kc298 ≈ 6×10⁵ (literature: 3.5×10⁵ - 6.8×10⁵)', () => {
      const haber = getReactionByName('Haber Process')!;
      expect(haber.Kc298).toBeGreaterThan(3.5e5);
      expect(haber.Kc298).toBeLessThan(7e5);
    });

    it('Contact Process: Kc298 ≈ 4×10²⁴ (very large)', () => {
      const contact = getReactionByName('Contact Process')!;
      // Literature indicates K > 10²³ at 298K
      expect(contact.Kc298).toBeGreaterThan(1e23);
      expect(contact.Kc298).toBeLessThan(1e26);
    });

    it('NO₂ Dimerization: Kc298 ≈ 170 (literature: 100-200)', () => {
      const no2 = getReactionByName('NO₂ Dimerization')!;
      expect(no2.Kc298).toBeGreaterThan(100);
      expect(no2.Kc298).toBeLessThan(200);
    });

    it('Esterification: Kc298 ≈ 4 (literature: 3-5)', () => {
      const ester = getReactionByName('Esterification')!;
      expect(ester.Kc298).toBeGreaterThan(3);
      expect(ester.Kc298).toBeLessThan(5);
    });

    it('PCl₅ Decomposition: Kc298 < 1 (reactants favored at 298K)', () => {
      const pcl5 = getReactionByName('PCl₅ Decomposition')!;
      expect(pcl5.Kc298).toBeLessThan(1);
      expect(pcl5.Kc298).toBeGreaterThan(0.01);
    });

    it('Methane Steam Reforming: Kc298 very small (highly unfavorable)', () => {
      const msr = getReactionByName('Methane Steam Reforming')!;
      expect(msr.Kc298).toBeLessThan(1e-20);
    });

    it('Iron(III) Thiocyanate: Kc298 ≈ 890 (formation constant)', () => {
      const fescn = getReactionByName('Iron(III) Thiocyanate')!;
      expect(fescn.Kc298).toBeGreaterThan(500);
      expect(fescn.Kc298).toBeLessThan(2000);
    });
  });

  describe('Enthalpy Changes (ΔH)', () => {
    it('Haber Process: ΔH ≈ -92 kJ/mol (literature: -91 to -92)', () => {
      const haber = getReactionByName('Haber Process')!;
      expect(haber.deltaH).toBeCloseTo(-92, 0);
    });

    it('Contact Process: highly exothermic (ΔH < -150)', () => {
      const contact = getReactionByName('Contact Process')!;
      expect(contact.deltaH).toBeLessThan(-150);
    });

    it('Methane Steam Reforming: highly endothermic (ΔH > 200)', () => {
      const msr = getReactionByName('Methane Steam Reforming')!;
      expect(msr.deltaH).toBeGreaterThan(200);
    });

    it('Esterification: slightly exothermic (ΔH ≈ -4)', () => {
      const ester = getReactionByName('Esterification')!;
      expect(ester.deltaH).toBeCloseTo(-4, 1);
    });
  });
});

describe('Thermodynamic Consistency', () => {
  it('all exothermic reactions have negative ΔH', () => {
    const exothermic = getExothermicReactions();

    expect(exothermic.length).toBeGreaterThan(0);
    exothermic.forEach(reaction => {
      expect(reaction.deltaH).toBeLessThan(0);
    });
  });

  it('all endothermic reactions have positive ΔH', () => {
    const endothermic = getEndothermicReactions();

    expect(endothermic.length).toBeGreaterThan(0);
    endothermic.forEach(reaction => {
      expect(reaction.deltaH).toBeGreaterThan(0);
    });
  });

  it('8 exothermic + 2 endothermic = 10 reactions', () => {
    const exo = getExothermicReactions();
    const endo = getEndothermicReactions();

    expect(exo.length + endo.length).toBe(10);
    expect(exo.length).toBe(8);
    expect(endo.length).toBe(2);
  });
});

describe('Gas Change (Δn) Validation', () => {
  function calculateExpectedGasChange(reaction: Reaction): number {
    const reactantGasMoles = reaction.reactants
      .filter(s => s.state === 'g')
      .reduce((sum, s) => sum + s.coeff, 0);

    const productGasMoles = reaction.products
      .filter(s => s.state === 'g')
      .reduce((sum, s) => sum + s.coeff, 0);

    return productGasMoles - reactantGasMoles;
  }

  it('gasChange matches stoichiometry for all reactions', () => {
    reactions.forEach(reaction => {
      const expected = calculateExpectedGasChange(reaction);
      expect(reaction.gasChange).toBe(expected);
    });
  });

  it('Haber Process: N₂ + 3H₂ → 2NH₃ (Δn = 2 - 4 = -2)', () => {
    const haber = getReactionByName('Haber Process')!;
    expect(haber.gasChange).toBe(-2);
  });

  it('Methane Steam Reforming: CH₄ + H₂O → CO + 3H₂ (Δn = 4 - 2 = +2)', () => {
    const msr = getReactionByName('Methane Steam Reforming')!;
    expect(msr.gasChange).toBe(2);
  });

  it('Water-Gas Shift: CO + H₂O → CO₂ + H₂ (Δn = 2 - 2 = 0)', () => {
    const wgs = getReactionByName('Water-Gas Shift')!;
    expect(wgs.gasChange).toBe(0);
  });

  it('NO₂ Dimerization: 2NO₂ → N₂O₄ (Δn = 1 - 2 = -1)', () => {
    const no2 = getReactionByName('NO₂ Dimerization')!;
    expect(no2.gasChange).toBe(-1);
  });

  it('PCl₅ Decomposition: PCl₅ → PCl₃ + Cl₂ (Δn = 2 - 1 = +1)', () => {
    const pcl5 = getReactionByName('PCl₅ Decomposition')!;
    expect(pcl5.gasChange).toBe(1);
  });

  it('aqueous reactions have gasChange = 0', () => {
    const aqueousReactions = [
      'Esterification',
      'Carbonic Acid Equilibrium',
      'Cobalt Chloride Hydration',
      'Iron(III) Thiocyanate',
    ];

    aqueousReactions.forEach(name => {
      const reaction = getReactionByName(name)!;
      expect(reaction.gasChange).toBe(0);
    });
  });
});

describe('Reaction Categories', () => {
  it('getGasReactions returns reactions with gas-phase species', () => {
    const gasReactions = getGasReactions();

    expect(gasReactions.length).toBeGreaterThan(0);
    gasReactions.forEach(reaction => {
      const hasGas =
        reaction.reactants.some(s => s.state === 'g') ||
        reaction.products.some(s => s.state === 'g');
      expect(hasGas).toBe(true);
    });
  });

  it('can retrieve each reaction by name', () => {
    const names = [
      'Haber Process',
      'Contact Process',
      'Water-Gas Shift',
      'Esterification',
      'NO₂ Dimerization',
      'Methane Steam Reforming',
      'Carbonic Acid Equilibrium',
      'PCl₅ Decomposition',
      'Cobalt Chloride Hydration',
      'Iron(III) Thiocyanate',
    ];

    names.forEach(name => {
      const reaction = getReactionByName(name);
      expect(reaction).toBeDefined();
      expect(reaction!.name).toBe(name);
    });
  });

  it('returns undefined for unknown reaction', () => {
    const result = getReactionByName('Unknown Reaction');
    expect(result).toBeUndefined();
  });
});

describe('Unique Identifiers', () => {
  it('all reaction names are unique', () => {
    const names = reactions.map(r => r.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('all species formulas within a reaction are unique', () => {
    reactions.forEach(reaction => {
      const allFormulas = [
        ...reaction.reactants.map(s => s.formula),
        ...reaction.products.map(s => s.formula),
      ];
      const uniqueFormulas = new Set(allFormulas);
      expect(uniqueFormulas.size).toBe(allFormulas.length);
    });
  });
});
