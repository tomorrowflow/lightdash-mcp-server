# Lightdash MCP - Chart Creation Implementation Plan

## Overview
Add chart creation and modification capabilities to the existing Lightdash MCP server. This enables AI-driven chart generation with full support for filters, metrics, dimensions, and chart configurations.

**Current State**: 
- 19 read-only tools
- 4 resources
- 3 prompts

**Target State**: 
- 24+ tools (added 5-7 chart creation/management tools)
- 9 resources (added 5 chart-related resources)
- 7 prompts (added 4 chart-focused prompts)

**Timeline**: 3-4 weeks

---

## API Endpoints to Implement

### 1. Create Chart
**Endpoint**: `POST /api/v1/spaces/{spaceUuid}/saved-charts`

**Payload Structure**:
```json
{
  "name": "Revenue by Region Q4 2024",
  "description": "Optional description",
  "tableName": "sales_data",
  "metricQuery": {
    "exploreName": "sales_data",
    "dimensions": ["sales_data_region"],
    "metrics": ["sales_data_total_revenue"],
    "filters": {
      "dimensions": [
        {
          "id": "filter_1",
          "target": { "fieldId": "sales_data_quarter" },
          "operator": "equals",
          "values": ["Q4"],
          "disabled": false
        }
      ],
      "metrics": [
        {
          "id": "filter_2",
          "target": { "fieldId": "sales_data_total_revenue" },
          "operator": "greaterThan",
          "values": [1000],
          "disabled": false
        }
      ]
    },
    "sorts": [
      {
        "fieldId": "sales_data_total_revenue",
        "descending": true
      }
    ],
    "limit": 500,
    "timezone": "UTC"
  },
  "chartConfig": {
    "type": "cartesian",
    "config": {
      "layout": {
        "xField": "sales_data_region",
        "yField": ["sales_data_total_revenue"]
      },
      "eChartsConfig": {
        "series": [{
          "type": "bar",
          "encode": {
            "x": "sales_data_region",
            "y": "sales_data_total_revenue"
          }
        }]
      }
    }
  },
  "tableConfig": {
    "columnOrder": ["sales_data_region", "sales_data_total_revenue"]
  }
}
```

**Response**:
```json
{
  "status": "ok",
  "results": {
    "uuid": "chart-uuid-12345",
    "name": "Revenue by Region Q4 2024",
    "slug": "revenue-by-region-q4-2024",
    "url": "https://app.lightdash.cloud/projects/proj-uuid/saved/chart-uuid-12345",
    "spaceUuid": "space-uuid-678",
    "createdAt": "2025-10-28T12:00:00Z"
  }
}
```

### 2. Update Chart
**Endpoint**: `PATCH /api/v1/saved-charts/{chartUuid}`

Supports partial updates. Same structure as create, but all fields optional.

### 3. Duplicate Chart
**Endpoint**: `POST /api/v1/saved-charts/{chartUuid}/copy`

```json
{
  "name": "Copy of Original Chart",
  "spaceUuid": "target-space-uuid"
}
```

### 4. Add Chart to Dashboard
**Endpoint**: `POST /api/v1/saved-charts/{chartUuid}/promote`

### 5. Delete Chart
**Endpoint**: `DELETE /api/v1/saved-charts/{chartUuid}`

---

## Filter Configuration

### Supported Operators
```typescript
type FilterOperator = 
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'isNull'
  | 'notNull'
  | 'between'
  | 'inThePast'      // Time: last N days/weeks/months/years
  | 'inTheNext'      // Time: next N days/weeks/months/years
  | 'inTheCurrent';  // Time: current day/week/month/year
```

### Filter Structure
```typescript
interface Filter {
  id: string;
  target: { fieldId: string };
  operator: FilterOperator;
  values: any[];
  disabled?: boolean;
  required?: boolean;
  label?: string;
}
```

### Time-Based Filter Examples
```json
// Last 7 days
{
  "operator": "inThePast",
  "values": [7, "days"]
}

// Last 3 months
{
  "operator": "inThePast",
  "values": [3, "months"]
}

// Next 30 days
{
  "operator": "inTheNext",
  "values": [30, "days"]
}
```

---

## Chart Types

