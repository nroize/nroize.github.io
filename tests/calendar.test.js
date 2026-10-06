import test from 'node:test';
import assert from 'node:assert/strict';
import {createDates,makeCalendar,calendarDate,foldLine,escapeText} from '../src/calendar.js';
const base={day:14,month:'adar',start:5784,count:18,mode:'annual',missing:'previous',title:'Remember'};
test('known Gregorian dates and 18 Hebrew anniversaries',()=>{
  const dates=createDates(base);assert.equal(dates.length,18);assert.equal(calendarDate(dates[0].greg),'20240324');
  for(let i=0;i<18;i++){assert.equal(dates[i].hd.getDate(),14);assert.equal(dates[i].hd.getFullYear(),5784+i);}
  assert.equal(calendarDate(createDates({...base,day:15,month:7,start:5785,count:1})[0].greg),'20241017');
});
test('Adar maps correctly in common and leap years',()=>{
  const dates=createDates({...base,count:4});assert.deepEqual(dates.map(e=>e.hd.getMonth()),[13,12,12,13]);
  assert.equal(createDates({...base,month:12,count:1})[0].hd.getMonth(),12);
  assert.equal(createDates({...base,month:13,start:5785,count:1})[0].hd.getMonth(),12);
});
test('missing 30th can move earlier, later, or skip; skip still yields requested count',()=>{
  const s={...base,day:30,month:8,start:5784,count:3};
  assert.equal(createDates(s)[0].hd.toString(),'29 Cheshvan 5784');
  assert.equal(createDates({...s,missing:'next'})[0].hd.toString(),'1 Kislev 5784');
  const skip=createDates({...s,missing:'skip'});assert.equal(skip.length,3);
  assert.ok(skip.every(e=>e.hd.getDate()===30&&e.hd.getMonth()===8));assert.ok(skip[0].hd.getFullYear()>5784);
});
test('Yahrzeit on 30 Adar I follows observance rules',()=>{
  const dates=createDates({...base,mode:'yahrzeit',original:5774,day:30,month:12,start:5780,count:1});
  assert.equal(dates[0].hd.toString(),"30 Sh'vat 5780");
});
test('Yahrzeit uses first anniversary precedent for variable-length months',()=>{
  const dates=createDates({...base,mode:'yahrzeit',original:5783,day:30,month:8,start:5784,count:4});
  assert.deepEqual(dates.map(e=>e.hd.toString()),['29 Cheshvan 5784','30 Cheshvan 5785','29 Cheshvan 5786','30 Cheshvan 5787']);
});
test('reject invalid dates, year, count and impossible original dates',()=>{
  for(const patch of [{count:0},{count:1.5},{count:''},{count:Infinity},{day:0},{day:31},{month:99},{month:2,day:30},{month:'adar',day:30},{start:1},{start:5784.5}]) assert.throws(()=>createDates({...base,...patch}));
  assert.throws(()=>createDates({...base,mode:'yahrzeit',original:5785,start:5785}));
  assert.throws(()=>createDates({...base,mode:'yahrzeit',original:5785,month:13}));
  assert.throws(()=>createDates({...base,mode:'yahrzeit',original:5784,day:30,month:8,start:5785}));
});
test('large ranges work and iCalendar year overflow is rejected',()=>{
  const dates=createDates({...base,count:2000});assert.equal(dates.length,2000);assert.equal(dates.at(-1).hd.getFullYear(),7783);
  assert.throws(()=>createDates({...base,start:13759,count:18}),/four-digit/);
});
test('all-day end is exclusive and optional evening covers two civil dates',()=>{
  const day=createDates({...base,count:1})[0];assert.equal(calendarDate(day.begin),'20240324');assert.equal(calendarDate(day.end),'20240325');
  const evening=createDates({...base,count:1,evening:true})[0];assert.equal(calendarDate(evening.begin),'20240323');assert.equal(calendarDate(evening.end),'20240325');
});
test('iCalendar output is escaped, folded as UTF-8, stable and timezone-independent',()=>{
  const s={...base,title:'זיכרון, test; \\line\nBEGIN:VEVENT '+ '😀'.repeat(50)};
  const text=makeCalendar(s,createDates(s),new Date('2026-10-06T12:34:56Z'));
  assert.equal(text.match(/^BEGIN:VEVENT\r$/gm).length,18);
  assert.match(text,/DTSTAMP:20261006T123456Z/);assert.match(text,/DTSTART;VALUE=DATE:20240324/);
  assert.ok(!text.includes('RRULE'));assert.ok(text.endsWith('END:VCALENDAR\r\n'));
  assert.ok(!/(^|[^\r])\n/.test(text));
  for(const line of text.split('\r\n')) assert.ok(Buffer.byteLength(line)<=75);
  const unfolded=text.replace(/\r\n /g,'');assert.ok(unfolded.includes(`SUMMARY:${escapeText(s.title)}`));assert.ok(!unfolded.includes('\ufffd'));
  const uids=text.match(/^UID:.*$/gm);assert.equal(new Set(uids).size,18);
  assert.deepEqual(makeCalendar(s,createDates(s)).match(/^UID:.*$/gm),uids);
  const folded=foldLine('SUMMARY:'+ 'שלום😀'.repeat(50));assert.equal(folded.replace(/\r\n /g,''),'SUMMARY:'+ 'שלום😀'.repeat(50));
});
