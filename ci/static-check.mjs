#!/usr/bin/env node
/**
 * 静态前端检查：HTML 骨架、CSS 存在、main.js 语法、无框架/CDN。
 * 成功 exit 0，失败 exit 1；行输出供日志阅读。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function ok(msg) {
  console.log(`✅ ${msg}`);
}
function bad(msg) {
  console.log(`❌ ${msg}`);
  failures.push(msg);
}

const htmlPath = path.join(root, 'index.html');
const cssPath = path.join(root, 'css', 'style.css');
const jsPath = path.join(root, 'js', 'main.js');

if (!fs.existsSync(htmlPath)) bad('缺少 index.html');
else {
  const html = fs.readFileSync(htmlPath, 'utf8');
  for (const id of ['display-main', 'display-sub', 'keyboard', 'history-panel', 'history-list']) {
    if (html.includes(`id="${id}"`)) ok(`HTML 含 #${id}`);
    else bad(`HTML 缺少 #${id}`);
  }
  if (/href=["']css\/style\.css["']/.test(html)) ok('HTML 引用 css/style.css');
  else bad('HTML 未引用 css/style.css');
  if (/src=["']js\/main\.js["']/.test(html)) ok('HTML 引用 js/main.js');
  else bad('HTML 未引用 js/main.js');
  if (/<script[^>]+src=["']https?:\/\//i.test(html)) bad('HTML 引入了外部 script CDN');
  else ok('HTML 无外部 script CDN');
}

if (!fs.existsSync(cssPath)) bad('缺少 css/style.css');
else {
  const css = fs.readFileSync(cssPath, 'utf8');
  if (css.trim().length < 20) bad('css/style.css 内容过短');
  else ok(`css/style.css 存在（${css.length} 字节）`);
  for (const sel of ['.display__main', '.keyboard', '.history-panel']) {
    if (css.includes(sel)) ok(`CSS 含 ${sel}`);
    else bad(`CSS 缺少 ${sel}`);
  }
}

if (!fs.existsSync(jsPath)) bad('缺少 js/main.js');
else {
  const js = fs.readFileSync(jsPath, 'utf8');
  const syn = spawnSync(process.execPath, ['--check', jsPath], { encoding: 'utf8' });
  if (syn.status === 0) ok('js/main.js 语法通过（node --check）');
  else bad(`js/main.js 语法失败：${(syn.stderr || syn.stdout || '').trim()}`);

  if (/\bimport\s+|require\s*\(|from\s+['"][^'"]+['"]/.test(js)) {
    bad('js/main.js 出现 import/require（训练场要求原生单文件）');
  } else {
    ok('js/main.js 无 import/require');
  }
  if (/https?:\/\/cdn\.|unpkg\.com|jsdelivr\.net/i.test(js)) {
    bad('js/main.js 疑似引用 CDN');
  } else {
    ok('js/main.js 无 CDN 痕迹');
  }
}

if (failures.length) {
  console.error(`\n静态检查失败 ${failures.length} 项`);
  process.exit(1);
}
console.log('\n静态检查全部通过');
