const displayMain = document.getElementById('display-main');
const displaySub = document.getElementById('display-sub');
const keyboard = document.getElementById('keyboard');

// 新增：获取历史记录列表容器
const historyList = document.getElementById('history-list');

/**
 * 加法：把两个数相加。
 * @param {number} a 加数
 * @param {number} b 被加数
 * @returns {number} 两数之和
 */
function add(a, b) {
  return a + b;
}

// ---------------------------------------------------------------
// 计算状态
// ---------------------------------------------------------------

const INITIAL = '0'; // 初始值
const ERROR_TEXT = '错误'; // 非法运算（如除以 0）时主屏显示的内容

let text = INITIAL; // 主屏当前显示的数字串（种子已有）
let acc = null; // 左操作数：按下运算符的那一刻冻结下来
let pendingOp = null; // 待执行的运算符，null 表示没有
let waiting = false; // 刚按过运算符或等号：下一个数字要另起一个数，不是接着拼

/** 把主屏的 text 刷到显示区。 */
function show() {
  displayMain.textContent = text;
}

/** 把算式刷到副屏。 */
function showSub(line) {
  displaySub.textContent = line || '';
}

function isError() {
  return text === ERROR_TEXT;
}

/** 清掉计算状态，但不动主屏（供出错与 C 键复用）。 */
function clearState() {
  acc = null;
  pendingOp = null;
  waiting = false;
}

// ---------------------------------------------------------------
// 运算符
// ---------------------------------------------------------------

// 顺序计算，不做优先级：2 + 3 × 4 = 先算 2+3 再乘 4，得 20
const OPERATORS = {
  '+': add,
  '−': (a, b) => a - b,
  '×': (a, b) => a * b,
  '÷': (a, b) => a / b,
};

/**
 * 把计算结果转成能显示的字符串。
 * 浮点误差用 12 位有效数字收敛：0.1 + 0.2 显示 0.3，而不是 0.30000000000000004。
 * 整数原样保留，避免大整数被削掉有效位。
 * @param {number} n 计算结果
 * @returns {string} 可直接显示的字符串
 */
function formatResult(n) {
  if (!Number.isFinite(n)) {
    return ERROR_TEXT;
  }
  if (Number.isInteger(n)) {
    return String(n);
  }
  return String(Number(n.toPrecision(12)));
}

/**
 * 执行一次 pendingOp：用主屏当前的数当右操作数。
 * 成功时把结果写回 acc；结果非法（除零、溢出）则进入错误态。
 * @returns {boolean} 是否算出了合法结果
 */
function applyPending() {
  const right = Number(text);
  const result = OPERATORS[pendingOp](acc, right);
  const shown = formatResult(result);

  if (shown === ERROR_TEXT) {
    text = ERROR_TEXT;
    clearState();
    showSub('');
    show();
    return false;
  }

  acc = result;
  return true;
}

// ---------------------------------------------------------------
// 按键行为
// ---------------------------------------------------------------

/** 数字键：拼接到主屏；刚按过运算符/等号则另起一个数。 */
function inputDigit(digit) {
  if (isError()) {
    text = INITIAL;
  }
  if (waiting) {
    text = digit;
    waiting = false;
  } else {
    text = text === INITIAL ? digit : text + digit;
  }
  show();
}

/** 小数点键：一个数里最多一个小数点；新起一个数时从 0. 开始。 */
function inputDecimal() {
  if (isError()) {
    text = INITIAL;
  }
  if (waiting) {
    text = `${INITIAL}.`;
    waiting = false;
  } else if (!text.includes('.')) {
    text = text === INITIAL ? `${INITIAL}.` : `${text}.`;
  }
  show();
}

/** 运算符键：冻结左操作数；已有待执行的运算时先算出中间结果。 */
function inputOperator(op) {
  if (isError()) {
    return;
  }

  if (pendingOp !== null) {
    // 连按运算符：只换运算符，不重复计算（1 + × 2 = 得 2）
    if (waiting) {
      pendingOp = op;
      showSub(`${formatResult(acc)} ${op}`);
      return;
    }
    // 已经 a op b 了，再按运算符：先算中间结果，再接着算（1 + 2 + 3 = 得 6）
    if (!applyPending()) {
      return;
    }
    text = formatResult(acc);
    show();
  } else {
    acc = Number(text);
  }

  pendingOp = op;
  waiting = true;
  showSub(`${formatResult(acc)} ${op}`);
}

