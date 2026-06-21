/**
 * The Fresh Cup — Google Apps Script Backend
 *
 * Deploy as Web App (Execute as: Me, Access: Anyone) and paste the URL
 * into the React app's Settings > API URL field, or set VITE_API_URL.
 *
 * Sheets expected in the bound spreadsheet (auto-created on first run):
 *   Staff:       id | name | pin | role | active
 *   Categories:  id | name | icon | display_order | active
 *   Products:    id | name | category_id | price | image_url | available
 *   Bills:       bill_id | datetime | staff_id | subtotal | payment_mode
 *   BillItems:   bill_id | product_id | product_name | qty | unit_price | line_total
 *   Settings:    key | value
 */

const SHEETS = {
  Staff:      ['id','name','pin','role','active'],
  Categories: ['id','name','icon','display_order','active'],
  Products:   ['id','name','category_id','price','image_url','available'],
  Bills:      ['bill_id','datetime','staff_id','subtotal','payment_mode'],
  BillItems:  ['bill_id','product_id','product_name','qty','unit_price','line_total'],
  Settings:   ['key','value']
};

/**
 * One-time setup — run this manually from the Apps Script editor.
 * Creates all 6 sheets with headers and seeds sample data.
 */
function setup() {
  ensureSheets_();
  SpreadsheetApp.getActiveSpreadsheet().toast('Setup complete — 6 sheets ready.', 'Fresh Cup', 5);
}

function doGet(e)  { return handle_(e, 'GET'); }
function doPost(e) { return handle_(e, 'POST'); }

function handle_(e, method) {
  ensureSheets_();
  e = e || {};
  let body = {};
  try {
    if (e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);
  } catch (err) {}
  const params = e.parameter || {};
  const action = (body.action || params.action || '').toString();
  try {
    let result;
    switch (action) {
      case 'ping':           result = { ok: true, ts: new Date().toISOString() }; break;
      case 'getAll':         result = getAll_(); break;
      case 'upsertCategory': result = upsertRow_('Categories', body.row); break;
      case 'deleteCategory': result = deleteRow_('Categories', body.id); break;
      case 'upsertProduct':  result = upsertRow_('Products', body.row); break;
      case 'deleteProduct':  result = deleteRow_('Products', body.id); break;
      case 'upsertStaff':    result = upsertRow_('Staff', body.row); break;
      case 'deleteStaff':    result = deleteRow_('Staff', body.id); break;
      case 'saveBill':       result = saveBill_(body.bill, body.items); break;
      case 'saveBillBatch':  result = saveBillBatch_(body.batch || []); break;
      case 'getBills':       result = getBills_(body.from, body.to); break;
      case 'getSettings':    result = getSettings_(); break;
      case 'updateSetting':  result = updateSetting_(body.key, body.value); break;
      default: return json_({ ok: false, error: 'Unknown action: ' + action });
    }
    return json_({ ok: true, data: result });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const headers = SHEETS[name];
    const firstRow = sh.getRange(1,1,1,headers.length).getValues()[0];
    const empty = firstRow.every(c => c === '' || c === null);
    if (empty) sh.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold');
  });
  seedIfEmpty_();
}

function seedIfEmpty_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const staffSh = ss.getSheetByName('Staff');
  if (staffSh.getLastRow() < 2) {
    staffSh.getRange(2,1,3,5).setValues([
      ['admin','Owner','1234','admin',true],
      ['staff-1','Ramesh','1111','cashier',true],
      ['staff-2','Suresh','2222','cashier',true]
    ]);
  }
  const catSh = ss.getSheetByName('Categories');
  if (catSh.getLastRow() < 2) {
    catSh.getRange(2,1,3,5).setValues([
      ['cat-milkshake','Milkshakes','🥤',1,true],
      ['cat-juice','Fresh Juices','🧃',2,true],
      ['cat-burger','Burgers','🍔',3,true]
    ]);
  }
  const prodSh = ss.getSheetByName('Products');
  if (prodSh.getLastRow() < 2) {
    prodSh.getRange(2,1,9,6).setValues([
      ['p-mango-shake','Mango Milkshake','cat-milkshake',120,'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400',true],
      ['p-choco-shake','Chocolate Milkshake','cat-milkshake',130,'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400',true],
      ['p-straw-shake','Strawberry Milkshake','cat-milkshake',130,'https://images.unsplash.com/photo-1638176067000-9e2a282406a6?w=400',true],
      ['p-papaya-juice','Papaya Juice','cat-juice',70,'https://images.unsplash.com/photo-1546173159-315724a31696?w=400',true],
      ['p-watermelon-juice','Watermelon Juice','cat-juice',70,'https://images.unsplash.com/photo-1527102298867-1bb3c3a45ddd?w=400',true],
      ['p-orange-juice','Orange Juice','cat-juice',80,'https://images.unsplash.com/photo-1600271886742-f049b9d23fcc?w=400',true],
      ['p-veg-burger','Veg Burger','cat-burger',90,'https://images.unsplash.com/photo-1550317138-10000687a72b?w=400',true],
      ['p-cheese-burger','Cheese Burger','cat-burger',110,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',true],
      ['p-paneer-burger','Paneer Burger','cat-burger',120,'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',true]
    ]);
  }
  const settingsSh = ss.getSheetByName('Settings');
  if (settingsSh.getLastRow() < 2) {
    settingsSh.getRange(2,1,3,2).setValues([
      ['cafe_name','The Fresh Cup'],
      ['currency','₹'],
      ['receipt_footer','Thank you for visiting!\nVisit again at The Fresh Cup']
    ]);
  }
}