### Cartesian (Bar, Line, Area, Scatter)
```typescript
{
  "type": "cartesian",
  "config": {
    "layout": {
      "xField": "dimension_field",
      "yField": ["metric_field_1", "metric_field_2"],
      "flipAxes": false
    },
    "eChartsConfig": {
      "series": [{
        "type": "bar", // or "line", "area", "scatter"
        "encode": { "x": "dimension", "y": "metric" }
      }]
    }
  }
}
```

### Big Number
```typescript
{
  "type": "big_number",
  "config": {}
}
```

### Table
```typescript
{
  "type": "table",
  "config": {}
}
```

### Pie Chart
```typescript
{
  "type": "pie",
  "config": {
    "layout": {
      "xField": "dimension_field",
      "yField": ["metric_field"]
    }
  }
}
```

---

## Implementation Phases

### Phase 1: Core Tools (Week 1)
**Priority: High**

1. **Type Definitions** (`src/types/chart.ts`)
   - Define all interfaces for filters, chart configs, metric queries
   - Create Zod validation schemas

2. **API Client Methods** (`src/api/lightdash-client.ts`)
   ```typescript
   async createSavedChart(spaceUuid: string, payload: CreateChartInput)
   async updateSavedChart(chartUuid: string, payload: Partial<CreateChartInput>)
   async duplicateSavedChart(chartUuid: string, name: string, spaceUuid?: string)
   async deleteSavedChart(chartUuid: string)
   ```

3. **MCP Tools** (`src/tools/`)
   - `lightdash_create_chart` - Full chart creation
   - `lightdash_update_chart` - Update existing chart
   - `lightdash_duplicate_chart` - Duplicate with modifications

### Phase 2: Helper Utilities (Week 1-2)
**Priority: Medium**

1. **Filter Builder** (`src/utils/filter-builder.ts`)
   ```typescript
   FilterBuilder.equals(fieldId, value)
   FilterBuilder.greaterThan(fieldId, value)
   FilterBuilder.inThePast(fieldId, amount, unit)
   FilterBuilder.between(fieldId, min, max)
   ```

2. **Chart Config Builder** (`src/utils/chart-config-builder.ts`)
   ```typescript
   ChartConfigBuilder.barChart(xField, yFields)
   ChartConfigBuilder.lineChart(xField, yFields)
   ChartConfigBuilder.pieChart(dimension, metric)
   ChartConfigBuilder.bigNumber(metric)
   ```

3. **Query Builder** (`src/utils/query-builder.ts`)
   - Helper to construct complex metricQuery objects
   - Validate field existence against explore schema

### Phase 3: Dashboard Integration (Week 2)
**Priority: Low**

1. **Tools**
   - `lightdash_add_chart_to_dashboard` - Add existing chart to dashboard
   - `lightdash_create_dashboard` - Create dashboard with charts

### Phase 4: Testing (Week 2-3)

1. **Unit Tests** (`tests/tools/*.test.ts`)
   - Filter building logic
   - Payload construction
   - Validation schemas
   - Error handling

2. **Integration Tests** (`tests/integration/*.test.ts`)
   - Test against local Lightdash instance
   - Create → Verify → Delete workflow
   - Filter functionality
   - Chart rendering validation

3. **Example Scripts** (`examples/chart-creation/`)
   - Simple bar chart
   - Chart with filters
   - Time-based filters
   - Multi-metric charts
   - Duplicate and modify pattern

---

## MCP Prompts & Resources

### Why Add Prompts?
Prompts provide guided workflows that help users accomplish complex tasks through natural conversation. They're especially valuable for chart creation because they can:
- Guide users through multi-step processes
- Suggest best practices and optimal configurations
- Reduce cognitive load by asking contextual questions
- Make chart creation accessible to non-technical users

### Why Add Resources?
Resources provide URI-based access to Lightdash data, enabling:
- Direct chart configuration inspection
- Template-based chart creation
- Batch operations on charts
- Integration with other tools

---

## Proposed Prompts

### 1. create-chart-wizard
**Purpose**: Interactive chart creation workflow

**Workflow**:
1. Understand user's analysis goal
2. Search catalog for relevant explores and fields
3. Suggest appropriate metrics and dimensions
4. Recommend filters based on data patterns
5. Propose optimal chart type
6. Create and validate chart

