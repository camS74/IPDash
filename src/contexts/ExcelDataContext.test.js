import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ExcelDataProvider, useExcelData } from './ExcelDataContext';
import * as XLSX from 'xlsx';

// Mock XLSX library
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
  },
}));

// Helper function to wrap hooks with provider
const wrapper = ({ children }) => <ExcelDataProvider>{children}</ExcelDataProvider>;

describe('ExcelDataContext', () => {
  beforeEach(() => {
    // Reset mocks before each test
    XLSX.read.mockReset();
    XLSX.utils.sheet_to_json.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
    jest.spyOn(console, 'log').mockImplementation(() => {}); // Suppress console.log
    jest.spyOn(console, 'warn').mockImplementation(() => {}); // Suppress console.warn
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restore original console functions
  });

  const mockExcelBuffer = new ArrayBuffer(8); // Dummy buffer

  test('loadExcelData successfully loads and parses Excel data', async () => {
    const mockSheetData = [['Header1', 'Header2'], ['Data1', 'Data2']];
    const mockParsedData = {
      Sheet1: mockSheetData,
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockExcelBuffer),
    });
    XLSX.read.mockReturnValueOnce({
      SheetNames: ['Sheet1'],
      Sheets: { Sheet1: {} },
    });
    XLSX.utils.sheet_to_json.mockReturnValueOnce(mockSheetData);

    const { result } = renderHook(() => useExcelData(), { wrapper });

    await act(async () => {
      await result.current.loadExcelData();
    });

    expect(result.current.excelData).toEqual(mockParsedData);
    expect(result.current.divisions).toEqual(['Sheet1']);
    expect(result.current.selectedDivision).toBe('Sheet1');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.dataLoaded).toBe(true);
  });

  test('loadExcelData handles network errors', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useExcelData(), { wrapper });

    await act(async () => {
      try {
        await result.current.loadExcelData();
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.error).toBe('A network error occurred. Please check your internet connection and try again.');
    expect(result.current.loading).toBe(false);
    expect(result.current.dataLoaded).toBe(false);
  });

  test('loadExcelData handles HTTP 404 errors', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });
    const { result } = renderHook(() => useExcelData(), { wrapper });

    await act(async () => {
      try {
        await result.current.loadExcelData();
      } catch (e) {
        // Expected error
      }
    });
    
    expect(result.current.error).toBe('The financial data file could not be found on the server. Please contact support.');
    expect(result.current.loading).toBe(false);
    expect(result.current.dataLoaded).toBe(false);
  });

  test('loadExcelData handles other HTTP errors', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    const { result } = renderHook(() => useExcelData(), { wrapper });

    await act(async () => {
      try {
        await result.current.loadExcelData();
      } catch (e) {
        // Expected error
      }
    });
    
    expect(result.current.error).toBe('An error occurred while fetching the financial data (HTTP Status: 500). Please try again later.');
    expect(result.current.loading).toBe(false);
    expect(result.current.dataLoaded).toBe(false);
  });

  test('loadExcelData handles empty file errors', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)), // Empty buffer
    });
    const { result } = renderHook(() => useExcelData(), { wrapper });

    await act(async () => {
      try {
        await result.current.loadExcelData();
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.error).toBe('The financial data file appears to be empty.');
    expect(result.current.loading).toBe(false);
    expect(result.current.dataLoaded).toBe(false);
  });

  test('loadExcelData handles errors when Excel file has no sheets', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockExcelBuffer),
    });
    XLSX.read.mockReturnValueOnce({ // Workbook with no sheets
      SheetNames: [],
      Sheets: {},
    });
    const { result } = renderHook(() => useExcelData(), { wrapper });

    await act(async () => {
      try {
        await result.current.loadExcelData();
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.error).toBe('The financial data file does not contain any sheets.');
    expect(result.current.loading).toBe(false);
    expect(result.current.dataLoaded).toBe(false);
  });

  test('loadExcelData handles XLSX.read parsing errors', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockExcelBuffer),
    });
    XLSX.read.mockImplementationOnce(() => {
      throw new Error('Corrupted file');
    });
    const { result } = renderHook(() => useExcelData(), { wrapper });

    await act(async () => {
      try {
        await result.current.loadExcelData();
      } catch (e) {
        // Expected error
      }
    });
    
    expect(result.current.error).toBe('An error occurred while parsing the financial data file. It might be corrupted or in an unsupported format.');
    expect(result.current.loading).toBe(false);
    expect(result.current.dataLoaded).toBe(false);
  });
});
