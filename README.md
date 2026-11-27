# Material Delivery Deadline & Delay Tracking Dashboard

A client-side **Material Delivery Deadline Dashboard** for delay tracking, lead-time analytics, category prefix summaries, and supplier-level breakdowns from Excel reports.

Developed by **Rashmi Peiris**.

## Key Features

- **100% Client-Side Privacy**: Uploaded Excel files (`.xlsx`, `.xls`, `.csv`) are parsed directly in browser memory using SheetJS (`xlsx`). Your private files are **never saved into the codebase** or uploaded to any external server.
- **Built-in Demo Data Mode**: Click **Run Demo Data** on the home screen (or **Demo Data** in the header) to explore all charts, filters, and supplier accordions using synthetic sample records.
- **Sample Excel Download**: Download a ready-to-use `Sample_Material_Delivery_Data.xlsx` template directly from the upload screen.
- **Automated Lead-Time Calculation**:
  - China Origin (`CNY`): `ETA Date + 14 days`
  - Non-China Origin (`Non-CNY`): `ETA Date + 6 days`
- **Basic Month Deadline Mapping**: Automatically computes the 10th-of-month target delivery deadline (`Basic Month + 2 months`).
- **Material Category Prefix Rules**:
  - **Fabric**: `TY`, `TF`, `TU`, `PI`, `FO`, `TS`
  - **Lace**: `BA`, `BI`, `BZ`
  - **Elastic**: `EL`
  - **Other**: All remaining prefixes
- **Interactive Filtering & Accordion Drill-Down**:
  - Global filters for Supplier, Basic Month, Origin Category, and free-text search.
  - Expandable supplier breakdown rows with inline per-column filters (Material Item, PO Number, ETA Date, Status).
- **Visual Analytics & Export**:
  - Category Quantity Distribution Doughnut Chart & Delay Severity Stacked Bar Chart (Chart.js).
  - One-click export of filtered results to `Material_Delivery_Report.xlsx`.
  - One-click **Export Full HTML** to download a self-contained, offline-ready full view HTML report (including tables, interactive supplier accordions & column filters, and embedded charts) ready to share or upload anywhere.

## Expected Excel Columns

| Field | Detected Column Header Names |
| --- | --- |
| **Supplier** | `Supplier/Supplying Plant`, `Supplying Plant`, `Supplier`, `Vendor` |
| **PO Number** | `Purchasing Document`, `Purchasing Doc`, `PO Number`, `PO` |
| **Material** | `Material`, `Material Code`, `Mat Item` |
| **Quantity** | `Scheduled Quantity`, `Scheduled Quant`, `Quantity`, `Qty` |
| **Currency** | `Currency`, `Curr`, `Doc Currency`, `Order Currency` |
| **Delivery Date** | `Delivery Date`, `Del Date`, `ETA Date`, `ETA`, `Expected Date` |

*(Excluded suppliers configured in `src/utils/deliveryUtils.ts`: YKK Lanka, Tomotex, Redmark Asia, JS Textiles.)*

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## GitHub Pages Deployment

This repository includes an automatic GitHub Actions workflow (`.github/workflows/deploy.yml`) and uses relative asset paths (`base: './'`) in `vite.config.ts`.

1. Push your code to the `main` branch on GitHub.
2. Open your repository on GitHub and go to **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions** (do **not** select "Deploy from a branch", as browsers cannot run raw `.tsx` files).
4. Wait ~1 minute for the **Deploy to GitHub Pages** workflow in the **Actions** tab to finish, then open your GitHub Pages link.

## Privacy Note for GitHub

`.gitignore` is configured to ignore `*.xlsx`, `*.xls`, and `*.csv` files so private production spreadsheets are never accidentally committed to your GitHub repository. Only synthetic demo records exist in `src/data/demoData.ts`.
