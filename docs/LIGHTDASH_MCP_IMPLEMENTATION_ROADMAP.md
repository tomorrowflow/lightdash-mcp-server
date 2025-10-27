# Lightdash MCP Server - Implementation Roadmap

**Extending**: [syucream/lightdash-mcp-server](https://github.com/syucream/lightdash-mcp-server)

**Last Updated**: October 26, 2025

---

## Table of Contents

- [Currently Implemented](#currently-implemented)
- [Phase 1: Core Query Execution](#phase-1-core-query-execution-high-priority-)
- [Phase 2: Enhanced Discovery](#phase-2-enhanced-discovery-medium-priority-)
- [Phase 3: Collaboration & Sharing](#phase-3-collaboration--sharing-lower-priority-)
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

## Phase 1: Core Query Execution (HIGH PRIORITY) 🔥

### 1. `run_metric_query` ⭐ **MOST CRITICAL**

**Purpose**: Execute queries and return actual data results - this is THE critical endpoint that enables actual data analysis

**API Endpoint**: 
```
POST /api/v1/projects/{projectUuid}/explores/{exploreId}/runQuery
```

**Parameters**:
```typescript
{
  projectUuid: string;     // Required: Project UUID
  exploreId: string;       // Required: Explore/table name (e.g., "orders")
  dimensions: string[];    // Optional: List of dimension field IDs
  metrics: string[];       // Optional: List of metric field IDs
  filters?: {              // Optional: Filter configuration
    dimensions?: FilterGroup;
    metrics?: FilterGroup;
  };
  sorts?: Array<{         // Optional: Sort configuration
    fieldId: string;
    descending: boolean;
  }>;
  limit?: number;         // Optional: Result limit (default 500)
  tableCalculations?: any[]; // Optional: Custom calculations
  additionalMetrics?: any[]; // Optional: Ad-hoc metrics
}
```

**Request Body Example**:
```json
{
  "exploreName": "orders",
  "dimensions": ["orders_created_date", "orders_status"],
  "metrics": ["orders_total_revenue", "orders_count"],
  "filters": {
    "dimensions": {
      "id": "filter_1",
      "and": [
        {
          "id": "filter_1_1",
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
    "metricQuery": {
      "dimensions": ["orders_created_date", "orders_status"],
      "metrics": ["orders_total_revenue", "orders_count"]
    },
    "rows": [
      {
        "orders_created_date": "2025-01-01",
        "orders_status": "completed",
        "orders_total_revenue": 15000.50,
        "orders_count": 45
      }
    ]
  }
}
```

**Implementation Notes**:
- This is the most important tool to implement first
- Queries can be slow - implement timeout handling
- Consider caching based on query hash
- Default limit should be 500 rows
- Validate that explore exists before running query

---

### 2. `list_explores`

**Purpose**: List all available explores (data models/tables) in a project

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
      "baseTable": "orders"
    },
    {
      "name": "customers",
      "label": "Customers",
      "tags": ["crm"],
      "baseTable": "customers"
    }
  ]
}
```

**Why**: Essential for discovering available data models before querying

---

### 3. `get_explore`

**Purpose**: Get detailed schema of a specific explore including all metrics and dimensions

**API Endpoint**:
```
GET /api/v1/projects/{projectUuid}/explores/{exploreId}
```

**Parameters**:
```typescript
{
  projectUuid: string;  // Required: Project UUID
  exploreId: string;    // Required: Explore name (e.g., "orders")
}
```

**Response Structure**:
```json
{
  "status": "ok",
  "results": {
    "name": "orders",
    "label": "Orders",
    "tables": {
      "orders": {
        "name": "orders",
        "label": "Orders",
        "dimensions": {
          "orders_created_date": {
            "fieldType": "dimension",
            "type": "date",
            "name": "orders_created_date",
            "label": "Created Date",
            "table": "orders",
            "description": "When the order was created"
          },
          "orders_status": {
            "fieldType": "dimension",
            "type": "string",
            "name": "orders_status",
            "label": "Status"
          }
        },
        "metrics": {
          "orders_total_revenue": {
            "fieldType": "metric",
            "type": "sum",
            "name": "orders_total_revenue",
            "label": "Total Revenue",
            "description": "Sum of all order amounts"
          },
          "orders_count": {
            "fieldType": "metric",
            "type": "count",
            "name": "orders_count",
            "label": "Order Count"
          }
        }
      }
    }
  }
}
```

**Why**: Needed to understand available fields before running queries

**Implementation Notes**:
- Cache explore schemas during session (they rarely change)
- This is essential for building the `run_metric_query` request

---

### 4. `search_fields`

**Purpose**: Search for metrics and dimensions across the project by name or description

**API Endpoint**:
```
GET /api/v1/projects/{projectUuid}/dataCatalog
```

**Query Parameters**:
```
?search={searchTerm}&type={metric|dimension}
```

**Parameters**:
```typescript
{
  projectUuid: string;         // Required: Project UUID
  searchTerm: string;          // Required: What to search for
  fieldType?: 'metric' | 'dimension' | null;  // Optional: Filter by type
}
```

**Response Example**:
```json
{
  "status": "ok",
  "results": [
    {
      "name": "orders_total_revenue",
      "label": "Total Revenue",
      "description": "Sum of all order amounts",
      "fieldType": "metric",
      "tableName": "orders",
      "tableLabel": "Orders"
    },
    {
      "name": "customers_lifetime_revenue",
      "label": "Customer Lifetime Revenue",
      "description": "Total revenue per customer",
      "fieldType": "metric",
      "tableName": "customers"
    }
  ]
}
```

**Why**: Essential for field discovery - AI can find relevant metrics/dimensions by description

---

### 5. `get_chart_results`

**Purpose**: Get results from an existing saved chart

**API Endpoint**:
```
POST /api/v1/saved/{chartUuid}/results
```

**Parameters**:
```typescript
{
  chartUuid: string;           // Required: Saved chart UUID
  invalidateCache?: boolean;   // Optional: Force fresh results (default: false)
}
```

**Request Body** (optional - to override filters/dates):
```json
{
  "filters": {},
  "dateRange": {
    "from": "2025-01-01",
    "to": "2025-01-31"
  }
}
```

**Response Example**:
```json
{
  "status": "ok",
  "results": {
    "rows": [
      {
        "orders_created_date": "2025-01-01",
        "orders_total_revenue": 15000.50
      }
    ],
    "metricQuery": {
      "dimensions": ["orders_created_date"],
      "metrics": ["orders_total_revenue"]
    }
  }
}
```

**Why**: Leverage existing charts that analysts have created

---

## Phase 2: Enhanced Discovery (MEDIUM PRIORITY) 📊

### 6. `get_dashboard_with_tiles`

**Purpose**: Get complete dashboard details including all tiles and their configurations

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
    "tiles": [
      {
        "uuid": "tile-1",
        "type": "saved_chart",
        "properties": {
          "savedChartUuid": "chart-uuid",
          "title": "Revenue Over Time"
        }
      },
      {
        "uuid": "tile-2",
        "type": "markdown",
        "properties": {
          "content": "# Sales Overview"
        }
      }
    ],
    "filters": {
      "dimensions": []
    }
  }
}
```

**Why**: Understand dashboard composition for comprehensive analysis

---

### 7. `get_dashboard_tile_results`

**Purpose**: Get results for a specific dashboard tile

**API Endpoint**:
```
POST /api/v1/dashboards/{dashboardUuid}/tiles/{tileUuid}
```

**Parameters**:
```typescript
{
  dashboardUuid: string;  // Required: Dashboard UUID
  tileUuid: string;       // Required: Tile UUID
}
```

**Request Body** (optional overrides):
```json
{
  "filters": {},
  "dateRange": {}
}
```

**Why**: Get specific tile data with dashboard-level filters applied

---

### 8. `download_csv`

**Purpose**: Export query or chart results as CSV

**API Endpoint Option 1** (from saved chart):
```
POST /api/v1/saved/{chartUuid}/csv
```

**API Endpoint Option 2** (from query):
```
POST /api/v1/projects/{projectUuid}/explores/{exploreId}/downloadCsv
```

**Parameters**:
```typescript
{
  chartUuid?: string;     // For saved chart export
  projectUuid?: string;   // For direct query export
  exploreId?: string;     // For direct query export
  // Include full query body for direct export
}
```

**Response**: CSV file content as string or stream

**Why**: Enable data extraction for external processing

---

### 9. `run_sql_query`

**Purpose**: Execute custom SQL queries (advanced use case)

**API Endpoint**:
```
POST /api/v1/projects/{projectUuid}/sqlRunner
```

**Parameters**:
```typescript
{
  projectUuid: string;  // Required: Project UUID
  sql: string;          // Required: SQL query string
}
```

**Request Body Example**:
```json
{
  "sql": "SELECT order_id, created_at, total_amount FROM orders WHERE created_at > '2025-01-01' LIMIT 100"
}
```

**Response Example**:
```json
{
  "status": "ok",
  "results": {
    "rows": [
      {
        "order_id": 1,
        "created_at": "2025-01-15",
        "total_amount": 250.00
      }
    ],
    "fields": {
      "order_id": { "type": "number" },
      "created_at": { "type": "date" },
      "total_amount": { "type": "number" }
    }
  }
}
```

**Why**: Advanced use cases requiring custom SQL

**Security Note**: This is a powerful feature - consider implementing additional validation/restrictions

---

### 10. `search_content`

**Purpose**: Search across charts, dashboards, and spaces by name or description

**API Endpoint**:
```
GET /api/v1/projects/{projectUuid}/search
```

**Query Parameters**:
```
?query={searchTerm}&type={chart|dashboard|space}&limit={number}
```

**Parameters**:
```typescript
{
  projectUuid: string;                          // Required: Project UUID
  searchQuery: string;                          // Required: Search term
  contentType?: 'chart' | 'dashboard' | 'space'; // Optional: Filter by type
  limit?: number;                               // Optional: Results limit (default: 20)
}
```

**Response Example**:
```json
{
  "status": "ok",
  "results": [
    {
      "type": "chart",
      "uuid": "chart-uuid",
      "name": "Revenue Analysis",
      "description": "Monthly revenue breakdown",
      "spaceName": "Sales",
      "updatedAt": "2025-01-15T10:30:00Z"
    },
    {
      "type": "dashboard",
      "uuid": "dashboard-uuid",
      "name": "Sales Overview",
      "description": "Key sales metrics"
    }
  ]
}
```

**Why**: Find existing content by name or description

---

### 11. `get_chart_version_results`

**Purpose**: Get results from a specific version of a chart (useful for comparing historical analysis)

**API Endpoint**:
```
POST /api/v1/saved/{chartUuid}/version/{versionUuid}/results
```

**Parameters**:
```typescript
{
  chartUuid: string;    // Required: Chart UUID
  versionUuid: string;  // Required: Version UUID
}
```

**Why**: Access historical versions of analysis

---

## Phase 3: Collaboration & Sharing (LOWER PRIORITY) 🔗

### 12. `create_share_url`

**Purpose**: Generate a shareable link for a chart or dashboard

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

**Parameters**:
```typescript
{
  path: string;        // Required: Resource path
  params?: object;     // Optional: URL parameters
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

**Why**: Enable collaboration by sharing links

---

### 13. `get_scheduler`

**Purpose**: Get scheduled delivery configuration details

**API Endpoint**:
```
GET /api/v1/schedulers/{schedulerUuid}
```

**Parameters**:
```typescript
{
  schedulerUuid: string;  // Required: Scheduler UUID
}
```

**Response Example**:
```json
{
  "status": "ok",
  "results": {
    "uuid": "scheduler-uuid",
    "name": "Weekly Sales Report",
    "enabled": true,
    "cron": "0 9 * * 1",
    "format": "csv",
    "savedChartUuid": "chart-uuid",
    "targets": [
      {
        "type": "email",
        "recipient": "team@company.com"
      }
    ]
  }
}
```

**Why**: Check scheduled report configurations

---

### 14. `get_scheduler_logs`

**Purpose**: Get execution logs for scheduled deliveries

**API Endpoint**:
```
GET /api/v1/schedulers/{schedulerUuid}/logs
```

**Parameters**:
```typescript
{
  schedulerUuid: string;  // Required: Scheduler UUID
}
```

**Response Example**:
```json
{
  "status": "ok",
  "results": [
    {
      "scheduledTime": "2025-01-15T09:00:00Z",
      "status": "success",
      "details": "Sent to 5 recipients"
    },
    {
      "scheduledTime": "2025-01-08T09:00:00Z",
      "status": "error",
      "details": "Chart query timeout"
    }
  ]
}
```

**Why**: Monitor scheduled delivery status and troubleshoot issues

---

### 15. `list_schedulers`

**Purpose**: List all scheduled deliveries for a project

**API Endpoint**:
```
GET /api/v1/projects/{projectUuid}/schedulers
```

**Parameters**:
```typescript
{
  projectUuid: string;  // Required: Project UUID
}
```

**Why**: Overview of all scheduled reports

---

## Resources Implementation

Resources provide URI-based read-only access to data. Implement these as MCP resources:

### 1. `lightdash://projects/{projectUuid}/explores`

**Description**: List of all explores with metadata

**Implementation**:
- Source API: `GET /api/v1/projects/{projectUuid}/explores`
- Content Type: `application/json`
- Template: `lightdash://projects/{projectUuid}/explores`

**Use Case**: Browse available data models

---

### 2. `lightdash://projects/{projectUuid}/catalog/metrics`

**Description**: Full metrics catalog with descriptions and types

**Implementation**:
- Source API: `GET /api/v1/projects/{projectUuid}/dataCatalog/metrics/tree`
- Content Type: `application/json`
- Template: `lightdash://projects/{projectUuid}/catalog/metrics`

**Use Case**: Discover all available metrics in project

---

### 3. `lightdash://projects/{projectUuid}/catalog/dimensions`

**Description**: Full dimensions catalog

**Implementation**:
- Source API: `GET /api/v1/projects/{projectUuid}/dataCatalog` (filter by type=dimension)
- Content Type: `application/json`
- Template: `lightdash://projects/{projectUuid}/catalog/dimensions`

**Use Case**: Discover all available dimensions

---

### 4. `lightdash://explores/{projectUuid}/{exploreId}/schema`

**Description**: Complete explore schema with all fields

**Implementation**:
- Source API: `GET /api/v1/projects/{projectUuid}/explores/{exploreId}`
- Content Type: `application/json`
- Template: `lightdash://explores/{projectUuid}/{exploreId}/schema`

**Use Case**: Reference field definitions before building queries

---

### 5. `lightdash://dashboards/{dashboardUuid}`

**Description**: Dashboard structure and metadata

**Implementation**:
- Source API: `GET /api/v1/dashboards/{dashboardUuid}`
- Content Type: `application/json`
- Template: `lightdash://dashboards/{dashboardUuid}`

**Use Case**: Reference dashboard composition and tiles

---

## Prompts Implementation

Prompts provide guided workflows for common analysis patterns. Implement these as MCP prompts:

### 1. `analyze-metric`

**Description**: Template for analyzing a metric with dimensions and filters

**Template**:
```
Analyze the metric "{metric_name}" in the "{explore_name}" explore.
Break it down by: {dimensions}
Apply these filters: {filters}
Date range: {date_range}
Sort by: {sort_field} {sort_direction}
```

**Arguments**:
- `metric_name` (required): Name of the metric to analyze
- `explore_name` (required): Which explore/table to query
- `dimensions` (optional): Comma-separated dimension names
- `filters` (optional): Filter description
- `date_range` (optional): Date range (e.g., "last 30 days")
- `sort_field` (optional): Field to sort by
- `sort_direction` (optional): "ascending" or "descending"

**Use Case**: Guide AI to construct proper metric queries

---

### 2. `explore-dashboard`

**Description**: Template for analyzing dashboard insights

**Template**:
```
Analyze the dashboard "{dashboard_name}" (UUID: {dashboard_uuid}) in project {project_uuid}.
Explain what insights are available and summarize the key metrics shown.
Focus areas: {focus_areas}
```

**Arguments**:
- `dashboard_name` (required): Name of the dashboard
- `dashboard_uuid` (required): Dashboard UUID
- `project_uuid` (required): Project UUID
- `focus_areas` (optional): Specific areas of interest

**Use Case**: Comprehensive dashboard analysis

---

### 3. `find-metric-by-description`

**Description**: Template for discovering relevant metrics

**Template**:
```
Find metrics related to "{business_concept}" in project {project_uuid}.
Search for metrics whose name or description contains information about: {search_terms}
Filter by explore: {explore_filter}
```

**Arguments**:
- `business_concept` (required): What business concept to search for
- `project_uuid` (required): Project UUID
- `search_terms` (optional): Specific search keywords
- `explore_filter` (optional): Limit search to specific explore

**Use Case**: Semantic metric discovery

---

### 4. `compare-time-periods`

**Description**: Template for time-based comparisons

**Template**:
```
Compare the metric "{metric_name}" between two time periods:
- Period 1: {period_1_start} to {period_1_end}
- Period 2: {period_2_start} to {period_2_end}

Break down by: {dimensions}
In explore: {explore_name}
```

**Arguments**:
- `metric_name` (required): Metric to compare
- `explore_name` (required): Which explore to query
- `period_1_start` (required): Start date of first period
- `period_1_end` (required): End date of first period
- `period_2_start` (required): Start date of second period
- `period_2_end` (required): End date of second period
- `dimensions` (optional): Additional breakdowns

**Use Case**: Period-over-period analysis

---

### 5. `dashboard-summary`

**Description**: Template for dashboard summaries

**Template**:
```
Provide a summary of the key metrics in dashboard "{dashboard_name}".
Include current values, trends, and notable insights.
Dashboard UUID: {dashboard_uuid}
Time range: {time_range}
```

**Arguments**:
- `dashboard_name` (required): Dashboard name
- `dashboard_uuid` (required): Dashboard UUID
- `time_range` (optional): Time period to analyze

**Use Case**: Quick dashboard overview

---

## Implementation Notes

### Authentication

All API endpoints require authentication via Personal Access Token (PAT):

```typescript
headers: {
  'Authorization': `ApiKey ${LIGHTDASH_API_KEY}`,
  'Content-Type': 'application/json'
}
```

**Environment Variables**:
- `LIGHTDASH_API_KEY`: Your Personal Access Token
- `LIGHTDASH_API_URL`: Base URL (e.g., `https://app.lightdash.cloud/api/v1` or `https://your-instance.com/api/v1`)

---

### Base URL Format

**Cloud**:
```
https://app.lightdash.cloud/api/v1/
```

**Self-hosted**:
```
https://<your-domain>/api/v1/
```

---

### Error Handling

All endpoints return standardized responses:

**Success**:
```json
{
  "status": "ok",
  "results": { ... }
}
```

**Error**:
```json
{
  "status": "error",
  "error": {
    "name": "ErrorName",
    "statusCode": 400,
    "message": "Detailed error description",
    "data": { ... }
  }
}
```

**Common Error Codes**:
- `401`: Unauthorized (invalid/missing API key)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found (project/explore/chart doesn't exist)
- `500`: Internal server error

**Error Handling Best Practices**:
```typescript
try {
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (data.status === 'error') {
    throw new Error(`Lightdash API Error: ${data.error.message}`);
  }
  
  return data.results;
} catch (error) {
  // Handle network errors, timeouts, etc.
  console.error('Request failed:', error);
  throw error;
}
```

---

### Rate Limiting Considerations

**Recommended Strategies**:

1. **Caching**:
   - Cache explore schemas (TTL: 1 hour)
   - Cache project lists (TTL: 30 minutes)
   - Cache catalog data (TTL: 1 hour)
   - Cache query results based on query hash (TTL: 5-15 minutes)

2. **Request Throttling**:
   - Implement exponential backoff for retries
   - Queue requests if hitting rate limits
   - Batch related requests when possible

3. **Optimize Queries**:
   - Default limit: 500 rows (configurable)
   - Implement query timeout (30-60 seconds)
   - Stream large results when possible

---

### Query Performance Best Practices

1. **Always set a limit** (default: 500)
2. **Pre-fetch explore schema** before building queries
3. **Validate field IDs** exist in explore before querying
4. **Implement timeout handling** (queries can be slow on large datasets)
5. **Cache query results** based on query hash + timestamp
6. **Use appropriate filters** to reduce query scope

**Example Query Optimization**:
```typescript
// Good: Limited, filtered query
{
  exploreName: "orders",
  metrics: ["orders_total_revenue"],
  dimensions: ["orders_created_date"],
  filters: {
    dimensions: {
      id: "date_filter",
      target: { fieldId: "orders_created_date" },
      operator: "inThePast",
      values: [30]
    }
  },
  limit: 100
}

// Bad: Unlimited query with many fields
{
  exploreName: "orders",
  metrics: ["*"],  // Don't use wildcards
  dimensions: ["*"],
  limit: 999999  // Too large
}
```

---

### Type Definitions

**Recommended TypeScript Types**:

```typescript
// Core types
interface LightdashResponse<T> {
  status: 'ok' | 'error';
  results?: T;
  error?: {
    name: string;
    statusCode: number;
    message: string;
    data?: any;
  };
}

// Field types
type FieldType = 'dimension' | 'metric';
type DimensionType = 'string' | 'number' | 'date' | 'timestamp' | 'boolean';
type MetricType = 'sum' | 'count' | 'count_distinct' | 'average' | 'min' | 'max' | 'number' | 'percentile';

// Filter types
type FilterOperator = 
  | 'equals' | 'notEquals'
  | 'greaterThan' | 'lessThan'
  | 'greaterThanOrEqual' | 'lessThanOrEqual'
  | 'include' | 'notInclude'
  | 'startsWith' | 'endsWith'
  | 'inThePast' | 'inTheNext'
  | 'isNull' | 'notNull';

interface Filter {
  id: string;
  target: {
    fieldId: string;
  };
  operator: FilterOperator;
  values?: any[];
}

interface FilterGroup {
  id: string;
  and?: Filter[];
  or?: Filter[];
}

// Query types
interface MetricQuery {
  exploreName: string;
  dimensions: string[];
  metrics: string[];
  filters?: {
    dimensions?: FilterGroup;
    metrics?: FilterGroup;
  };
  sorts?: Array<{
    fieldId: string;
    descending: boolean;
  }>;
  limit?: number;
  tableCalculations?: any[];
  additionalMetrics?: any[];
}

// Explore types
interface Dimension {
  fieldType: 'dimension';
  type: DimensionType;
  name: string;
  label: string;
  table: string;
  description?: string;
  sql?: string;
  hidden?: boolean;
}

interface Metric {
  fieldType: 'metric';
  type: MetricType;
  name: string;
  label: string;
  table: string;
  description?: string;
  sql?: string;
  hidden?: boolean;
  format?: string;
  round?: number;
}

interface Explore {
  name: string;
  label: string;
  tags: string[];
  baseTable: string;
  tables: {
    [tableName: string]: {
      name: string;
      label: string;
      dimensions: Record<string, Dimension>;
      metrics: Record<string, Metric>;
    };
  };
}
```

---

### Session Management

**Recommended Approach**:

1. **Project Context**:
   - Store active project UUID in session
   - Allow switching between projects
   - Cache project metadata during session

2. **Explore Cache**:
   ```typescript
   const exploreCache = new Map<string, {
     data: Explore;
     timestamp: number;
     ttl: number;
   }>();
   ```

3. **Query History**:
   - Keep recent query history (last 10-20 queries)
   - Allow re-running previous queries
   - Store query hash for deduplication

---

## Testing Checklist

### Per-Endpoint Tests

For each implemented endpoint, verify:

- [ ] Successfully authenticates with valid PAT
- [ ] Returns 401 with invalid/missing PAT
- [ ] Returns 403 when user lacks permissions
- [ ] Handles missing/invalid project UUID (404)
- [ ] Handles missing/invalid explore ID (404)
- [ ] Handles missing/invalid chart UUID (404)
- [ ] Returns proper error messages for validation failures
- [ ] Validates all required parameters
- [ ] Handles empty results gracefully
- [ ] Respects user permissions correctly
- [ ] Implements timeout for long-running queries
- [ ] Handles network errors gracefully
- [ ] Returns data in expected format
- [ ] Properly encodes/decodes special characters
- [ ] Handles pagination if applicable

---

### Integration Tests

- [ ] Can list all projects user has access to
- [ ] Can retrieve explore schema successfully
- [ ] Can execute simple metric query
- [ ] Can execute query with filters
- [ ] Can execute query with sorts
- [ ] Can handle query timeout gracefully
- [ ] Can search for fields by name
- [ ] Can get chart results
- [ ] Can get dashboard structure
- [ ] Can export results as CSV
- [ ] Cache works correctly for explores
- [ ] Cache expires after TTL
- [ ] Session maintains project context

---

### MCP-Specific Tests

- [ ] Tools are properly registered
- [ ] Tool schemas validate correctly
- [ ] Resources are accessible via URI
- [ ] Prompts expand correctly with arguments
- [ ] Error messages are user-friendly
- [ ] Response times are reasonable (<5s for queries)
- [ ] Concurrent requests are handled properly

---

## Implementation Priority Summary

### 🔥 Phase 1: Implement FIRST (Critical for MVP)

**Goal**: Enable actual data analysis, not just metadata browsing

1. **`run_metric_query`** - Execute queries and return data
2. **`list_explores`** - Discover available tables
3. **`get_explore`** - Get field schemas
4. **`search_fields`** - Find relevant fields
5. **`get_chart_results`** - Fetch existing chart data

**Estimated Time**: 2-3 days

**Why Phase 1**: These tools enable the core use case - AI-driven data analysis. Without query execution, the MCP server is just a metadata browser.

---

### 📊 Phase 2: Implement SECOND (Enhanced Functionality)

**Goal**: Add dashboard analysis, exports, and advanced querying

6. **`get_dashboard_with_tiles`** - Dashboard structure
7. **`get_dashboard_tile_results`** - Tile data
8. **`download_csv`** - Data export
9. **`search_content`** - Content discovery
10. **`run_sql_query`** - Advanced SQL queries

**Estimated Time**: 2-3 days

**Why Phase 2**: These enhance the user experience with dashboard analysis, data export, and advanced querying capabilities.

---

### 🔗 Phase 3: Implement LAST (Nice-to-Have)

**Goal**: Add collaboration and monitoring features

11. **`create_share_url`** - Sharing
12. **`get_scheduler`** - Scheduler details
13. **`get_scheduler_logs`** - Execution logs
14. **`list_schedulers`** - All schedulers
15. **Version control tools** - Historical analysis

**Estimated Time**: 1-2 days

**Why Phase 3**: These are useful but not critical for core functionality. Can be added after MVP is working.

---

## Quick Start Implementation Guide

### Step 1: Set Up Authentication (5 minutes)

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

### Step 2: Implement `run_metric_query` (30-60 minutes)

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'run_metric_query') {
    const { projectUuid, exploreId, metrics, dimensions, filters, sorts, limit } = request.params.arguments;
    
    const queryBody = {
      exploreName: exploreId,
      metrics: metrics || [],
      dimensions: dimensions || [],
      filters: filters || {},
      sorts: sorts || [],
      limit: limit || 500,
    };
    
    const results = await fetchLightdash(
      `/projects/${projectUuid}/explores/${exploreId}/runQuery`,
      {
        method: 'POST',
        body: JSON.stringify(queryBody),
      }
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

### Step 3: Test Your Implementation (15 minutes)

```bash
# Test authentication
curl -H "Authorization: ApiKey YOUR_TOKEN" \
  https://app.lightdash.cloud/api/v1/org/projects

# Test query execution
curl -X POST \
  -H "Authorization: ApiKey YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exploreName": "orders",
    "metrics": ["orders_count"],
    "dimensions": ["orders_status"],
    "limit": 10
  }' \
  https://app.lightdash.cloud/api/v1/projects/YOUR_PROJECT_UUID/explores/orders/runQuery
```

---

### Step 4: Add Remaining Tools (Iteratively)

Follow the same pattern for each tool:
1. Define tool schema in MCP
2. Implement API call
3. Transform response for AI consumption
4. Add error handling
5. Test thoroughly

---

## Resources and References

- **Official Lightdash API Docs**: https://docs.lightdash.com/api-reference/v1/introduction
- **MCP Protocol Spec**: https://modelcontextprotocol.io/
- **Base Implementation**: https://github.com/syucream/lightdash-mcp-server
- **Official Lightdash MCP**: https://docs.lightdash.com/guides/lightdash-mcp

---

## Getting Help

- **Lightdash Community Slack**: https://join.slack.com/t/lightdash-community
- **GitHub Issues**: https://github.com/lightdash/lightdash/issues
- **MCP Community**: https://github.com/modelcontextprotocol

---

**Good luck with your implementation! Start with Phase 1 and iterate from there.** 🚀
