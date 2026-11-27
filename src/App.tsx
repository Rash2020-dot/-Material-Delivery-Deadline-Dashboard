import React, { useMemo, useRef, useState } from 'react';
import {
  CalendarCheck,
  Database,
  Download,
  FileCode2,
  FileSpreadsheet,
  Play,
  RotateCcw,
  Search,
  Truck,
  X,
} from 'lucide-react';
import {
  DataSourceMode,
  DeadlineMode,
  OriginCategoryFilter,
  ProcessedMaterialItem,
  RawMaterialItem,
} from './types';
import {
  buildMonthCycleGroups,
  calculateItemStatus,
  downloadSampleExcelTemplate,
  exportFilteredToExcel,
  getDeadlineDate,
  getDemoMaterialData,
  getFatherCode,
  getMaterialCategory,
  parseExcelFile,
  parsePeriodKey,
} from './utils/deliveryUtils';
import { exportFullViewToHtml } from './utils/exportHtmlReport';
import { UploadDropzone } from './components/UploadDropzone';
import { CategorySummaryTable } from './components/CategorySummaryTable';
import { SupplierAccordionTable } from './components/SupplierAccordionTable';
import { AnalyticsCharts } from './components/AnalyticsCharts';

const DEFAULT_PERIOD_KEY = '2026-8'; // September 2026

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const categoryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const delayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [rawMaterialData, setRawMaterialData] = useState<RawMaterialItem[]>([]);
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>('none');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter state
  const [deadlineMode, setDeadlineMode] = useState<DeadlineMode>('basic');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] =
    useState<string>(DEFAULT_PERIOD_KEY);
  const [originCategory, setOriginCategory] =
    useState<OriginCategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const resetAllFilters = () => {
    setSelectedSupplier('ALL');
    setDeadlineMode('basic');
    setSelectedPeriod(DEFAULT_PERIOD_KEY);
    setOriginCategory('ALL');
    setSearchQuery('');
  };

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    try {
      const parsed = await parseExcelFile(file);
      setRawMaterialData(parsed);
      setDataSourceMode('upload');
      setUploadedFileName(file.name);
      resetAllFilters();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Error parsing Excel file. Please ensure it is a valid format.',
      );
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileProcess(file);
    }
  };

  const handleRunDemoData = () => {
    setErrorMessage(null);
    const demoItems = getDemoMaterialData();
    setRawMaterialData(demoItems);
    setDataSourceMode('demo');
    setUploadedFileName('');
    resetAllFilters();
  };

  const handleClearData = () => {
    setRawMaterialData([]);
    setDataSourceMode('none');
    setUploadedFileName('');
    setErrorMessage(null);
    resetAllFilters();
  };

  const uniqueSuppliers = useMemo(() => {
    return [...new Set(rawMaterialData.map((item) => item.supplier))].sort();
  }, [rawMaterialData]);

  const monthCycleGroups = useMemo(() => {
    const extraYears = rawMaterialData.map((item) =>
      item.etaDate.getFullYear(),
    );
    return buildMonthCycleGroups(deadlineMode, extraYears);
  }, [deadlineMode, rawMaterialData]);

  const targetDeadline = useMemo(() => {
    const { year, monthIndex } = parsePeriodKey(selectedPeriod);
    return getDeadlineDate(monthIndex, year, deadlineMode);
  }, [selectedPeriod, deadlineMode]);

  const formattedDeadline = useMemo(() => {
    return targetDeadline.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [targetDeadline]);

  const shortDeadline = useMemo(() => {
    return targetDeadline.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [targetDeadline]);

  const filteredMaterialData: ProcessedMaterialItem[] = useMemo(() => {
    if (rawMaterialData.length === 0) return [];
    const searchVal = searchQuery.toLowerCase().trim();

    return rawMaterialData
      .map((item) => ({
        ...item,
        category: getMaterialCategory(item.materialCode),
        fatherCode: getFatherCode(item.materialCode),
        statusInfo: calculateItemStatus(item, targetDeadline),
      }))
      .filter((item) => {
        if (selectedSupplier !== 'ALL' && item.supplier !== selectedSupplier) {
          return false;
        }

        if (originCategory === 'CNY' && item.currency !== 'CNY') return false;
        if (originCategory === 'NON_CNY' && item.currency === 'CNY') {
          return false;
        }

        if (searchVal) {
          const matchSupp = item.supplier.toLowerCase().includes(searchVal);
          const matchCode = item.materialCode.toLowerCase().includes(searchVal);
          const matchPO = item.poNumber.toLowerCase().includes(searchVal);
          if (!matchSupp && !matchCode && !matchPO) return false;
        }

        return true;
      });
  }, [
    rawMaterialData,
    targetDeadline,
    selectedSupplier,
    originCategory,
    searchQuery,
  ]);

  const grandTotalQty = useMemo(() => {
    return filteredMaterialData.reduce((sum, i) => sum + i.qty, 0);
  }, [filteredMaterialData]);

  const deadlineModeLabel =
    deadlineMode === 'sub' ? 'Sub Month' : 'Basic Month';

  const handleExportExcel = () => {
    if (filteredMaterialData.length === 0) {
      setErrorMessage('No filtered rows available to export.');
      return;
    }
    setErrorMessage(null);
    exportFilteredToExcel(filteredMaterialData);
  };

  const handleExportHtml = () => {
    if (filteredMaterialData.length === 0) {
      setErrorMessage('No filtered rows available to export.');
      return;
    }
    setErrorMessage(null);

    const activeOption = monthCycleGroups
      .flatMap((g) => g.options)
      .find((opt) => opt.value === selectedPeriod);

    const periodLabel = activeOption?.label ?? formattedDeadline;

    const categoryChartDataUrl = categoryCanvasRef.current
      ? categoryCanvasRef.current.toDataURL('image/png')
      : null;
    const delayChartDataUrl = delayCanvasRef.current
      ? delayCanvasRef.current.toDataURL('image/png')
      : null;

    exportFullViewToHtml({
      items: filteredMaterialData,
      formattedDeadline,
      deadlineModeLabel,
      basicMonthLabel: periodLabel,
      selectedSupplier,
      originCategory,
      searchQuery,
      dataSourceLabel:
        dataSourceMode === 'demo'
          ? 'Demo Data (Synthetic)'
          : uploadedFileName || 'Uploaded Excel File',
      categoryChartDataUrl,
      delayChartDataUrl,
    });
  };

  const hasData = dataSourceMode !== 'none' && rawMaterialData.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#0f172a]">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="bg-sky-500 text-white p-2 rounded-lg flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight leading-none text-white truncate">
                Material Delivery Deadline Dashboard
              </h1>
              <p className="text-xs text-slate-400 mt-1 truncate">
                Delay Tracking &amp; Lead-Time Analytics &bull;{' '}
                <span className="text-sky-400 font-medium">
                  Developed by Rashmi Peiris
                </span>
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 space-x-2 shrink-0">
            <span className="text-slate-400">
              Target Deadline ({deadlineMode === 'sub' ? 'Sub' : 'Basic'}):
            </span>
            <span className="text-sky-400 font-bold">
              {hasData ? formattedDeadline : shortDeadline}
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {!hasData ? (
              <button
                type="button"
                onClick={handleRunDemoData}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Demo Data</span>
              </button>
            ) : (
              <>
                {dataSourceMode === 'upload' && (
                  <button
                    type="button"
                    onClick={handleRunDemoData}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg transition-colors hidden sm:flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5 text-sky-400" />
                    <span>Load Demo Data</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Upload New Excel</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {!hasData ? (
          <UploadDropzone
            onBrowseClick={triggerFileSelect}
            onFileDrop={(file) => void handleFileProcess(file)}
            onRunDemoData={handleRunDemoData}
            onDownloadSample={downloadSampleExcelTemplate}
            errorMessage={errorMessage}
          />
        ) : (
          <div className="space-y-6">
            {/* Active Data Source Strip (Demo vs Local Upload) */}
            {dataSourceMode === 'demo' ? (
              <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-600 text-white">
                    DEMO MODE
                  </span>
                  <span className="font-medium text-slate-700">
                    Viewing sample synthetic data. Upload your own Excel file
                    anytime &mdash; your files stay local in your browser and
                    are never saved to the code.
                  </span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={downloadSampleExcelTemplate}
                    className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-white hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Sample Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearData}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Close</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Loaded Local File:</span>
                  <span className="font-mono text-emerald-800">
                    {uploadedFileName}
                  </span>
                  <span className="text-emerald-700/80 hidden sm:inline">
                    (Browser memory only &mdash; not saved to code)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearData}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-white/80 hover:bg-white border border-emerald-200 rounded-lg transition-colors inline-flex items-center space-x-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear File</span>
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-xs font-medium flex items-center justify-between">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-500 hover:text-rose-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Deadline Mode Tabs: Basic Month vs Sub Month */}
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <div
                className="inline-flex items-center bg-slate-100 p-1 rounded-xl gap-1"
                role="tablist"
                aria-label="Deadline Month Type"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={deadlineMode === 'basic'}
                  onClick={() => setDeadlineMode('basic')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-2 ${
                    deadlineMode === 'basic'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <span>Basic Month</span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      deadlineMode === 'basic'
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    +2M &bull; 10th
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={deadlineMode === 'sub'}
                  onClick={() => setDeadlineMode('sub')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-2 ${
                    deadlineMode === 'sub'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <span>Sub Month</span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      deadlineMode === 'sub'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    +1M &bull; 26th
                  </span>
                </button>
              </div>

              <div className="text-xs text-slate-500 px-2">
                {deadlineMode === 'basic' ? (
                  <span>
                    <strong className="text-slate-700">Basic Month Rule:</strong>{' '}
                    Target deadline is the <strong>10th</strong>, two months
                    ahead (e.g. Jan 2027 &rarr; 10 Mar 2027)
                  </span>
                ) : (
                  <span>
                    <strong className="text-sky-700">Sub Month Rule:</strong>{' '}
                    Target deadline is the <strong>26th</strong>, one month
                    ahead (e.g. Nov 2026 &rarr; 26 Dec 2026, Dec 2026 &rarr; 26
                    Jan 2027)
                  </span>
                )}
              </div>
            </div>

            {/* Controls / Filters Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Supplier Filter Dropdown */}
                <div className="flex flex-col min-w-[200px]">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Supplier Filter
                  </label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-sky-500 p-2.5 font-medium outline-none"
                  >
                    <option value="ALL">All Suppliers</option>
                    {uniqueSuppliers.map((supplier) => (
                      <option key={supplier} value={supplier}>
                        {supplier}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Basic Month / Sub Month Dropdown */}
                <div className="flex flex-col min-w-[230px]">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {deadlineMode === 'sub' ? 'Sub Month' : 'Basic Month'}
                  </label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-sky-500 p-2.5 font-medium outline-none"
                  >
                    {monthCycleGroups.map((group) => (
                      <optgroup key={group.groupLabel} label={group.groupLabel}>
                        {group.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Category / Origin Dropdown */}
                <div className="flex flex-col min-w-[180px]">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Origin Category
                  </label>
                  <select
                    value={originCategory}
                    onChange={(e) =>
                      setOriginCategory(e.target.value as OriginCategoryFilter)
                    }
                    className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-sky-500 p-2.5 font-medium outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="CNY">China Category (CNY +14d)</option>
                    <option value="NON_CNY">
                      Other Category (Non-CNY +6d)
                    </option>
                  </select>
                </div>

                {/* Global Search Input */}
                <div className="flex flex-col flex-1 min-w-[200px]">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Global Search
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Code, PO#, Supplier..."
                      className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl pl-9 pr-3 p-2.5 focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-end lg:self-center pt-2 lg:pt-0">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportHtml}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>Export Full HTML</span>
                </button>
              </div>
            </div>

            {/* Target Deadline Banner */}
            <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-sky-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 font-bold text-lg shrink-0">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-sky-300 font-medium">
                    Active {deadlineModeLabel} Deadline
                  </div>
                  <div className="text-lg font-bold text-white">
                    Target Delivery Deadline: {formattedDeadline}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-xs bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
                <span className="text-slate-400">Total Filtered Quantity:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {Number(grandTotalQty.toFixed(1)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* SECTION 1: Material Category Summary Report */}
            <CategorySummaryTable items={filteredMaterialData} />

            {/* SECTION 2: Supplier-Wise Summary Breakdown Table with Accordion Column Filters */}
            <SupplierAccordionTable items={filteredMaterialData} />

            {/* SECTION 3: Visual Analytics Charts */}
            <AnalyticsCharts
              items={filteredMaterialData}
              categoryCanvasRef={categoryCanvasRef}
              delayCanvasRef={delayCanvasRef}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-4 text-center text-xs border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            Material Delivery Deadline Dashboard &bull; Developed by{' '}
            <span className="text-sky-400 font-semibold">Rashmi Peiris</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
