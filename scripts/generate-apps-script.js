import fs from "fs";
import path from "path";

const auditDir = path.resolve("audit");

function parseCsv(filename) {
  const content = fs.readFileSync(path.join(auditDir, filename), "utf8");
  const lines = content.trim().split(/\r?\n/);
  return lines.map((line) => {
    const result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === "," && !inQuotes) {
        result.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  });
}

const files = [
  {
    name: "01_screens_and_navigation.csv",
    sheetName: "1. Screens & Navigation",
    color: "#1B5E20",
  },
  {
    name: "02_quest_lifecycle_and_contracts.csv",
    sheetName: "2. Lifecycle & Rules",
    color: "#0D47A1",
  },
  {
    name: "03_finance_and_wallet.csv",
    sheetName: "3. Finance & Wallet",
    color: "#E65100",
  },
  {
    name: "04_chat_and_inquiry.csv",
    sheetName: "4. Chat & Inquiries",
    color: "#4A148C",
  },
  {
    name: "05_architecture_and_security.csv",
    sheetName: "5. Architecture & State",
    color: "#006064",
  },
  {
    name: "06_mobile_ui_and_a11y.csv",
    sheetName: "6. UI & Accessibility",
    color: "#3E2723",
  },
  {
    name: "KUQUEST_MOBILE_MASTER_AUDIT.csv",
    sheetName: "Master Audit Checklist",
    color: "#263238",
  },
];

const parsedSheets = files.map((f) => ({
  sheetName: f.sheetName,
  color: f.color,
  data: parseCsv(f.name),
}));

