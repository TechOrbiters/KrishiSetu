# KRISHISETU — Government Mandi Price API Architecture & Specification

## Overview

KRISHISETU connects directly to the official Government of India Open Government Data (OGD) Mandi Price API (AGMARKNET feed) on `data.gov.in`.

- **Official Source**: Ministry of Agriculture and Farmers Welfare, Department of Agriculture and Farmers Welfare.
- **Resource Title**: `"Current Daily Price of Various Commodities from Various Markets (Mandi)"`
- **Resource ID**: `9ef84268-d588-465a-a308-a864a43d0070`
- **API Endpoint**: `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`
- **Authentication**: `DATA_GOV_API_KEY` (Stored strictly server-side in `.env.local`).

---

## Data Flow Architecture

```
+-------------------------------------------------------------------------+
|                           FARMER BROWSER                                |
|                                                                         |
|  Bazaar Bhav Page                      Farmer Dashboard                 |
|  (/farmer/market-prices)               (Today's Market Card)            |
+------------------------------------^------------------------------------+
                                     |
                                     | Typed Client Queries (getMarketPrices)
                                     v
+-------------------------------------------------------------------------+
|                             NEXT.JS API                                 |
|                                                                         |
|  GET /api/market-prices  ----->  MarketPriceService                     |
|                                         |                               |
|                                         +--> Query Cached Records       |
|                                         |    from Supabase market_prices|
|                                         |                               |
|  POST /api/market-prices/sync  --------+--> DataGovMarketProvider       |
|                                              (data.gov.in AGMARKNET)    |
+-------------------------------------------------------------------------+
```

---

## Field Normalization & Unit Safety

Native AGMARKNET records are normalized into canonical `MarketPriceRecord` objects:

| Source AGMARKNET Field | Canonical Field | Type | Description |
| :--- | :--- | :--- | :--- |
| `state` | `state` | string | State Name (e.g., `"Uttar Pradesh"`) |
| `district` | `district` | string | District Name (e.g., `"Lucknow"`, `"Barabanki"`) |
| `market` | `market` | string | Mandi / APMC Name (e.g., `"Lucknow APMC"`) |
| `commodity` | `commodity` | string | Crop Name (e.g., `"Wheat"`, `"Potato"`, `"Paddy(Common)"`) |
| `variety` | `variety` | string | Crop Variety (e.g., `"Dara"`, `"PBW-343"`) |
| `grade` | `grade` | string | Quality Grade (e.g., `"FAQ"`, `"Medium"`) |
| `arrival_date` | `rawArrivalDate` / `priceDate` | string | Native `"DD/MM/YYYY"` & ISO `"YYYY-MM-DD"` |
| `min_price` | `minPrice` | number | Minimum Wholesale Price (₹ per quintal) |
| `max_price` | `maxPrice` | number | Maximum Wholesale Price (₹ per quintal) |
| `modal_price` | `modalPrice` | number | Modal/Average Wholesale Price (₹ per quintal) |
| *Calculated* | `pricePerKg` | number | `Math.round((modalPrice / 100) * 10) / 10` (₹/kg) |

> **Unit Safety Rule**: The native source unit is `"₹/quintal"`. Conversions to `"₹/kg"` are explicit (`modalPrice / 100`) and never relabelled implicitly.

---

## Environment Configuration

```bash
# Server-Side Only (Never expose to browser or client bundle)
DATA_GOV_API_KEY=579b464db66ec23bdd000001ebe9a985b4644cb5728a12ccf6236f06
```

---

## API Endpoints

### 1. `GET /api/market-prices`
Returns paginated, filtered market records.

- **Query Parameters**: `state`, `district`, `market`, `commodity`, `page`, `limit`
- **Response**:
```json
{
  "success": true,
  "data": {
    "prices": [
      {
        "id": "uttar-pradesh-lucknow-lucknow-apmc-wheat-dara-05-09-2026",
        "commodity": "Wheat",
        "variety": "Dara",
        "state": "Uttar Pradesh",
        "district": "Lucknow",
        "market": "Lucknow APMC",
        "minPrice": 2400,
        "maxPrice": 2600,
        "modalPrice": 2500,
        "pricePerKg": 25.0,
        "unit": "₹/quintal",
        "priceDate": "2026-09-05",
        "rawArrivalDate": "05/09/2026",
        "source": "Government of India OGD / AGMARKNET"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 100 },
    "meta": {
      "source": "Government of India OGD / AGMARKNET",
      "lastUpdated": "2026-09-05T13:00:49Z"
    }
  }
}
```

### 2. `POST /api/market-prices/sync`
Triggers synchronization from `data.gov.in` into Supabase PostgreSQL `market_prices` table.

### 3. `GET /api/market-prices/summary`
Returns top 4 summary KPI cards for Wheat, Potato, Paddy, and Mustard.
