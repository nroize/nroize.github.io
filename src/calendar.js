import {HDate, daysInMonth, isLeapYear, yahrzeit, birthdayOrAnniversary} from '@hebcal/hdate';
export const monthOptions = [[7,'Tishrei'],[8,'Cheshvan'],[9,'Kislev'],[10,'Tevet'],[11,'Shevat'],['adar','Adar'],[12,'Adar I'],[13,'Adar II'],[1,'Nisan'],[2,'Iyyar'],[3,'Sivan'],[4,'Tamuz'],[5,'Av'],[6,'Elul']];
const integer = (value, label, min, max) => {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) throw new Error(`${label} must be a whole number between ${min.toLocaleString()} and ${max.toLocaleString()}.`);
  return n;
};
export function createDates(settings) {
  const day = integer(settings.day, 'Day', 1, 30);
  const start = integer(settings.start, 'Starting Hebrew year', 3762, 13759);
  const count = integer(settings.count, 'Repetitions', 1, 9999);
  if (!monthOptions.some(([m]) => String(m) === String(settings.month))) throw new Error('Choose a Hebrew month.');
  const mode = settings.mode || 'annual';
  if (!['annual','yahrzeit','birthday'].includes(mode)) throw new Error('Choose an event type.');
  if (!['previous','next','skip'].includes(settings.missing || 'previous')) throw new Error('Choose a missing-date rule.');
  const monthForYear = year => settings.month === 'adar' ? (isLeapYear(year) ? 13 : 12) : Number(settings.month) === 13 && !isLeapYear(year) ? 12 : Number(settings.month);
  let original;
  if (mode !== 'annual') {
    if (mode === 'birthday' && !String(settings.original ?? '').trim()) throw new Error('Enter the Hebrew birth year.');
    const year = integer(settings.original, mode === 'birthday' ? 'Hebrew birth year' : 'Original Hebrew year', 3762, mode === 'birthday' ? 13759 : 13758);
    if (mode === 'yahrzeit' && start <= year) throw new Error('Start Yahrzeit reminders after the original Hebrew year.');
    if (mode === 'birthday' && start < year) throw new Error('The starting Hebrew year cannot be before the birth year.');
    if (mode === 'birthday' && settings.month === 'adar' && isLeapYear(year)) throw new Error('The birth year is a leap year. Choose Adar I or Adar II.');
    if ([12,13].includes(Number(settings.month)) && !isLeapYear(year)) throw new Error('The original year is not a leap year. Choose Adar, or correct the original year.');
    const month = monthForYear(year);
    if (day > daysInMonth(month, year)) throw new Error('That Hebrew date does not exist in the original year.');
    original = new HDate(day, month, year);
  } else {
    const maximum = settings.month === 'adar' || Number(settings.month) === 13 ? 29 : [2,4,6,10].includes(Number(settings.month)) ? 29 : 30;
    if (day > maximum) throw new Error('This month has only 29 days. Choose a day from 1 to 29.');
  }
  const events = [];
  for (let year = start; events.length < count; year++) {
    if (year > 13759) throw new Error('This range exceeds iCalendar’s four-digit Gregorian year limit. Choose fewer repetitions or an earlier starting year.');
    let hd;
    if (original) hd = mode === 'birthday' ? birthdayOrAnniversary(year, original) : yahrzeit(year, original);
    else {
      const month = monthForYear(year), max = daysInMonth(month, year);
      if (day > max && settings.missing === 'skip') continue;
      hd = new HDate(day > max && settings.missing !== 'next' ? max : day, month, year);
    }
    if (!hd) throw new Error('Unable to calculate this anniversary.');
    const greg = hd.greg(), end = hd.add(1, 'day').greg();
    const begin = settings.evening ? hd.subtract(1, 'day').greg() : greg;
    if (begin.getFullYear() < 1 || end.getFullYear() > 9999) throw new Error('This range exceeds iCalendar’s four-digit Gregorian year limit. Choose fewer repetitions or an earlier starting year.');
    events.push({hd, greg, begin, end});
  }
  return events;
}
export function calendarDate(date) {
  return `${String(date.getFullYear()).padStart(4,'0')}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
}
export function escapeText(text) {
  return String(text).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
}
export function foldLine(line) {
  const encoder = new TextEncoder(), lines = [];
  let current = '', length = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (length + size > 75) { lines.push(current); current = ' '; length = 1; }
    current += char; length += size;
  }
  lines.push(current);
  return lines.join('\r\n');
}
function stableId(text) {
  let hash = 2166136261;
  for (const char of new TextEncoder().encode(text)) hash = Math.imul(hash ^ char, 16777619);
  return (hash >>> 0).toString(16);
}
export function makeCalendar(settings, events, now = new Date()) {
  const title = settings.title.trim() || (settings.mode === 'yahrzeit' ? 'Yahrzeit' : settings.mode === 'birthday' ? 'Hebrew birthday' : 'Hebrew anniversary');
  const stamp = now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const series = stableId(JSON.stringify([title,settings.mode,settings.month,Number(settings.day),['yahrzeit','birthday'].includes(settings.mode) ? Number(settings.original) : null, settings.mode === 'birthday' ? null : settings.missing, !!settings.evening]));
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Natanel Roizenman//Hebrew Date//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH',`X-WR-CALNAME:${escapeText(title)}`];
  for (const {hd, begin, end} of events) {
    const description = `${hd.toString()}. The Hebrew day begins at sunset the previous evening.${settings.evening ? ' This all-day event includes that evening’s civil date; it does not specify an exact sunset time.' : ''} ${settings.mode === 'yahrzeit' ? 'Calculated using Hebcal Yahrzeit rules. Customs may vary.' : settings.mode === 'birthday' ? 'Calculated using Hebcal birthday rules.' : 'Annual Hebrew date; leap years and missing days use your selected rules.'}`;
    lines.push('BEGIN:VEVENT',`UID:${series}-${hd.getFullYear()}@hebrew-date.local`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${calendarDate(begin)}`,`DTEND;VALUE=DATE:${calendarDate(end)}`,`SUMMARY:${escapeText(title)}`,`DESCRIPTION:${escapeText(description)}`,'TRANSP:TRANSPARENT','END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
