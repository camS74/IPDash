# IPDash - Interactive Performance Dashboard

A comprehensive React-based dashboard for analyzing financial and sales data with advanced filtering, visualization, and reporting capabilities.

## Project Overview

IPDash is a sophisticated business intelligence dashboard that processes Excel data files to provide interactive analysis of:
- Financial performance metrics by product groups
- Sales data analysis by sales representatives
- Manufacturing cost tracking and visualization
- Multi-dimensional filtering by divisions, time periods, and data types

## Quick Start

### Prerequisites
- Node.js (v14 or higher) - Required
- npm or yarn package manager - Required
- PostgreSQL - Can be installed later

### Starting the Application

#### Using Automation Scripts (Recommended)

We've created several automation scripts to simplify the setup and running process:

```bash
# First time setup (installs dependencies without requiring PostgreSQL)
./setup.sh

# Check if environment is properly configured
./check-environment.sh

# If PostgreSQL is installed - start both frontend and backend servers
./start-servers.sh

# If PostgreSQL is NOT installed - start frontend only
./start-frontend-only.sh
```

For macOS users, these scripts will:
- Install all dependencies without requiring PostgreSQL
- Set up environment files
- Start the application based on your PostgreSQL installation status

See [SETUP_GUIDE.md](SETUP_GUIDE.md) and [AUTOMATION_SCRIPTS.md](AUTOMATION_SCRIPTS.md) for detailed instructions on both frontend-only and full setup options.

#### Manual Start

Alternatively, you can start servers manually:

```bash
# Start backend server
cd server
node server.js

# Start frontend server (in new terminal)
npm start
```

This will start:
- Backend server: http://localhost:3001
- Frontend server: http://localhost:3000

## Key Features

### 📊 Product Group Analysis
- **Multi-Division Support**: FP, SB, TF, HCM divisions with automatic sheet detection
- **Dynamic Filtering**: Filter by years, months, quarters, and data types (Budget, Actual, Forecast)
- **Product Group Metrics**: Comprehensive analysis of product categories with derived calculations
- **Sales Rep Integration**: Product group filtering by individual sales reps or sales rep groups

### 👥 Sales by Sales Rep
- **Individual & Group Analysis**: Support for both individual sales reps and predefined groups
- **Ledger Type Filtering**: Filter by 'Kgs' or 'Amount' from dropdown selection
- **S&V Sheet Integration**: Utilizes division-specific S&V sheets for accurate data extraction
- **Dynamic Column Mapping**: Intelligent period column detection and value aggregation
- **Product Group Breakdown**: Display sum of product groups filtered by sales rep and ledger type

### 📈 Advanced Data Processing
- **Excel File Integration**: Processes `Sales.xlsx` and `Financials.xlsx` files
- **Smart Sheet Selection**: Automatic fallback logic (S&V → Volume sheets)
- **Period-Based Calculations**: Support for custom date ranges, quarters, and yearly aggregations
- **Real-time Filtering**: Dynamic data updates based on user selections

### 🎨 User Interface
- **Responsive Design**: Modern, mobile-friendly interface
- **Interactive Tables**: Sortable columns with color-coded metrics
- **Tabbed Navigation**: Organized data presentation across multiple views
- **Export Capabilities**: PDF and Excel export functionality

## Architecture

### Frontend (React)
- **Context-Based State Management**: `ExcelDataContext`, `SalesDataContext`, `FilterContext`
- **Component Structure**:
  - `Dashboard.js` - Main orchestration component
  - `ProductGroupTable.js` - Financial metrics display
  - `SalesBySaleRepTable.js` - Sales rep analysis with product group filtering
  - `FilterContext.js` - Column configuration and period management

### Backend (Node.js/Express)
- **API Endpoints**: Serves Excel files and configuration data
- **File Processing**: Handles `Sales.xlsx` and `Financials.xlsx` parsing
- **Configuration Management**: Sales rep groups and standard configurations