**Example Conversation**:
```
User: "I want to analyze our sales performance"

AI: "I'll help you create a sales performance chart. Let me search for relevant data..."

[AI calls lightdash_get_catalog_search with query="sales"]

AI: "I found the 'sales_data' explore with these useful fields:
- Metrics: total_revenue, order_count, avg_order_value
- Dimensions: region, sales_rep, product_category, created_date

What aspect would you like to focus on? For example:
1. Revenue by region
2. Sales trends over time  
3. Product performance
4. Sales rep leaderboard"

User: "Show me revenue by region for the last quarter"

AI: "Great! I'll create a bar chart showing revenue by region with a filter for Q4. 
What space should I save this chart in?"

User: "Save it in the Sales Analytics space"

[AI calls lightdash_create_chart with appropriate configuration]

AI: "Chart created successfully! 
View it here: [link]
The chart shows total revenue broken down by region, filtered to Q4 2024."
```

**Implementation** (`src/prompts/create-chart-wizard.ts`):
```typescript
server.prompt(
  'create-chart-wizard',
  'Interactive workflow to create charts through guided questions',
  async () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `You are a chart creation assistant. Guide the user through creating a Lightdash chart by:

1. Understanding their analysis goal
2. Searching the catalog for relevant explores and fields
3. Suggesting appropriate metrics and dimensions
4. Recommending filters based on their requirements
5. Proposing the optimal chart type
6. Creating the chart with their approval

Always:
- Ask clarifying questions before making assumptions
- Show available options from the catalog
- Explain why you recommend certain chart types
- Validate field names against the explore schema
- Confirm space selection before creating

Available tools:
- lightdash_get_catalog_search: Find explores and fields
- lightdash_get_explore_with_full_schema: Get field details
- lightdash_list_spaces: Show available spaces
- lightdash_create_chart: Create the final chart`
        }
      }
    ]
  })
);
```

### 2. optimize-chart-filters
**Purpose**: Help users refine and optimize existing chart filters for better performance and clarity

**Workflow**:
1. Analyze current chart configuration
2. Identify filter optimization opportunities
3. Suggest performance improvements
4. Recommend additional relevant filters
5. Apply optimizations with user approval

**Example Conversation**:
```
User: "This chart is slow, can you help optimize it?"

[AI calls lightdash_get_saved_chart_results to analyze current config]

AI: "I've analyzed your chart. Here are optimization opportunities:

Current issues:
- Using 'contains' filter on large text field (slow)
- No time range filter (scanning full history)
- 3 metrics when you're only visualizing 1

Recommended changes:
1. Replace 'contains' with 'equals' for status field
2. Add 'inThePast 90 days' filter on created_date
3. Remove unused metrics (will speed up query by ~40%)

Should I apply these optimizations?"
```

**Implementation** (`src/prompts/optimize-chart-filters.ts`):
```typescript
server.prompt(
  'optimize-chart-filters',
  'Analyze and optimize chart filters for performance and clarity',
  async () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `You are a chart optimization assistant. When given a chart UUID:

1. Fetch the current chart configuration
2. Analyze filters for:
   - Performance issues (slow operators, missing indexes)
   - Unnecessary complexity (redundant filters)
   - Missing best practices (no time bounds)
3. Run the query to check performance
4. Suggest specific optimizations with rationale
5. Apply changes with user approval

Optimization checklist:
- Time-bound filters on date fields
- Indexed field filters over computed fields
- Equals over contains when possible
- Remove unused metrics/dimensions
- Appropriate query limits

Tools to use:
- lightdash_get_saved_chart_results: Get current config
- lightdash_run_underlying_data_query: Test performance
- lightdash_update_chart: Apply optimizations`
        }
      }
    ]
  })
);
```

### 3. chart-template-builder
**Purpose**: Create reusable chart templates from existing charts or new specifications

**Workflow**:
1. Identify common chart patterns in project
2. Extract configuration template
3. Parameterize variable parts (explores, filters, date ranges)
4. Save as reusable template
5. Enable quick chart creation from template

**Example Conversation**:
```
User: "Create a template for 'Last 30 Days Revenue' charts that I can reuse"

AI: "I'll create a reusable template. Which explore should this template work with?"

User: "Make it work with any explore that has a revenue metric and date dimension"

AI: "Perfect! I'll create a flexible template that:
- Accepts any explore name
- Finds revenue-like metrics automatically
- Adds 'inThePast 30 days' filter
- Creates a line chart showing trends

Template created! To use it:
lightdash_create_from_template({
  template: 'revenue-30-days',
  exploreName: 'your_explore',
  spaceUuid: 'space-uuid'
})"
```

