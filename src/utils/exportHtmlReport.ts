import {
  BucketTotals,
  FatherCodeGroup,
  MaterialCategory,
  OriginCategoryFilter,
  ProcessedMaterialItem,
  SupplierGroup,
} from '../types';
import { formatLocalDateISO, MATERIAL_CATEGORIES } from './deliveryUtils';

export interface ExportHtmlReportParams {
  items: ProcessedMaterialItem[];
  formattedDeadline: string;
  deadlineModeLabel?: string;
  basicMonthLabel: string;
  selectedSupplier: string;
  originCategory: OriginCategoryFilter;
  searchQuery: string;
  dataSourceLabel: string;
  categoryChartDataUrl: string | null;
  delayChartDataUrl: string | null;
}

const PREFIX_DESCRIPTIONS: Record<MaterialCategory, string> = {
  Fabric: 'Prefixes: TY, TF, TU, PI, FO, TS',
  Lace: 'Prefixes: BA, BI, BZ',
  Elastic: 'Prefixes: EL',
  Other: 'All Other Prefixes',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtQtyPctHtml(qty: number, total: number): string {
  if (!qty || qty <= 0) return '-';
  const pct = total > 0 ? ((qty / total) * 100).toFixed(1) : '0.0';
  const formattedQty = Number(qty.toFixed(1)).toLocaleString();
  return `<div class="qty-cell"><span class="qty-val">${escapeHtml(formattedQty)}</span><span class="qty-pct">(${pct}%)</span></div>`;
}

function getOriginLabel(origin: OriginCategoryFilter): string {
  if (origin === 'CNY') return 'China Category (CNY +14d)';
  if (origin === 'NON_CNY') return 'Other Category (Non-CNY +6d)';
  return 'All Categories';
}

export function exportFullViewToHtml(params: ExportHtmlReportParams): void {
  const {
    items,
    formattedDeadline,
    deadlineModeLabel = 'Basic Month',
    basicMonthLabel,
    selectedSupplier,
    originCategory,
    searchQuery,
    dataSourceLabel,
    categoryChartDataUrl,
    delayChartDataUrl,
  } = params;

  // 1. Build Category Summary Aggregation
  const categoryAgg: Record<MaterialCategory, BucketTotals & { total: number }> =
    {
      Fabric: {
        ON_TIME: 0,
        '1_WK': 0,
        '2_WKS': 0,
        '3_WKS': 0,
        '4_WKS': 0,
        MORE_4_WKS: 0,
        total: 0,
      },
      Lace: {
        ON_TIME: 0,
        '1_WK': 0,
        '2_WKS': 0,
        '3_WKS': 0,
        '4_WKS': 0,
        MORE_4_WKS: 0,
        total: 0,
      },
      Elastic: {
        ON_TIME: 0,
        '1_WK': 0,
        '2_WKS': 0,
        '3_WKS': 0,
        '4_WKS': 0,
        MORE_4_WKS: 0,
        total: 0,
      },
      Other: {
        ON_TIME: 0,
        '1_WK': 0,
        '2_WKS': 0,
        '3_WKS': 0,
        '4_WKS': 0,
        MORE_4_WKS: 0,
        total: 0,
      },
    };

  items.forEach((item) => {
    const row = categoryAgg[item.category];
    if (row) {
      row[item.statusInfo.bucket] += item.qty;
      row.total += item.qty;
    }
  });

  const catTotals = {
    ON_TIME: 0,
    '1_WK': 0,
    '2_WKS': 0,
    '3_WKS': 0,
    '4_WKS': 0,
    MORE_4_WKS: 0,
    grand: 0,
  };

  MATERIAL_CATEGORIES.forEach((cat) => {
    const r = categoryAgg[cat];
    catTotals.ON_TIME += r.ON_TIME;
    catTotals['1_WK'] += r['1_WK'];
    catTotals['2_WKS'] += r['2_WKS'];
    catTotals['3_WKS'] += r['3_WKS'];
    catTotals['4_WKS'] += r['4_WKS'];
    catTotals.MORE_4_WKS += r.MORE_4_WKS;
    catTotals.grand += r.total;
  });

  const categoryRowsHtml = MATERIAL_CATEGORIES.map((cat) => {
    const r = categoryAgg[cat];
    return `
      <tr>
        <td class="cell-cat">
          <div class="cat-title">${escapeHtml(cat)}</div>
          <div class="cat-sub">${escapeHtml(PREFIX_DESCRIPTIONS[cat])}</div>
        </td>
        <td class="num c-emerald bg-emerald-soft">${fmtQtyPctHtml(r.ON_TIME, r.total)}</td>
        <td class="num c-amber bg-amber-soft">${fmtQtyPctHtml(r['1_WK'], r.total)}</td>
        <td class="num c-orange bg-orange-soft">${fmtQtyPctHtml(r['2_WKS'], r.total)}</td>
        <td class="num c-rose bg-rose-soft">${fmtQtyPctHtml(r['3_WKS'], r.total)}</td>
        <td class="num c-red bg-red-soft">${fmtQtyPctHtml(r['4_WKS'], r.total)}</td>
        <td class="num c-purple bg-purple-soft">${fmtQtyPctHtml(r.MORE_4_WKS, r.total)}</td>
        <td class="num cell-total">${fmtQtyPctHtml(r.total, catTotals.grand)}</td>
      </tr>
    `;
  }).join('');

  // 2. Build Supplier Breakdown + Per-Supplier Father Code Summary Aggregation
  const suppliersMap: Record<
    string,
    SupplierGroup & { fatherMap: Record<string, FatherCodeGroup> }
  > = {};

  items.forEach((item) => {
    if (!suppliersMap[item.supplier]) {
      suppliersMap[item.supplier] = {
        name: item.supplier,
        items: [],
        buckets: {
          ON_TIME: 0,
          '1_WK': 0,
          '2_WKS': 0,
          '3_WKS': 0,
          '4_WKS': 0,
          MORE_4_WKS: 0,
        },
        totalQty: 0,
        fatherMap: {},
      };
    }
    const g = suppliersMap[item.supplier];
    g.items.push(item);
    g.buckets[item.statusInfo.bucket] += item.qty;
    g.totalQty += item.qty;

    const fc = item.fatherCode;
    if (!g.fatherMap[fc]) {
      g.fatherMap[fc] = {
        fatherCode: fc,
        items: [],
        buckets: {
          ON_TIME: 0,
          '1_WK': 0,
          '2_WKS': 0,
          '3_WKS': 0,
          '4_WKS': 0,
          MORE_4_WKS: 0,
        },
        totalQty: 0,
      };
    }
    const fcGroup = g.fatherMap[fc];
    fcGroup.items.push(item);
    fcGroup.buckets[item.statusInfo.bucket] += item.qty;
    fcGroup.totalQty += item.qty;
  });

  const sortedSuppliers = Object.values(suppliersMap)
    .sort((a, b) => b.totalQty - a.totalQty)
    .map(({ fatherMap, ...rest }) => ({
      ...rest,
      fatherCodes: Object.values(fatherMap).sort(
        (a, b) => b.totalQty - a.totalQty,
      ),
    }));

  const supplierRowsHtml =
    sortedSuppliers.length === 0
      ? `<tr><td colspan="9" class="empty-cell">No items found matching current filters.</td></tr>`
      : sortedSuppliers
          .map((supp, idx) => {
            const suppId = `supp-${idx}`;
            const b = supp.buckets;

            const fatherRowsHtml = supp.fatherCodes
              .map((fc) => {
                const fb = fc.buckets;
                return `
                  <tr class="fc-row fc-row-${suppId}"
                      data-fc="${escapeHtml(fc.fatherCode)}"
                      onclick="toggleFatherCodeFilter('${suppId}', this)">
                    <td class="sub-mat">
                      <div class="supp-name-wrap">
                        <span>${escapeHtml(fc.fatherCode)}</span>
                        <span class="item-count">${fc.items.length} item${fc.items.length > 1 ? 's' : ''}</span>
                      </div>
                    </td>
                    <td class="num c-emerald bg-emerald-tint">${fmtQtyPctHtml(fb.ON_TIME, fc.totalQty)}</td>
                    <td class="num c-amber bg-amber-tint">${fmtQtyPctHtml(fb['1_WK'], fc.totalQty)}</td>
                    <td class="num c-orange bg-orange-tint">${fmtQtyPctHtml(fb['2_WKS'], fc.totalQty)}</td>
                    <td class="num c-rose bg-rose-tint">${fmtQtyPctHtml(fb['3_WKS'], fc.totalQty)}</td>
                    <td class="num c-red bg-red-tint">${fmtQtyPctHtml(fb['4_WKS'], fc.totalQty)}</td>
                    <td class="num c-purple bg-purple-tint">${fmtQtyPctHtml(fb.MORE_4_WKS, fc.totalQty)}</td>
                    <td class="num cell-total">${fmtQtyPctHtml(fc.totalQty, supp.totalQty)}</td>
                  </tr>
                `;
              })
              .join('');

            const subRowsHtml = supp.items
              .map((it) => {
                const isOnTime = it.statusInfo.bucket === 'ON_TIME';
                const formattedEta = formatLocalDateISO(it.etaDate);
                const formattedCalc = formatLocalDateISO(
                  it.statusInfo.calcArrival,
                );
                const currClass =
                  it.currency === 'CNY' ? 'badge-cny' : 'badge-other-curr';
                const statusClass = isOnTime ? 'badge-ontime' : 'badge-delayed';

                return `
                  <tr class="sub-row supp-item-row-${suppId}"
                      data-fc="${escapeHtml(it.fatherCode)}"
                      data-mat="${escapeHtml(it.materialCode.toLowerCase())}"
                      data-po="${escapeHtml(it.poNumber.toLowerCase())}"
                      data-eta="${escapeHtml(formattedEta)}"
                      data-status="${escapeHtml(it.statusInfo.bucket)}">
                    <td class="sub-mat">
                      <div>${escapeHtml(it.materialCode)}</div>
                      <span class="fc-tag">Father: ${escapeHtml(it.fatherCode)}</span>
                    </td>
                    <td class="sub-po">${escapeHtml(it.poNumber)}</td>
                    <td class="num sub-qty">${escapeHtml(it.qty.toLocaleString())}</td>
                    <td class="center"><span class="curr-badge ${currClass}">${escapeHtml(it.currency)}</span></td>
                    <td class="sub-date">${escapeHtml(formattedEta)}</td>
                    <td class="sub-calc">${escapeHtml(formattedCalc)} <span class="lead-tag">(+${it.statusInfo.leadDays}d)</span></td>
                    <td class="num"><span class="status-badge ${statusClass}">${escapeHtml(it.statusInfo.label)}</span></td>
                  </tr>
                `;
              })
              .join('');

            return `
              <tr class="supp-header-row" onclick="toggleAccordion('${suppId}')">
                <td class="cell-supp">
                  <div class="supp-name-wrap">
                    <span id="icon-${suppId}" class="chevron">&#9656;</span>
                    <span>${escapeHtml(supp.name)}</span>
                    <span class="item-count">${supp.fatherCodes.length} father code${supp.fatherCodes.length > 1 ? 's' : ''} &bull; ${supp.items.length} items</span>
                  </div>
                </td>
                <td class="num c-emerald bg-emerald-tint">${fmtQtyPctHtml(b.ON_TIME, supp.totalQty)}</td>
                <td class="num c-amber bg-amber-tint">${fmtQtyPctHtml(b['1_WK'], supp.totalQty)}</td>
                <td class="num c-orange bg-orange-tint">${fmtQtyPctHtml(b['2_WKS'], supp.totalQty)}</td>
                <td class="num c-rose bg-rose-tint">${fmtQtyPctHtml(b['3_WKS'], supp.totalQty)}</td>
                <td class="num c-red bg-red-tint">${fmtQtyPctHtml(b['4_WKS'], supp.totalQty)}</td>
                <td class="num c-purple bg-purple-tint">${fmtQtyPctHtml(b.MORE_4_WKS, supp.totalQty)}</td>
                <td class="num cell-total">${fmtQtyPctHtml(supp.totalQty, catTotals.grand)}</td>
                <td class="center view-col"><span id="view-label-${suppId}">View</span></td>
              </tr>
              <tr id="${suppId}" class="supp-detail-row hidden">
                <td colspan="9" class="detail-td">
                  <div class="detail-box">
                    <div class="fc-card">
                      <div class="fc-card-head">
                        <div class="supp-name-wrap">
                          <span class="fc-title">Father Code Summary</span>
                          <span class="pill-sky">${supp.fatherCodes.length} code${supp.fatherCodes.length > 1 ? 's' : ''}</span>
                        </div>
                        <div class="fc-hint-wrap">
                          <span id="fc-status-${suppId}" class="fc-hint">Click a Father Code row to filter PO lines below</span>
                          <button type="button" id="fc-clear-${suppId}" class="fc-clear-btn hidden" onclick="clearFatherCodeFilter('${suppId}')">Clear Filter &times;</button>
                        </div>
                      </div>
                      <div class="table-wrap">
                        <table class="sub-table">
                          <thead>
                            <tr>
                              <th style="min-width:170px">Father Code</th>
                              <th class="num th-emerald">On Time Qty</th>
                              <th class="num th-amber">1 Wk Late</th>
                              <th class="num th-orange">2 Wks Late</th>
                              <th class="num th-rose">3 Wks Late</th>
                              <th class="num th-red">4 Wks Late</th>
                              <th class="num th-purple">&gt; 4 Wks Late</th>
                              <th class="num th-total">Total Qty</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${fatherRowsHtml}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div class="detail-inner">
                      <table class="sub-table">
                        <thead>
                          <tr>
                            <th style="min-width:150px">
                              <div class="th-filter">
                                <span>MATERIAL ITEM</span>
                                <input type="text" id="f_mat_${suppId}" oninput="filterSupplierSubTable('${suppId}')" placeholder="Filter Material..." />
                              </div>
                            </th>
                            <th style="min-width:140px">
                              <div class="th-filter">
                                <span>PO NUMBER</span>
                                <input type="text" id="f_po_${suppId}" oninput="filterSupplierSubTable('${suppId}')" placeholder="Filter PO..." />
                              </div>
                            </th>
                            <th class="num">SCHEDULED QUANTITY</th>
                            <th class="center">CURRENCY</th>
                            <th style="min-width:145px">
                              <div class="th-filter">
                                <span>ETA DATE</span>
                                <input type="date" id="f_eta_${suppId}" oninput="filterSupplierSubTable('${suppId}')" />
                              </div>
                            </th>
                            <th>CALCULATED ARRIVAL</th>
                            <th class="num" style="min-width:155px">
                              <div class="th-filter th-filter-right">
                                <span>STATUS</span>
                                <select id="f_status_${suppId}" onchange="filterSupplierSubTable('${suppId}')">
                                  <option value="ALL">All Status</option>
                                  <option value="ON_TIME">On Time</option>
                                  <option value="ALL_DELAYED">All Delayed</option>
                                  <option value="1_WK">1 Week Late</option>
                                  <option value="2_WKS">2 Weeks Late</option>
                                  <option value="3_WKS">3 Weeks Late</option>
                                  <option value="4_WKS">4 Weeks Late</option>
                                  <option value="MORE_4_WKS">&gt; 4 Weeks Late</option>
                                </select>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          ${subRowsHtml}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </td>
              </tr>
            `;
          })
          .join('');

  const generatedTimestamp = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const categoryChartHtml = categoryChartDataUrl
    ? `<img src="${categoryChartDataUrl}" alt="Category Quantity Distribution Chart" class="chart-img" />`
    : `<div class="chart-empty">Chart preview unavailable</div>`;

  const delayChartHtml = delayChartDataUrl
    ? `<img src="${delayChartDataUrl}" alt="Delay Severity by Category Chart" class="chart-img" />`
    : `<div class="chart-empty">Chart preview unavailable</div>`;

  const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Material Delivery Deadline Dashboard - Full View Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    .container { max-width: 1280px; width: 100%; margin: 0 auto; padding: 0 24px; }
    header {
      background: #0f172a;
      color: #ffffff;
      border-bottom: 1px solid #1e293b;
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.15);
    }
    .header-inner {
      min-height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 10px 0;
      flex-wrap: wrap;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      background: #0ea5e9;
      color: #ffffff;
      width: 38px;
      height: 38px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .brand h1 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.1; }
    .brand p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; }
    .brand .author { color: #38bdf8; font-weight: 500; }
    .header-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .header-badge {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      color: #e2e8f0;
    }
    .header-badge .muted { color: #94a3b8; margin-right: 6px; }
    .header-badge .accent { color: #38bdf8; font-weight: 700; }
    main { flex: 1; padding: 24px 0 36px; }
    .stack { display: flex; flex-direction: column; gap: 24px; }
    .filter-summary {
      background: #ffffff;
      border: 1px solid rgba(226, 232, 240, 0.9);
      border-radius: 16px;
      padding: 14px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      font-size: 12px;
    }
    .filter-chips { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .chip {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
      border-radius: 10px;
      color: #334155;
    }
    .chip strong { color: #0f172a; margin-right: 4px; }
    .generated-at { color: #64748b; font-size: 11px; }
    .banner {
      background: linear-gradient(to right, #0c4a6e, #0f172a);
      color: #ffffff;
      border-radius: 16px;
      padding: 18px 20px;
      border: 1px solid rgba(7, 89, 133, 0.45);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
    }
    .banner-left { display: flex; align-items: center; gap: 12px; }
    .banner-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: rgba(14, 165, 233, 0.2);
      border: 1px solid rgba(56, 189, 248, 0.35);
      color: #38bdf8;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .banner-label { font-size: 12px; color: #7dd3fc; font-weight: 500; }
    .banner-title { font-size: 18px; font-weight: 700; margin-top: 2px; }
    .banner-total {
      background: rgba(30, 41, 59, 0.85);
      border: 1px solid rgba(51, 65, 85, 0.7);
      padding: 8px 14px;
      border-radius: 12px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .banner-total .muted { color: #94a3b8; }
    .banner-total .qty { color: #34d399; font-weight: 700; font-size: 14px; }
    .card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid rgba(226, 232, 240, 0.9);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      overflow: hidden;
    }
    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
      background: rgba(248, 250, 252, 0.6);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .card-header h2 { margin: 0; font-size: 16px; font-weight: 700; color: #1e293b; }
    .card-header p { margin: 3px 0 0; font-size: 12px; color: #64748b; }
    .pill-sky {
      font-size: 11px;
      font-weight: 600;
      background: #e0f2fe;
      color: #075985;
      padding: 3px 9px;
      border-radius: 999px;
    }
    .accordion-actions { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #64748b; }
    .link-btn {
      background: none;
      border: none;
      padding: 0;
      color: #0284c7;
      font-weight: 600;
      text-decoration: underline;
      cursor: pointer;
      font-size: 12px;
      font-family: inherit;
    }
    .link-btn:hover { color: #075985; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; }
    thead tr {
      background: rgba(241, 245, 249, 0.85);
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #e2e8f0;
    }
    th, td { padding: 13px 14px; }
    th:first-child, td:first-child { padding-left: 20px; }
    th:last-child, td:last-child { padding-right: 20px; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:hover { background: rgba(248, 250, 252, 0.9); }
    tfoot {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      border-top: 2px solid #1e293b;
    }
    .num { text-align: right; }
    .center { text-align: center; }
    .cell-cat, .cell-supp { font-weight: 700; color: #1e293b; min-width: 210px; }
    .cat-sub { font-size: 10px; color: #94a3b8; font-weight: 400; margin-top: 2px; }
    .qty-cell { line-height: 1.2; }
    .qty-val { font-weight: 600; display: block; }
    .qty-pct { font-size: 10px; font-weight: 400; opacity: 0.78; display: block; margin-top: 2px; }
    .th-emerald { color: #047857; background: rgba(236, 253, 245, 0.7); }
    .th-amber { color: #b45309; background: rgba(255, 251, 235, 0.6); }
    .th-orange { color: #c2410c; background: rgba(255, 247, 237, 0.6); }
    .th-rose { color: #be123c; background: rgba(255, 241, 242, 0.6); }
    .th-red { color: #b91c1c; background: rgba(254, 242, 242, 0.7); }
    .th-purple { color: #7e22ce; background: rgba(250, 245, 255, 0.7); }
    .th-total { color: #0f172a; background: #f1f5f9; }
    .c-emerald { color: #059669; }
    .c-amber { color: #d97706; }
    .c-orange { color: #ea580c; }
    .c-rose { color: #e11d48; }
    .c-red { color: #dc2626; }
    .c-purple { color: #9333ea; }
    .bg-emerald-soft { background: rgba(236, 253, 245, 0.35); }
    .bg-amber-soft { background: rgba(255, 251, 235, 0.25); }
    .bg-orange-soft { background: rgba(255, 247, 237, 0.25); }
    .bg-rose-soft { background: rgba(255, 241, 242, 0.25); }
    .bg-red-soft { background: rgba(254, 242, 242, 0.35); }
    .bg-purple-soft { background: rgba(250, 245, 255, 0.35); }
    .bg-emerald-tint { background: rgba(236, 253, 245, 0.18); }
    .bg-amber-tint { background: rgba(255, 251, 235, 0.18); }
    .bg-orange-tint { background: rgba(255, 247, 237, 0.18); }
    .bg-rose-tint { background: rgba(255, 241, 242, 0.18); }
    .bg-red-tint { background: rgba(254, 242, 242, 0.18); }
    .bg-purple-tint { background: rgba(250, 245, 255, 0.18); }
    .cell-total { font-weight: 700; color: #0f172a; background: #f8fafc; }
    .tfoot-grand { color: #38bdf8; font-weight: 800; font-size: 14px; }
    .tfoot-grand-pct { font-size: 10px; font-weight: 400; opacity: 0.85; }
    .supp-header-row { cursor: pointer; transition: background 0.15s ease; }
    .supp-header-row:hover { background: rgba(240, 249, 255, 0.85) !important; }
    .supp-name-wrap { display: flex; align-items: center; gap: 8px; }
    .chevron { display: inline-block; color: #94a3b8; font-size: 11px; transition: transform 0.2s ease; }
    .chevron.open { transform: rotate(90deg); }
    .item-count {
      font-size: 10px;
      background: #f1f5f9;
      color: #64748b;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .view-col { color: #0284c7; font-weight: 600; }
    .hidden { display: none; }
    .detail-td { padding: 0 !important; background: #f1f5f9; }
    .detail-box {
      padding: 16px;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .fc-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .fc-card-head {
      padding: 10px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .fc-title { font-size: 12px; font-weight: 700; color: #1e293b; }
    .fc-hint-wrap { display: flex; align-items: center; gap: 8px; }
    .fc-hint { font-size: 11px; color: #94a3b8; }
    .fc-clear-btn {
      background: #0284c7;
      color: #ffffff;
      border: none;
      border-radius: 999px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    .fc-row { cursor: pointer; }
    .fc-row.selected { background: #f0f9ff !important; outline: 1px solid #7dd3fc; outline-offset: -1px; }
    .fc-tag {
      display: inline-block;
      margin-top: 3px;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      background: #f0f9ff;
      color: #0369a1;
    }
    .detail-inner {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow-x: auto;
    }
    .sub-table thead tr { background: #f1f5f9; font-size: 10px; color: #334155; }
    .sub-table th, .sub-table td { padding: 10px 14px; }
    .th-filter { display: flex; flex-direction: column; gap: 4px; }
    .th-filter-right { align-items: flex-end; }
    .th-filter input, .th-filter select {
      width: 100%;
      max-width: 155px;
      padding: 4px 6px;
      font-size: 11px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      color: #334155;
      font-family: inherit;
    }
    .sub-mat { font-weight: 700; color: #0f172a; }
    .sub-po { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #475569; }
    .sub-qty { font-weight: 600; color: #1e293b; }
    .sub-date { color: #475569; font-weight: 500; }
    .sub-calc { font-weight: 600; color: #1e293b; }
    .lead-tag { font-size: 10px; color: #94a3b8; font-weight: 400; margin-left: 3px; }
    .curr-badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
    .badge-cny { background: #fef3c7; color: #92400e; }
    .badge-other-curr { background: #dbeafe; color: #1e40af; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid transparent;
    }
    .badge-ontime { background: #d1fae5; color: #065f46; border-color: #a7f3d0; }
    .badge-delayed { background: #ffe4e6; color: #9f1239; border-color: #fecdd3; }
    .empty-cell { padding: 32px; text-align: center; color: #94a3b8; }
    .charts-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
    @media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }
    .chart-card { padding: 20px; }
    .chart-card h3 { margin: 0; font-size: 14px; font-weight: 700; color: #1e293b; }
    .chart-card p { margin: 4px 0 16px; font-size: 12px; color: #64748b; }
    .chart-box { display: flex; align-items: center; justify-content: center; min-height: 240px; }
    .chart-img { max-width: 100%; max-height: 280px; height: auto; object-fit: contain; }
    .chart-empty { color: #94a3b8; font-size: 12px; }
    footer {
      background: #0f172a;
      color: #94a3b8;
      text-align: center;
      padding: 16px;
      font-size: 12px;
      border-top: 1px solid #1e293b;
      margin-top: auto;
    }
    footer .author { color: #38bdf8; font-weight: 600; }
    @media print {
      header { position: static; }
      .supp-detail-row { display: table-row !important; }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="header-inner">
        <div class="brand">
          <div class="brand-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M15 18H9"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
              <circle cx="17" cy="18" r="2"/>
              <circle cx="7" cy="18" r="2"/>
            </svg>
          </div>
          <div>
            <h1>Material Delivery Deadline Dashboard</h1>
            <p>Delay Tracking &amp; Lead-Time Analytics &bull; <span class="author">Developed by Rashmi Peiris</span></p>
          </div>
        </div>
        <div class="header-meta">
          <div class="header-badge">
            <span class="muted">Target Deadline:</span>
            <span class="accent">${escapeHtml(formattedDeadline)}</span>
          </div>
        </div>
      </div>
    </div>
  </header>

  <main>
    <div class="container">
      <div class="stack">

        <!-- Exported Filter Context -->
        <div class="filter-summary">
          <div class="filter-chips">
            <span class="chip"><strong>Source:</strong>${escapeHtml(dataSourceLabel)}</span>
            <span class="chip"><strong>Supplier:</strong>${escapeHtml(selectedSupplier === 'ALL' ? 'All Suppliers' : selectedSupplier)}</span>
            <span class="chip"><strong>${escapeHtml(deadlineModeLabel)}:</strong>${escapeHtml(basicMonthLabel)}</span>
            <span class="chip"><strong>Origin:</strong>${escapeHtml(getOriginLabel(originCategory))}</span>
            ${searchQuery.trim() ? `<span class="chip"><strong>Search:</strong>${escapeHtml(searchQuery.trim())}</span>` : ''}
          </div>
          <div class="generated-at">Exported: ${escapeHtml(generatedTimestamp)}</div>
        </div>

        <!-- Target Deadline Banner -->
        <div class="banner">
          <div class="banner-left">
            <div class="banner-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 2v4"/><path d="M16 2v4"/>
                <rect width="18" height="18" x="3" y="4" rx="2"/>
                <path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>
              </svg>
            </div>
            <div>
              <div class="banner-label">Active ${escapeHtml(deadlineModeLabel)} Deadline</div>
              <div class="banner-title">Target Delivery Deadline: ${escapeHtml(formattedDeadline)}</div>
            </div>
          </div>
          <div class="banner-total">
            <span class="muted">Total Filtered Quantity:</span>
            <span class="qty">${escapeHtml(Number(catTotals.grand.toFixed(1)).toLocaleString())}</span>
          </div>
        </div>

        <!-- SECTION 1: Material Category Summary Report -->
        <section class="card">
          <div class="card-header">
            <div>
              <h2>Material Category Summary Report</h2>
              <p>Sum of Total Quantity and Percentage (%) aggregated by Material Category Prefixes and Delay Buckets</p>
            </div>
            <span class="pill-sky">Prefix Rules Active</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="min-width:200px">Material Category</th>
                  <th class="num th-emerald">On Time (Qty / %)</th>
                  <th class="num th-amber">1 Wk Late</th>
                  <th class="num th-orange">2 Wks Late</th>
                  <th class="num th-rose">3 Wks Late</th>
                  <th class="num th-red">4 Wks Late</th>
                  <th class="num th-purple">&gt; 4 Wks Late</th>
                  <th class="num th-total">Total Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${categoryRowsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td>TOTAL QUANTITY</td>
                  <td class="num">${fmtQtyPctHtml(catTotals.ON_TIME, catTotals.grand)}</td>
                  <td class="num">${fmtQtyPctHtml(catTotals['1_WK'], catTotals.grand)}</td>
                  <td class="num">${fmtQtyPctHtml(catTotals['2_WKS'], catTotals.grand)}</td>
                  <td class="num">${fmtQtyPctHtml(catTotals['3_WKS'], catTotals.grand)}</td>
                  <td class="num">${fmtQtyPctHtml(catTotals['4_WKS'], catTotals.grand)}</td>
                  <td class="num">${fmtQtyPctHtml(catTotals.MORE_4_WKS, catTotals.grand)}</td>
                  <td class="num">
                    <div class="tfoot-grand">${escapeHtml(Number(catTotals.grand.toFixed(1)).toLocaleString())}</div>
                    <div class="tfoot-grand-pct">(100%)</div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <!-- SECTION 2: Supplier-Wise Summary Breakdown -->
        <section class="card">
          <div class="card-header">
            <div>
              <h2>Supplier Lead Time &amp; Delivery Breakdown</h2>
              <p>Click supplier row to expand Father Code summary &amp; material details. Quantities are shown with their percentage (%) distribution.</p>
            </div>
            <div class="accordion-actions">
              <button type="button" class="link-btn" onclick="toggleAllAccordions(true)">Expand All</button>
              <span>&bull;</span>
              <button type="button" class="link-btn" onclick="toggleAllAccordions(false)">Collapse All</button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="min-width:220px">Supplier Name</th>
                  <th class="num th-emerald">On Time Qty</th>
                  <th class="num th-amber">1 Wk Late</th>
                  <th class="num th-orange">2 Wks Late</th>
                  <th class="num th-rose">3 Wks Late</th>
                  <th class="num th-red">4 Wks Late</th>
                  <th class="num th-purple">&gt; 4 Wks Late</th>
                  <th class="num th-total">Total Qty</th>
                  <th class="center" style="min-width:80px">Details</th>
                </tr>
              </thead>
              <tbody>
                ${supplierRowsHtml}
              </tbody>
            </table>
          </div>
        </section>

        <!-- SECTION 3: Visual Analytics Charts -->
        <section class="charts-grid">
          <div class="card chart-card">
            <h3>Category Quantity Distribution</h3>
            <p>Volume share by Material Category</p>
            <div class="chart-box">${categoryChartHtml}</div>
          </div>
          <div class="card chart-card">
            <h3>Delay Severity by Category</h3>
            <p>Breakdown of On Time vs. Weeks Delayed per category</p>
            <div class="chart-box">${delayChartHtml}</div>
          </div>
        </section>

      </div>
    </div>
  </main>

  <footer>
    <div class="container">
      Material Delivery Deadline Dashboard &bull; Developed by <span class="author">Rashmi Peiris</span>
    </div>
  </footer>

  <script>
    var selectedFatherCodes = {};

    function toggleAccordion(id) {
      var row = document.getElementById(id);
      var icon = document.getElementById('icon-' + id);
      var label = document.getElementById('view-label-' + id);
      if (!row) return;
      var isHidden = row.classList.contains('hidden');
      if (isHidden) {
        row.classList.remove('hidden');
        if (icon) icon.classList.add('open');
        if (label) label.textContent = 'Hide';
      } else {
        row.classList.add('hidden');
        if (icon) icon.classList.remove('open');
        if (label) label.textContent = 'View';
      }
    }

    function toggleAllAccordions(expand) {
      var rows = document.querySelectorAll('.supp-detail-row');
      rows.forEach(function (row) {
        var id = row.id;
        var icon = document.getElementById('icon-' + id);
        var label = document.getElementById('view-label-' + id);
        if (expand) {
          row.classList.remove('hidden');
          if (icon) icon.classList.add('open');
          if (label) label.textContent = 'Hide';
        } else {
          row.classList.add('hidden');
          if (icon) icon.classList.remove('open');
          if (label) label.textContent = 'View';
        }
      });
    }

    function toggleFatherCodeFilter(suppId, rowEl) {
      var fc = rowEl.getAttribute('data-fc') || '';
      if (selectedFatherCodes[suppId] === fc) {
        selectedFatherCodes[suppId] = '';
      } else {
        selectedFatherCodes[suppId] = fc;
      }
      updateFatherCodeSelectionUI(suppId);
      filterSupplierSubTable(suppId);
    }

    function clearFatherCodeFilter(suppId) {
      selectedFatherCodes[suppId] = '';
      updateFatherCodeSelectionUI(suppId);
      filterSupplierSubTable(suppId);
    }

    function updateFatherCodeSelectionUI(suppId) {
      var activeFc = selectedFatherCodes[suppId] || '';
      var fcRows = document.querySelectorAll('.fc-row-' + suppId);
      fcRows.forEach(function (r) {
        if (activeFc && r.getAttribute('data-fc') === activeFc) {
          r.classList.add('selected');
        } else {
          r.classList.remove('selected');
        }
      });
      var statusEl = document.getElementById('fc-status-' + suppId);
      var clearBtn = document.getElementById('fc-clear-' + suppId);
      if (activeFc) {
        if (statusEl) statusEl.textContent = 'Filtered: ' + activeFc;
        if (clearBtn) clearBtn.classList.remove('hidden');
      } else {
        if (statusEl) statusEl.textContent = 'Click a Father Code row to filter PO lines below';
        if (clearBtn) clearBtn.classList.add('hidden');
      }
    }

    function filterSupplierSubTable(suppId) {
      var activeFc = selectedFatherCodes[suppId] || '';
      var matFilter = (document.getElementById('f_mat_' + suppId)?.value || '').toLowerCase().trim();
      var poFilter = (document.getElementById('f_po_' + suppId)?.value || '').toLowerCase().trim();
      var etaFilter = (document.getElementById('f_eta_' + suppId)?.value || '').trim();
      var statusFilter = document.getElementById('f_status_' + suppId)?.value || 'ALL';

      var rows = document.querySelectorAll('.supp-item-row-' + suppId);
      rows.forEach(function (row) {
        var fcVal = row.getAttribute('data-fc') || '';
        var matVal = row.getAttribute('data-mat') || '';
        var poVal = row.getAttribute('data-po') || '';
        var etaVal = row.getAttribute('data-eta') || '';
        var statusVal = row.getAttribute('data-status') || '';

        var visible = true;
        if (activeFc && fcVal !== activeFc) visible = false;
        if (matFilter && matVal.indexOf(matFilter) === -1) visible = false;
        if (poFilter && poVal.indexOf(poFilter) === -1) visible = false;
        if (etaFilter && etaVal.indexOf(etaFilter) === -1) visible = false;
        if (statusFilter === 'ON_TIME' && statusVal !== 'ON_TIME') visible = false;
        if (statusFilter === 'ALL_DELAYED' && statusVal === 'ON_TIME') visible = false;
        if (['1_WK', '2_WKS', '3_WKS', '4_WKS', 'MORE_4_WKS'].indexOf(statusFilter) !== -1 && statusVal !== statusFilter) {
          visible = false;
        }
        row.style.display = visible ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;

  const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const todayStamp = formatLocalDateISO(new Date());
  link.href = url;
  link.download = `Material_Delivery_Full_View_${todayStamp}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
