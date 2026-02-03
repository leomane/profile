/**
 * Test setup file for p5.js mocking
 * Provides Vector class and helper functions for testing
 */

export class MockVector {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  static sub(v1: MockVector, v2: MockVector): MockVector {
    return new MockVector(v1.x - v2.x, v1.y - v2.y);
  }

  static add(v1: MockVector, v2: MockVector): MockVector {
    return new MockVector(v1.x + v2.x, v1.y + v2.y);
  }

  static mult(v: MockVector, n: number): MockVector {
    return new MockVector(v.x * n, v.y * n);
  }

  static div(v: MockVector, n: number): MockVector {
    return new MockVector(v.x / n, v.y / n);
  }

  static dist(v1: MockVector, v2: MockVector): number {
    return Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2);
  }

  copy(): MockVector {
    return new MockVector(this.x, this.y);
  }

  add(v: MockVector | number, y?: number): this {
    if (typeof v === 'number') {
      this.x += v;
      this.y += y ?? v;
    } else {
      this.x += v.x;
      this.y += v.y;
    }
    return this;
  }

  sub(v: MockVector | number, y?: number): this {
    if (typeof v === 'number') {
      this.x -= v;
      this.y -= y ?? v;
    } else {
      this.x -= v.x;
      this.y -= v.y;
    }
    return this;
  }

  mult(n: number): this {
    this.x *= n;
    this.y *= n;
    return this;
  }

  div(n: number): this {
    if (n !== 0) {
      this.x /= n;
      this.y /= n;
    }
    return this;
  }

  mag(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  magSq(): number {
    return this.x ** 2 + this.y ** 2;
  }

  normalize(): this {
    const m = this.mag();
    if (m > 0) {
      this.x /= m;
      this.y /= m;
    }
    return this;
  }

  limit(max: number): this {
    const m = this.mag();
    if (m > max) {
      this.normalize();
      this.mult(max);
    }
    return this;
  }

  setMag(n: number): this {
    this.normalize();
    this.mult(n);
    return this;
  }

  heading(): number {
    return Math.atan2(this.y, this.x);
  }

  rotate(angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const newX = this.x * cos - this.y * sin;
    const newY = this.x * sin + this.y * cos;
    this.x = newX;
    this.y = newY;
    return this;
  }

  dot(v: MockVector): number {
    return this.x * v.x + this.y * v.y;
  }

  dist(v: MockVector): number {
    return MockVector.dist(this, v);
  }

  set(x: number | MockVector, y?: number): this {
    if (typeof x === 'number') {
      this.x = x;
      this.y = y ?? x;
    } else {
      this.x = x.x;
      this.y = x.y;
    }
    return this;
  }
}

// Make available globally for tests
(globalThis as any).createVector = (x = 0, y = 0) => new MockVector(x, y);
(globalThis as any).p5 = { Vector: MockVector };

// Utility for order of magnitude comparison
export function expectOrderOfMagnitude(actual: number, expected: number, tolerance = 1): void {
  const actualOrder = Math.log10(Math.abs(actual) + Number.EPSILON);
  const expectedOrder = Math.log10(Math.abs(expected) + Number.EPSILON);
  if (Math.abs(actualOrder - expectedOrder) > tolerance) {
    throw new Error(
      `Expected order of magnitude ~${expectedOrder.toFixed(1)} but got ${actualOrder.toFixed(1)}`
    );
  }
}

// Utility for relative error comparison
export function expectWithinPercent(actual: number, expected: number, percentTolerance = 5): void {
  const relativeError = Math.abs((actual - expected) / expected) * 100;
  if (relativeError > percentTolerance) {
    throw new Error(
      `Expected ${expected} within ${percentTolerance}% but got ${actual} (${relativeError.toFixed(2)}% error)`
    );
  }
}
