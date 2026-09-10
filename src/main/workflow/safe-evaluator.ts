/**
 * 求值条件节点表达式的最小表达式语言。
 *
 * 这里**不做**正则黑名单过滤：黑名单无法约束语法，`[]["filter"]["constructor"](...)`
 * 一类的下标访问与字符串拼接都能绕过。取而代之的是一个只允许白名单语法的
 * 词法分析器 + 递归下降解析器，求值时只走显式实现的运算符分支，
 * 不暴露任何宿主对象，也不使用 `eval` / `new Function`。
 *
 * 支持的语法：
 * - 字面量：数字、字符串、`true` / `false` / `null` / `undefined`
 * - 输入：`$input`
 * - 受限属性：`$input.foo`、`$input[0]`、`Math.max`、`Math.PI`
 * - 运算符：`! - + typeof`、`* / %`、`+ -`、`< <= > >=`、`== != === !==`、`&& || ??`
 * - 括号与三元表达式 `cond ? a : b`
 *
 * 明确不支持：函数调用、赋值、属性链（`a.b.c`）、数组字面量、模板字符串、`new`。
 */

type TokenType = 'number' | 'string' | 'identifier' | 'punctuator' | 'eof'

interface Token {
  type: TokenType
  value: string
  position: number
}

type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '<'
  | '<='
  | '>'
  | '>='
  | '=='
  | '!='
  | '==='
  | '!=='
  | '&&'
  | '||'
  | '??'

type UnaryOperator = '!' | '-' | '+'

type Expression =
  | { kind: 'literal'; value: unknown }
  | { kind: 'input' }
  | { kind: 'member'; target: 'input' | 'math'; keyType: 'static' | 'dynamic'; key: string | Expression }
  | { kind: 'unary'; operator: UnaryOperator; argument: Expression }
  | { kind: 'typeof'; argument: Expression }
  | { kind: 'binary'; operator: BinaryOperator; left: Expression; right: Expression }
  | { kind: 'conditional'; test: Expression; consequent: Expression; alternate: Expression }

/** 允许出现在 `Math.<name>` 位置的方法与常量。 */
const MATH_MEMBERS = new Set([
  'abs',
  'ceil',
  'floor',
  'max',
  'min',
  'pow',
  'round',
  'sign',
  'sqrt',
  'trunc',
  'E',
  'PI',
])

const PUNCTUATORS = [
  '===',
  '!==',
  '<=',
  '>=',
  '==',
  '!=',
  '&&',
  '||',
  '??',
  '(',
  ')',
  '.',
  '[',
  ']',
  '!',
  '-',
  '+',
  '*',
  '/',
  '%',
  '<',
  '>',
  '?',
  ':',
  ',',
]

const IDENTIFIER_START = /[A-Za-z_$]/
const IDENTIFIER_PART = /[A-Za-z0-9_$]/
const NUMBER_PATTERN = /^(?:0[xX][0-9a-fA-F]+|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)/

const BINARY_PRECEDENCE: Record<string, { precedence: number; operator: BinaryOperator }> = {
  '??': { precedence: 1, operator: '??' },
  '||': { precedence: 2, operator: '||' },
  '&&': { precedence: 3, operator: '&&' },
  '==': { precedence: 4, operator: '==' },
  '!=': { precedence: 4, operator: '!=' },
  '===': { precedence: 4, operator: '===' },
  '!==': { precedence: 4, operator: '!==' },
  '<': { precedence: 5, operator: '<' },
  '<=': { precedence: 5, operator: '<=' },
  '>': { precedence: 5, operator: '>' },
  '>=': { precedence: 5, operator: '>=' },
  '+': { precedence: 6, operator: '+' },
  '-': { precedence: 6, operator: '-' },
  '*': { precedence: 7, operator: '*' },
  '/': { precedence: 7, operator: '/' },
  '%': { precedence: 7, operator: '%' },
}

class ExpressionSyntaxError extends Error {}

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let index = 0

  while (index < source.length) {
    const char = source[index]!

    if (/\s/.test(char)) {
      index += 1
      continue
    }

    if (char === '"' || char === "'") {
      const quote = char
      const start = index
      let raw = ''
      index += 1

      while (index < source.length && source[index] !== quote) {
        if (source[index] === '\\') {
          index += 1
          if (index >= source.length) break
          raw += `\\${source[index]}`
          index += 1
          continue
        }
        raw += source[index]
        index += 1
      }

      if (index >= source.length) {
        throw new ExpressionSyntaxError(`Unterminated string literal at ${start}`)
      }

      index += 1
      let value: string
      try {
        value = JSON.parse(`"${raw}"`) as string
      } catch {
        throw new ExpressionSyntaxError(`Invalid string escape at ${start}`)
      }
      tokens.push({ type: 'string', value, position: start })
      continue
    }

    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(source[index + 1] ?? ''))) {
      const match = NUMBER_PATTERN.exec(source.slice(index))
      if (!match) {
        throw new ExpressionSyntaxError(`Invalid number at ${index}`)
      }
      tokens.push({ type: 'number', value: match[0], position: index })
      index += match[0].length
      continue
    }

    if (IDENTIFIER_START.test(char)) {
      const start = index
      while (index < source.length && IDENTIFIER_PART.test(source[index]!)) {
        index += 1
      }
      tokens.push({ type: 'identifier', value: source.slice(start, index), position: start })
      continue
    }

    const punctuator = PUNCTUATORS.find((candidate) => source.startsWith(candidate, index))
    if (!punctuator) {
      throw new ExpressionSyntaxError(`Unexpected character "${char}" at ${index}`)
    }
    tokens.push({ type: 'punctuator', value: punctuator, position: index })
    index += punctuator.length
  }

  tokens.push({ type: 'eof', value: '', position: source.length })
  return tokens
}

