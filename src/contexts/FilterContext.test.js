import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { FilterProvider, useFilter } from './FilterContext';
import { ExcelDataProvider, useExcelData } from './ExcelDataContext'; // Required for context dependency

// Mock useExcelData
jest.mock('./ExcelDataContext', () => ({
  ...jest.requireActual('./ExcelDataContext'), // Import and retain default exports
  useExcelData: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });


// Defines the maximum number of columns a user can select.
// Copied from FilterContext.js for use in tests
const MAX_COLUMNS = 5;


// Helper function to wrap hooks with provider
const wrapper = ({ children }) => (
  <ExcelDataProvider> {/* FilterProvider depends on ExcelDataProvider */}
    <FilterProvider>{children}</FilterProvider>
  </ExcelDataProvider>
);


describe('FilterContext', () => {
  beforeEach(() => {
    // Reset mocks and localStorage before each test
    localStorageMock.clear();
    jest.clearAllMocks(); // Clears all Jest mocks, including localStorageMock's spies and useExcelData

    // Default mock for useExcelData - can be overridden in specific tests
    useExcelData.mockReturnValue({
      excelData: {},
      selectedDivision: null,
    });
    
    jest.spyOn(console, 'warn').mockImplementation(() => {}); // Suppress console.warn for MAX_COLUMNS test
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    test('initializes with default values when localStorage is empty', () => {
      const { result } = renderHook(() => useFilter(), { wrapper });
      expect(result.current.availableFilters).toEqual({ years: [], months: [], types: [] });
      expect(result.current.columnOrder).toEqual([]);
      expect(result.current.basePeriodIndex).toBeNull();
      expect(result.current.chartVisibleColumns).toEqual([]);
    });

    test('loads columnOrder from localStorage', () => {
      const storedColumnOrder = [{ id: '2023-Year-Sales', year: '2023', month: 'Year', type: 'Sales', months: [] }];
      localStorageMock.setItem('standardColumnSelection', JSON.stringify(storedColumnOrder));
      const { result } = renderHook(() => useFilter(), { wrapper });
      expect(result.current.columnOrder).toEqual(storedColumnOrder);
    });

    test('loads basePeriodIndex from localStorage', () => {
      localStorageMock.setItem('basePeriodIndex', JSON.stringify(1));
      const { result } = renderHook(() => useFilter(), { wrapper });
      expect(result.current.basePeriodIndex).toBe(1);
    });

    test('loads chartVisibleColumns from localStorage', () => {
      const storedVisibility = ['2023-Year-Sales'];
      localStorageMock.setItem('chartVisibleColumns', JSON.stringify(storedVisibility));
      const { result } = renderHook(() => useFilter(), { wrapper });
      expect(result.current.chartVisibleColumns).toEqual(storedVisibility);
    });
  });

  describe('Column Management', () => {
    test('addColumn successfully adds a new unique column', () => {
      const { result } = renderHook(() => useFilter(), { wrapper });
      act(() => {
        const success = result.current.addColumn('2023', 'January', 'Sales');
        expect(success).toBe(true);
      });
      expect(result.current.columnOrder).toHaveLength(1);
      expect(result.current.columnOrder[0]).toMatchObject({ year: '2023', month: 'January', type: 'Sales' });
    });

    test('addColumn prevents adding duplicate columns', () => {
      const { result } = renderHook(() => useFilter(), { wrapper });
      act(() => {
        result.current.addColumn('2023', 'January', 'Sales');
      });
      act(() => {
        const success = result.current.addColumn('2023', 'January', 'Sales'); // Attempt duplicate
        expect(success).toBe(false);
      });
      expect(result.current.columnOrder).toHaveLength(1);
    });

    test(`addColumn respects MAX_COLUMNS limit of ${MAX_COLUMNS}`, () => {
      const { result } = renderHook(() => useFilter(), { wrapper });
      for (let i = 0; i < MAX_COLUMNS; i++) {
        act(() => {
          result.current.addColumn('2023', `Month${i}`, 'Sales');
        });
      }
      expect(result.current.columnOrder).toHaveLength(MAX_COLUMNS);
      act(() => {
        const success = result.current.addColumn('2023', 'OverflowMonth', 'Sales');
        expect(success).toBe(false);
      });
      expect(result.current.columnOrder).toHaveLength(MAX_COLUMNS);
      expect(console.warn).toHaveBeenCalledWith(`Maximum number of columns (${MAX_COLUMNS}) reached`);
    });
    
    test('addColumn correctly defines months for "Year" and "Quarter" periods', () => {
      const { result } = renderHook(() => useFilter(), { wrapper });
      act(() => result.current.addColumn('2023', 'Year', 'Sales'));
      act(() => result.current.addColumn('2023', 'Q1', 'Expenses'));
      
      const yearColumn = result.current.columnOrder.find(col => col.month === 'Year');
      const q1Column = result.current.columnOrder.find(col => col.month === 'Q1');
      
      expect(yearColumn.months).toEqual(result.current.fullYear);
      expect(q1Column.months).toEqual(result.current.quarters.Q1);
    });

    test('removeColumn removes an existing column', () => {
      const { result } = renderHook(() => useFilter(), { wrapper });
      act(() => {
        result.current.addColumn('2023', 'January', 'Sales');
      });
      const columnIdToRemove = result.current.columnOrder[0].id;
      act(() => {
        result.current.removeColumn(columnIdToRemove);
      });
      expect(result.current.columnOrder).toHaveLength(0);
    });

    test('clearAllColumns clears all columns and resets dataGenerated', () => {
      const { result } = renderHook(() => useFilter(), { wrapper });
      act(() => {
        result.current.addColumn('2023', 'January', 'Sales');
        result.current.generateData(); // Set dataGenerated to true
      });
      expect(result.current.columnOrder).toHaveLength(1);
      expect(result.current.dataGenerated).toBe(true);
      act(() => {
        result.current.clearAllColumns();
      });
      expect(result.current.columnOrder).toHaveLength(0);
      expect(result.current.dataGenerated).toBe(false);
    });
  });

  describe('localStorage Interactions', () => {
    test('saveAsStandardSelection calls localStorage.setItem', () => {
      const { result } = renderHook(() => useFilter(), { wrapper });
      act(() => {
        result.current.addColumn('2023', 'January', 'Sales');
      });
      act(() => {
        result.current.saveAsStandardSelection();
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('standardColumnSelection', JSON.stringify(result.current.columnOrder));
    });

    test('clearStandardSelection calls localStorage.removeItem', () => {
      const { result } = renderHook(() => useFilter(), { wrapper });
      act(() => {
        result.current.clearStandardSelection();
      });
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('standardColumnSelection');
    });

    test('setBasePeriod calls localStorage.setItem', () => {
      const { result } = renderHook(() => useFilter(), { wrapper });
      act(() => {
        result.current.setBasePeriod(1);
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('basePeriodIndex', JSON.stringify(1));
    });

    test('clearBasePeriod calls localStorage.removeItem', () => {
      const { result } = renderHook(() => useFilter(), { wrapper });
      act(() => {
        result.current.clearBasePeriod();
      });
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('basePeriodIndex');
    });
    
    test('toggleChartColumnVisibility adds and removes columnId and calls localStorage.setItem', () => {
      const { result } = renderHook(() => useFilter(), { wrapper });
      const columnId = 'test-column-id';

      // Add to visibility
      act(() => {
        result.current.toggleChartColumnVisibility(columnId);
      });
      expect(result.current.chartVisibleColumns).toContain(columnId);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('chartVisibleColumns', JSON.stringify([columnId]));

      // Remove from visibility
      act(() => {
        result.current.toggleChartColumnVisibility(columnId);
      });
      expect(result.current.chartVisibleColumns).not.toContain(columnId);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('chartVisibleColumns', JSON.stringify([]));
    });
    
    test('useEffect for chartVisibleColumns syncs with columnOrder and localStorage', () => {
      const initialColumns = [{ id: 'col1', year: '2023', month: 'Jan', type: 'A' }];
      localStorageMock.setItem('standardColumnSelection', JSON.stringify(initialColumns));
      localStorageMock.setItem('chartVisibleColumns', JSON.stringify(['col1']));

      const { result, rerender } = renderHook(() => useFilter(), { wrapper });
      expect(result.current.chartVisibleColumns).toEqual(['col1']);

      // Add a new column
      act(() => {
        result.current.addColumn('2024', 'Feb', 'B');
      });
      rerender(); // Rerender to trigger useEffect
      expect(result.current.chartVisibleColumns).toEqual(['col1', '2024-Feb-B']);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('chartVisibleColumns', JSON.stringify(['col1', '2024-Feb-B']));
      
      // Remove a column
      act(() => {
        result.current.removeColumn('col1');
      });
      rerender(); // Rerender to trigger useEffect
      expect(result.current.chartVisibleColumns).toEqual(['2024-Feb-B']);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('chartVisibleColumns', JSON.stringify(['2024-Feb-B']));
    });
  });

  describe('availableFilters Extraction', () => {
    test('extracts filters correctly from excelData', () => {
      const mockExcelData = {
        DivisionA: [
          ['', '2023', '2023', '2024'], // Years in row 0
          ['', 'January', 'February', 'January'], // Months in row 1
          ['', 'Sales', 'Expenses', 'Sales'], // Types in row 2
          ['Category1', 100, 150, 200],
        ],
      };
      useExcelData.mockReturnValue({
        excelData: mockExcelData,
        selectedDivision: 'DivisionA',
      });

      const { result } = renderHook(() => useFilter(), { wrapper });
      
      expect(result.current.availableFilters.years).toEqual(['2023', '2024']);
      // Note: "Year", "Q1"-"Q4" are prepended by the context itself
      expect(result.current.availableFilters.months).toEqual(expect.arrayContaining(['Year', 'Q1', 'Q2', 'Q3', 'Q4', 'January', 'February']));
      expect(result.current.availableFilters.types).toEqual(['Sales', 'Expenses']);
    });

    test('handles empty or malformed sheet data gracefully for filter extraction', () => {
      useExcelData.mockReturnValue({
        excelData: { DivisionA: [] }, // Empty sheet
        selectedDivision: 'DivisionA',
      });
      const { result: resultEmpty } = renderHook(() => useFilter(), { wrapper });
      expect(resultEmpty.current.availableFilters).toEqual({ years: [], months: [], types: [] });

      useExcelData.mockReturnValue({
        excelData: { DivisionB: [['Header']] }, // Malformed sheet (not enough rows)
        selectedDivision: 'DivisionB',
      });
      const { resultMalformed } = renderHook(() => useFilter(), { wrapper });
      expect(resultMalformed.current.availableFilters).toEqual({ years: [], months: [], types: [] });
    });
  });
  
  describe('Data Generation Flag', () => {
    test('generateData sets dataGenerated to true if columns exist', () => {
      const { result } = renderHook(() => useFilter(), { wrapper });
      act(() => {
        result.current.addColumn('2023', 'Jan', 'Sales');
      });
      act(() => {
        const success = result.current.generateData();
        expect(success).toBe(true);
      });
      expect(result.current.dataGenerated).toBe(true);
    });

    test('generateData returns false and does not change dataGenerated if no columns exist', () => {
      const { result } = renderHook(() => useFilter(), { wrapper });
      expect(result.current.dataGenerated).toBe(false); // Initial state
      act(() => {
        const success = result.current.generateData();
        expect(success).toBe(false);
      });
      expect(result.current.dataGenerated).toBe(false);
    });
  });
});