### Data Flow
1. **Data Loading**: Excel files loaded via API endpoints
2. **Sheet Processing**: Division detection and sheet selection (S&V/Volume)
3. **Filtering**: Multi-dimensional filtering by division, rep, period, type
4. **Calculation**: Dynamic value aggregation and derived metrics
5. **Display**: Formatted tables with interactive controls

## Recent Implementations

### Sales by Sales Rep Product Group Integration
**Implementation Date**: Latest Update

**Key Features Added**:
- **S&V Sheet Filtering**: Filter data by sales rep (column A) and ledger type (column E)
- **Product Group Extraction**: Extract unique product groups from column D
- **Dynamic Period Mapping**: Intelligent column index detection for period data (starting from column F)
- **Group Support**: Handle both individual sales reps and sales rep groups
- **Data Limitation**: Limited to first 100 rows for performance

**Technical Details**:
- Enhanced `getUniqueProductGroups()` function with S&V sheet integration
- Implemented `findColumnIndex()` for dynamic period column detection
- Updated `sumForPeriod()` with accurate data aggregation logic
- Consistent sheet selection across all data processing functions

**Files Modified**:
- `src/components/dashboard/SalesBySaleRepTable.js` - Core implementation
- `src/contexts/getUniqueProductGroups.js` - Helper functions

## Available Scripts

### Development
```bash
npm start          # Start development server

npm run build      # Build for production
```



## Data Structure

### Excel File Requirements

**Sales.xlsx Structure**:
- **S&V Sheets**: `{Division}-S&V` (e.g., `FP-S&V`, `SB-S&V`)
  - Column A: Sales Rep Name
  - Column D: Product Group
  - Column E: Ledger Type (Kgs/Amount)
  - Column F+: Period data (Year, Month, Type in header rows)
- **Volume Sheets**: `{Division}-Volume` (fallback when S&V not available)
  - Column A: Sales Rep Name
  - Column B: Product Group
  - Column C+: Period data

**Financials.xlsx Structure**:
- Division-specific sheets with financial metrics
- Header rows containing Year, Month, Type information
- Product group data in subsequent rows

### Configuration Files

**server/data/sales-reps-config.json**:
```json
{
  "defaultSalesReps": ["Rep1", "Rep2"],
  "salesRepGroups": {
    "Group1": ["Rep1", "Rep2"],
    "Group2": ["Rep3", "Rep4"]
  }
}
```

## Development Guidelines

### Adding New Features
1. **Context Updates**: Modify relevant context files for state management
2. **Component Integration**: Update dashboard components with new functionality
3. **Data Processing**: Ensure proper Excel sheet parsing and filtering
4. **Documentation**: Update this README with implementation details
5. **Documentation**: Update this README with implementation details

### Code Organization
```
src/
├── components/
│   ├── dashboard/          # Main dashboard components
│   ├── charts/            # Chart visualizations
│   ├── common/            # Shared UI components
│   └── table/             # Table-specific components
├── contexts/              # React context providers
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
└── styles/                # CSS and styling
```

### Performance Considerations
- **Data Limiting**: Large datasets limited to first 100 rows for performance
- **Dynamic Loading**: Excel files loaded on-demand
- **Efficient Filtering**: Optimized filtering algorithms for large datasets
- **Memory Management**: Proper cleanup of unused data references

## Troubleshooting

### Common Issues

**Server Won't Start**:
- Ensure Node.js is installed (v14+)
- Check if ports 3000/3001 are available
- Run `npm install` in both root and server directories

**Data Not Loading**:
- Verify Excel files exist in `server/data/`
- Check file permissions and format
- Review browser console for API errors

**Filtering Issues**:
- Ensure proper sheet naming convention (`{Division}-S&V`)
- Verify column structure matches expected format
- Check for data type consistency in Excel files

### Debug Mode
```bash
# Check server logs
cd server && npm start
```

## Technical Stack

### Frontend
- **React 18**: Modern React with hooks and context API
- **CSS3**: Custom styling with responsive design
- **JavaScript ES6+**: Modern JavaScript features
- **Context API**: State management without external libraries

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **XLSX**: Excel file parsing and processing
- **CORS**: Cross-origin resource sharing support