class Parser {
  private index = 0

  constructor(private readonly tokens: Token[]) {}

  parse(): Expression {
    const expression = this.parseConditional()
    const rest = this.peek()
    if (rest.type !== 'eof') {
      throw new ExpressionSyntaxError(`Unexpected token "${rest.value}" at ${rest.position}`)
    }
    return expression
  }

  private peek(): Token {
    return this.tokens[this.index]!
  }

  private next(): Token {
    const token = this.peek()
    if (token.type !== 'eof') this.index += 1
    return token
  }

  private matchPunctuator(...values: string[]): Token | null {
    const token = this.peek()
    if (token.type === 'punctuator' && values.includes(token.value)) {
      return this.next()
    }
    return null
  }

  private expectPunctuator(value: string): Token {
    const token = this.matchPunctuator(value)
    if (!token) {
      const current = this.peek()
      throw new ExpressionSyntaxError(
        `Expected "${value}" but found "${current.value}" at ${current.position}`,
      )
    }
    return token
  }

  private parseConditional(): Expression {
    const test = this.parseBinary(0)
    if (!this.matchPunctuator('?')) return test

    const consequent = this.parseConditional()
    this.expectPunctuator(':')
    const alternate = this.parseConditional()
    return { kind: 'conditional', test, consequent, alternate }
  }

  private parseBinary(minimumPrecedence: number): Expression {
    let left = this.parseUnary()

    for (;;) {
      const token = this.peek()
      if (token.type !== 'punctuator') break

      const entry = BINARY_PRECEDENCE[token.value]
      if (!entry || entry.precedence < minimumPrecedence) break

      this.next()
      // 所有运算符都按左结合处理
      const right = this.parseBinary(entry.precedence + 1)
      left = { kind: 'binary', operator: entry.operator, left, right }
    }

    return left
  }

  private parseUnary(): Expression {
    const token = this.peek()

    if (
      token.type === 'punctuator' &&
      (token.value === '!' || token.value === '-' || token.value === '+')
    ) {
      this.next()
      return { kind: 'unary', operator: token.value, argument: this.parseUnary() }
    }

    if (token.type === 'identifier' && token.value === 'typeof') {
      this.next()
      return { kind: 'typeof', argument: this.parseUnary() }
    }

    return this.parseMember()
  }

  private parseMember(): Expression {
    const token = this.peek()

    if (token.type === 'identifier' && token.value === '$input') {
      this.next()
      if (this.peek().type === 'punctuator' && (this.peek().value === '.' || this.peek().value === '[')) {
        const key = this.parseMemberKey()
        return this.buildMember('input', key)
      }
      return { kind: 'input' }
    }

    if (token.type === 'identifier' && token.value === 'Math') {
      this.next()
      if (this.peek().type !== 'punctuator' || (this.peek().value !== '.' && this.peek().value !== '[')) {
        throw new ExpressionSyntaxError(`"Math" must be accessed as a member at ${token.position}`)
      }
      const key = this.parseMemberKey()
      return this.buildMember('math', key)
    }

    return this.parsePrimary()
  }

  private parseMemberKey(): { keyType: 'static' | 'dynamic'; key: string | Expression } {
    if (this.matchPunctuator('.')) {
      const token = this.next()
      if (token.type !== 'identifier') {
        throw new ExpressionSyntaxError(`Expected property name at ${token.position}`)
      }
      return { keyType: 'static', key: token.value }
    }

    this.expectPunctuator('[')
    const index = this.parseConditional()
    this.expectPunctuator(']')
    return { keyType: 'dynamic', key: index }
  }

  private buildMember(
    target: 'input' | 'math',
    { keyType, key }: { keyType: 'static' | 'dynamic'; key: string | Expression },
  ): Expression {
    const next = this.peek()
    // 只允许一层属性访问，避免通过属性链逃逸
    if (next.type === 'punctuator' && (next.value === '.' || next.value === '[')) {
      throw new ExpressionSyntaxError(`Property chaining is not allowed at ${next.position}`)
    }
    if (next.type === 'punctuator' && next.value === '(') {
      throw new ExpressionSyntaxError(`Function calls are not allowed at ${next.position}`)
    }
    if (target === 'math' && keyType === 'static') {
      const member = key as string
      if (!MATH_MEMBERS.has(member)) {
        throw new ExpressionSyntaxError(`Unsupported Math member "${member}"`)
      }
    }
    return { kind: 'member', target, keyType, key }
  }

