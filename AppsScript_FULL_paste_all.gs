/**
 * Google Apps Script - POS Integration Backend for Bokeo Airport POS
 */

// Handle POST request from POS App
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'upload_invoice') {
      const fileId = savePdfToDrive(data);
      let sheetError = null;
      try {
        saveTransactionToSheet(data.transaction);
      } catch (err) {
        sheetError = err.toString();
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        fileId: fileId,
        sheetError: sheetError
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (action === 'log_transaction') {
      // บันทึก transaction ลง Sheet อย่างเดียว (ไม่ต้องมี PDF)
      let sheetError = null;
      try {
        saveTransactionToSheet(data.transaction);
      } catch (err) {
        sheetError = err.toString();
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: !sheetError,
        sheetError: sheetError
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (action === 'delete_transaction') {
      let delError = null, deleted = false;
      try {
        deleted = deleteTransactionFromSheet(data.id);
      } catch (err) {
        delError = err.toString();
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: !delError, deleted: deleted, error: delError
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (action === 'sync_petty_cash') {
      savePettyCashToSheet(data.session);
      return ContentService.createTextOutput(JSON.stringify({
        success: true
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (action === 'update_stock' || action === 'update_sales') {
      const result = updateStockSheet(data.code, data.addedQty || data.qty, action);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'register_member') {
      const result = registerMember(data.member);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'upload_product_image') {
      const result = uploadProductImage(data);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Invalid action: ' + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET request (For direct sheet data exports)
function doGet(e) {
  const sheetParam = e.parameter.sheet;
  const GOODS_SPREADSHEET_ID = '1K3_qyglY9K_DXw9aSOHZWj8wanQwFjX2THaf1Rprojg';

  let ssGoods;
  try {
    ssGoods = SpreadsheetApp.openById(GOODS_SPREADSHEET_ID);
  } catch (err) {
    Logger.log('Failed to open goods spreadsheet in doGet: ' + err.toString());
    ssGoods = SpreadsheetApp.getActiveSpreadsheet();
  }

  if (sheetParam === 'prices') {
    const sheet = ssGoods.getSheetByName('ລາຄາສິນຄ້າ');
    if (!sheet) return ContentService.createTextOutput('Error: sheet ລາຄາສິນຄ້າ not found');
    const data = sheet.getDataRange().getDisplayValues();
    const csv = convertToCSV(data);
    return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.TEXT);

  } else if (sheetParam === 'stock') {
    const sheet = ssGoods.getSheetByName('ສະຕັອກສິນຄ້າລ່າສຸດ');
    if (!sheet) return ContentService.createTextOutput('Error: sheet ສະຕັອກສິນຄ້າລ່າສຸດ not found');
    const data = sheet.getDataRange().getDisplayValues();
    const csv = convertToCSV(data);
    return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.TEXT);

  } else if (sheetParam === 'petty_cash') {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PettyCash');
    if (!sheet) return ContentService.createTextOutput('Error: sheet PettyCash not found');
    const data = sheet.getDataRange().getDisplayValues();
    const csv = convertToCSV(data);
    return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.TEXT);
  } else if (sheetParam === 'members') {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Members');
    if (!sheet) return ContentService.createTextOutput('Error: sheet Members not found');
    const data = sheet.getDataRange().getDisplayValues();
    const csv = convertToCSV(data);
    return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.TEXT);
  } else if (sheetParam === 'sales') {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sales');
    if (!sheet) return ContentService.createTextOutput('Error: sheet Sales not found');
    const data = sheet.getDataRange().getDisplayValues();
    const csv = convertToCSV(data);
    return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.TEXT);
  } else if (sheetParam === 'cashiers') {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cashiers');
    if (!sheet) return ContentService.createTextOutput('Error: sheet Cashiers not found');
    const data = sheet.getDataRange().getDisplayValues();
    const csv = convertToCSV(data);
    return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.TEXT);
  } else if (sheetParam === 'qr') {
    // Read QR images from the shared Drive folder and return name,publicUrl as CSV.
    const QR_FOLDER_ID = '1b1A00EbKj1duThl4wC7J5Kz3CwckDqZa';
    const folder = DriveApp.getFolderById(QR_FOLDER_ID);
    const files = folder.getFiles();
    const rows = [['name', 'url']];
    while (files.hasNext()) {
      const file = files.next();
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      const base = file.getName().replace(/\.[^.]+$/, ''); // strip extension
      rows.push([base, 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w600']);
    }
    return ContentService.createTextOutput(convertToCSV(rows)).setMimeType(ContentService.MimeType.TEXT);
  } else if (sheetParam === 'product_images') {
    // Read product images from the shared Drive folder (file name = product id) -> name,publicUrl CSV.
    const PROD_IMG_FOLDER_ID = '1ghBIq6oshgGBniRBgBcZvFGBVkBjDjAX';
    const folder2 = DriveApp.getFolderById(PROD_IMG_FOLDER_ID);
    const files2 = folder2.getFiles();
    const rows2 = [['name', 'url']];
    while (files2.hasNext()) {
      const file2 = files2.next();
      file2.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      const base2 = file2.getName().replace(/\.[^.]+$/, '');
      rows2.push([base2, 'https://drive.google.com/thumbnail?id=' + file2.getId() + '&sz=w400']);
    }
    return ContentService.createTextOutput(convertToCSV(rows2)).setMimeType(ContentService.MimeType.TEXT);
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Bokeo Airport POS Apps Script API active'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Convert 2D array to CSV string
function convertToCSV(data) {
  return data.map(row => {
    return row.map(val => {
      let str = val === null ? '' : val.toString();
      if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
        str = '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }).join(',');
  }).join('\n');
}

// Save transaction PDF invoice to Google Drive
function savePdfToDrive(data) {
  try {
    let base64Data = data.file;
    if (base64Data.indexOf('base64,') !== -1) {
      base64Data = base64Data.split('base64,')[1];
    }
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'application/pdf', data.filename.split('/').pop());

    let rootFolder;
    if (data.folderId) {
      try {
        rootFolder = DriveApp.getFolderById(data.folderId);
      } catch (err) {
        Logger.log('Could not find folder by ID, using folder name: ' + err.toString());
      }
    }

    if (!rootFolder) {
      const rootFolders = DriveApp.getFoldersByName('Bokeo_Receipts');
      if (rootFolders.hasNext()) {
        rootFolder = rootFolders.next();
      } else {
        rootFolder = DriveApp.createFolder('Bokeo_Receipts');
      }
    }

    // Parse directories from filename (e.g., YYYY-MM-DD/POS_Name/Payment_Type/File.pdf)
    const pathParts = data.filename.split('/');
    let currentFolder = rootFolder;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!part) continue;
      const subFolders = currentFolder.getFoldersByName(part);
      if (subFolders.hasNext()) {
        currentFolder = subFolders.next();
      } else {
        currentFolder = currentFolder.createFolder(part);
      }
    }

    const file = currentFolder.createFile(blob);
    return file.getId();
  } catch (err) {
    Logger.log('Failed to save PDF to Drive: ' + err.toString());
    throw err;
  }
}

// Save transaction metadata to "Sales" tab
function deleteTransactionFromSheet(txId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Sales');
  if (!sheet) return false;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === String(txId)) {
      sheet.deleteRow(i + 2);
      return true;
    }
  }
  return false;
}

function saveTransactionToSheet(tx) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Sales');

  if (!sheet) {
    sheet = ss.insertSheet('Sales');
    sheet.appendRow([
      'เลขบิล (Invoice No)',             // A
      'วันที่ & เวลา (Timestamp)',        // B
      'จุดขาย (POS)',                   // C
      'พนักงาน (Cashier)',              // D
      'รายการสินค้า (Items)',             // E
      'ประเภทการชำระ (Payment Type)',     // F
      'ธนาคาร (Bank)',                  // G
      'สกุลเงินที่จ่าย (Paid Currency)',   // H
      'ยอดจ่าย (Paid Amount)',          // I
      'เงินทอน (Change)',               // J
      'ยอดรวม กีบ (Subtotal LAK)',       // K
      'ยอดรวม บาท (Subtotal THB)',       // L
      'ยอดรวม หยวน (Subtotal CNY)',      // M
      'ส่วนลด % (Discount %)',          // N
      'ส่วนลด กีบ (Discount LAK)',       // O
      'อากร % (VAT %)',                 // P
      'อากร กีบ (VAT LAK)',              // Q
      'ยอดสุทธิ กีบ (Total LAK)',         // R
      'ยอดสุทธิ บาท (Total THB)',         // S
      'ยอดสุทธิ หยวน (Total CNY)',        // T
      'ต้นทุน กีบ (Cost LAK)',           // U
      'ต้นทุน บาท (Cost THB)',           // V
      'ต้นทุน หยวน (Cost CNY)',          // W
      'กำไร กีบ (Profit LAK)',           // X
      'กำไร บาท (Profit THB)',           // Y
      'กำไร หยวน (Profit CNY)',          // Z
      'ລະຫັດສະມາຊິກ (Member ID)',       // AA
      'ຄະແນນທີ່ໄດ້ຮັບ (Earned Points)'     // AB
    ]);
    sheet.getRange('A1:AB1').setFontWeight('bold').setBackground('#cfe2f3').setHorizontalAlignment('center');
  }

  // กันบันทึกซ้ำ: ถ้า invoice id นี้มีในคอลัมน์ A แล้ว ให้ข้าม (idempotent)
  const _lastRow = sheet.getLastRow();
  if (_lastRow > 1) {
    const _ids = sheet.getRange(2, 1, _lastRow - 1, 1).getValues();
    for (let _i = 0; _i < _ids.length; _i++) {
      if (String(_ids[_i][0]) === String(tx.id)) return;
    }
  }

  const itemsSummary = tx.items.map(item => `${item.name_lo} (${item.qty} ${item.qty > 1 ? 'items' : 'item'})`).join(', ');

  sheet.appendRow([
    tx.id,                                     // A
    formatDateTime(new Date(tx.timestamp)),    // B
    tx.pos,                                    // C
    tx.cashier,                                // D
    itemsSummary,                              // E
    tx.payment_type,                           // F
    tx.bank || '-',                            // G
    tx.paid_currency,                          // H
    tx.paid_amount,                            // I
    tx.change_amount,                          // J
    tx.subtotal_lak,                           // K
    tx.subtotal_thb,                           // L
    tx.subtotal_cny,                           // M
    tx.discount_percent || 0,                  // N
    tx.discount_amount_lak || 0,               // O
    tx.vat_percent || 0,                       // P
    tx.vat_amount_lak || 0,                    // Q
    tx.total_lak,                              // R
    tx.total_thb,                              // S
    tx.total_cny,                              // T
    tx.cost_lak || 0,                          // U
    tx.cost_thb || 0,                          // V
    tx.cost_cny || 0,                          // W
    tx.profit_lak || 0,                        // X
    tx.profit_thb || 0,                        // Y
    tx.profit_cny || 0,                        // Z
    tx.member_id || '-',                       // AA
    tx.earned_points || 0                      // AB
  ]);

  // If a member is associated, update their points
  if (tx.member_id && tx.member_id !== '-') {
    updateMemberPoints(tx.member_id, tx.earned_points || 0);
  }
}

// Save petty cash session data to "PettyCash" tab
function savePettyCashToSheet(session) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('PettyCash');

  if (!sheet) {
    sheet = ss.insertSheet('PettyCash');
    sheet.appendRow([
      'ວັນທີ (Date)',
      'ຈຸດຂາຍ (POS Outlets)',
      'ພະນັກງານ (Cashier)',
      'ເງິນທອນເລີ່ມຕົ້ນ LAK',
      'ເງິນທອນເລີ່ມຕົ້ນ THB',
      'ເງິນທອນເລີ່ມຕົ້ນ CNY',
      'ເງິນໃນລີ້ນຊັກຄົງເຫຼືອ LAK',
      'ເງິນໃນລີ້ນຊັກຄົງເຫຼືອ THB',
      'ເງິນໃນລີ້ນຊັກຄົງເຫຼືອ CNY',
      'Drawer CNY End',
      'Session ID',
      'Closed'
    ]);
    sheet.getRange('A1:L1').setFontWeight('bold').setBackground('#d9ead3').setHorizontalAlignment('center');
  }

  const data = sheet.getDataRange().getValues();
  let foundRow = -1;

  for (let i = 1; i < data.length; i++) {
    // Check key in column K (index 10)
    if (data[i][10] && data[i][10].toString().trim() === session.id.toString().trim()) {
      foundRow = i + 1;
      break;
    }
  }

  const rowData = [
    session.date,
    session.pos,
    session.cashier,
    session.lak_start,
    session.thb_start,
    session.cny_start,
    session.lak_remaining,
    session.thb_remaining,
    session.cny_remaining,
    session.cny_remaining, // Drawer CNY End matches Remaining CNY
    session.id,
    session.closed ? 'TRUE' : 'FALSE'
  ];

  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

// Update stock sheet restocks and sales in "goods and price" spreadsheet
function updateStockSheet(code, qty, action) {
  const GOODS_SPREADSHEET_ID = '1K3_qyglY9K_DXw9aSOHZWj8wanQwFjX2THaf1Rprojg';
  let ss;
  try {
    ss = SpreadsheetApp.openById(GOODS_SPREADSHEET_ID);
  } catch (err) {
    Logger.log('Failed to open goods spreadsheet by ID: ' + err.toString());
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  const sheet = ss.getSheetByName('ສະຕັອກສິນຄ້າລ່າສຸດ');
  if (!sheet) return { success: false, error: 'Sheet ສະຕັອກສິນຄ້າລ່າສຸດ not found in goods spreadsheet' };

  const data = sheet.getDataRange().getValues();
  let foundRow = -1;

  for (let i = 4; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim() === code.toString().trim()) {
      foundRow = i + 1; // 1-based row index
      break;
    }
  }

  if (foundRow === -1) {
    return { success: false, error: 'Product ID not found in stock sheet: ' + code };
  }

  if (action === 'update_stock') {
    // เติมสต๊อก: บวกเข้า column H (เพิ่มสะต๊อกเข้า)
    const currentRestock = parseFloat(sheet.getRange(foundRow, 8).getValue() || 0);
    const newH = currentRestock + qty;
    sheet.getRange(foundRow, 8).setValue(newH);                       // H เพิ่มเข้า
    // คำนวณ column I (จำนวนรวมใหม่) = G (จำนวนรวมหลังขาย) + H อัตโนมัติ
    const gStock = parseFloat(sheet.getRange(foundRow, 7).getValue() || 0);
    sheet.getRange(foundRow, 9).setValue(gStock + newH);             // I รวมใหม่
    // บันทึกวันที่เพิ่มเข้าล่าสุด column J
    sheet.getRange(foundRow, 10).setValue(formatDate(new Date()));   // J หมายเหตุ (วันที่)
  } else if (action === 'update_sales') {
    // ขาย: บวกเข้า column F (ขายออก)
    const currentSales = parseFloat(sheet.getRange(foundRow, 6).getValue() || 0);
    const newF = currentSales + qty;
    sheet.getRange(foundRow, 6).setValue(newF);                      // F ขายออก
    // คำนวณ G (จำนวนรวมหลังขาย) = E - F และ I = G + H อัตโนมัติ
    const eStart = parseFloat(sheet.getRange(foundRow, 5).getValue() || 0);
    const newG = eStart - newF;
    sheet.getRange(foundRow, 7).setValue(newG);                      // G รวมหลังขาย
    const hAdd = parseFloat(sheet.getRange(foundRow, 8).getValue() || 0);
    sheet.getRange(foundRow, 9).setValue(newG + hAdd);              // I รวมใหม่
  }

  return { success: true };
}

// Format Date: DD/MM/YYYY
function formatDate(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// Format DateTime: YYYY-MM-DD HH:mm:ss
function formatDateTime(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

// Register a new member and auto-generate ID starting from BF0001
function registerMember(member) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Members');

  if (!sheet) {
    sheet = ss.insertSheet('Members');
    sheet.appendRow([
      'ລະຫັດສະມາຊິກ (Member ID)',       // A
      'ຊື່ (First Name)',                // B
      'ນາມສະກຸນ (Surname)',              // C
      'ເບີໂທ (Phone)',                  // D
      'ອີເມວ (Email)',                  // E
      'ຄະແນນສະສົມ (Points)',             // F
      'ວັນທີລົງທະບຽນ (Date Registered)'  // G
    ]);
    sheet.getRange('A1:G1').setFontWeight('bold').setBackground('#d1c4e9').setHorizontalAlignment('center');
  }

  const data = sheet.getDataRange().getValues();
  let nextId = 'BF0001';

  if (data.length > 1) {
    let maxNum = 0;
    for (let i = 1; i < data.length; i++) {
      const idStr = data[i][0] ? data[i][0].toString().trim() : '';
      if (idStr.startsWith('BF')) {
        const num = parseInt(idStr.substring(2)) || 0;
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = maxNum + 1;
    nextId = 'BF' + String(nextNum).padStart(4, '0');
  }

  const todayStr = formatDate(new Date());
  const rowData = [
    nextId,
    member.name,
    member.surname,
    member.phone,
    member.email || '-',
    0, // starting points
    todayStr
  ];

  sheet.appendRow(rowData);

  return {
    success: true,
    member: {
      id: nextId,
      name: member.name,
      surname: member.surname,
      phone: member.phone,
      email: member.email || '-',
      points: 0,
      date_registered: todayStr
    }
  };
}

// Update member points inside Google Sheets
function updateMemberPoints(memberId, earnedPoints) {
  if (!memberId || memberId === '-') return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Members');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  let foundRow = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim() === memberId.toString().trim()) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow !== -1) {
    const currentPoints = parseFloat(sheet.getRange(foundRow, 6).getValue() || 0);
    sheet.getRange(foundRow, 6).setValue(currentPoints + earnedPoints);
  }
}

// Upload a product image to Google Drive and return a public thumbnail URL
// (called by POS when a product photo is added; stores only a small URL on the product)
function uploadProductImage(data) {
  const FOLDER_ID = '1ghBIq6oshgGBniRBgBcZvFGBVkBjDjAX'; // product image folder
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const name = (data.productId || 'img') + '.jpg';

  // Remove any previous image for this product so the folder stays clean
  const old = folder.getFilesByName(name);
  while (old.hasNext()) old.next().setTrashed(true);

  let base64Data = data.file;
  if (base64Data.indexOf('base64,') !== -1) {
    base64Data = base64Data.split('base64,')[1];
  }
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), data.mime || 'image/jpeg', name);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const id = file.getId();
  return {
    success: true,
    fileId: id,
    url: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w400'
  };
}