/** 等号键：算出结果并把整条算式留在副屏。 */
function inputEquals() {
  if (isError() || pendingOp === null) {
    return;
  }

  const line = `${formatResult(acc)} ${pendingOp} ${text} =`;
  
  // 保存旧值用于历史记录
  const oldText = text;

  if (!applyPending()) {
    return;
  }

  text = formatResult(acc);
  
  // =========================================
  // 新增：记录历史
  // =========================================
  if (historyList) {
    const li = document.createElement('li');
    li.textContent = `${formatResult(acc)} ${pendingOp} ${oldText} = ${text}`;
    historyList.appendChild(li);
    historyList.scrollTop = historyList.scrollHeight;
  }
  // =========================================

  clearState();
  waiting = true; // 求值后：按数字开新一轮，按运算符接着用这个结果算
  showSub(line);
  show();
}

/** 退格键：只编辑正在输入的数字，不改动待输入状态、计算结果或错误。 */
function inputBackspace() {
  if (waiting || isError()) {
    return;
  }

  text = text.slice(0, -1) || INITIAL;
  show();
}

/** CE 键：清除当前输入，保留待执行的运算。 */
function inputClearEntry() {
  text = INITIAL;
  waiting = false;

  if (pendingOp === null) {
    acc = null;
    showSub('');
  } else {
    showSub(`${formatResult(acc)} ${pendingOp}`);
  }

  show();
}

/** 平方根键：对当前显示的数开平方；负数进入错误态。 */
function inputSqrt() {
  if (isError()) {
    return;
  }

  const value = Number(text);
  if (value < 0) {
    text = ERROR_TEXT;
    clearState();
    showSub('');
    show();
    return;
  }

  text = formatResult(Math.sqrt(value));
  show();
}

/** C 键：全部清零。 */
function inputClear() {
  text = INITIAL;
  clearState();
  showSub('');
  show();
}

// ---------------------------------------------------------------
// 括号表达式模式（#43 新增）：按 ( 进入，主屏改为输入整条算式，= 求值
// ---------------------------------------------------------------

let exprMode = false; // 是否正在输入括号表达式
let expr = ''; // 表达式原文（运算符用 − × ÷，与按键文字一致）

/**
 * 解析并计算一条算式，支持 + − × ÷、括号嵌套与一元正负号。
 * 优先级：括号 > × ÷ > + −；同级从左到右（8 ÷ 4 ÷ 2 = 1）。
 * 任何不合法的写法（括号不匹配、3(4+5)、空表达式等）直接抛错，由调用方提示。
 * @param {string} src 算式字符串
 * @returns {number} 计算结果
 */
function evaluateExpression(src) {
  // 词法分析：把字符串切成 数字 / 运算符 / 左括号 / 右括号 四类记号
  const tokens = [];
  for (let i = 0; i < src.length; ) {
    const ch = src[i];
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let j = i + 1;
      while (j < src.length && ((src[j] >= '0' && src[j] <= '9') || src[j] === '.')) {
        j++;
      }
      const num = Number(src.slice(i, j));
      if (!Number.isFinite(num)) {
        throw new Error('数字写法不对');
      }
      tokens.push({ type: 'num', value: num });
      i = j;
    } else if (ch === '+' || ch === '−' || ch === '×' || ch === '÷') {
      tokens.push({ type: 'op', value: ch });
      i++;
    } else if (ch === '(') {
      tokens.push({ type: 'lparen' });
      i++;
    } else if (ch === ')') {
      tokens.push({ type: 'rparen' });
      i++;
    } else {
      throw new Error('出现非法字符');
    }
  }

  // 语法分析：递归下降。expr 管 + −，term 管 × ÷，factor 管数/括号/正负号
  let pos = 0;
  const peek = () => tokens[pos];

  function parseExpr() {
    let v = parseTerm();
    while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '−')) {
      const op = tokens[pos++].value;
      const r = parseTerm();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }

  function parseTerm() {
    let v = parseFactor();
    while (peek() && peek().type === 'op' && (peek().value === '×' || peek().value === '÷')) {
      const op = tokens[pos++].value;
      const r = parseFactor();
      v = op === '×' ? v * r : v / r; // ÷0 得 Infinity/NaN，交给 formatResult 判错
    }
    return v;
  }

  function parseFactor() {
    const t = peek();
    if (!t) {
      throw new Error('算式到结尾还缺内容');
    }
    if (t.type === 'op' && (t.value === '+' || t.value === '−')) {
      // 一元正负号，如 −3+5
      pos++;
      const v = parseFactor();
      return t.value === '+' ? v : -v;
    }
    if (t.type === 'lparen') {
      pos++;
      const v = parseExpr();
      if (!peek() || peek().type !== 'rparen') {
        throw new Error('括号不匹配');
      }
      pos++;
      return v;
    }
    if (t.type === 'num') {
      pos++;
      return t.value;
    }
    throw new Error('这里的符号不对');
  }

  const result = parseExpr();
  if (pos !== tokens.length) {
    // 如 1+2)、3(4+5)：式子算完了却还剩记号（后者也是不自动补乘号的意思）
    throw new Error('算式有多余部分');
  }
  return result;
}

