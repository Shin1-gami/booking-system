import fs from 'node:fs/promises';
import path from 'node:path';

const TARGET_EXTENSIONS = new Set(['.js', '.mjs', '.ts', '.tsx', '.json', '.md', '.sql']);
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);

// Таблиця зворотного відображення символів Windows-1251 -> байт
const WIN1251_TO_BYTE = new Map([
  ['Ђ', 0x80], ['Ѓ', 0x81], ['‚', 0x82], ['ѓ', 0x83], ['„', 0x84], ['…', 0x85],
  ['†', 0x86], ['‡', 0x87], ['€', 0x88], ['‰', 0x89], ['Љ', 0x8a], ['‹', 0x8b],
  ['Њ', 0x8c], ['Ќ', 0x8d], ['Ћ', 0x8e], ['Џ', 0x8f], ['ђ', 0x90], ['‘', 0x91],
  ['’', 0x92], ['“', 0x93], ['”', 0x94], ['•', 0x95], ['–', 0x96], ['—', 0x97],
  ['™', 0x99], ['љ', 0x9a], ['›', 0x9b], ['њ', 0x9c], ['ќ', 0x9d], ['ћ', 0x9e],
  ['џ', 0x9f], ['\u00a0', 0xa0], ['Ў', 0xa1], ['ў', 0xa2], ['Ј', 0xa3], ['¤', 0xa4],
  ['Ґ', 0xa5], ['¦', 0xa6], ['§', 0xa7], ['Ё', 0xa8], ['©', 0xa9], ['Є', 0xaa],
  ['«', 0xab], ['¬', 0xac], ['\u00ad', 0xad], ['®', 0xae], ['Ї', 0xaf], ['°', 0xb0],
  ['±', 0xb1], ['І', 0xb2], ['і', 0xb3], ['ґ', 0xb4], ['µ', 0xb5], ['¶', 0xb6],
  ['·', 0xb7], ['ё', 0xb8], ['№', 0xb9], ['є', 0xba], ['»', 0xbb], ['ј', 0xbc],
  ['Ѕ', 0xbd], ['ѕ', 0xbe], ['ї', 0xbf],
]);

for (let i = 0; i < 64; i += 1) {
  WIN1251_TO_BYTE.set(String.fromCharCode(0x0410 + i), 0xc0 + i);
}

const repairMojibake = (text) => {
  if (!/(?:Р[А-Яа-яЁёІіЇїЄєҐґ]|С[А-Яа-яЁёІіЇїЄєҐґ])/.test(text)) {
    return text;
  }

  const bytes = [];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code < 0x80) {
      bytes.push(code);
    } else if (WIN1251_TO_BYTE.has(ch)) {
      bytes.push(WIN1251_TO_BYTE.get(ch));
    } else {
      return text;
    }
  }

  const decoded = Buffer.from(bytes).toString('utf8');
  return decoded.includes('\ufffd') ? text : decoded;
};

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await walk(fullPath);
    } else if (TARGET_EXTENSIONS.has(path.extname(entry.name))) {
      const original = await fs.readFile(fullPath, 'utf8');
      const cleaned = repairMojibake(original.replace(/^\uFEFF/, ''));
      if (cleaned !== original) {
        await fs.writeFile(fullPath, cleaned, 'utf8');
        console.log(`Виправлено кодування: ${fullPath}`);
      }
    }
  }
};

await walk(process.cwd());
console.log('Перевірку та відновлення UTF-8 завершено.');