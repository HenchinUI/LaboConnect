// scripts/parse_sql_dump.js
// Simple parser for plain PostgreSQL SQL dumps to extract CREATE TABLE blocks
// Usage: node scripts/parse_sql_dump.js path/to/dump.sql

const fs = require('fs');
const path = require('path');

function normalizeName(raw) {
  if (!raw) return raw;
  return raw.replace(/^\s*"?([^"\.]+)"?\.?"?([^\"]+)"?\s*$/,'$1.$2').replace(/"/g,'').trim();
}

function parseCreateTableBlocks(sql) {
  const blocks = [];
  // Match CREATE TABLE ... ( ... ); including schema-qualified names
  const re = /CREATE\s+TABLE\s+([\w\."]+)\s*\(([^;]*?)\)\s*;/gims;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const rawName = m[1].trim();
    const body = m[2].trim();
    const tableName = rawName.replace(/\s+/g,' ');
    blocks.push({ name: tableName, body });
  }
  return blocks;
}

function parseColumns(body) {
  // split by commas, but naive splitting may break for commas inside parentheses (e.g., numeric(10,2))
  // We'll parse line-by-line to be safer: split on newlines and then join lines belonging to same column
  const lines = body.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const cols = [];
  let cur = '';
  for (let line of lines) {
    // Remove trailing comma for easier handling (we'll treat commas as separators)
    const hasTrailingComma = line.endsWith(',');
    const clean = hasTrailingComma ? line.slice(0, -1).trim() : line;
    // If line starts with CONSTRAINT or PRIMARY KEY or UNIQUE or FOREIGN KEY, treat as table-level constraint
    if (/^(CONSTRAINT|PRIMARY\s+KEY|UNIQUE|FOREIGN\s+KEY|CHECK)\b/i.test(clean)) {
      cols.push({ __constraint: clean });
      continue;
    }
    // If line begins with double-quoted or word, assume column definition
    if (/^[\"\w]/.test(clean)) {
      cols.push({ __col: clean });
      continue;
    }
    // otherwise append to previous
    if (cols.length && cols[cols.length-1].__col) {
      cols[cols.length-1].__col += ' ' + clean;
    } else {
      cols.push({ __col: clean });
    }
  }

  const parsed = { columns: [], constraints: [] };
  for (const item of cols) {
    if (item.__constraint) {
      parsed.constraints.push(item.__constraint);
      continue;
    }
    const def = item.__col;
    // column name is first token (possibly double-quoted)
    const colNameMatch = def.match(/^\s*"?([^"]+)"?\s+(.*)$/s);
    if (!colNameMatch) {
      parsed.constraints.push(def);
      continue;
    }
    const col = { name: colNameMatch[1] };
    let rest = colNameMatch[2].trim();
    // type is first token or token with parentheses (e.g., numeric(10,2))
    const typeMatch = rest.match(/^([a-z0-9_]+(?:\s*\([^\)]+\))?)(.*)$/i);
    if (typeMatch) {
      col.type = typeMatch[1].trim();
      rest = typeMatch[2].trim();
    } else {
      // fallback: take first word
      const w = rest.split(/\s+/)[0]; col.type = w; rest = rest.slice(w.length).trim();
    }
    col.raw = rest;
    // detect nullability
    col.nullable = !/NOT\s+NULL/i.test(rest);
    const defaultMatch = rest.match(/DEFAULT\s+([^\s,]+)/i);
    col.default = defaultMatch ? defaultMatch[1] : null;
    // detect primary key inline
    col.primary = /PRIMARY\s+KEY/i.test(rest);
    // detect unique
    col.unique = /UNIQUE/i.test(rest);
    parsed.columns.push(col);
  }
  return parsed;
}

function parseAlterForeignKeys(sql) {
  const fks = [];
  const re = /ALTER\s+TABLE\s+([\w\."]+)\s+ADD\s+(CONSTRAINT\s+([\w\"]+)\s+)?FOREIGN\s+KEY\s*\(([^\)]+)\)\s+REFERENCES\s+([\w\."]+)\s*\(([^\)]+)\)/gims;
  let m;
  while ((m = re.exec(sql)) !== null) {
    fks.push({ table: m[1].trim(), constraint: m[3] ? m[3].trim() : null, columns: m[4].trim(), references: m[5].trim() + '(' + m[6].trim() + ')' });
  }
  return fks;
}

function prettyPrintSummary(summary) {
  for (const t of summary) {
    console.log('\nTABLE:', t.name);
    if (t.comment) console.log('  COMMENT:', t.comment);
    if (t.columns && t.columns.length) {
      for (const c of t.columns) {
        console.log(`  - ${c.name}: ${c.type}${c.primary ? ' PRIMARY KEY' : ''}${c.unique ? ' UNIQUE' : ''}${c.nullable ? '' : ' NOT NULL'}${c.default ? ' DEFAULT ' + c.default : ''}${c.raw ? ' // ' + c.raw : ''}`);
      }
    }
    if (t.constraints && t.constraints.length) {
      console.log('  Table constraints:');
      for (const con of t.constraints) console.log('   -', con);
    }
  }
}

async function main() {
  const fileArg = process.argv[2] || 'dump.sql';
  const filePath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(2);
  }
  const sql = fs.readFileSync(filePath, 'utf8');
  const blocks = parseCreateTableBlocks(sql);
  const alters = parseAlterForeignKeys(sql);
  const summary = [];
  for (const b of blocks) {
    const tblName = b.name.replace(/\s+/g,' ');
    const parsed = parseColumns(b.body);
    summary.push({ name: tblName, columns: parsed.columns, constraints: parsed.constraints });
  }
  // try to attach FK info
  for (const fk of alters) {
    // find table in summary
    const idx = summary.findIndex(s => s.name.toLowerCase().includes(fk.table.replace(/"/g,'').toLowerCase()));
    if (idx >= 0) {
      summary[idx].constraints = summary[idx].constraints || [];
      summary[idx].constraints.push(`FK ${fk.constraint || ''}: ${fk.columns} -> ${fk.references}`);
    }
  }

  prettyPrintSummary(summary);
  console.log('\nFound', blocks.length, 'CREATE TABLE statements and', alters.length, 'ALTER TABLE FK statements.');
}

main();
