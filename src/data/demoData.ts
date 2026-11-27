/**
 * Synthetic demo dataset for showcasing the dashboard on GitHub or testing
 * without uploading private/production Excel files.
 *
 * All supplier names, PO numbers, material codes, and quantities below are
 * completely fictional sample records. Material values contain 2-3 words where
 * the first word represents the Father Code.
 */

export interface DemoExcelRow {
  'Supplier/Supplying Plant': string;
  'Purchasing Document': string;
  Material: string;
  'Scheduled Quantity': number;
  Currency: string;
  'Delivery Date': string;
}

export const DEMO_MATERIAL_ROWS: DemoExcelRow[] = [
  // Zenith Fabrics Co. Ltd (CNY - +14 days lead time)
  {
    'Supplier/Supplying Plant': '20104 Zenith Fabrics Co. Ltd',
    'Purchasing Document': '4500192841',
    Material: 'TY44820 BLACK 150CM',
    'Scheduled Quantity': 12500,
    Currency: 'CNY',
    'Delivery Date': '2026-10-20',
  },
  {
    'Supplier/Supplying Plant': '20104 Zenith Fabrics Co. Ltd',
    'Purchasing Document': '4500192842',
    Material: 'TY44820 NAVY 150CM',
    'Scheduled Quantity': 8400,
    Currency: 'CNY',
    'Delivery Date': '2026-11-01',
  },
  {
    'Supplier/Supplying Plant': '20104 Zenith Fabrics Co. Ltd',
    'Purchasing Document': '4500192855',
    Material: 'TF90211 WHITE 160CM',
    'Scheduled Quantity': 6200,
    Currency: 'CNY',
    'Delivery Date': '2026-10-25',
  },
  {
    'Supplier/Supplying Plant': '20104 Zenith Fabrics Co. Ltd',
    'Purchasing Document': '4500192890',
    Material: 'TF90211 GREY 160CM',
    'Scheduled Quantity': 4100,
    Currency: 'CNY',
    'Delivery Date': '2026-11-09',
  },
  {
    'Supplier/Supplying Plant': '20104 Zenith Fabrics Co. Ltd',
    'Purchasing Document': '4500192914',
    Material: 'TS77410 CREAM MESH',
    'Scheduled Quantity': 3300,
    Currency: 'CNY',
    'Delivery Date': '2026-11-29',
  },

  // Apex Lace Mills (CNY + USD mix)
  {
    'Supplier/Supplying Plant': '30412 Apex Lace Mills',
    'Purchasing Document': '4500201105',
    Material: 'BA61204 IVORY LACE',
    'Scheduled Quantity': 9600,
    Currency: 'CNY',
    'Delivery Date': '2026-10-24',
  },
  {
    'Supplier/Supplying Plant': '30412 Apex Lace Mills',
    'Purchasing Document': '4500201122',
    Material: 'BA61204 PINK LACE',
    'Scheduled Quantity': 5400,
    Currency: 'CNY',
    'Delivery Date': '2026-11-02',
  },
  {
    'Supplier/Supplying Plant': '30412 Apex Lace Mills',
    'Purchasing Document': '4500201189',
    Material: 'BZ44102 BLACK TRIM',
    'Scheduled Quantity': 4800,
    Currency: 'CNY',
    'Delivery Date': '2026-11-16',
  },
  {
    'Supplier/Supplying Plant': '30412 Apex Lace Mills',
    'Purchasing Document': '4500201204',
    Material: 'BA61204 RED LACE',
    'Scheduled Quantity': 2900,
    Currency: 'USD',
    'Delivery Date': '2026-11-03',
  },

  // Horizon Elastics (Pvt) Ltd (USD - +6 days lead time)
  {
    'Supplier/Supplying Plant': '40819 Horizon Elastics (Pvt) Ltd',
    'Purchasing Document': '4500310412',
    Material: 'EL22014 BLACK 12MM',
    'Scheduled Quantity': 15200,
    Currency: 'USD',
    'Delivery Date': '2026-10-30',
  },
  {
    'Supplier/Supplying Plant': '40819 Horizon Elastics (Pvt) Ltd',
    'Purchasing Document': '4500310448',
    Material: 'EL22014 WHITE 12MM',
    'Scheduled Quantity': 7800,
    Currency: 'USD',
    'Delivery Date': '2026-11-08',
  },
  {
    'Supplier/Supplying Plant': '40819 Horizon Elastics (Pvt) Ltd',
    'Purchasing Document': '4500310491',
    Material: 'EL22014 NUDE 12MM',
    'Scheduled Quantity': 3900,
    Currency: 'USD',
    'Delivery Date': '2026-11-22',
  },
  {
    'Supplier/Supplying Plant': '40819 Horizon Elastics (Pvt) Ltd',
    'Purchasing Document': '4500310508',
    Material: 'EL22310 NAVY 18MM',
    'Scheduled Quantity': 2100,
    Currency: 'USD',
    'Delivery Date': '2026-12-08',
  },

  // Pacific Trims International (CNY - Other + Fabric)
  {
    'Supplier/Supplying Plant': '51208 Pacific Trims International',
    'Purchasing Document': '4500418020',
    Material: 'TR55100 SILVER HOOK',
    'Scheduled Quantity': 11000,
    Currency: 'CNY',
    'Delivery Date': '2026-10-22',
  },
  {
    'Supplier/Supplying Plant': '51208 Pacific Trims International',
    'Purchasing Document': '4500418044',
    Material: 'TR55100 GOLD HOOK',
    'Scheduled Quantity': 4300,
    Currency: 'CNY',
    'Delivery Date': '2026-11-04',
  },
  {
    'Supplier/Supplying Plant': '51208 Pacific Trims International',
    'Purchasing Document': '4500418099',
    Material: 'PI67820 BLUE INTERLINING',
    'Scheduled Quantity': 5600,
    Currency: 'CNY',
    'Delivery Date': '2026-11-21',
  },
  {
    'Supplier/Supplying Plant': '51208 Pacific Trims International',
    'Purchasing Document': '4500418115',
    Material: 'LB99012 WHITE CARE',
    'Scheduled Quantity': 2500,
    Currency: 'CNY',
    'Delivery Date': '2026-12-05',
  },

  // Continental Textiles Ltd (EUR - +6 days lead time)
  {
    'Supplier/Supplying Plant': '62015 Continental Textiles Ltd',
    'Purchasing Document': '4500529100',
    Material: 'TY80112 OLIVE JERSEY',
    'Scheduled Quantity': 9200,
    Currency: 'EUR',
    'Delivery Date': '2026-11-01',
  },
  {
    'Supplier/Supplying Plant': '62015 Continental Textiles Ltd',
    'Purchasing Document': '4500529145',
    Material: 'TY80112 CHARCOAL JERSEY',
    'Scheduled Quantity': 6700,
    Currency: 'EUR',
    'Delivery Date': '2026-11-12',
  },
  {
    'Supplier/Supplying Plant': '62015 Continental Textiles Ltd',
    'Purchasing Document': '4500529188',
    Material: 'BI51902 IVORY GALLOON',
    'Scheduled Quantity': 3400,
    Currency: 'EUR',
    'Delivery Date': '2026-11-28',
  },

  // Meridian Accessories Supply (USD - +6 days lead time)
  {
    'Supplier/Supplying Plant': '71902 Meridian Accessories Supply',
    'Purchasing Document': '4500640211',
    Material: 'HW33018 BLACK RING',
    'Scheduled Quantity': 6800,
    Currency: 'USD',
    'Delivery Date': '2026-11-02',
  },
  {
    'Supplier/Supplying Plant': '71902 Meridian Accessories Supply',
    'Purchasing Document': '4500640255',
    Material: 'EL91004 GREY STRAP',
    'Scheduled Quantity': 4500,
    Currency: 'USD',
    'Delivery Date': '2026-11-18',
  },
  {
    'Supplier/Supplying Plant': '71902 Meridian Accessories Supply',
    'Purchasing Document': '4500640290',
    Material: 'HW33018 CLEAR SLIDER',
    'Scheduled Quantity': 3100,
    Currency: 'USD',
    'Delivery Date': '2026-11-26',
  },
];