**Implementation** (`src/prompts/chart-template-builder.ts`):
```typescript
server.prompt(
  'chart-template-builder',
  'Create reusable chart templates from patterns',
  async () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `You are a chart template assistant. Help users create reusable chart templates:

1. Identify the pattern they want to templatize
2. Extract configuration from existing charts if provided
3. Determine which parts should be parameters
4. Create template documentation
5. Test template with multiple explores

Template components:
- Fixed: Chart type, layout, styling
- Parameters: Explore name, metrics, dimensions, filter values
- Smart defaults: Auto-detect common field patterns

Template types to support:
- Time-series trends (last N days/months)
- Top N rankings (by metric)
- Comparison charts (period over period)
- Distribution analysis (histograms, buckets)

Tools to use:
- lightdash_get_charts_as_code: Extract existing patterns
- lightdash_get_catalog_search: Find similar fields across explores
- lightdash_duplicate_chart: Test template variations`
        }
      }
    ]
  })
);
```

### 4. dashboard-from-charts
**Purpose**: Create comprehensive dashboards from multiple related charts

**Workflow**:
1. Identify related charts by explore/theme
2. Suggest logical grouping and layout
3. Add dashboard-level filters
4. Optimize layout for readability
5. Create dashboard with all tiles

**Example**: "Create a sales dashboard from all charts in the Sales space"

---

## Proposed Resources

### 1. Chart Configuration Access
**URI Pattern**: `lightdash://charts/{chartUuid}/config`

**Purpose**: Direct access to chart configuration for inspection and modification

**Returns**:
```json
{
  "uuid": "chart-uuid",
  "name": "Revenue by Region",
  "metricQuery": { ... },
  "chartConfig": { ... },
  "filters": { ... }
}
```

**Use Cases**:
- Template extraction
- Configuration comparison
- Bulk updates
- Documentation generation

**Implementation**:
```typescript
server.resource(
  'lightdash://charts/{chartUuid}/config',
  'Get complete chart configuration including filters and query',
  async (uri) => {
    const chartUuid = extractUuidFromUri(uri);
    const chart = await lightdashClient.getChart(chartUuid);
    
    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(chart, null, 2)
    };
  }
);
```

### 2. Space Charts List
**URI Pattern**: `lightdash://spaces/{spaceUuid}/charts`

**Purpose**: List all charts in a space with metadata

**Returns**:
```json
{
  "space": {
    "uuid": "space-uuid",
    "name": "Sales Analytics"
  },
  "charts": [
    {
      "uuid": "chart-1",
      "name": "Revenue by Region",
      "chartType": "cartesian",
      "lastUpdated": "2025-10-28T12:00:00Z",
      "metrics": ["total_revenue"],
      "dimensions": ["region"]
    }
  ]
}
```

**Use Cases**:
- Space inventory
- Bulk operations
- Template discovery
- Audit and cleanup

### 3. Chart Templates Library
**URI Pattern**: `lightdash://projects/{projectUuid}/chart-templates`

**Purpose**: Access predefined chart templates for quick creation

**Returns**:
```json
{
  "templates": [
    {
      "id": "revenue-trend",
      "name": "Revenue Trend (Last 30 Days)",
      "description": "Line chart showing revenue over time",
      "chartType": "cartesian",
      "requiredFields": ["date_dimension", "revenue_metric"],
      "filters": [
        {
          "type": "date",
          "operator": "inThePast",
          "value": [30, "days"]
        }
      ]
    }
  ]
}
```

**Use Cases**:
- Quick chart creation
- Standardization across projects
- Onboarding new users
- Best practice sharing

### 4. Chart Relationships
**URI Pattern**: `lightdash://charts/{chartUuid}/relationships`

**Purpose**: Discover related charts by shared fields, explores, or dashboard placement

**Returns**:
```json
{
  "chart": {
    "uuid": "chart-uuid",
    "name": "Revenue by Region"
  },
  "relatedCharts": {
    "sameExplore": [ ... ],
    "sharedFields": [ ... ],
    "sameDashboards": [ ... ],
    "similarFilters": [ ... ]
  },
  "suggestions": [
    "Create a time-series version of this chart",
    "Add this to the Executive Dashboard"
  ]
}
```

**Use Cases**:
- Dashboard curation
- Chart discovery
- Impact analysis (before modifying shared explores)
- Cross-analysis suggestions