/** 把表达式刷到主屏；表达式为空时显示占位的 0。 */
function showExpr() {
  displayMain.textContent = expr === '' ? INITIAL : expr;
}

/** 副屏闪现一条错误提示，2 秒后自动消失；期间出现的新提示优先。 */
let exprErrorSeq = 0;
function flashExprError(msg) {
  showSub(msg);
  const stamp = ++exprErrorSeq;
  setTimeout(() => {
    if (stamp === exprErrorSeq) {
      showSub('');
    }
  }, 2000);
}

/** 括号模式下的等号：解析求值；成功则退出括号模式并保留挂起运算。 */
function exprEquals() {
  if (expr === '') {
    return; // 什么都没输：不动作，对齐 inputEquals 的空守卫
  }

  let value;
  try {
    value = evaluateExpression(expr);
  } catch (e) {
    flashExprError(`表达式错误：${e.message}`); // 括号不匹配等：副屏提示，算式保留可改
    return;
  }

  const shown = formatResult(value);
  if (shown === ERROR_TEXT) {
    // 除零等数学错误：沿用现有约定，主屏进错误态、状态全清
    exprMode = false;
    expr = '';
    text = ERROR_TEXT;
    clearState();
    showSub('');
    show();
    return;
  }

  const hadPending = pendingOp !== null;
  const written = expr; // 留档用：expr 马上要被清空
  const line = hadPending ? `${formatResult(acc)} ${pendingOp}` : `${written} =`;

  text = shown;
  expr = '';
  exprMode = false;
  if (!hadPending) {
    clearState(); // 无挂起运算时，收尾与 inputEquals 完全一致
  }
  // 有挂起运算时保留 acc 与 pendingOp：结果作为右操作数，再按 = 或运算符继续链式计算
  waiting = true;

  if (historyList && !hadPending) {
    // 独立算式也记入历史面板；链式运算的最终结果由 inputEquals 记
    const li = document.createElement('li');
    li.textContent = `${written} = ${shown}`;
    historyList.appendChild(li);
    historyList.scrollTop = historyList.scrollHeight;
  }
  showSub(line);
  show();
}

/** 括号模式下的按键路由：数字/运算符/括号追加进算式，C 退出模式。 */
function exprKey(kind, label) {
  if (kind === 'equals') {
    exprEquals();
  } else if (kind === 'clear') {
    exprMode = false; // C：退出括号模式并整屏清零
    expr = '';
    inputClear();
  } else if (kind === 'clearEntry') {
    expr = ''; // CE：清空算式，但留在括号模式
    showExpr();
  } else if (kind === 'backspace') {
    expr = expr.slice(0, -1);
    showExpr();
  } else if (kind === 'sqrt') {
    // 平方根在括号模式下暂不开放：忽略按键
  } else {
    // 数字、小数点、运算符、左右括号：原样追加，合法性交给 = 时的解析器
    expr += label;
    showExpr();
  }
}

/**
 * 统一按键分发：界面点击与物理键盘都走这里。
 * 括号模式先把按键交给 exprKey；其余分支与原先的点击处理一一对应，行为不变。
 */
