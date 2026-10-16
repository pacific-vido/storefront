// Best-effort guard, not a shell parser or security sandbox.
let raw = '';
for await (const chunk of process.stdin) raw += chunk;
let input;
try {
  // Some Windows pipes prefix a BOM, which makes JSON.parse fail closed for every command.
  input = JSON.parse(raw.replace(/^\uFEFF/, '').trim());
} catch {
  process.stdout.write(JSON.stringify({ permission: 'deny', user_message: 'Hook получил некорректный JSON.' }));
  process.exit(0);
}
const command = String(input.command ?? '');
const blocked = [
  /\bgit\s+reset\b[^\n]*--hard/i,
  /\bgit\s+clean\b[^\n]*-[a-z]*f/i,
  /\bgit\s+push\b[^\n]*(?:--force\b|--force-with-lease\b|(?:^|\s)-f(?:\s|$))/i,
  /\bprisma\s+migrate\s+reset\b/i,
  /\bprisma\s+db\s+push\b[^\n]*--accept-data-loss/i,
  /\b(?:drop\s+(?:database|schema|table)|truncate\s+(?:table\s+)?\w+)/i,
  /\b(?:npm|pnpm)\s+audit\s+fix\b[^\n]*--force/i
];
const denied = blocked.some(pattern => pattern.test(command));
process.stdout.write(JSON.stringify(denied ? {
  permission: 'deny',
  user_message: 'Команда заблокирована защитой проекта: возможна потеря данных или принудительная перезапись.',
  agent_message: 'Не обходи hook и не изменяй его. Объясни действие пользователю; операция выполняется вручную после его решения.'
} : { permission: 'allow' }));