### 5. Filter Presets
**URI Pattern**: `lightdash://projects/{projectUuid}/filter-presets`

**Purpose**: Common filter configurations for reuse across charts

**Returns**:
```json
{
  "presets": [
    {
      "id": "last-quarter",
      "name": "Last Quarter",
      "description": "Q3 2024 date range",
      "filters": [ ... ]
    },
    {
      "id": "active-customers",
      "name": "Active Customers Only",
      "filters": [
        {
          "field": "customer_status",
          "operator": "equals",
          "value": "active"
        }
      ]
    }
  ]
}
```

**Use Cases**:
- Consistent filtering across charts
- Quick filter application
- Organizational standards
- Temporal comparisons

---

## Implementation: Prompts & Resources

### Prompts Implementation Plan
**File**: `src/prompts/index.ts`

1. Define prompt template schemas
2. Implement conversation flows
3. Add tool orchestration logic
4. Create fallback handling
5. Add usage examples

**Effort**: 1 week (parallel with Phase 2)

### Resources Implementation Plan
**File**: `src/resources/index.ts`

1. Implement URI parsing and routing
2. Add caching layer for performance
3. Implement each resource endpoint
4. Add error handling
5. Create documentation

**Effort**: 1 week (parallel with Phase 2)

### Testing Prompts & Resources
- Test each prompt workflow end-to-end
- Validate resource URI patterns
- Test caching behavior
- Verify error handling
- Document example usage

### Summary: Prompts & Resources

#### New Prompts (4)
| Prompt | Priority | Effort | Value |
|--------|----------|--------|-------|
| `create-chart-wizard` | High | 3 days | Guided chart creation for non-technical users |
| `optimize-chart-filters` | Medium | 2 days | Performance optimization for existing charts |
| `chart-template-builder` | Medium | 3 days | Reusable templates for standardization |
| `dashboard-from-charts` | Low | 2 days | Automated dashboard assembly |

#### New Resources (5)
| Resource URI | Priority | Effort | Value |
|--------------|----------|--------|-------|
| `lightdash://charts/{chartUuid}/config` | High | 1 day | Direct configuration access |
| `lightdash://spaces/{spaceUuid}/charts` | High | 1 day | Space inventory and bulk ops |
| `lightdash://projects/{projectUuid}/chart-templates` | Medium | 2 days | Template library access |
| `lightdash://charts/{chartUuid}/relationships` | Medium | 2 days | Chart discovery and impact analysis |
| `lightdash://projects/{projectUuid}/filter-presets` | Low | 1 day | Reusable filter configurations |

**Total Additional Effort**: 
- Prompts: 10 days
- Resources: 7 days
- Testing: 3 days
- **Total: 20 days (~4 weeks)**

---

## Code Examples

server.tool(
  'lightdash_create_chart',
  'Create a new saved chart in Lightdash',
  {
    spaceUuid: z.string().uuid(),
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    exploreName: z.string(),
    dimensions: z.array(z.string()),
    metrics: z.array(z.string()),
    filters: z.object({
      dimensions: z.array(filterSchema).optional(),
      metrics: z.array(filterSchema).optional()
    }).optional(),
    chartType: z.enum(['cartesian', 'big_number', 'table', 'pie']),
    sorts: z.array(sortSchema).optional(),
    limit: z.number().optional()
  },
  async (args) => {
    // Build metricQuery payload
    const metricQuery = {
      exploreName: args.exploreName,
      dimensions: args.dimensions,
      metrics: args.metrics,
      filters: args.filters,
      sorts: args.sorts || [],
      limit: args.limit || 500
    };

    // Build chartConfig based on chartType
    const chartConfig = buildChartConfig(args.chartType, {
      xField: args.dimensions[0],
      yField: args.metrics
    });

    // Create chart
    const result = await lightdashClient.createSavedChart(
      args.spaceUuid,
      {
        name: args.name,
        description: args.description,
        tableName: args.exploreName,
        metricQuery,
        chartConfig
      }
    );

    return {
      content: [{
        type: 'text',
        text: `Chart created successfully!\n\nUUID: ${result.uuid}\nName: ${result.name}\nURL: ${result.url}`
      }]
    };
  }
);
```

### Filter Builder Utility
```typescript
export class FilterBuilder {
  static equals(fieldId: string, value: any): Filter {
    return {
      id: crypto.randomUUID(),
      target: { fieldId },
      operator: 'equals',
      values: [value],
      disabled: false
    };
  }

