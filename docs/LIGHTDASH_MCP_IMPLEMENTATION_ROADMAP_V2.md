# Lightdash MCP Server - Implementation Roadmap (Updated)

**Extending**: [syucream/lightdash-mcp-server](https://github.com/syucream/lightdash-mcp-server)

**Reference**: [Official Lightdash Cloud MCP](https://docs.lightdash.com/guides/lightdash-mcp)

**Last Updated**: October 27, 2025

---

## ⚠️ Important Updates

This roadmap has been updated to reflect:
1. **Current API endpoints** (not deprecated)
2. **Catalog-based discovery** (official approach used by Lightdash Cloud MCP)
3. **Proper query execution patterns** from official implementation
4. **Removed deprecated endpoints** like `ListChartSummariesInProject`

---

## Table of Contents

- [Currently Implemented](#currently-implemented)
- [Official Lightdash Cloud MCP Tools](#official-lightdash-cloud-mcp-tools-reference)
- [Phase 1: Core Discovery & Query Execution](#phase-1-core-discovery--query-execution-high-priority-)
- [Phase 2: Enhanced Content Discovery](#phase-2-enhanced-content-discovery-medium-priority-)
- [Phase 3: Advanced Features](#phase-3-advanced-features-lower-priority-)
- [Resources Implementation](#resources-implementation)
- [Prompts Implementation](#prompts-implementation)
- [Implementation Notes](#implementation-notes)
- [Testing Checklist](#testing-checklist)

---

## Currently Implemented

The following tools are already implemented in syucream/lightdash-mcp-server:

- ✅ `list_projects` - List all projects
- ✅ `get_project` - Get project details
- ✅ `list_spaces` - List spaces in a project
- ✅ `list_charts` - List charts in a project  
- ✅ `list_dashboards` - List dashboards in a project
- ✅ `get_custom_metrics` - Get custom metrics
- ✅ `get_catalog` - Get full catalog
- ✅ `get_metrics_catalog` - Get metrics catalog
- ✅ `get_charts_as_code` - Export charts as code
- ✅ `get_dashboards_as_code` - Export dashboards as code

---

## Official Lightdash Cloud MCP Tools (Reference)

The Official Lightdash Cloud MCP exposes these tools:

1. **Get Lightdash version** - Check version
2. **List projects** - View all accessible projects
3. **Set active project** - Switch context between projects (required before accessing data)
4. **Get current project** - Check which project is currently active
5. **Find explores** - Browse available data models with search
6. **Find fields** - Search for specific metrics and dimensions
7. **Find dashboards** - Locate dashboards by name or content
8. **Find charts** - Search through saved charts
9. **Execute metric queries** - Run queries and get results (THE critical feature)

**Key Pattern**: The official implementation uses **catalog-based search** rather than direct REST endpoints for discovery.

---

## Phase 1: Core Discovery & Query Execution (HIGH PRIORITY) 🔥

### 1. `run_underlying_data_query` ⭐ **MOST CRITICAL**

**Purpose**: Execute queries against explores and return actual data results - this is THE most important endpoint

**API Endpoint**:
```
POST /api/v1/projects/{projectUuid}/explores/{exploreId}/runUnderlyingDataQuery
```

**Why This Endpoint**: This is the **current, non-deprecated endpoint** for executing metric queries. It's what the Lightdash frontend uses and what the Official MCP implementation uses.

**Parameters**:
```typescript
{
  projectUuid: string;     // Required: Project UUID
  exploreId: string;       // Required: Explore/table name
  dimensions: string[];    // Optional: Dimension field IDs
  metrics: string[];       // Optional: Metric field IDs
  filters?: {              // Optional: Filters
    dimensions?: FilterGroup;
    metrics?: FilterGroup;
  };
  sorts?: Array<{         // Optional: Sorts
    fieldId: string;
    descending: boolean;
  }>;
  limit?: number;         // Optional: Row limit (default 500, max 5000)
  tableCalculations?: any[]; // Optional: Custom calculations
}
```

**Request Body Example**:
```json
{
  "dimensions": ["orders_created_date", "orders_status"],
  "metrics": ["orders_total_revenue", "orders_count"],
  "filters": {
    "dimensions": {
      "id": "filter_1",
      "and": [
        {
          "id": "date_filter",
          "target": {
            "fieldId": "orders_created_date"
          },
          "operator": "inThePast",
          "values": [30]
        }
      ]
    }
  },
  "sorts": [
    {
      "fieldId": "orders_total_revenue",
      "descending": true
    }
  ],
  "limit": 500
}
```

**Response Example**:
```json
{
  "status": "ok",
  "results": {
    "rows": [
      {
        "orders_created_date": {"value": {"raw": "2025-01-01"}},
        "orders_status": {"value": {"raw": "completed"}},
        "orders_total_revenue": {"value": {"raw": 15000.50}},
        "orders_count": {"value": {"raw": 45}}
      }
    ],
    "fields": {
      "orders_created_date": {...},
      "orders_status": {...},
      "orders_total_revenue": {...},
      "orders_count": {...}
    }
  }
}
```

**Implementation Notes**:
- This is the FIRST priority - enables actual data analysis
- Response format includes nested `{value: {raw: ...}}` structure
- Supports complex filters, sorts, and calculations
- Has rate limiting - implement caching
- Default limit 500, maximum 5000 rows

---

### 2. `get_catalog_search`

**Purpose**: Search across all catalog items (explores, fields, dashboards, charts) - this is how the official MCP does discovery

**API Endpoint**:
```
GET /api/v1/projects/{projectUuid}/dataCatalog
```

**Query Parameters**:
```
?search={searchTerm}&type={field|table|dashboard|space|chart}&limit={number}
```

**Parameters**:
```typescript
{
  projectUuid: string;       // Required: Project UUID
  search?: string;           // Optional: Search term
  type?: 'field' | 'table' | 'dashboard' | 'space' | 'chart'; // Optional: Filter by type
  limit?: number;            // Optional: Result limit
  page?: number;             // Optional: Pagination
}
```

**Response Example**:
```json
{
  "status": "ok",
  "results": [
    {
      "uuid": "catalog-item-uuid",
      "name": "orders_total_revenue",
      "label": "Total Revenue",
      "description": "Sum of all order amounts",
      "type": "field",
      "fieldType": "metric",
      "tableName": "orders",
      "tableLabel": "Orders"
    },
    {
      "uuid": "explore-uuid",
      "name": "orders",
      "label": "Orders",
      "description": "Order transactions",
      "type": "table"
    }
  ]
}
```

**Why**: This is the OFFICIAL way to search for fields, explores, dashboards. It's what powers the Lightdash Cloud MCP `find_fields`, `find_explores`, `find_dashboards` tools.

---

### 3. `get_explore_with_full_schema`

**Purpose**: Get complete explore schema with ALL metrics and dimensions - essential for building queries

**API Endpoint**:
```
GET /api/v1/projects/{projectUuid}/explores/{exploreId}
```

**Parameters**:
```typescript
{
  projectUuid: string;  // Required: Project UUID
  exploreId: string;    // Required: Explore name
}
```

**Response Structure**:
```json
{
  "status": "ok",
  "results": {
    "name": "orders",
    "label": "Orders",
    "tags": ["sales"],
    "baseTable": "orders",
    "tables": {
      "orders": {
        "name": "orders",
        "label": "Orders",
        "database": "analytics",
        "schema": "public",
        "sqlTable": "orders",
        "dimensions": {
          "orders_created_date": {
            "fieldType": "dimension",
            "type": "date",
            "name": "orders_created_date",
            "label": "Created Date",
            "table": "orders",
            "tableLabel": "Orders",
            "description": "When the order was created",
            "sql": "${TABLE}.created_at"
          }
        },
        "metrics": {
          "orders_total_revenue": {
            "fieldType": "metric",
            "type": "sum",
            "name": "orders_total_revenue",
            "label": "Total Revenue",
            "table": "orders",
            "description": "Sum of all order amounts",
            "sql": "${TABLE}.amount"
          }
        }
      }
    }
  }
}
```

**Why**: Needed to understand available fields before running queries. Cache this aggressively (1 hour TTL).

---

### 4. `get_explores_summary`

**Purpose**: List all available explores with basic metadata

**API Endpoint**:
```
GET /api/v1/projects/{projectUuid}/explores
```

**Parameters**:
```typescript
{
  projectUuid: string;  // Required: Project UUID
}
```

**Response Example**:
```json
{
  "status": "ok",
  "results": [
    {
      "name": "orders",
      "label": "Orders",
      "tags": ["sales", "revenue"],
      "groupLabel": "Sales"
    },
    {
      "name": "customers",
      "label": "Customers",
      "tags": ["crm"],
      "groupLabel": "CRM"
    }
  ]
}
```

**Why**: Fast way to list all available data models. Use for initial discovery.

---

### 5. `get_saved_chart_results`

**Purpose**: Get results from an existing saved chart (with applied filters)

**API Endpoint**:
```
POST /api/v1/saved/{chartUuid}/results
```

**Parameters**:
```typescript
{
  chartUuid: string;           // Required: Saved chart UUID
  invalidateCache?: boolean;   // Optional: Force refresh (default: false)
  dashboardFilters?: object;   // Optional: Override dashboard filters
  dateZoomGranularity?: string; // Optional: Time granularity
}
```

**Request Body Example** (optional overrides):
```json
{
  "dashboardFilters": {
    "dimensions": []
  },
  "invalidateCache": false
}
```

**Response Example**:
```json
{
  "status": "ok",
  "results": {
    "rows": [
      {
        "orders_created_date": {"value": {"raw": "2025-01-01"}},
        "orders_total_revenue": {"value": {"raw": 15000.50}}
      }
    ],
    "metricQuery": {
      "exploreName": "orders",
      "dimensions": ["orders_created_date"],
      "metrics": ["orders_total_revenue"]
    }
  }
}
```

**Why**: Leverage existing charts created by analysts. Very useful for common queries.

---

## Phase 2: Enhanced Content Discovery (MEDIUM PRIORITY) 📊

### 6. `get_dashboard_by_uuid`

**Purpose**: Get complete dashboard details including all tiles

**API Endpoint**:
```
GET /api/v1/dashboards/{dashboardUuid}
```

**Parameters**:
```typescript
{
  dashboardUuid: string;  // Required: Dashboard UUID
}
```

**Response Structure**:
```json
{
  "status": "ok",
  "results": {
    "uuid": "dashboard-uuid",
    "name": "Sales Dashboard",
    "description": "Overview of sales metrics",
    "projectUuid": "project-uuid",
    "spaceUuid": "space-uuid",
    "tiles": [
      {
        "uuid": "tile-1",
        "type": "saved_chart",
        "properties": {
          "savedChartUuid": "chart-uuid",
          "title": "Revenue Over Time",
          "hideTitle": false
        },
        "x": 0,
        "y": 0,
        "h": 4,
        "w": 6
      },
      {
        "uuid": "tile-2",
        "type": "markdown",
        "properties": {
          "content": "# Sales Overview\n\nKey metrics for the sales team."
        },
        "x": 6,
        "y": 0,
        "h": 2,
        "w": 6
      }
    ],
    "filters": {
      "dimensions": [],
      "metrics": []
    },
    "dashboardVersionId": 123,
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

**Why**: Understand dashboard composition for comprehensive analysis.

---

### 7. `run_dashboard_tile_query`

**Purpose**: Get results for a specific dashboard tile with dashboard-level filters applied

**API Endpoint**:
```
POST /api/v1/dashboards/{dashboardUuid}/tiles/{tileUuid}
```

**Parameters**:
```typescript
{
  dashboardUuid: string;  // Required: Dashboard UUID
  tileUuid: string;       // Required: Tile UUID
  dashboardFilters?: object; // Optional: Dashboard filters
  invalidateCache?: boolean; // Optional: Force refresh
}
```

**Why**: Get specific tile data with proper filter context from dashboards.

---

### 8. `download_csv_from_explore`

**Purpose**: Export query results as CSV

**API Endpoint**:
```
POST /api/v1/projects/{projectUuid}/explores/{exploreId}/downloadCsv
```

**Parameters**:
```typescript
{
  projectUuid: string;  // Required: Project UUID
  exploreId: string;    // Required: Explore name
  // Include full metric query in body
}
```

**Request Body**: Same as `run_underlying_data_query`

**Response**: CSV file content as stream

**Alternative - From Saved Chart**:
```
POST /api/v1/saved/{chartUuid}/download/csv
```

**Why**: Enable data extraction for external processing.

---

### 9. `run_sql_query`

**Purpose**: Execute custom SQL queries (advanced use case)

**API Endpoint**:
```
POST /api/v1/projects/{projectUuid}/sqlRunner
```

**Request Body**:
```json
{
  "sql": "SELECT order_id, created_at, total_amount FROM orders WHERE created_at > '2025-01-01' LIMIT 100"
}
```

**Parameters**:
```typescript
{
  projectUuid: string;  // Required: Project UUID
  sql: string;          // Required: SQL query string
}
```

**Response Example**:
```json
{
  "status": "ok",
  "results": {
    "rows": [
      ["1", "2025-01-15", "250.00"],
      ["2", "2025-01-16", "180.50"]
    ],
    "fields": {
      "order_id": {"type": "number"},
      "created_at": {"type": "date"},
      "total_amount": {"type": "number"}
    }
  }
}
```

**Why**: Advanced use cases requiring custom SQL.

**⚠️ Security Note**: This is a powerful feature - consider implementing validation/restrictions.

---

### 10. `get_catalog_metadata`

**Purpose**: Get detailed metadata for a specific catalog item

**API Endpoint**:
```
GET /api/v1/projects/{projectUuid}/dataCatalog/{catalogSearchUuid}
```

**Parameters**:
```typescript
{
  projectUuid: string;          // Required: Project UUID
  catalogSearchUuid: string;    // Required: Catalog item UUID
}
```

**Response**: Detailed metadata for the specific catalog item

**Why**: Get full details about a specific field, explore, or dashboard after discovering it via search.

---

### 11. `get_catalog_analytics`

**Purpose**: Get usage analytics for catalog items (which charts use this field/table)

**API Endpoint**:
```
GET /api/v1/projects/{projectUuid}/dataCatalog/{table}/analytics
```

**Parameters**:
```typescript
{
  projectUuid: string;  // Required: Project UUID
  table: string;        // Required: Table name
}
```

**Response Example**:
```json
{
  "status": "ok",
  "results": {
    "charts": [
      {
        "name": "Revenue Analysis",
        "uuid": "chart-uuid",
        "spaceName": "Sales",
        "spaceUuid": "space-uuid",
        "dashboardUuid": "dashboard-uuid",
        "dashboardName": "Sales Overview",
        "chartKind": "line"
      }
    ]
  }
}
```

**Why**: Understand how fields/tables are being used across the organization.

---

## Phase 3: Advanced Features (LOWER PRIORITY) 🔗

### 12. `create_share_url`

**Purpose**: Generate a shareable link

**API Endpoint**:
```
POST /api/v1/share
```

**Request Body**:
```json
{
  "path": "/projects/{projectUuid}/saved/{chartUuid}",
  "params": {}
}
```

**Response Example**:
```json
{
  "status": "ok",
  "results": {
    "nanoid": "abc123",
    "url": "https://app.lightdash.cloud/share/abc123",
    "path": "/projects/proj-uuid/saved/chart-uuid"
  }
}
```

**Why**: Enable collaboration by sharing links.

---

### 13. `get_chart_history`

**Purpose**: Get version history for a chart

**API Endpoint**:
```
GET /api/v1/saved/{chartUuid}/history
```

**Parameters**:
```typescript
{
  chartUuid: string;  // Required: Chart UUID
}
```

**Why**: Access historical versions of analysis.

---

### 14. `get_chart_version_results`

**Purpose**: Get results from a specific chart version

**API Endpoint**:
```
POST /api/v1/saved/{chartUuid}/version/{versionUuid}/results
```

**Why**: Compare historical analysis versions.

---

### 15. `validate_project`

**Purpose**: Validate project configuration and dbt model integrity

**API Endpoint**:
```
POST /api/v1/projects/{projectUuid}/validate
```

**Why**: Check for configuration errors before deploying changes.

---

## Resources Implementation

Resources provide URI-based read-only access to data.

### 1. `lightdash://projects/{projectUuid}/catalog`

**Description**: Searchable catalog of all items in project

**Implementation**:
- Source API: `GET /api/v1/projects/{projectUuid}/dataCatalog`
- Content Type: `application/json`
- Supports search parameter

**Use Case**: Browse all available fields, explores, dashboards

---

### 2. `lightdash://projects/{projectUuid}/explores/{exploreId}/schema`

**Description**: Complete explore schema

**Implementation**:
- Source API: `GET /api/v1/projects/{projectUuid}/explores/{exploreId}`
- Content Type: `application/json`
- Cache: 1 hour TTL

**Use Case**: Reference field definitions before building queries

---

### 3. `lightdash://dashboards/{dashboardUuid}`

**Description**: Dashboard structure and tiles

**Implementation**:
- Source API: `GET /api/v1/dashboards/{dashboardUuid}`
- Content Type: `application/json`

**Use Case**: Reference dashboard composition

---

### 4. `lightdash://charts/{chartUuid}`

**Description**: Saved chart configuration

**Implementation**:
- Source API: `GET /api/v1/saved/{chartUuid}`
- Content Type: `application/json`

**Use Case**: Reference existing chart configurations

---

## Prompts Implementation

### 1. `analyze-metric`

**Description**: Guided metric analysis workflow

**Template**:
```
Analyze the metric "{metric_name}" from the "{explore_name}" explore.

1. First, search for the metric in the catalog to get its exact field ID
2. Search for relevant dimensions to break down the analysis
3. Build and execute a query with:
   - Metric: {metric_name}
   - Dimensions: {dimensions}
   - Filters: {filters}
   - Date range: {date_range}
   - Sort by: {sort_field} {sort_direction}
4. Interpret the results and provide insights
```

**Arguments**:
- `metric_name` (required): Business term for the metric
- `explore_name` (required): Which explore/table
- `dimensions` (optional): Breakdown dimensions
- `filters` (optional): Filter conditions
- `date_range` (optional): Time period
- `sort_field` (optional): Sort field
- `sort_direction` (optional): "asc" or "desc"

---

### 2. `find-and-explore`

**Description**: Discover and analyze data workflow

**Template**:
```
I want to analyze "{business_question}".

1. Search the catalog for relevant fields related to: {search_terms}
2. Identify the best explore (table) to use
3. Find relevant metrics and dimensions
4. Suggest a query structure to answer the question
5. Execute the query if confirmed
```

**Arguments**:
- `business_question` (required): The question to answer
- `search_terms` (optional): Specific keywords to search for

---

### 3. `dashboard-deep-dive`

**Description**: Comprehensive dashboard analysis

**Template**:
```
Analyze the dashboard: {dashboard_name}

1. Find the dashboard in the catalog
2. Get the full dashboard structure
3. For each tile:
   - Get the tile results
   - Summarize key findings
4. Provide an executive summary of all insights
```

**Arguments**:
- `dashboard_name` (required): Dashboard name or UUID

---

## Implementation Notes

### Critical Differences from Previous Version

1. **Query Execution**: Use `runUnderlyingDataQuery` NOT `runQuery` (which may be internal/frontend-only)
2. **Discovery**: Use **catalog search** (`/dataCatalog`) for finding fields, explores, dashboards
3. **Response Format**: Query results have nested structure `{value: {raw: ...}}`
4. **Deprecated Endpoints**: Avoid `ListChartSummariesInProject` and other deprecated endpoints

---

### Authentication

```typescript
headers: {
  'Authorization': `ApiKey ${LIGHTDASH_API_KEY}`,
  'Content-Type': 'application/json'
}
```

**Environment Variables**:
- `LIGHTDASH_API_KEY`: Personal Access Token
- `LIGHTDASH_API_URL`: Base URL (e.g., `https://app.lightdash.cloud/api/v1`)

---

### Query Execution Best Practices

1. **Always use catalog search first** to get exact field IDs
2. **Cache explore schemas** (1 hour TTL)
3. **Default limit: 500 rows** (max 5000)
4. **Implement timeout handling** (queries can take 30-60 seconds)
5. **Parse nested response format**: `row[fieldId].value.raw`

**Example Query Flow**:
```typescript
// 1. Search catalog for fields
const catalogResults = await searchCatalog({
  projectUuid,
  search: "revenue",
  type: "field"
});

// 2. Get explore schema
const explore = await getExplore({
  projectUuid,
  exploreId: "orders"
});

// 3. Build and execute query
const results = await runUnderlyingDataQuery({
  projectUuid,
  exploreId: "orders",
  metrics: ["orders_total_revenue"],
  dimensions: ["orders_created_date"],
  limit: 500
});

// 4. Parse results
const rows = results.rows.map(row => ({
  date: row.orders_created_date.value.raw,
  revenue: row.orders_total_revenue.value.raw
}));
```

---

### Response Format Parsing

**Critical**: Query results are nested!

```javascript
// Raw response
{
  "rows": [
    {
      "orders_total_revenue": {
        "value": {
          "raw": 15000.50,
          "formatted": "$15,000.50"
        }
      }
    }
  ]
}

// Extract raw values
const revenue = row.orders_total_revenue.value.raw;
const formatted = row.orders_total_revenue.value.formatted;
```

---

### Caching Strategy

**High Priority Caching**:
1. **Explore schemas**: 1 hour TTL (they rarely change)
2. **Project list**: 30 minutes TTL
3. **Catalog search results**: 15 minutes TTL
4. **Query results**: 5-15 minutes TTL (based on query hash)

**Cache Key Example**:
```typescript
const queryCacheKey = `query:${projectUuid}:${exploreId}:${hashQuery(queryBody)}`;
```

---

### Rate Limiting

**Lightdash API Rate Limits**:
- Personal Access Token: ~100 requests/minute
- Query execution: ~10-20 concurrent queries

**Mitigation**:
- Implement request queue
- Use exponential backoff
- Cache aggressively
- Batch catalog searches when possible

---

### Error Handling

**Common Error Codes**:
- `401`: Unauthorized (invalid API key)
- `403`: Forbidden (no permission to project/resource)
- `404`: Not found (project/explore/chart doesn't exist)
- `422`: Validation error (invalid query structure)
- `500`: Internal server error (query timeout, database error)

**Error Response Format**:
```json
{
  "status": "error",
  "error": {
    "name": "ForbiddenError",
    "statusCode": 403,
    "message": "User does not have access to this project",
    "data": {}
  }
}
```

---

### Type Definitions

```typescript
// Query Response Structure
interface QueryResult {
  rows: Array<{
    [fieldId: string]: {
      value: {
        raw: any;
        formatted?: string;
      };
    };
  }>;
  fields: Record<string, FieldDefinition>;
}

// Catalog Search Result
interface CatalogSearchResult {
  uuid: string;
  name: string;
  label: string;
  description?: string;
  type: 'field' | 'table' | 'dashboard' | 'space' | 'chart';
  fieldType?: 'metric' | 'dimension';
  tableName?: string;
  tableLabel?: string;
}

// Explore Schema
interface Explore {
  name: string;
  label: string;
  tags: string[];
  baseTable: string;
  tables: Record<string, ExploreTable>;
}

interface ExploreTable {
  name: string;
  label: string;
  dimensions: Record<string, Dimension>;
  metrics: Record<string, Metric>;
}
```

---

## Testing Checklist

### Core Functionality Tests

**Catalog Search**:
- [ ] Can search for fields by name
- [ ] Can search for fields by description
- [ ] Can filter by field type (metric vs dimension)
- [ ] Can search for explores/tables
- [ ] Can search for dashboards
- [ ] Handles empty search results
- [ ] Pagination works correctly

**Query Execution**:
- [ ] Can execute simple metric query
- [ ] Can execute query with dimensions
- [ ] Can apply filters correctly
- [ ] Can apply sorts correctly
- [ ] Response format is parsed correctly (nested structure)
- [ ] Handles query timeout gracefully
- [ ] Respects row limit
- [ ] Cache works for identical queries

**Explore Schema**:
- [ ] Can retrieve explore schema
- [ ] Schema includes all metrics and dimensions
- [ ] Cache works (doesn't fetch repeatedly)
- [ ] Handles non-existent explore

**Saved Charts**:
- [ ] Can get chart results
- [ ] Can override dashboard filters
- [ ] Can invalidate cache

**Dashboards**:
- [ ] Can retrieve dashboard structure
- [ ] Can get tile results
- [ ] Dashboard filters apply correctly

---

### Integration Tests

- [ ] Full workflow: Search → Explore Schema → Build Query → Execute → Parse Results
- [ ] Can handle multiple concurrent requests
- [ ] Rate limiting doesn't break functionality
- [ ] Cache expiration works correctly
- [ ] Authentication works with PAT
- [ ] Permissions are respected (403 errors handled)

---

### MCP-Specific Tests

- [ ] Tools register correctly
- [ ] Tool schemas validate
- [ ] Resources are accessible via URI
- [ ] Prompts expand correctly
- [ ] Error messages are user-friendly
- [ ] Response times are reasonable
- [ ] Works with Claude Desktop
- [ ] Works with Claude Code CLI

---

## Implementation Priority Summary

### 🔥 Phase 1: IMPLEMENT FIRST (Days 1-3)

**Goal**: Enable AI-driven data discovery and analysis

1. **`run_underlying_data_query`** - Execute queries (MOST IMPORTANT)
2. **`get_catalog_search`** - Search for fields/explores/dashboards
3. **`get_explore_with_full_schema`** - Get field definitions
4. **`get_explores_summary`** - List available explores
5. **`get_saved_chart_results`** - Fetch existing chart data

**Why**: These enable the core use case that differentiates from the community server - actual query execution with intelligent discovery.

---

### 📊 Phase 2: IMPLEMENT SECOND (Days 4-5)

**Goal**: Dashboard analysis and data export

6. **`get_dashboard_by_uuid`** - Dashboard structure
7. **`run_dashboard_tile_query`** - Tile-level results
8. **`download_csv_from_explore`** - Data export
9. **`get_catalog_metadata`** - Detailed item metadata
10. **`get_catalog_analytics`** - Usage analytics

**Why**: Enhanced analytics capabilities and data export for workflows.

---

### 🔗 Phase 3: IMPLEMENT LAST (Days 6-7)

**Goal**: Advanced features and collaboration

11. **`create_share_url`** - Sharing
12. **`get_chart_history`** - Version history
13. **`run_sql_query`** - Custom SQL
14. **`validate_project`** - Project validation

**Why**: Nice-to-have features that add polish but aren't critical for MVP.

---

## Quick Start Implementation Guide

### Step 1: Update Authentication (5 min)

```typescript
const LIGHTDASH_API_KEY = process.env.LIGHTDASH_API_KEY;
const LIGHTDASH_API_URL = process.env.LIGHTDASH_API_URL || 'https://app.lightdash.cloud/api/v1';

async function fetchLightdash(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${LIGHTDASH_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `ApiKey ${LIGHTDASH_API_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  const data = await response.json();
  
  if (data.status === 'error') {
    throw new Error(`Lightdash API Error: ${data.error.message}`);
  }
  
  return data.results;
}
```

---

### Step 2: Implement Catalog Search (30 min)

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'search_catalog') {
    const { projectUuid, search, type } = request.params.arguments;
    
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (type) params.append('type', type);
    
    const results = await fetchLightdash(
      `/projects/${projectUuid}/dataCatalog?${params.toString()}`
    );
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results, null, 2),
      }],
    };
  }
});
```

---

### Step 3: Implement Query Execution (60 min)

```typescript
if (request.params.name === 'run_query') {
  const { projectUuid, exploreId, metrics, dimensions, filters, sorts, limit } = request.params.arguments;
  
  const queryBody = {
    metrics: metrics || [],
    dimensions: dimensions || [],
    filters: filters || {},
    sorts: sorts || [],
    limit: limit || 500,
  };
  
  const results = await fetchLightdash(
    `/projects/${projectUuid}/explores/${exploreId}/runUnderlyingDataQuery`,
    {
      method: 'POST',
      body: JSON.stringify(queryBody),
    }
  );
  
  // Parse nested response format
  const parsedRows = results.rows.map(row => {
    const parsed = {};
    for (const [fieldId, data] of Object.entries(row)) {
      parsed[fieldId] = data.value.raw;
    }
    return parsed;
  });
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ rows: parsedRows, fields: results.fields }, null, 2),
    }],
  };
}
```

---

### Step 4: Test Your Implementation (15 min)

```bash
# Test catalog search
curl -H "Authorization: ApiKey YOUR_TOKEN" \
  "https://app.lightdash.cloud/api/v1/projects/YOUR_PROJECT_UUID/dataCatalog?search=revenue&type=field"

# Test query execution
curl -X POST \
  -H "Authorization: ApiKey YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": ["orders_count"],
    "dimensions": ["orders_status"],
    "limit": 10
  }' \
  "https://app.lightdash.cloud/api/v1/projects/YOUR_PROJECT_UUID/explores/orders/runUnderlyingDataQuery"
```

---

## Key Differences from Community Implementation

| Feature | Community Server | Your Implementation |
|---------|------------------|---------------------|
| Query Execution | ❌ Not implemented | ✅ `runUnderlyingDataQuery` |
| Field Discovery | Basic catalog | ✅ Advanced catalog search |
| Explore Schema | Basic | ✅ Full schema with all fields |
| Dashboard Analysis | List only | ✅ Full tiles + results |
| Response Parsing | N/A | ✅ Handles nested format |
| Caching | Minimal | ✅ Aggressive caching |
| Official MCP Alignment | Partial | ✅ Full alignment |

---

## Resources

- **Official Lightdash Cloud MCP**: https://docs.lightdash.com/guides/lightdash-mcp
- **Lightdash API Docs**: https://docs.lightdash.com/api-reference/v1/introduction
- **Community MCP Server**: https://github.com/syucream/lightdash-mcp-server
- **MCP Protocol**: https://modelcontextprotocol.io/

---

**Start with Phase 1 and build from there. Focus on query execution first - that's what makes this MCP server truly powerful!** 🚀
