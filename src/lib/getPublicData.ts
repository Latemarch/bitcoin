import fs from 'fs';
import path from 'path';

export function saveJson(data: any, filename = 'output.json') {
  const filePath = path.join(process.cwd(), 'public', filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function getData(name: string) {
  const filePath = path.join(process.cwd(), 'public', name);
  const file = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(file);
}
