import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FolderOpen,
  Play,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface UploadDropzoneProps {
  onBrowseClick: () => void;
  onFileDrop: (file: File) => void;
  onRunDemoData: () => void;
  onDownloadSample: () => void;
  errorMessage: string | null;
}

export function UploadDropzone({
  onBrowseClick,
  onFileDrop,
  onRunDemoData,
  onDownloadSample,
  errorMessage,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 shadow-sm max-w-2xl mx-auto my-12 ${
        isDragging
          ? 'border-sky-500 bg-sky-50/50'
          : 'border-slate-300 hover:border-sky-500'
      }`}
    >
      <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
        <FileSpreadsheet className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-2">
        Upload Material Delivery Excel File
      </h2>
      <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto">
        Drag and drop your Excel sheet (<code>.xlsx</code>, <code>.xls</code>,{' '}
        <code>.csv</code>) here or click below to select file.
      </p>

      {errorMessage && (
        <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-center gap-2 max-w-lg mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onBrowseClick}
          className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg inline-flex items-center space-x-2 cursor-pointer"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Browse Excel File</span>
        </button>

        <button
          type="button"
          onClick={onRunDemoData}
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg inline-flex items-center space-x-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Run Demo Data</span>
        </button>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onDownloadSample}
          className="text-xs font-semibold text-sky-600 hover:text-sky-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Sample Excel Template (.xlsx)</span>
        </button>
        <p className="text-[11px] text-slate-400 inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            Files are processed locally in your browser &mdash; never stored or
            committed to code.
          </span>
        </p>
      </div>

      {/* Column Info */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-left">
        <h3 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-3">
          Detected Excel Column Mapping:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
            <strong className="text-slate-800">Supplier:</strong>{' '}
            <code>Supplier/Supplying Plant</code>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
            <strong className="text-slate-800">PO Number:</strong>{' '}
            <code>Purchasing Document</code>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
            <strong className="text-slate-800">Material:</strong>{' '}
            <code>Material</code>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
            <strong className="text-slate-800">Quantity:</strong>{' '}
            <code>Scheduled Quantity</code>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
            <strong className="text-slate-800">Delivery Date:</strong>{' '}
            <code>Delivery Date</code>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
            <strong className="text-slate-800">Exclusions:</strong> YKK,
            Tomotex, Redmark, JS Textiles
          </div>
        </div>
      </div>
    </div>
  );
}