function handleKeyAction(kind, label) {
  if (kind === 'lparen' || kind === 'rparen') {
    if (isError()) {
      return;
    }
    if (kind === 'rparen' && !exprMode) {
      return; // 还没进入括号模式就按 ) ：无事发生
    }
    if (!exprMode) {
      exprMode = true; // 按 ( 进入括号模式，主屏改输整条算式
      expr = '';
      if (pendingOp !== null) {
        showSub(`${formatResult(acc)} ${pendingOp}`); // 挂起运算的上下文留在副屏
      } else {
        showSub('');
      }
    }
  }

  if (exprMode) {
    exprKey(kind, label);
    return;
  }

  if (kind === 'digit') {
    inputDigit(label);
  } else if (kind === 'operator') {
    inputOperator(label);
  } else if (kind === 'decimal') {
    inputDecimal();
  } else if (kind === 'clear') {
    inputClear();
  } else if (kind === 'backspace') {
    inputBackspace();
  } else if (kind === 'clearEntry') {
    inputClearEntry();
  } else if (kind === 'sqrt') {
    inputSqrt();
  } else {
    inputEquals();
  }
}

// ---------------------------------------------------------------
// 键盘渲染：4 列网格，末行放小数点与退格键
// ---------------------------------------------------------------

// 每项：显示文字 + 按键类别（决定配色 class）
const LAYOUT = [
  ['7', 'digit'], ['8', 'digit'], ['9', 'digit'], ['C', 'clear'],
  ['4', 'digit'], ['5', 'digit'], ['6', 'digit'], ['÷', 'operator'],
  ['1', 'digit'], ['2', 'digit'], ['3', 'digit'], ['×', 'operator'],
  ['0', 'digit'], ['−', 'operator'], ['+', 'operator'], ['=', 'equals'],
  ['.', 'decimal'], ['⌫', 'backspace'], ['CE', 'clearEntry'], ['√', 'sqrt'],
  ['(', 'lparen'], [')', 'rparen'], // #43 新增：末行整行放左右括号
];

// 类别 → 样式类（沿用 seed 里预留好的四个配色类）
const KEY_CLASS = {
  digit: 'key--normal',
  operator: 'key--action',
  clear: 'key--danger',
  equals: 'key--success',
  decimal: 'key--normal',
  backspace: 'key--action',
  clearEntry: 'key--danger',
  sqrt: 'key--action',
  lparen: 'key--action', // #43 新增
  rparen: 'key--action',
};

LAYOUT.forEach(([label, kind]) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `key ${KEY_CLASS[kind]}`;
  if (kind === 'lparen' || kind === 'rparen') {
    button.classList.add('key--wide'); // 括号键各占两列，末行正好排满
  }
  button.textContent = label;
  button.addEventListener('click', () => {
    handleKeyAction(kind, label); // 分发逻辑统一收口到 handleKeyAction（原 if/else 链原样搬移）
  });
  keyboard.appendChild(button);
});

show();

// ---------------------------------------------------------------
// 物理键盘（#43 新增）：数字/运算符/括号直接输入，Enter 求值，Esc 清屏
// ---------------------------------------------------------------

document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return; // 不抢浏览器与系统快捷键（Ctrl+R、DevTools 等）
  }

  let kind = null;
  let label = event.key;

  if (event.key >= '0' && event.key <= '9') {
    kind = 'digit';
  } else if (event.key === '.') {
    kind = 'decimal';
  } else if (event.key === '+') {
    kind = 'operator';
  } else if (event.key === '-') {
    kind = 'operator';
    label = '−'; // 键盘的 - 映射成界面用的全角减号
  } else if (event.key === '*') {
    kind = 'operator';
    label = '×';
  } else if (event.key === '/') {
    kind = 'operator';
    label = '÷';
  } else if (event.key === '(') {
    kind = 'lparen';
  } else if (event.key === ')') {
    kind = 'rparen';
  } else if (event.key === 'Enter' || event.key === '=') {
    kind = 'equals';
  } else if (event.key === 'Backspace') {
    kind = 'backspace';
  } else if (event.key === 'Escape') {
    kind = 'clear';
  } else {
    return; // 其余按键一律放行
  }

  event.preventDefault(); // 拦下 / 触发的快速搜索、Enter 误触焦点按钮等默认行为
  handleKeyAction(kind, label);
});