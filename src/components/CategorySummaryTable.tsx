import { Layers } from 'lucide-react';
import { CategorySummaryRow, MaterialCategory, ProcessedMaterialItem } from '../types';
import { MATERIAL_CATEGORIES } from '../utils/deliveryUtils';
import { QtyPctCell } from './QtyPctCell';

interface CategorySummaryTableProps {
  items: ProcessedMaterialItem[];
}

const PREFIX_DESCRIPTIONS: Record<MaterialCategory, string> = {
  Fabric: 'Prefixes: TY, TF, TU, PI, FO, TS',
  Lace: 'Prefixes: BA, BI, BZ',
  Elastic: 'Prefixes: EL',
  Other: 'All Other Prefixes',
};

export function CategorySummaryTable({ items }: CategorySummaryTableProps) {
  const aggMap: Record<MaterialCategory, CategorySummaryRow> = {
    Fabric: {
      category: 'Fabric',
      ON_TIME: 0,
      '1_WK': 0,
      '2_WKS': 0,
      '3_WKS': 0,
      '4_WKS': 0,
      MORE_4_WKS: 0,
      total: 0,
    },
    Lace: {
      category: 'Lace',
      ON_TIME: 0,
      '1_WK': 0,
      '2_WKS': 0,
      '3_WKS': 0,
      '4_WKS': 0,
      MORE_4_WKS: 0,
      total: 0,
    },
    Elastic: {
      category: 'Elastic',
      ON_TIME: 0,
      '1_WK': 0,
      '2_WKS': 0,
      '3_WKS': 0,
      '4_WKS': 0,
      MORE_4_WKS: 0,
      total: 0,
    },
    Other: {
      category: 'Other',
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
    const row = aggMap[item.category];
    if (row) {
      row[item.statusInfo.bucket] += item.qty;
      row.total += item.qty;
    }
  });

  const totals = {
    ON_TIME: 0,
    '1_WK': 0,
    '2_WKS': 0,
    '3_WKS': 0,
    '4_WKS': 0,
    MORE_4_WKS: 0,
    grand: 0,
  };

  MATERIAL_CATEGORIES.forEach((cat) => {
    const row = aggMap[cat];
    totals.ON_TIME += row.ON_TIME;
    totals['1_WK'] += row['1_WK'];
    totals['2_WKS'] += row['2_WKS'];
    totals['3_WKS'] += row['3_WKS'];
    totals['4_WKS'] += row['4_WKS'];
    totals.MORE_4_WKS += row.MORE_4_WKS;
    totals.grand += row.total;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-sky-600" />
            <span>Material Category Summary Report</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sum of Total Quantity and Percentage (%) aggregated by Material
            Category Prefixes and Delay Buckets
          </p>
        </div>
        <span className="text-xs bg-sky-100 text-sky-800 font-semibold px-2.5 py-1 rounded-full shrink-0">
          Prefix Rules Active
        </span>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <th className="p-3.5 pl-5 min-w-[200px]">Material Category</th>
              <th className="p-3.5 text-right text-emerald-700 bg-emerald-50/50">
                On Time (Qty / %)
              </th>
              <th className="p-3.5 text-right text-amber-700 bg-amber-50/30">
                1 Wk Late
              </th>
              <th className="p-3.5 text-right text-orange-700 bg-orange-50/30">
                2 Wks Late
              </th>
              <th className="p-3.5 text-right text-rose-700 bg-rose-50/30">
                3 Wks Late
              </th>
              <th className="p-3.5 text-right text-red-700 bg-red-50/40">
                4 Wks Late
              </th>
              <th className="p-3.5 text-right text-purple-700 bg-purple-50/40">
                &gt; 4 Wks Late
              </th>
              <th className="p-3.5 pr-5 text-right text-slate-900 bg-slate-100">
                Total Quantity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {MATERIAL_CATEGORIES.map((cat) => {
              const row = aggMap[cat];
              return (
                <tr
                  key={cat}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="p-3.5 pl-5 font-bold text-slate-800">
                    {cat}
                    <span className="text-[10px] text-slate-400 block font-normal">
                      {PREFIX_DESCRIPTIONS[cat]}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-medium text-emerald-600 bg-emerald-50/20">
                    <QtyPctCell qty={row.ON_TIME} total={row.total} />
                  </td>
                  <td className="p-3.5 text-right font-medium text-amber-600 bg-amber-50/10">
                    <QtyPctCell qty={row['1_WK']} total={row.total} />
                  </td>
                  <td className="p-3.5 text-right font-medium text-orange-600 bg-orange-50/10">
                    <QtyPctCell qty={row['2_WKS']} total={row.total} />
                  </td>
                  <td className="p-3.5 text-right font-medium text-rose-600 bg-rose-50/10">
                    <QtyPctCell qty={row['3_WKS']} total={row.total} />
                  </td>
                  <td className="p-3.5 text-right font-medium text-red-600 bg-red-50/20">
                    <QtyPctCell qty={row['4_WKS']} total={row.total} />
                  </td>
                  <td className="p-3.5 text-right font-medium text-purple-600 bg-purple-50/20">
                    <QtyPctCell qty={row.MORE_4_WKS} total={row.total} />
                  </td>
                  <td className="p-3.5 pr-5 text-right font-bold text-slate-900 bg-slate-50">
                    <QtyPctCell qty={row.total} total={totals.grand} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-900 text-white font-bold border-t-2 border-slate-800">
            <tr>
              <td className="p-3.5 pl-5">TOTAL QUANTITY</td>
              <td className="p-3.5 text-right">
                <QtyPctCell qty={totals.ON_TIME} total={totals.grand} />
              </td>
              <td className="p-3.5 text-right">
                <QtyPctCell qty={totals['1_WK']} total={totals.grand} />
              </td>
              <td className="p-3.5 text-right">
                <QtyPctCell qty={totals['2_WKS']} total={totals.grand} />
              </td>
              <td className="p-3.5 text-right">
                <QtyPctCell qty={totals['3_WKS']} total={totals.grand} />
              </td>
              <td className="p-3.5 text-right">
                <QtyPctCell qty={totals['4_WKS']} total={totals.grand} />
              </td>
              <td className="p-3.5 text-right">
                <QtyPctCell qty={totals.MORE_4_WKS} total={totals.grand} />
              </td>
              <td className="p-3.5 pr-5 text-right text-sky-400 font-extrabold text-sm">
                <div>{Number(totals.grand.toFixed(1)).toLocaleString()}</div>
                <div className="text-[10px] font-normal opacity-80">(100%)</div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
