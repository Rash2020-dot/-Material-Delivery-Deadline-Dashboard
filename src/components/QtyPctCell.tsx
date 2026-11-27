interface QtyPctCellProps {
  qty: number;
  total: number;
}

export function QtyPctCell({ qty, total }: QtyPctCellProps) {
  if (!qty || qty <= 0) {
    return <>-</>;
  }

  const pct = total > 0 ? ((qty / total) * 100).toFixed(1) : '0.0';
  const formattedQty = Number(qty.toFixed(1)).toLocaleString();

  return (
    <div className="leading-tight">
      <span className="font-semibold">{formattedQty}</span>
      <span className="text-[10px] block font-normal opacity-75 mt-0.5">
        ({pct}%)
      </span>
    </div>
  );
}
