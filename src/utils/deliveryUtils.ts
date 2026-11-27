import * as XLSX from 'xlsx';
import {
  DelayBucket,
  ItemStatusInfo,
  MaterialCategory,
  ProcessedMaterialItem,
  RawMaterialItem,
} from '../types';
import { DEMO_MATERIAL_ROWS } from '../data/demoData';

export const EXCLUDED_SUPPLIERS = [
  '85106 YKK Lanka (Pvt) Ltd',
  '54502 Tomotex Ltd.',
  '114747 Redmark Asia Limited',
  '54174 JS Textiles(Pvt) Ltd.',
];

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  'Fabric',
  'Lace',
  'Elastic',
  'Other',
];

export const BASIC_MONTH_OPTIONS = [
  { value: 0, label: 'January Basic (Target: Mar 10)' },
  { value: 1, label: 'February Basic (Target: Apr 10)' },
  { value: 2, label: 'March Basic (Target: May 10)' },
  { value: 3, label: 'April Basic (Target: Jun 10)' },
  { value: 4, label: 'May Basic (Target: Jul 10)' },
  { value: 5, label: 'June Basic (Target: Aug 10)' },
  { value: 6, label: 'July Basic (Target: Sep 10)' },
  { value: 7, label: 'August Basic (Target: Oct 10)' },
  { value: 8, label: 'September Basic (Target: Nov 10)' },
  { value: 9, label: 'October Basic (Target: Dec 10)' },
  { value: 10, label: 'November Basic (Target: Jan 10)' },
  { value: 11, label: 'December Basic (Target: Feb 10)' },
];

export function formatLocalDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function findColumnValue(
  row: Record<string, unknown>,
  priorityKeys: string[],
): unknown {
  const keys = Object.keys(row);
  for (const targetKey of priorityKeys) {
    const cleanTarget = targetKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const key of keys) {
      const cleanKey = key
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      if (cleanKey === cleanTarget || cleanKey.includes(cleanTarget)) {
        const val = row[key];
        if (val !== undefined && val !== null && val !== '') {
          return val;
        }
      }
    }
  }
  return '';
}

export function parseExcelDate(val: unknown): Date {
  if (!val) return new Date();
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) return date;
  }
  if (typeof val === 'string') {
    // Handle YYYY-MM-DD cleanly in local time so timezone offsets don't shift dates
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val.trim());
    if (isoMatch) {
      return new Date(
        Number(isoMatch[1]),
        Number(isoMatch[2]) - 1,
        Number(isoMatch[3]),
      );
    }
  }
  const d = new Date(String(val));
  if (!isNaN(d.getTime())) return d;
  return new Date();
}

export function normalizeRowsToMaterialData(
  rows: Record<string, unknown>[],
): RawMaterialItem[] {
  const result: RawMaterialItem[] = [];

  rows.forEach((row, idx) => {
    const supplierRaw = findColumnValue(row, [
      'suppliersupplyingplant',
      'supplyingplant',
      'supplier',
      'vendor',
    ]);
    const supplier = String(supplierRaw || 'Unknown Supplier').trim();

    const materialCodeRaw = findColumnValue(row, [
      'materialcode',
      'material',
      'matitem',
    ]);
    const materialCode = String(materialCodeRaw || 'N/A').trim();

    const poNumberRaw = findColumnValue(row, [
      'purchasingdocument',
      'purchasingdoc',
      'ponumber',
      'po',
    ]);
    const poNumber = String(poNumberRaw || 'N/A').trim();

    const rawQty = findColumnValue(row, [
      'scheduledquantity',
      'scheduledquant',
      'quantity',
      'qty',
    ]);
    let qty = parseFloat(String(rawQty).replace(/,/g, ''));
    if (isNaN(qty)) qty = 0;

    const rawCurr = findColumnValue(row, [
      'currency',
      'curr',
      'doccurrency',
      'ordercurrency',
    ]);
    let curr = String(rawCurr).trim().toUpperCase();
    if (!curr || curr === 'MTR' || curr === 'ST' || curr === 'PCS') {
      curr = 'CNY';
    }

    const rawEta = findColumnValue(row, [
      'deliverydate',
      'deldate',
      'etadate',
      'eta',
      'expecteddate',
    ]);
    const etaDate = parseExcelDate(rawEta);

    const isExcluded = EXCLUDED_SUPPLIERS.some((ex) =>
      supplier.toLowerCase().includes(ex.toLowerCase()),
    );
    if (isExcluded) return;

    result.push({
      id: idx + 1,
      supplier,
      materialCode,
      poNumber,
      qty,
      currency: curr,
      etaDate,
    });
  });

  return result;
}