### Development Tools
- **Create React App**: React application scaffolding
- **npm**: Package management
- **PowerShell Scripts**: Automated server startup
- **Git**: Version control

### Data Processing
- **Excel Integration**: Direct .xlsx file processing
- **Dynamic Filtering**: Real-time data manipulation
- **Memory Optimization**: Efficient data handling for large datasets
- **Error Handling**: Robust error management and fallback logic

## Contributing

### Development Workflow
1. **Feature Planning**: Document requirements and implementation approach
2. **Implementation**: Follow established patterns and conventions
3. **Verification**: Verify functionality with manual checks
4. **Documentation**: Update README with new features and changes
5. **Code Review**: Ensure code quality and consistency

### Coding Standards
- **Component Structure**: Functional components with hooks
- **State Management**: Context API for shared state
- **Error Handling**: Comprehensive try-catch blocks
- **Performance**: Optimize for large dataset processing
- **Documentation**: Inline comments for complex logic

## Project History

### Major Milestones
- **Initial Setup**: React dashboard with Excel data integration
- **Product Group Analysis**: Multi-division financial metrics
- **Sales Rep Integration**: Individual and group-based analysis
- **S&V Sheet Implementation**: Enhanced data filtering and processing
- **Dynamic Column Mapping**: Intelligent period detection and aggregation

### Recent Updates
- Enhanced sales by sales rep functionality with product group filtering
- Improved data processing efficiency and accuracy
- Added comprehensive documentation and troubleshooting guides
- Implemented robust error handling and fallback mechanisms

---

**Built with ❤️ for business intelligence and data analysis**

*For technical support or feature requests, please refer to the troubleshooting section or contact the development team.*

## Sales Rep HTML Report

### Overview
A new feature has been added to the dashboard that allows users to export a detailed HTML report for each sales representative. This report is designed to match the in-app dashboard style and provides a shareable, static HTML file with all key sales metrics and tables.

### What Has Been Implemented
- **Sales Reports Tab:** A new tab called 'Sales Reports' is available under 'Sales by Sales Rep'.
- **Export Button:** For each sales rep (starting with Narek Koroukian as an example), there is an 'Export HTML Report' button.
- **Live Data Export:** When exporting, the report gathers all current live data for the selected sales rep, including product group performance, customer performance, and summary metrics.
- **Dynamic Period Logic:** The report uses the current period selection from the dashboard (not hardcoded). It dynamically determines the base period, previous period, and next period, and uses these for all tables and summaries.
- **Tables:**
  - Product group performance table (with previous, current, budget, YoY, and achievement columns)
  - Customer performance table (top 10 customers, with period breakdowns and YoY)
- **Executive Summary:** The report includes a summary of total volume, YoY growth, and budget achievement, all based on live data.
- **Data Consistency:** All exported data matches the current dashboard view and selection.

### In Progress / Planned
- **Period Header UI:** Finalizing the HTML/CSS for the period header at the top of the report, matching the app’s style (with color, star, and checkmarks as in the app).
- **Charts:** Adding interactive charts (using Chart.js) for YoY growth, budget achievement, and customer performance, with data hardcoded at export time.
- **Key Findings & Recommendations:** Automatically generating key findings and recommended actions based on the exported data.
- **Q2 (or next period) Growth Targets:** Adding a section for required growth targets for the next period, based on current and target values.
- **Full Style Matching:** Ensuring the exported HTML matches the in-app design, including fonts, colors, and layout.
- **Support for All Sales Reps:** Extending the export to all sales reps, not just the example.

### Usage
1. Go to the 'Sales by Sales Rep' section and select the 'Sales Reports' tab.
2. Click the 'Export HTML Report' button for the desired sales rep.
3. The report will be generated using the current dashboard data and downloaded as an HTML file.

This feature is under active development and will continue to be improved for completeness and visual fidelity.
