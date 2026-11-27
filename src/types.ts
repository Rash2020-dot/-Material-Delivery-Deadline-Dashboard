export type MaterialCategory = 'Fabric' | 'Lace' | 'Elastic' | 'Other';

export type DelayBucket =
  | 'ON_TIME'
  | '1_WK'
  | '2_WKS'
  | '3_WKS'
  | '4_WKS'
  | 'MORE_4_WKS';

export type OriginCategoryFilter = 'ALL' | 'CNY' | 'NON_CNY';

export type DeadlineMode = 'basic' | 'sub';

export type SubTableStatusFilter =
  | 'ALL'
  | 'ON_TIME'
  | 'ALL_DELAYED'
  | '1_WK'
  | '2_WKS'
  | '3_WKS'
  | '4_WKS'
  | 'MORE_4_WKS';

export interface RawMaterialItem {
  id: number;
  supplier: string;
  materialCode: string;
  poNumber: string;
  qty: number;
  currency: string;
  etaDate: Date;
}

export interface ItemStatusInfo {
  calcArrival: Date;
  leadDays: number;
  diffDays: number;
  weeksLate: number;
  bucket: DelayBucket;
  label: string;
}

export interface ProcessedMaterialItem extends RawMaterialItem {
  category: MaterialCategory;
  fatherCode: string;
  statusInfo: ItemStatusInfo;
}

export interface BucketTotals {
  ON_TIME: number;
  '1_WK': number;
  '2_WKS': number;
  '3_WKS': number;
  '4_WKS': number;
  MORE_4_WKS: number;
}

export interface CategorySummaryRow extends BucketTotals {
  category: MaterialCategory;
  total: number;
}

export interface FatherCodeGroup {
  fatherCode: string;
  items: ProcessedMaterialItem[];
  buckets: BucketTotals;
  totalQty: number;
}

export interface SupplierGroup {
  name: string;
  items: ProcessedMaterialItem[];
  buckets: BucketTotals;
  totalQty: number;
}

export type DataSourceMode = 'none' | 'demo' | 'upload';
