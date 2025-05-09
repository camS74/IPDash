# DashIP Project Structure

```
D:\Downloads\DashNew/
│
├── public/                       # Static files
│   ├── index.html
│   └── favicon.ico
│
├── src/                          # Source files
│   ├── api/                      # API functions
│   │   └── excelService.js       # Excel data fetching & processing
│   │
│   ├── components/               # Reusable components
│   │   ├── common/               # Common UI components
│   │   │   ├── Spinner.js        # Loading indicator
│   │   │   ├── ErrorMessage.js   # Error display
│   │   │   └── FilterSelector.js # Filter UI component
│   │   │
│   │   ├── dashboard/            # Dashboard specific components
│   │   │   ├── TabNavigation.js  # Tabs for Table/Charts
│   │   │   ├── DivisionSelector.js  # Division selection component
│   │   │   ├── YearSelector.js   # Year filter component
│   │   │   └── MonthSelector.js  # Month filter component
│   │   │
│   │   ├── table/                # Table specific components
│   │   │   ├── TableView.js      # Main table component
│   │   │   ├── TableHeader.js    # Table header component
│   │   │   ├── TableRow.js       # Table row component
│   │   │   └── TableCell.js      # Table cell component
│   │   │
│   │   └── charts/               # Charts specific components
│   │       ├── ChartView.js      # Main chart component
│   │       ├── LineChart.js      # Line chart component
│   │       ├── BarChart.js       # Bar chart component
│   │       └── KPICard.js        # KPI display component
│   │
│   ├── context/                  # React context
│   │   ├── DashboardContext.js   # Context for dashboard state
│   │   └── FilterContext.js      # Context for filter state
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useExcelData.js       # Hook for Excel data loading
│   │   └── useColumnGenerator.js # Hook for column generation
│   │
│   ├── utils/                    # Utility functions
│   │   ├── excelUtils.js         # Excel parsing functions
│   │   ├── calculationUtils.js   # Financial calculations
│   │   ├── filterUtils.js        # Filter processing utils
│   │   └── colorUtils.js         # Color coding functions
│   │
│   ├── styles/                   # CSS/SCSS files
│   │   ├── index.css             # Global styles
│   │   ├── Dashboard.css         # Dashboard styles
│   │   ├── TableStyles.css       # Table specific styles
│   │   └── ChartStyles.css       # Chart specific styles
│   │
│   ├── App.js                    # Main application component
│   ├── index.js                  # Application entry point
│   └── setupTests.js             # Test configuration
│
├── package.json                  # Dependencies and scripts
├── .gitignore                    # Git ignore file
├── .env                          # Environment variables
└── README.md                     # Project documentation
```
