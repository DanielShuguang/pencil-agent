import { describe, it, expect } from 'vitest'
import { evaluateSafeExpression } from '../safe-evaluator'

describe('SafeExpressionEvaluator', () => {
  describe('basic comparisons', () => {
    it('should evaluate equality', () => {
      expect(evaluateSafeExpression('$input === 42', 42)).toBe(true)
      expect(evaluateSafeExpression('$input === 42', 43)).toBe(false)
    })

    it('should evaluate inequality', () => {
      expect(evaluateSafeExpression('$input !== null', null)).toBe(false)
      expect(evaluateSafeExpression('$input !== null', 'value')).toBe(true)
    })

    it('should evaluate numeric comparisons', () => {
      expect(evaluateSafeExpression('$input > 10', 15)).toBe(true)
      expect(evaluateSafeExpression('$input > 10', 5)).toBe(false)
      expect(evaluateSafeExpression('$input < 10', 5)).toBe(true)
      expect(evaluateSafeExpression('$input >= 10', 10)).toBe(true)
      expect(evaluateSafeExpression('$input <= 10', 10)).toBe(true)
    })

    it('should evaluate string comparisons', () => {
      expect(evaluateSafeExpression('$input === "hello"', 'hello')).toBe(true)
      expect(evaluateSafeExpression('$input === "hello"', 'world')).toBe(false)
    })
  })

  describe('logical operators', () => {
    it('should evaluate AND', () => {
      expect(evaluateSafeExpression('$input > 0 && $input < 100', 50)).toBe(true)
      expect(evaluateSafeExpression('$input > 0 && $input < 100', 150)).toBe(false)
    })

    it('should evaluate OR', () => {
      expect(evaluateSafeExpression('$input === "error" || $input === "warning"', 'error')).toBe(true)
      expect(evaluateSafeExpression('$input === "error" || $input === "warning"', 'info')).toBe(false)
    })

    it('should evaluate NOT', () => {
      expect(evaluateSafeExpression('!$input', false)).toBe(true)
      expect(evaluateSafeExpression('!$input', true)).toBe(false)
    })
  })

  describe('null/undefined checks', () => {
    it('should check for null', () => {
      expect(evaluateSafeExpression('$input === null', null)).toBe(true)
      expect(evaluateSafeExpression('$input === null', 'value')).toBe(false)
    })

    it('should check for undefined', () => {
      expect(evaluateSafeExpression('$input === undefined', undefined)).toBe(true)
      expect(evaluateSafeExpression('$input === undefined', 'value')).toBe(false)
    })

    it('should check for truthiness', () => {
      expect(evaluateSafeExpression('$input', 'value')).toBe(true)
      expect(evaluateSafeExpression('$input', '')).toBe(false)
      expect(evaluateSafeExpression('$input', 0)).toBe(false)
      expect(evaluateSafeExpression('$input', null)).toBe(false)
    })
  })

  describe('security', () => {
    it('should reject function calls', () => {
      expect(evaluateSafeExpression('alert("xss")', null)).toBe(false)
      expect(evaluateSafeExpression('process.exit()', null)).toBe(false)
      expect(evaluateSafeExpression('require("child_process")', null)).toBe(false)
    })

    it('should reject assignment', () => {
      expect(evaluateSafeExpression('$input = 10', null)).toBe(false)
      expect(evaluateSafeExpression('$input += 10', null)).toBe(false)
    })

    it('should reject property access on dangerous objects', () => {
      expect(evaluateSafeExpression('process.env', null)).toBe(false)
      expect(evaluateSafeExpression('globalThis', null)).toBe(false)
    })

    it('should reject template literals', () => {
      expect(evaluateSafeExpression('`${process.exit()}`', null)).toBe(false)
    })

    it('should reject new keyword', () => {
      expect(evaluateSafeExpression('new Function("return 1")', null)).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should return false for invalid expressions', () => {
      expect(evaluateSafeExpression('invalid!!!', null)).toBe(false)
      expect(evaluateSafeExpression('', null)).toBe(false)
    })
  })
})