export function parseExcelFile(file: File): Promise<RawMaterialItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          reject(new Error('Could not read the selected file.'));
          return;
        }
        const data = new Uint8Array(buffer as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          worksheet,
          { defval: '' },
        );

        if (jsonRows.length === 0) {
          reject(new Error('Uploaded Excel file contains no readable rows.'));
          return;
        }

        const normalized = normalizeRowsToMaterialData(jsonRows);
        if (normalized.length === 0) {
          reject(new Error('No valid items found after applying exclusion filters.'));
          return;
        }

        resolve(normalized);
      } catch {
        reject(
          new Error(
            'Error parsing Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.',
          ),
        );
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the uploaded file.'));
    reader.readAsArrayBuffer(file);
  });
}

export function getDemoMaterialData(): RawMaterialItem[] {
  return normalizeRowsToMaterialData(
    DEMO_MATERIAL_ROWS as unknown as Record<string, unknown>[],
  );
}

export function getMaterialCategory(code: string): MaterialCategory {
  if (!code) return 'Other';
  const clean = String(code).trim().toUpperCase();

  if (/^(TY|TF|TU|PI|FO|TS)/i.test(clean) || clean.includes('TS')) {
    return 'Fabric';
  }
  if (/^(BA|BI|BZ)/i.test(clean)) return 'Lace';
  if (/^EL/i.test(clean)) return 'Elastic';

  return 'Other';
}

export function getTargetDeadline(basicMonthIndex: number, year: number): Date {
  const targetMonth = (basicMonthIndex + 2) % 12;
  let targetYear = year;
  if (basicMonthIndex + 2 >= 12) {
    targetYear += 1;
  }
  return new Date(targetYear, targetMonth, 10, 23, 59, 59);
}

export function calculateItemStatus(
  item: RawMaterialItem,
  targetDeadline: Date,
): ItemStatusInfo {
  const isCNY = item.currency === 'CNY';
  const leadDays = isCNY ? 14 : 6;

  const calcArrival = new Date(item.etaDate.getTime());
  calcArrival.setDate(calcArrival.getDate() + leadDays);

  const diffTime = calcArrival.getTime() - targetDeadline.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let bucket: DelayBucket = 'ON_TIME';
  let label = 'On Time';
  let weeksLate = 0;

  if (diffDays > 0) {
    weeksLate = Math.ceil(diffDays / 7);
    if (weeksLate === 1) bucket = '1_WK';
    else if (weeksLate === 2) bucket = '2_WKS';
    else if (weeksLate === 3) bucket = '3_WKS';
    else if (weeksLate === 4) bucket = '4_WKS';
    else bucket = 'MORE_4_WKS';

    label =
      weeksLate > 4
        ? '> 4 Weeks Late'
        : `${weeksLate} Week${weeksLate > 1 ? 's' : ''} Late`;
  }

  return {
    calcArrival,
    leadDays,
    diffDays,
    weeksLate,
    bucket,
    label,
  };
}

export function exportFilteredToExcel(items: ProcessedMaterialItem[]): void {
  const exportRows = items.map((item) => ({
    Supplier: item.supplier,
    'PO Number': item.poNumber,
    'Material Code': item.materialCode,
    Category: item.category,
    'Scheduled Quantity': item.qty,
    Currency: item.currency,
    'ETA Date': formatLocalDateISO(item.etaDate),
    'Calculated Arrival': formatLocalDateISO(item.statusInfo.calcArrival),
    Status: item.statusInfo.label,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Delivery Report');
  XLSX.writeFile(workbook, 'Material_Delivery_Report.xlsx');
}

export function downloadSampleExcelTemplate(): void {
  const worksheet = XLSX.utils.json_to_sheet(DEMO_MATERIAL_ROWS);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Material Data');
  XLSX.writeFile(workbook, 'Sample_Material_Delivery_Data.xlsx');
}
