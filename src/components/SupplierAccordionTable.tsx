import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Factory,
  Filter,
  Inbox,
} from 'lucide-react';
import {
  ProcessedMaterialItem,
  SubTableStatusFilter,
  SupplierGroup,
} from '../types';
import { formatLocalDateISO } from '../utils/deliveryUtils';
import { QtyPctCell } from './QtyPctCell';

interface SupplierAccordionTableProps {
  items: ProcessedMaterialItem[];
}

interface SubFilters {
  material: string;
  po: string;
  eta: string;
  status: SubTableStatusFilter;
}

const DEFAULT_SUB_FILTERS: SubFilters = {
  material: '',
  po: '',
  eta: '',
  status: 'ALL',
};

export function SupplierAccordionTable({ items }: SupplierAccordionTableProps) {
  const [expandedSuppliers, setExpandedSuppliers] = useState<
    Record<string, boolean>
  >({});
  const [subFiltersBySupplier, setSubFiltersBySupplier] = useState<
    Record<string, SubFilters>
  >({});

  const { sortedSuppliers, grandTotal } = useMemo(() => {
    const total = items.reduce((sum, i) => sum + i.qty, 0);
    const map: Record<string, SupplierGroup> = {};

    items.forEach((item) => {
      if (!map[item.supplier]) {
        map[item.supplier] = {
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
        };
      }
      const group = map[item.supplier];
      group.items.push(item);
      group.buckets[item.statusInfo.bucket] += item.qty;
      group.totalQty += item.qty;
    });

    const sorted = Object.values(map).sort((a, b) => b.totalQty - a.totalQty);
    return { sortedSuppliers: sorted, grandTotal: total };
  }, [items]);

  const toggleSupplier = (name: string) => {
    setExpandedSuppliers((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const toggleAll = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    sortedSuppliers.forEach((s) => {
      next[s.name] = expand;
    });
    setExpandedSuppliers(next);
  };

  const updateSubFilter = <K extends keyof SubFilters>(
    supplierName: string,
    field: K,
    value: SubFilters[K],
  ) => {
    setSubFiltersBySupplier((prev) => ({
      ...prev,
      [supplierName]: {
        ...(prev[supplierName] ?? DEFAULT_SUB_FILTERS),
        [field]: value,
      },
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-50/50">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <Factory className="w-4 h-4 text-sky-600" />
            <span>Supplier Lead Time &amp; Delivery Breakdown</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click supplier row to expand. Quantities are shown with their
            percentage (%) distribution.
          </p>
        </div>
        <div className="text-xs text-slate-500 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => toggleAll(true)}
            className="text-sky-600 hover:text-sky-800 font-semibold underline text-xs cursor-pointer"
          >
            Expand All
          </button>
          <span>&bull;</span>
          <button
            type="button"
            onClick={() => toggleAll(false)}
            className="text-sky-600 hover:text-sky-800 font-semibold underline text-xs cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <th className="p-3.5 pl-5 min-w-[220px]">Supplier Name</th>
              <th className="p-3.5 text-right text-emerald-700 bg-emerald-50/30">
                On Time Qty
              </th>
              <th className="p-3.5 text-right text-amber-700 bg-amber-50/20">
                1 Wk Late
              </th>
              <th className="p-3.5 text-right text-orange-700 bg-orange-50/20">
                2 Wks Late
              </th>
              <th className="p-3.5 text-right text-rose-700 bg-rose-50/20">
                3 Wks Late
              </th>
              <th className="p-3.5 text-right text-red-700 bg-red-50/30">
                4 Wks Late
              </th>
              <th className="p-3.5 text-right text-purple-700 bg-purple-50/30">
                &gt; 4 Wks Late
              </th>
              <th className="p-3.5 text-right text-slate-900 bg-slate-100 font-bold">
                Total Qty
              </th>
              <th className="p-3.5 pr-5 text-center min-w-[80px]">Details</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sortedSuppliers.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  <Inbox className="w-8 h-8 mx-auto mb-2" />
                  <span>No items found matching current filters.</span>
                </td>
              </tr>
            ) : (
              sortedSuppliers.map((supp) => {
                const isOpen = !!expandedSuppliers[supp.name];
                const subFilters =
                  subFiltersBySupplier[supp.name] ?? DEFAULT_SUB_FILTERS;
                const b = supp.buckets;

                const visibleItems = supp.items.filter((it) => {
                  const matVal = it.materialCode.toLowerCase();
                  const poVal = it.poNumber.toLowerCase();
                  const etaVal = formatLocalDateISO(it.etaDate);
                  const statusVal = it.statusInfo.bucket;

                  if (
                    subFilters.material &&
                    !matVal.includes(subFilters.material.toLowerCase().trim())
                  ) {
                    return false;
                  }
                  if (
                    subFilters.po &&
                    !poVal.includes(subFilters.po.toLowerCase().trim())
                  ) {
                    return false;
                  }
                  if (
                    subFilters.eta &&
                    !etaVal.includes(subFilters.eta.trim())
                  ) {
                    return false;
                  }
                  if (
                    subFilters.status === 'ON_TIME' &&
                    statusVal !== 'ON_TIME'
                  ) {
                    return false;
                  }
                  if (
                    subFilters.status === 'ALL_DELAYED' &&
                    statusVal === 'ON_TIME'
                  ) {
                    return false;
                  }
                  if (
                    [
                      '1_WK',
                      '2_WKS',
                      '3_WKS',
                      '4_WKS',
                      'MORE_4_WKS',
                    ].includes(subFilters.status) &&
                    statusVal !== subFilters.status
                  ) {
                    return false;
                  }

                  return true;
                });

                return (
                  <React.Fragment key={supp.name}>
                    <tr
                      onClick={() => toggleSupplier(supp.name)}
                      className="hover:bg-sky-50/50 cursor-pointer transition-colors border-b border-slate-100 font-medium text-slate-800"
                    >
                      <td className="p-3.5 pl-5 font-bold">
                        <div className="flex items-center space-x-2">
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-90' : ''
                            }`}
                          />
                          <span>{supp.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-normal px-2 py-0.5 rounded-full shrink-0">
                            {supp.items.length} items
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-right text-emerald-600 font-semibold bg-emerald-50/10">
                        <QtyPctCell qty={b.ON_TIME} total={supp.totalQty} />
                      </td>
                      <td className="p-3.5 text-right text-amber-600 bg-amber-50/10">
                        <QtyPctCell qty={b['1_WK']} total={supp.totalQty} />
                      </td>
                      <td className="p-3.5 text-right text-orange-600 bg-orange-50/10">
                        <QtyPctCell qty={b['2_WKS']} total={supp.totalQty} />
                      </td>
                      <td className="p-3.5 text-right text-rose-600 bg-rose-50/10">
                        <QtyPctCell qty={b['3_WKS']} total={supp.totalQty} />
                      </td>
                      <td className="p-3.5 text-right text-red-600 bg-red-50/10">
                        <QtyPctCell qty={b['4_WKS']} total={supp.totalQty} />
                      </td>
                      <td className="p-3.5 text-right text-purple-600 bg-purple-50/10">
                        <QtyPctCell qty={b.MORE_4_WKS} total={supp.totalQty} />
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900 bg-slate-50">
                        <QtyPctCell qty={supp.totalQty} total={grandTotal} />
                      </td>
                      <td className="p-3.5 pr-5 text-center text-sky-600 font-semibold text-xs">
                        <span>{isOpen ? 'Hide' : 'View'}</span>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={9} className="p-0">
                          <div className="p-4 bg-slate-100/70 border-y border-slate-200">
                            <div className="bg-white rounded-xl shadow-inner border border-slate-200 overflow-x-auto custom-scrollbar">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                                    <th className="py-2.5 px-4 min-w-[160px]">
                                      <div className="flex flex-col space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>MATERIAL ITEM</span>
                                          <Filter className="w-2.5 h-2.5 text-sky-600" />
                                        </div>
                                        <input
                                          type="text"
                                          value={subFilters.material}
                                          onChange={(e) =>
                                            updateSubFilter(
                                              supp.name,
                                              'material',
                                              e.target.value,
                                            )
                                          }
                                          placeholder="Filter Material..."
                                          className="w-full p-1 text-[11px] font-normal border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 bg-white outline-none"
                                        />
                                      </div>
                                    </th>

                                    <th className="py-2.5 px-4 min-w-[150px]">
                                      <div className="flex flex-col space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>PO NUMBER</span>
                                          <Filter className="w-2.5 h-2.5 text-sky-600" />
                                        </div>
                                        <input
                                          type="text"
                                          value={subFilters.po}
                                          onChange={(e) =>
                                            updateSubFilter(
                                              supp.name,
                                              'po',
                                              e.target.value,
                                            )
                                          }
                                          placeholder="Filter PO..."
                                          className="w-full p-1 text-[11px] font-normal border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 bg-white outline-none"
                                        />
                                      </div>
                                    </th>

                                    <th className="py-2.5 px-4 text-right">
                                      SCHEDULED QUANTITY
                                    </th>

                                    <th className="py-2.5 px-4 text-center">
                                      CURRENCY
                                    </th>

                                    <th className="py-2.5 px-4 min-w-[150px]">
                                      <div className="flex flex-col space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span>ETA DATE</span>
                                          <Filter className="w-2.5 h-2.5 text-sky-600" />
                                        </div>
                                        <input
                                          type="date"
                                          value={subFilters.eta}
                                          onChange={(e) =>
                                            updateSubFilter(
                                              supp.name,
                                              'eta',
                                              e.target.value,
                                            )
                                          }
                                          className="w-full p-1 text-[11px] font-normal border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 bg-white outline-none"
                                        />
                                      </div>
                                    </th>

                                    <th className="py-2.5 px-4">
                                      CALCULATED ARRIVAL
                                    </th>

                                    <th className="py-2.5 px-4 text-right min-w-[160px]">
                                      <div className="flex flex-col space-y-1 items-end">
                                        <div className="flex items-center space-x-1">
                                          <span>STATUS</span>
                                          <Filter className="w-2.5 h-2.5 text-sky-600" />
                                        </div>
                                        <select
                                          value={subFilters.status}
                                          onChange={(e) =>
                                            updateSubFilter(
                                              supp.name,
                                              'status',
                                              e.target
                                                .value as SubTableStatusFilter,
                                            )
                                          }
                                          className="w-36 p-1 text-[11px] font-semibold border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 bg-white text-slate-700 outline-none"
                                        >
                                          <option value="ALL">All Status</option>
                                          <option value="ON_TIME">
                                            On Time
                                          </option>
                                          <option value="ALL_DELAYED">
                                            All Delayed
                                          </option>
                                          <option value="1_WK">
                                            1 Week Late
                                          </option>
                                          <option value="2_WKS">
                                            2 Weeks Late
                                          </option>
                                          <option value="3_WKS">
                                            3 Weeks Late
                                          </option>
                                          <option value="4_WKS">
                                            4 Weeks Late
                                          </option>
                                          <option value="MORE_4_WKS">
                                            &gt; 4 Weeks Late
                                          </option>
                                        </select>
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {visibleItems.length === 0 ? (
                                    <tr>
                                      <td
                                        colSpan={7}
                                        className="py-4 px-4 text-center text-slate-400 text-xs"
                                      >
                                        No items match the column filters.
                                      </td>
                                    </tr>
                                  ) : (
                                    visibleItems.map((it) => {
                                      const isOnTime =
                                        it.statusInfo.bucket === 'ON_TIME';
                                      const badgeColor = isOnTime
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        : 'bg-rose-100 text-rose-800 border-rose-200';
                                      const formattedEta = formatLocalDateISO(
                                        it.etaDate,
                                      );
                                      const formattedCalc = formatLocalDateISO(
                                        it.statusInfo.calcArrival,
                                      );

                                      return (
                                        <tr
                                          key={it.id}
                                          className="hover:bg-slate-50/80 text-xs text-slate-700 transition-colors border-b border-slate-200/60"
                                        >
                                          <td className="py-2.5 px-4 font-bold text-slate-900">
                                            {it.materialCode}
                                          </td>
                                          <td className="py-2.5 px-4 text-slate-600 font-mono">
                                            {it.poNumber}
                                          </td>
                                          <td className="py-2.5 px-4 text-right font-semibold text-slate-800">
                                            {it.qty.toLocaleString()}
                                          </td>
                                          <td className="py-2.5 px-4 text-center">
                                            <span
                                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                it.currency === 'CNY'
                                                  ? 'bg-amber-100 text-amber-800'
                                                  : 'bg-blue-100 text-blue-800'
                                              }`}
                                            >
                                              {it.currency}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-4 text-slate-600 font-medium">
                                            {formattedEta}
                                          </td>
                                          <td className="py-2.5 px-4 font-semibold text-slate-800">
                                            {formattedCalc}
                                            <span className="text-[10px] text-slate-400 font-normal ml-1">
                                              (+{it.statusInfo.leadDays}d)
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-4 text-right">
                                            <span
                                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badgeColor}`}
                                            >
                                              {isOnTime ? (
                                                <CheckCircle2 className="w-3 h-3" />
                                              ) : (
                                                <AlertTriangle className="w-3 h-3" />
                                              )}
                                              <span>{it.statusInfo.label}</span>
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