const scriptContent = `/**
 * KUQuest Mobile — Google Sheets Audit Workbook Setup
 *
 * HOW TO USE:
 * 1. Create a blank Google Sheet (go to https://sheets.new)
 * 2. Click "Extensions" > "Apps Script"
 * 3. Replace all code in the script editor with this file's content
 * 4. Click "Run" (choose createAuditSheets function)
 * 5. Return to the Google Sheet — all sheets, headers, colors, data, and formulas are ready!
 */

function createAuditSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Dashboard Sheet
  let dash = ss.getSheetByName('Audit Summary');
  if (!dash) {
    dash = ss.insertSheet('Audit Summary', 0);
  }
  dash.clear();
  dash.setTabColor('#1A73E8');
  
  // Title
  dash.getRange('A1:E1').merge()
    .setValue('KUQUEST MOBILE — SYSTEM AUDIT & VERIFICATION MATRIX')
    .setFontSize(16)
    .setFontWeight('bold')
    .setBackground('#1A73E8')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  dash.setRowHeight(1, 45);
  
  dash.getRange('A2:E2').merge()
    .setValue('Authority: docs/rulebook/, docs/adr/, CONTEXT.md | Target: Expo SDK 57 / React Native 0.86')
    .setFontSize(10)
    .setFontColor('#5F6368')
    .setHorizontalAlignment('center');
  dash.setRowHeight(2, 25);
  
  // KPI table
  const kpiHeaders = [['Audit Category / Sheet', 'Total Items', 'Passed', 'Failed / Blocked', 'Pending Smoke']];
  dash.getRange('A4:E4').setValues(kpiHeaders)
    .setFontWeight('bold')
    .setBackground('#E8F0FE')
    .setFontColor('#174EA6')
    .setBorder(true, true, true, true, true, true);
    
  const kpiRows = [
    ["1. Screens & Navigation", "=COUNTA('1. Screens & Navigation'!A2:A)", "=COUNTIF('1. Screens & Navigation'!I2:I, \\"PASS\\")", "=COUNTIF('1. Screens & Navigation'!I2:I, \\"FAIL\\")", "=COUNTIF('1. Screens & Navigation'!I2:I, \\"PENDING\\")"],
    ["2. Lifecycle & Rules", "=COUNTA('2. Lifecycle & Rules'!A2:A)", "=COUNTIF('2. Lifecycle & Rules'!H2:H, \\"PASS\\")", "=COUNTIF('2. Lifecycle & Rules'!H2:H, \\"FAIL\\")", "=COUNTIF('2. Lifecycle & Rules'!H2:H, \\"PENDING\\")"],
    ["3. Finance & Wallet", "=COUNTA('3. Finance & Wallet'!A2:A)", "=COUNTIF('3. Finance & Wallet'!H2:H, \\"PASS\\")", "=COUNTIF('3. Finance & Wallet'!H2:H, \\"FAIL\\")", "=COUNTIF('3. Finance & Wallet'!H2:H, \\"PENDING\\")"],
    ["4. Chat & Inquiries", "=COUNTA('4. Chat & Inquiries'!A2:A)", "=COUNTIF('4. Chat & Inquiries'!H2:H, \\"PASS\\")", "=COUNTIF('4. Chat & Inquiries'!H2:H, \\"FAIL\\")", "=COUNTIF('4. Chat & Inquiries'!H2:H, \\"PENDING\\")"],
    ["5. Architecture & State", "=COUNTA('5. Architecture & State'!A2:A)", "=COUNTIF('5. Architecture & State'!H2:H, \\"PASS\\")", "=COUNTIF('5. Architecture & State'!H2:H, \\"FAIL\\")", "=COUNTIF('5. Architecture & State'!H2:H, \\"PENDING\\")"],
    ["6. UI & Accessibility", "=COUNTA('6. UI & Accessibility'!A2:A)", "=COUNTIF('6. UI & Accessibility'!H2:H, \\"PASS\\")", "=COUNTIF('6. UI & Accessibility'!H2:H, \\"FAIL\\")", "=COUNTIF('6. UI & Accessibility'!H2:H, \\"PENDING\\")"],
    ["TOTAL MASTER ITEMS", "=SUM(B5:B10)", "=SUM(C5:C10)", "=SUM(D5:D10)", "=SUM(E5:E10)"]
  ];
  
  dash.getRange('A5:E11').setValues(kpiRows)
    .setBorder(true, true, true, true, true, true);
  dash.getRange('A11:E11').setFontWeight('bold').setBackground('#F1F3F4');
  
  dash.setColumnWidth(1, 240);
  dash.setColumnWidth(2, 120);
  dash.setColumnWidth(3, 100);
  dash.setColumnWidth(4, 130);
  dash.setColumnWidth(5, 130);

  // Sheets data
  const sheetsData = ${JSON.stringify(parsedSheets, null, 2)};
  
  for (let s = 0; s < sheetsData.length; s++) {
    const item = sheetsData[s];
    let sheet = ss.getSheetByName(item.sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(item.sheetName);
    }
    sheet.clear();
    sheet.setTabColor(item.color);
    
    const rows = item.data;
    if (!rows || rows.length === 0) continue;
    
    const range = sheet.getRange(1, 1, rows.length, rows[0].length);
    range.setValues(rows);
    
    // Style Header Row
    const headerRange = sheet.getRange(1, 1, 1, rows[0].length);
    headerRange.setBackground(item.color)
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    sheet.setRowHeight(1, 36);
    
    // Freeze Header Row
    sheet.setFrozenRows(1);
    
    // Auto-fit & Wrap
    sheet.getRange(2, 1, rows.length - 1, rows[0].length)
      .setWrap(true)
      .setVerticalAlignment('middle');
      
    // Set column borders
    sheet.getRange(1, 1, rows.length, rows[0].length)
      .setBorder(true, true, true, true, true, true, '#E0E0E0', SpreadsheetApp.BorderStyle.SOLID);
      
    // Add dropdown validation for Pass/Fail column
    const lastColIndex = rows[0].length;
    // Check header for Pass/Fail
    let passCol = -1;
    for (let c = 0; c < rows[0].length; c++) {
      if (rows[0][c].includes('Pass/Fail') || rows[0][c].includes('Audit Status') || rows[0][c].includes('Audit Check')) {
        passCol = c + 1;
        break;
      }
    }
    if (passCol > 0 && rows.length > 1) {
      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['PASS', 'FAIL', 'PENDING', 'N/A'], true)
        .build();
      sheet.getRange(2, passCol, rows.length - 1, 1).setDataValidation(rule);
    }
    
    // Default column widths
    for (let c = 1; c <= rows[0].length; c++) {
      sheet.setColumnWidth(c, 180);
    }
    sheet.setColumnWidth(1, 100);
    if (rows[0].length >= 3) sheet.setColumnWidth(3, 200);
    if (rows[0].length >= 6) sheet.setColumnWidth(6, 280);
  }
  
  // Remove default "Sheet1" if present
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
}
`;

fs.writeFileSync(
  path.join(auditDir, "GoogleSheetsImporter.js"),
  scriptContent,
  "utf8"
);
console.log("Generated audit/GoogleSheetsImporter.js");
