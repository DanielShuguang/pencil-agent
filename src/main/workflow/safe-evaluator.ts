const DANGEROUS_PATTERNS = [
  /\bprocess\b/,
  /\bglobal\b/,
  /\bglobalThis\b/,
  /\brequire\b/,
  /\bimport\b/,
  /\bexport\b/,
  /\beval\b/,
  /\bFunction\b/,
  /\bconstructor\b/,
  /\bprototype\b/,
  /\b__proto__\b/,
  /\b__defineGetter__\b/,
  /\b__defineSetter__\b/,
  /\b__lookupGetter__\b/,
  /\b__lookupSetter__\b/,
  /\balert\b/,
  /\bconfirm\b/,
  /\bprompt\b/,
  /\bfetch\b/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\bindexedDB\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bcrypto\b/,
  /\bnavigator\b/,
  /\bwindow\b/,
  /\bdocument\b/,
  /\blocation\b/,
  /\bhistory\b/,
  /\bperformance\b/,
  /\bscreen\b/,
  /\bframes\b/,
  /\bself\b/,
  /\btop\b/,
  /\bparent\b/,
  /\bopener\b/,
  /\bpostMessage\b/,
  /\bclose\b/,
  /\bblur\b/,
  /\bfocus\b/,
  /\bprint\b/,
  /\bstop\b/,
  /\bfind\b/,
  /\bgetSelection\b/,
  /\bgetComputedStyle\b/,
  /\bmatchMedia\b/,
  /\bmoveTo\b/,
  /\bmoveBy\b/,
  /\bresizeTo\b/,
  /\bresizeBy\b/,
  /\bscroll\b/,
  /\bscrollTo\b/,
  /\bscrollBy\b/,
  /\brequestAnimationFrame\b/,
  /\bcancelAnimationFrame\b/,
  /\brequestIdleCallback\b/,
  /\bcancelIdleCallback\b/,
  /\bgetComputedStyle\b/,
  /\bmatchMedia\b/,
  /\balert\b/,
  /\bconfirm\b/,
  /\bprompt\b/,
  /\bprint\b/,
  /\bstop\b/,
  /\bfind\b/,
  /\bgetSelection\b/,
  /\bgetComputedStyle\b/,
  /\bmatchMedia\b/,
  /\bmoveTo\b/,
  /\bmoveBy\b/,
  /\bresizeTo\b/,
  /\bresizeBy\b/,
  /\bscroll\b/,
  /\bscrollTo\b/,
  /\bscrollBy\b/,
  /\brequestAnimationFrame\b/,
  /\bcancelAnimationFrame\b/,
  /\brequestIdleCallback\b/,
  /\bcancelIdleCallback\b/,
  /\bgetComputedStyle\b/,
  /\bmatchMedia\b/,
]

const ASSIGNMENT_PATTERNS = [
  /[^=!<>]=[^=]/,  // 普通赋值（排除比较运算符）
  /\+=/, // 加法赋值
  /-=/, // 减法赋值
  /\*=/, // 乘法赋值
  /\/=/, // 除法赋值
  /%=/, // 取模赋值
  /\*\*=/, // 幂赋值
  /<<=/, // 左移赋值
  />>=/, // 右移赋值
  />>>=/, // 无符号右移赋值
  /&=/, // 按位与赋值
  /\|=/, // 按位或赋值
  /\^=/, // 按位异或赋值
  /&&=/, // 逻辑与赋值
  /\|\|=/, // 逻辑或赋值
  /\?\?=/, // 空值合并赋值
]

export function evaluateSafeExpression(expression: string, input: unknown): boolean {
  if (!expression || typeof expression !== 'string') {
    return false
  }

  // 检查危险模式
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(expression)) {
      return false
    }
  }

  // 检查赋值操作
  for (const pattern of ASSIGNMENT_PATTERNS) {
    if (pattern.test(expression)) {
      return false
    }
  }

  // 检查模板字符串
  if (expression.includes('`')) {
    return false
  }

  // 检查 new 关键字
  if (/\bnew\s/.test(expression)) {
    return false
  }

  // 检查函数调用（但允许基本操作）
  // 允许的操作：比较、逻辑运算
  // 禁止的：函数调用如 alert(), process.exit() 等
  if (/\b(?:alert|confirm|prompt|print|stop|find|getSelection|getComputedStyle|matchMedia|moveTo|moveBy|resizeTo|resizeBy|scroll|scrollTo|scrollBy|requestAnimationFrame|cancelAnimationFrame|requestIdleCallback|cancelIdleCallback|fetch|XMLHttpRequest|WebSocket|indexedDB|localStorage|sessionStorage|crypto|navigator|window|document|location|history|performance|screen|frames|self|top|parent|opener|postMessage|close|blur|focus|process|global|globalThis|require|import|export|eval|Function|constructor|prototype|__proto__|__defineGetter__|__defineSetter__|__lookupGetter__|__lookupSetter__)\s*\(/.test(expression)) {
    return false
  }

  try {
    // 替换 $input 为实际值
    const evalExpression = expression.replace(/\$input/g, JSON.stringify(input))
    
    // 使用 Function 构造器进行安全求值
    const fn = new Function(`"use strict"; return (${evalExpression})`)
    return Boolean(fn())
  } catch {
    return false
  }
}