  private parsePrimary(): Expression {
    const token = this.next()

    if (token.type === 'number') {
      const isHex = token.value.startsWith('0x') || token.value.startsWith('0X')
      const value = isHex ? Number.parseInt(token.value, 16) : Number(token.value)
      if (!Number.isFinite(value)) {
        throw new ExpressionSyntaxError(`Invalid number "${token.value}"`)
      }
      return { kind: 'literal', value }
    }

    if (token.type === 'string') {
      return { kind: 'literal', value: token.value }
    }

    if (token.type === 'identifier') {
      switch (token.value) {
        case 'true':
          return { kind: 'literal', value: true }
        case 'false':
          return { kind: 'literal', value: false }
        case 'null':
          return { kind: 'literal', value: null }
        case 'undefined':
          return { kind: 'literal', value: undefined }
        default:
          throw new ExpressionSyntaxError(`Unknown identifier "${token.value}" at ${token.position}`)
      }
    }

    if (token.type === 'punctuator' && token.value === '(') {
      const expression = this.parseConditional()
      this.expectPunctuator(')')
      return expression
    }

    throw new ExpressionSyntaxError(`Unexpected token "${token.value}" at ${token.position}`)
  }
}

function readStaticKey(container: unknown, key: string): unknown {
  if (container === null || container === undefined) return undefined
  if (typeof container !== 'object' && typeof container !== 'string') return undefined
  // 阻止原型链访问
  if (key === 'constructor' || key === '__proto__' || key === 'prototype') return undefined
  return (container as Record<string, unknown>)[key]
}

function evaluateMember(expression: Extract<Expression, { kind: 'member' }>, input: unknown): unknown {
  if (expression.target === 'math') {
    const key = expression.keyType === 'static' ? (expression.key as string) : undefined
    if (!key || !MATH_MEMBERS.has(key)) return undefined
    return (Math as unknown as Record<string, unknown>)[key]
  }

  if (expression.keyType === 'dynamic') {
    const key = evaluateExpression(expression.key as Expression, input)
    if (typeof key !== 'string' && typeof key !== 'number') return undefined
    return readStaticKey(input, String(key))
  }

  return readStaticKey(input, expression.key as string)
}

function evaluateExpression(expression: Expression, input: unknown): unknown {
  switch (expression.kind) {
    case 'literal':
      return expression.value
    case 'input':
      return input
    case 'member':
      return evaluateMember(expression, input)
    case 'unary': {
      const value = evaluateExpression(expression.argument, input)
      switch (expression.operator) {
        case '!':
          return !value
        case '-':
          return -(value as number)
        case '+':
          return +(value as number)
      }
      return undefined
    }
    case 'typeof':
      return typeof evaluateExpression(expression.argument, input)
    case 'conditional':
      return evaluateExpression(expression.test, input)
        ? evaluateExpression(expression.consequent, input)
        : evaluateExpression(expression.alternate, input)
    case 'binary': {
      const left = evaluateExpression(expression.left, input)
      switch (expression.operator) {
        case '&&':
          return left ? evaluateExpression(expression.right, input) : left
        case '||':
          return left ? left : evaluateExpression(expression.right, input)
        case '??':
          return left ?? evaluateExpression(expression.right, input)
        default:
          break
      }

      const right = evaluateExpression(expression.right, input)
      switch (expression.operator) {
        case '==':
          // eslint-disable-next-line eqeqeq
          return left == right
        case '!=':
          // eslint-disable-next-line eqeqeq
          return left != right
        case '===':
          return left === right
        case '!==':
          return left !== right
        case '<':
          return (left as number) < (right as number)
        case '<=':
          return (left as number) <= (right as number)
        case '>':
          return (left as number) > (right as number)
        case '>=':
          return (left as number) >= (right as number)
        case '+':
          return (left as number) + (right as number)
        case '-':
          return (left as number) - (right as number)
        case '*':
          return (left as number) * (right as number)
        case '/':
          return (right as number) === 0 ? Number.NaN : (left as number) / (right as number)
        case '%':
          return (right as number) === 0 ? Number.NaN : (left as number) % (right as number)
      }
    }
  }

  return undefined
}

/**
 * 求值条件表达式。任何语法错误、非法标识符或求值异常都返回 `false`，
 * 不向调用方抛出，也不会执行表达式里的任意代码。
 */
export function evaluateSafeExpression(expression: string, input: unknown): boolean {
  if (!expression || typeof expression !== 'string') return false

  try {
    const ast = new Parser(tokenize(expression)).parse()
    return Boolean(evaluateExpression(ast, input))
  } catch {
    return false
  }
}