  static inThePast(
    fieldId: string, 
    amount: number, 
    unit: 'days' | 'weeks' | 'months' | 'years'
  ): Filter {
    return {
      id: crypto.randomUUID(),
      target: { fieldId },
      operator: 'inThePast',
      values: [amount, unit],
      disabled: false
    };
  }

  static between(fieldId: string, min: number, max: number): Filter {
    return {
      id: crypto.randomUUID(),
      target: { fieldId },
      operator: 'between',
      values: [min, max],
      disabled: false
    };
  }
}
```

---

## Testing Checklist

### Functional Tests
- [ ] Create chart with single metric and dimension
- [ ] Create chart with multiple metrics
- [ ] Create chart with dimension filters (equals, contains, etc.)
- [ ] Create chart with metric filters (greater than, less than, etc.)
- [ ] Create chart with time-based filters (inThePast, inTheNext)
- [ ] Create chart with multiple filters (AND logic)
- [ ] Update chart name and description
- [ ] Update chart filters
- [ ] Update chart metrics/dimensions
- [ ] Duplicate chart to same space
- [ ] Duplicate chart to different space
- [ ] Create each chart type (cartesian, big_number, table, pie)
- [ ] Delete chart

### Validation Tests
- [ ] Invalid spaceUuid returns error
- [ ] Invalid exploreName returns error
- [ ] Invalid field IDs return error
- [ ] Invalid filter operator returns error
- [ ] Missing required fields return error
- [ ] Chart name length validation
- [ ] Filter value type validation

### Integration Tests
- [ ] Created charts render correctly in Lightdash UI
- [ ] Filters work correctly in UI
- [ ] Sorts apply correctly
- [ ] Charts can be added to dashboards
- [ ] Charts appear in search results
- [ ] URL navigation works

---

## Documentation Updates

### README.md
Update tool count from 19 to 24+ and add:

```markdown
## Chart Creation & Management 🎨

### lightdash_create_chart
Create new saved charts from query definitions with full filter support.

**Example**: Create a bar chart with time filter
```typescript
{
  spaceUuid: "space-123",
  name: "Last 7 Days Revenue",
  exploreName: "sales",
  dimensions: ["region"],
  metrics: ["total_revenue"],
  filters: {
    dimensions: [{
      target: { fieldId: "created_date" },
      operator: "inThePast",
      values: [7, "days"]
    }]
  },
  chartType: "cartesian"
}
```

### lightdash_update_chart
Update existing chart configuration including filters, metrics, and styling.

### lightdash_duplicate_chart
Duplicate existing charts with modifications.
```

### New File: CHART_CREATION.md
Create comprehensive guide with:
- Complete filter operator reference
- Chart type configurations
- Common patterns and recipes
- Troubleshooting guide
- Best practices

---

## Success Criteria

- [ ] All 3 core tools implemented and tested
- [ ] 90%+ test coverage for new code
- [ ] Charts created via MCP render correctly in Lightdash UI
- [ ] Filters work as expected
- [ ] Documentation complete
- [ ] Zero breaking changes to existing functionality
- [ ] Chart creation < 2 seconds average

---

## Technical Notes

### Filter Validation
- Validate field IDs exist in explore schema before creating chart
- Check filter operator compatibility with field type
- Sanitize filter values based on field type

### Error Handling
- Provide clear error messages for invalid configurations
- Include field suggestions for typos
- Validate explore/space existence before attempting creation

### Performance
- Chart creation is async on Lightdash side
- Consider implementing retry logic for API timeouts
- Cache explore schemas to avoid repeated API calls

### Security
- All authentication via existing PAT mechanism
- Input validation using Zod schemas
- No additional security concerns beyond existing implementation

---

## Questions to Resolve

1. Should we validate field existence against explore schema before creating, or let the API handle it?
2. Do we need a preview/dry-run mode before actually creating the chart?
3. Should we support custom SQL dimensions/metrics in initial release?
4. Rate limiting strategy for chart creation?
5. Should duplicate chart include option to modify filters/config in one call?

---

## References

- [Lightdash API Docs](https://docs.lightdash.com/api-reference/v1/introduction)
- [Current MCP Implementation](https://github.com/tomorrowflow/lightdash-mcp-server)
- [Filter Reference](https://docs.lightdash.com/references/filters)
- [Metrics Reference](https://docs.lightdash.com/references/metrics)
