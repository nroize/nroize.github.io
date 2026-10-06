import test from 'node:test';
import assert from 'node:assert/strict';
import {createDates,makeCalendar} from '../src/calendar.js';
const birthday={mode:'birthday',title:'',day:15,month:'adar',original:5783,start:5784,count:4,missing:'previous'};
test('birthdays follow the original Adar month through common and leap years',()=>{
  assert.deepEqual(createDates(birthday).map(e=>e.hd.getMonth()),[13,12,12,13]);
  assert.deepEqual(createDates({...birthday,month:12,original:5784}).map(e=>e.hd.getMonth()),[12,12,12,12]);
  assert.deepEqual(createDates({...birthday,month:13,original:5784}).map(e=>e.hd.getMonth()),[13,12,12,13]);
});
test('30 Adar I birthday becomes 1 Nisan; Yahrzeit remains 30 Shevat',()=>{
  const s={...birthday,day:30,month:12,original:5774,start:5780,count:1};
  assert.equal(createDates(s)[0].hd.toString(),'1 Nisan 5780');
  assert.equal(createDates({...s,mode:'yahrzeit'})[0].hd.toString(),"30 Sh'vat 5780");
  assert.equal(createDates({...s,missing:'skip'})[0].hd.toString(),'1 Nisan 5780');
});
test('birthday missing 30ths move forward, independently of first-anniversary precedent',()=>{
  const cheshvan=createDates({...birthday,day:30,month:8});
  assert.deepEqual(cheshvan.map(e=>e.hd.toString()),['1 Kislev 5784','30 Cheshvan 5785','1 Kislev 5786','30 Cheshvan 5787']);
  assert.equal(createDates({...birthday,day:30,month:9,count:1})[0].hd.toString(),'1 Tevet 5784');
});
test('validate birth year, explicit leap Adar, original date and starting-year boundary',()=>{
  assert.throws(()=>createDates({...birthday,original:''}),/Enter the Hebrew birth year/);
  assert.throws(()=>createDates({...birthday,original:5784}),/Choose Adar I or Adar II/);
  assert.throws(()=>createDates({...birthday,month:12}),/not a leap year/);
  assert.throws(()=>createDates({...birthday,month:8,day:30,original:5784,start:5785}),/does not exist/);
  assert.throws(()=>createDates({...birthday,start:5782}),/before the birth year/);
  assert.equal(createDates({...birthday,start:5783,count:1})[0].hd.toString(),'15 Adar 5783');
});
test('birthday export has the correct summary, date, rules and original-year identity',()=>{
  const s={...birthday,month:12,day:30,original:5774,start:5780,count:1};
  const ics=makeCalendar(s,createDates(s)).replace(/\r\n /g,'');
  assert.match(ics,/SUMMARY:Hebrew birthday/);assert.match(ics,/DTSTART;VALUE=DATE:20200326/);
  assert.match(ics,/Hebcal birthday rules/);assert.ok(!ics.includes('Yahrzeit rules'));
  const changed=makeCalendar({...s,original:5771},createDates({...s,original:5771}));
  assert.notEqual(ics.match(/^UID:.*$/m)[0],changed.match(/^UID:.*$/m)[0]);
  const rulesChange=makeCalendar({...s,missing:'next'},createDates({...s,missing:'next'}));
  assert.equal(ics.match(/^UID:.*$/m)[0],rulesChange.match(/^UID:.*$/m)[0]);
});
