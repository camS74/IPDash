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
- Node.js (v14 or higher)
- npm or yarn package manager

### Starting the Application

Use the provided PowerShell script to start both frontend and backend servers:

```powershell
.\start-servers.ps1
```

This will start:
- Backend server: http://localhost:3001
- Frontend server: http://localhost:3000

Alternatively, you can start servers manually:

```bash
# Start backend server
cd server
npm start

# Start frontend server (in new terminal)
npm start
```

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
