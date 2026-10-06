import {HDate} from '@hebcal/hdate';
import {createDates, makeCalendar, monthOptions} from './calendar.js';
import './install.js';
const $ = id => document.getElementById(id), form = $('form'), today = new HDate(new Date());
for (let d=1;d<=30;d++) $('day').add(new Option(d,d));
for (const [value,name] of monthOptions) $('month').add(new Option(name,value));
$('day').value = today.getDate();
$('month').value = today.getMonth() === 12 && !today.isLeapYear() ? 'adar' : today.getMonth();
$('start').value = today.getFullYear();
$('original').value = today.getFullYear()-1;
const originalYears = {yahrzeit: String(today.getFullYear()-1), birthday: ''};
let previousMode = 'annual';
let events = [], page = 0;
const pageSize = 5, dateFormat = new Intl.DateTimeFormat('en',{month:'long',day:'numeric',year:'numeric'}), weekdayFormat = new Intl.DateTimeFormat('en',{weekday:'short'});
function settings() { const values = Object.fromEntries(new FormData(form)); values.evening = $('evening').checked; return values; }
function paintDates() {
  $('dates').replaceChildren();
  events.slice(page*pageSize,(page+1)*pageSize).forEach((event,i) => {
    const row = document.createElement('div'); row.className = 'date-row';
    const number = document.createElement('span'); number.className = 'date-number'; number.textContent = String(page*pageSize+i+1).padStart(2,'0');
    const text = document.createElement('div'), greg = document.createElement('div'), hebrew = document.createElement('div');
    greg.className = 'greg-date'; greg.textContent = dateFormat.format(event.greg);
    hebrew.className = 'hebrew-date'; hebrew.textContent = event.hd.toString(); text.append(greg,hebrew);
    const weekday = document.createElement('span'); weekday.className = 'weekday'; weekday.textContent = weekdayFormat.format(event.greg);
    row.append(number,text,weekday); $('dates').append(row);
  });
  $('previous').disabled = page === 0; $('next').disabled = (page+1)*pageSize >= events.length;
  $('page-label').textContent = `${page*pageSize+1}–${Math.min((page+1)*pageSize,events.length)} of ${events.length.toLocaleString()}`;
  $('pagination').hidden = !events.length;
}
function refresh() {
  let s = settings();
  if (s.mode !== previousMode) {
    if (previousMode !== 'annual') originalYears[previousMode] = s.original;
    if (s.mode !== 'annual') { $('original').value = originalYears[s.mode]; s = settings(); }
    previousMode = s.mode;
  }
  const isYahrzeit = s.mode === 'yahrzeit', isBirthday = s.mode === 'birthday', needsOriginal = isYahrzeit || isBirthday;
  $('original-field').hidden = !needsOriginal; $('original').required = needsOriginal; $('missing-field').hidden = needsOriginal;
  $('original-label').textContent = isBirthday ? 'Hebrew birth year' : 'Original Hebrew year';
  $('original-hint').textContent = isBirthday ? 'Used for Adar and missing-date rules.' : 'The year of death, used for Yahrzeit calculations.';
  $('original').max = isBirthday ? '13759' : '13758';
  $('title').placeholder = isBirthday ? 'e.g. Sarah’s birthday' : isYahrzeit ? 'e.g. Dad’s Yahrzeit' : 'e.g. Anniversary';
  $('rules').textContent = isBirthday ? 'Birthdays use the original birth year. Missing 30ths move to the 1st of the next month; Adar follows the birth month.' : isYahrzeit ? 'Yahrzeit dates use Hebcal’s rules for Adar and missing dates. Customs can vary; review the dates below.' : 'Adar uses Adar II in leap years. Adar I and Adar II use Adar in common years. Skipped years do not count as repetitions.';
  $('status').textContent = '';
  $('preview-heading').textContent = s.title.trim() || (isBirthday ? 'Birthday' : isYahrzeit ? 'Yahrzeit' : 'Annual date');
  try {
    events = createDates(s); page = 0; $('error').hidden = true; $('download').disabled = false;
    const first = events[0], last = events.at(-1);
    $('hebrew-label').textContent = first.hd.render('he-x-NoNikud');
    $('preview-summary').textContent = `${events.length.toLocaleString()} ${events.length===1?'reminder':'reminders'} · ${first.hd.getFullYear()}${events.length>1 ? `–${last.hd.getFullYear()}` : ''} · ${s.evening?'Two-day':'All-day'} events`;
    document.querySelector('.sunset-note p').textContent = s.evening ? 'Each event includes the preceding evening’s civil date and the Hebrew daytime date. Exact sunset times depend on your location.' : 'Hebrew dates begin at sunset the evening before. Events mark the daytime date.';
    paintDates();
  } catch (error) {
    events = []; $('error').textContent = error.message; $('error').hidden = false; $('download').disabled = true;
    $('hebrew-label').textContent = ''; $('preview-summary').textContent = 'Adjust the date to see your upcoming reminders.'; paintDates();
  }
}
form.addEventListener('input',refresh); form.addEventListener('change',refresh);
form.addEventListener('submit',event => {
  event.preventDefault();
  try {
    const s = settings(), calculated = createDates(s), blob = new Blob([makeCalendar(s, calculated)],{type:'text/calendar;charset=utf-8'});
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href=url;
    a.download = `${(s.title.trim() || 'hebrew-date').replace(/[^\p{L}\p{N}_-]+/gu,'-').slice(0,80) || 'hebrew-date'}.ics`;
    document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),10000);
    $('status').textContent = `Downloaded ${calculated.length.toLocaleString()} events.`;
  } catch(error) { $('error').textContent=error.message; $('error').hidden=false; }
});
$('previous').addEventListener('click',()=>{if(page>0){page--;paintDates();}});
$('next').addEventListener('click',()=>{if((page+1)*pageSize<events.length){page++;paintDates();}});
try { $('theme').value=localStorage.getItem('hebrew-date-theme') || 'system'; } catch {}
$('theme').addEventListener('change',()=>{
  const theme=$('theme').value;
  if(theme==='system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme=theme;
  try { localStorage.setItem('hebrew-date-theme',theme); } catch {}
});
refresh();
