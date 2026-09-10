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
      expect(evaluateSafeExpression('$input === "error" || $input === "warning"', 'error')).toBe(
        true,
      )
      expect(evaluateSafeExpression('$input === "error" || $input === "warning"', 'info')).toBe(
        false,
      )
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

  describe('member access', () => {
    it('should read properties of the input', () => {
      expect(evaluateSafeExpression('$input.status === "error"', { status: 'error' })).toBe(true)
      expect(evaluateSafeExpression('$input.status === "error"', { status: 'ok' })).toBe(false)
    })

    it('should read nested-by-key properties', () => {
      expect(evaluateSafeExpression('$input["count"] > 3', { count: 10 })).toBe(true)
    })

    it('should fall back to undefined for missing properties', () => {
      expect(evaluateSafeExpression('$input.missing === undefined', {})).toBe(true)
    })

    it('should support Math helpers', () => {
      // 常量可以读，函数一律不可调用（调用即逃逸面）
      expect(evaluateSafeExpression('$input > Math.PI', 4)).toBe(true)
      expect(evaluateSafeExpression('$input > Math.PI', 3)).toBe(false)
      expect(evaluateSafeExpression('$input === Math.max(1, 2, 3)', 3)).toBe(false)
      expect(evaluateSafeExpression('$input === Math.floor(3.7)', 3)).toBe(false)
    })

    it('should support typeof', () => {
      expect(evaluateSafeExpression('typeof $input === "string"', 'x')).toBe(true)
      expect(evaluateSafeExpression('typeof $input === "string"', 1)).toBe(false)
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

    it('should reject array literals and subscript-based constructor access', () => {
      // 旧的黑名单实现放行了这些表达式，直接导致任意代码执行
      expect(evaluateSafeExpression('[]["filter"]["constructor"]("return true")()', null)).toBe(
        false,
      )
      expect(
        evaluateSafeExpression('[]["filter"]["constr" + "uctor"]("return true")()', null),
      ).toBe(false)
      expect(
        evaluateSafeExpression('(()=>{})["constructor"]("return typeof process")()', null),
      ).toBe(false)
      expect(
        evaluateSafeExpression('(1)["constructor"]["constructor"]("return true")()', null),
      ).toBe(false)
    })

    it('should reject string-concatenated dangerous identifiers', () => {
      expect(evaluateSafeExpression('typeof pro"+"cess === "undefined"', null)).toBe(false)
      expect(
        evaluateSafeExpression(
          '[]["filter"]["constr"+"uctor"]("return typeof pro"+"cess")()',
          null,
        ),
      ).toBe(false)
    })

    it('should reject property chains', () => {
      expect(evaluateSafeExpression('$input.a.b', { a: { b: 1 } })).toBe(false)
      expect(evaluateSafeExpression('$input.constructor', {})).toBe(false)
      expect(evaluateSafeExpression('$input.__proto__', {})).toBe(false)
      expect(evaluateSafeExpression('$input["constructor"]', {})).toBe(false)
    })

    it('should reject arbitrary identifiers and assignments', () => {
      expect(evaluateSafeExpression('this', null)).toBe(false)
      expect(evaluateSafeExpression('$input = 1', null)).toBe(false)
      expect(evaluateSafeExpression('$input ||= 1', null)).toBe(false)
      expect(evaluateSafeExpression('Math.random', 1)).toBe(false)
    })

    it('should reject function calls on members', () => {
      expect(evaluateSafeExpression('$input.slice(0)', 'abc')).toBe(false)
      expect(evaluateSafeExpression('Math.max.call(null, 1)', 1)).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should return false for invalid expressions', () => {
      expect(evaluateSafeExpression('invalid!!!', null)).toBe(false)
      expect(evaluateSafeExpression('', null)).toBe(false)
    })
  })
})