function readAll_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(name);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const headers = SHEETS[name];
  const values = sh.getRange(2,1,last-1,headers.length).getValues();
  return values.map(r => {
    const obj = {};
    headers.forEach((h,i) => obj[h] = r[i]);
    return obj;
  });
}

function getAll_() {
  return {
    staff:      readAll_('Staff'),
    categories: readAll_('Categories'),
    products:   readAll_('Products'),
    settings:   readAll_('Settings')
  };
}

function upsertRow_(name, row) {
  if (!row || !row.id) throw new Error('Missing row.id');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(name);
  const headers = SHEETS[name];
  const last = sh.getLastRow();
  const ids = last < 2 ? [] : sh.getRange(2,1,last-1,1).getValues().map(r => r[0]);
  const idx = ids.indexOf(row.id);
  const rowArr = headers.map(h => row[h] !== undefined ? row[h] : '');
  if (idx === -1) sh.appendRow(rowArr);
  else sh.getRange(2 + idx, 1, 1, headers.length).setValues([rowArr]);
  return row;
}

function deleteRow_(name, id) {
  if (!id) throw new Error('Missing id');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(name);
  const last = sh.getLastRow();
  if (last < 2) return { deleted: 0 };
  const ids = sh.getRange(2,1,last-1,1).getValues().map(r => r[0]);
  const idx = ids.indexOf(id);
  if (idx === -1) return { deleted: 0 };
  sh.deleteRow(2 + idx);
  return { deleted: 1 };
}

function saveBill_(bill, items) {
  if (!bill || !bill.bill_id) throw new Error('Missing bill_id');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const billsSh = ss.getSheetByName('Bills');
  billsSh.appendRow([bill.bill_id, bill.datetime, bill.staff_id, bill.subtotal, bill.payment_mode]);
  if (items && items.length) {
    const itemsSh = ss.getSheetByName('BillItems');
    const rows = items.map(it => [bill.bill_id, it.product_id, it.product_name, it.qty, it.unit_price, it.line_total]);
    itemsSh.getRange(itemsSh.getLastRow() + 1, 1, rows.length, 6).setValues(rows);
  }
  return { bill_id: bill.bill_id };
}

function saveBillBatch_(batch) {
  const saved = [];
  batch.forEach(b => {
    try {
      saveBill_(b.bill, b.items);
      saved.push(b.bill.bill_id);
    } catch (err) {}
  });
  return { saved };
}

function getBills_(from, to) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const billsSh = ss.getSheetByName('Bills');
  const itemsSh = ss.getSheetByName('BillItems');
  const bills = readAll_('Bills');
  const items = readAll_('BillItems');
  const fromTs = from ? new Date(from).getTime() : 0;
  const toTs   = to   ? new Date(to).getTime()   : Date.now() + 86400000;
  const filtered = bills.filter(b => {
    const ts = new Date(b.datetime).getTime();
    return ts >= fromTs && ts <= toTs;
  });
  const ids = new Set(filtered.map(b => b.bill_id));
  const filteredItems = items.filter(it => ids.has(it.bill_id));
  return { bills: filtered, items: filteredItems };
}

function getSettings_() {
  const rows = readAll_('Settings');
  const obj = {};
  rows.forEach(r => obj[r.key] = r.value);
  return obj;
}

function updateSetting_(key, value) {
  if (!key) throw new Error('Missing key');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName('Settings');
  const last = sh.getLastRow();
  const keys = last < 2 ? [] : sh.getRange(2,1,last-1,1).getValues().map(r => r[0]);
  const idx = keys.indexOf(key);
  if (idx === -1) sh.appendRow([key, value]);
  else sh.getRange(2 + idx, 2).setValue(value);
  return { key, value };
}
