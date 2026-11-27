import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { BarChart3, PieChart } from 'lucide-react';
import { MaterialCategory, ProcessedMaterialItem } from '../types';
import { MATERIAL_CATEGORIES } from '../utils/deliveryUtils';

Chart.register(...registerables);

interface AnalyticsChartsProps {
  items: ProcessedMaterialItem[];
  categoryCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  delayCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export function AnalyticsCharts({
  items,
  categoryCanvasRef: externalCategoryRef,
  delayCanvasRef: externalDelayRef,
}: AnalyticsChartsProps) {
  const internalCategoryRef = useRef<HTMLCanvasElement | null>(null);
  const internalDelayRef = useRef<HTMLCanvasElement | null>(null);
  const categoryCanvasRef = externalCategoryRef ?? internalCategoryRef;
  const delayCanvasRef = externalDelayRef ?? internalDelayRef;
  const categoryChartRef = useRef<Chart | null>(null);
  const delayChartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const catTotals: Record<MaterialCategory, number> = {
      Fabric: 0,
      Lace: 0,
      Elastic: 0,
      Other: 0,
    };

    const delayData: Record<MaterialCategory, { ON_TIME: number; LATE: number }> = {
      Fabric: { ON_TIME: 0, LATE: 0 },
      Lace: { ON_TIME: 0, LATE: 0 },
      Elastic: { ON_TIME: 0, LATE: 0 },
      Other: { ON_TIME: 0, LATE: 0 },
    };

    items.forEach((item) => {
      if (catTotals[item.category] !== undefined) {
        catTotals[item.category] += item.qty;
        if (item.statusInfo.bucket === 'ON_TIME') {
          delayData[item.category].ON_TIME += item.qty;
        } else {
          delayData[item.category].LATE += item.qty;
        }
      }
    });

    if (categoryCanvasRef.current) {
      if (categoryChartRef.current) {
        categoryChartRef.current.destroy();
      }
      categoryChartRef.current = new Chart(categoryCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: MATERIAL_CATEGORIES,
          datasets: [
            {
              data: MATERIAL_CATEGORIES.map((c) => catTotals[c]),
              backgroundColor: ['#0284c7', '#06b6d4', '#10b981', '#64748b'],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
          },
        },
      });
    }

    if (delayCanvasRef.current) {
      if (delayChartRef.current) {
        delayChartRef.current.destroy();
      }
      delayChartRef.current = new Chart(delayCanvasRef.current, {
        type: 'bar',
        data: {
          labels: MATERIAL_CATEGORIES,
          datasets: [
            {
              label: 'On Time',
              data: MATERIAL_CATEGORIES.map((c) => delayData[c].ON_TIME),
              backgroundColor: '#10b981',
            },
            {
              label: 'Delayed',
              data: MATERIAL_CATEGORIES.map((c) => delayData[c].LATE),
              backgroundColor: '#f43f5e',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true },
            y: { stacked: true },
          },
          plugins: {
            legend: { position: 'bottom' },
          },
        },
      });
    }

    return () => {
      if (categoryChartRef.current) {
        categoryChartRef.current.destroy();
        categoryChartRef.current = null;
      }
      if (delayChartRef.current) {
        delayChartRef.current.destroy();
        delayChartRef.current = null;
      }
    };
  }, [items]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Share Donut Chart */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-sky-600" />
            <span>Category Quantity Distribution</span>
          </h3>
          <p className="text-xs text-slate-500">
            Volume share by Material Category
          </p>
        </div>
        <div className="relative h-64 w-full flex items-center justify-center">
          <canvas ref={categoryCanvasRef} />
        </div>
      </div>

      {/* Delay Breakdown Stacked Bar Chart */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-sky-600" />
            <span>Delay Severity by Category</span>
          </h3>
          <p className="text-xs text-slate-500">
            Breakdown of On Time vs. Weeks Delayed per category
          </p>
        </div>
        <div className="relative h-64 w-full">
          <canvas ref={delayCanvasRef} />
        </div>
      </div>
    </div>
  );
}
