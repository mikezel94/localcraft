/**
 * Framework-free cron parsing: five-field expressions → plain language +
 * upcoming runs. All date handling is local time; no I/O, no DOM.
 */

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface CronFieldSpec {
  label: string;
  min: number;
  max: number;
  /** Month and weekday names resolve 1-based (Jan = 1) and 0-based (Sun = 0). */
  names?: string[];
  oneBasedNames?: boolean;
}

export const CRON_FIELDS: CronFieldSpec[] = [
  { label: 'minute', min: 0, max: 59 },
  { label: 'hour', min: 0, max: 23 },
  { label: 'day of month', min: 1, max: 31 },
  { label: 'month', min: 1, max: 12, names: MONTH_NAMES, oneBasedNames: true },
  { label: 'day of week', min: 0, max: 6, names: DAY_NAMES },
];

export function parseCronField(spec: string, field: CronFieldSpec): number[] {
  const values = new Set<number>();
  for (const part of spec.split(',')) {
    const [rangePart, stepPart] = part.split('/');
    const step = stepPart ? parseInt(stepPart, 10) : 1;
    if (!Number.isFinite(step) || step < 1) throw new Error(`Bad step in “${part}”`);
    let start = field.min;
    let end = field.max;
    if (rangePart !== '*' && rangePart !== '') {
      const [fromRaw, toRaw] = rangePart.split('-');
      const resolve = (raw: string | undefined): number => {
        if (!raw) throw new Error(`Bad range in “${part}”`);
        if (field.names) {
          const index = field.names.findIndex((n) => n.toLowerCase().startsWith(raw.toLowerCase().slice(0, 3)));
          if (index !== -1) return field.oneBasedNames ? index + 1 : index;
        }
        const parsed = parseInt(raw, 10);
        if (!Number.isFinite(parsed)) throw new Error(`Bad value “${raw}”`);
        return parsed;
      };
      start = resolve(fromRaw);
      end = toRaw ? resolve(toRaw) : rangePart.includes('-') ? field.max : start;
    }
    if (start < field.min || end > field.max || start > end) throw new Error(`“${part}” is out of range for ${field.label}`);
    for (let v = start; v <= end; v += step) values.add(v);
  }
  return [...values].sort((a, b) => a - b);
}

export function describeCronSet(values: number[], field: CronFieldSpec): string {
  if (values.length === field.max - field.min + 1) return 'every ' + field.label;
  const render = (v: number) => (field.names ? field.names[field.oneBasedNames ? v - 1 : v]! : String(v));
  if (values.length === 1) return render(values[0]!);
  // Compress runs of consecutive numbers into ranges.
  const parts: string[] = [];
  let runStart = values[0]!;
  for (let i = 1; i <= values.length; i++) {
    const prev = values[i - 1]!;
    const current = values[i];
    if (current !== prev + 1) {
      parts.push(runStart === prev ? render(runStart) : `${render(runStart)}–${render(prev)}`);
      runStart = current!;
    }
  }
  return parts.join(', ');
}

export function describeCron(fields: string[]): string {
  const sets = CRON_FIELDS.map((field, i) => ({ field, values: parseCronField(fields[i]!, field) }));
  const [minute, hour, dom, month, dow] = sets.map((s) => ({ values: s!.values, field: s!.field }));
  if (minute!.values.length > 1 || hour!.values.length > 1) {
    return `Runs at minute ${describeCronSet(minute!.values, minute!.field)} of ${describeCronSet(hour!.values, hour!.field)}`;
  }
  const time = `at ${String(hour!.values[0]).padStart(2, '0')}:${String(minute!.values[0]).padStart(2, '0')}`;
  let out = `Runs ${time}`;
  if (dom!.values.length !== CRON_FIELDS[2]!.max - CRON_FIELDS[2]!.min + 1) {
    out += ` on day ${describeCronSet(dom!.values, dom!.field)} of ${describeCronSet(month!.values, month!.field)}`;
  }
  if (dow!.values.length !== 7) out += `${dom!.values.length !== 31 ? ',' : ' and'} on ${describeCronSet(dow!.values, dow!.field)}`;
  if (dom!.values.length === 31 && dow!.values.length === 7) out += ` every day`;
  return out;
}

export function nextCronRuns(fields: string[], count = 5): Date[] {
  const sets = CRON_FIELDS.map((field, i) => new Set(parseCronField(fields[i]!, field)));
  const [minutes, hours, doms, months, dows] = sets;
  const results: Date[] = [];
  const cursor = new Date();
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);
  const horizon = new Date(cursor.getTime() + 366 * 86400000);
  while (results.length < count && cursor < horizon) {
    if (
      months!.has(cursor.getMonth() + 1) &&
      doms!.has(cursor.getDate()) &&
      dows!.has(cursor.getDay()) &&
      hours!.has(cursor.getHours()) &&
      minutes!.has(cursor.getMinutes())
    ) {
      results.push(new Date(cursor));
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return results;
}
