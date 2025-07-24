import React, { useEffect, useState } from 'react';
import { useFilter } from '../../contexts/FilterContext';
import ReportHeader from './ReportHeader';
import ExecutiveSummary from './ExecutiveSummary';
import PerformanceDashboard from './PerformanceDashboard';
import ProductPerformanceTable from './ProductPerformanceTable';
import KeyInsights from './KeyInsights';
import TopCustomersTable from './TopCustomersTable';
import PeriodComparison from './PeriodComparison';
import ExportActions from './ExportActions';
import './SalesRepReport.css';

const SalesRepReport = ({ 
  rep, 
  getProductGroupsForSalesRep, 
  fetchCustomerDashboardData, 
  preparePeriods, 
  buildExtendedColumns, 
  processCustomerData 
}) => {
  const { columnOrder, basePeriodIndex } = useFilter();
  const [kgsData, setKgsData] = useState([]);
  const [amountData, setAmountData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const toProperCase = (str) => {
    if (!str) return '';
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Fetch data for the report
  useEffect(() => {
    const fetchReportData = async () => {
      if (!rep || !columnOrder || columnOrder.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all necessary data
        const [kgsResult, amountResult] = await Promise.all([
          getProductGroupsForSalesRep(rep, 'KGS', columnOrder),
          getProductGroupsForSalesRep(rep, 'Amount', columnOrder)
        ]);

        // Fetch customer data
        const { customers, dashboardData } = await fetchCustomerDashboardData(rep, preparePeriods(columnOrder));
        const extendedColumns = buildExtendedColumns(columnOrder);
        
        const processedCustomers = customers.map(customerName => 
          processCustomerData(customerName, extendedColumns, dashboardData)
        );

        // Sort customers by base period volume
        if (basePeriodIndex != null && basePeriodIndex >= 0) {
          processedCustomers.sort((a, b) => {
            const aValue = a.rawValues[basePeriodIndex] || 0;
            const bValue = b.rawValues[basePeriodIndex] || 0;
            return bValue - aValue;
          });
        }

        setKgsData(kgsResult);
        setAmountData(amountResult);
        setCustomerData(processedCustomers);

        // Generate report data
        generateReportData(kgsResult, amountResult, processedCustomers);

      } catch (error) {
        console.error('Error fetching report data:', error);
        setError('Failed to load report data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [rep, columnOrder, basePeriodIndex]);

  // Generate comprehensive report data
  const generateReportData = (kgsData, amountData, customerData) => {
    if (!columnOrder || basePeriodIndex === null) return;

    const basePeriod = columnOrder[basePeriodIndex];
    const prevPeriod = basePeriodIndex > 0 ? columnOrder[basePeriodIndex - 1] : null;
    const nextPeriod = basePeriodIndex < columnOrder.length - 1 ? columnOrder[basePeriodIndex + 1] : null;

    // Calculate totals and key metrics
    const kgsTotals = calculateTotals(kgsData);
    const amountTotals = calculateTotals(amountData);
    
    // Generate insights and findings
    const insights = generateInsights(kgsData, amountData, customerData);
    
    setReportData({
      basePeriod,
      basePeriodIndex,
      prevPeriod,
      nextPeriod,
      kgsTotals,
      amountTotals,
      insights,
      topProducts: getTopPerformers(kgsData, basePeriodIndex),
      topCustomers: customerData.slice(0, 5),
      performanceMetrics: calculatePerformanceMetrics(kgsData, amountData),
      periodLabel: basePeriod,
      salesRep: rep
    });
  };

  // Calculate totals for a dataset
  const calculateTotals = (data) => {
    if (!data || !columnOrder) return {};
    
    const totals = {};
    columnOrder.forEach((col, index) => {
      const total = data.reduce((sum, item) => {
        const value = item.rawValues[index] || 0;
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
      totals[index] = total;
    });
    return totals;
  };

  // Get top performing products
  const getTopPerformers = (data, baseIndex) => {
    if (!data || baseIndex === null) return [];
    
    return data
      .filter(item => item.rawValues[baseIndex] > 0)
      .sort((a, b) => (b.rawValues[baseIndex] || 0) - (a.rawValues[baseIndex] || 0))
      .slice(0, 5);
  };

  // Generate insights based on data analysis
  const generateInsights = (kgsData, amountData, customerData) => {
    const insights = [];
    
    if (basePeriodIndex !== null && basePeriodIndex > 0) {
      // YoY Growth Analysis
      const currentKgs = calculateTotals(kgsData)[basePeriodIndex] || 0;
      const prevKgs = calculateTotals(kgsData)[basePeriodIndex - 1] || 0;
      
      if (prevKgs > 0) {
        const growth = ((currentKgs - prevKgs) / prevKgs) * 100;
        insights.push({
          type: growth > 0 ? 'positive' : 'negative',
          title: `${growth > 0 ? 'Growth' : 'Decline'} in Sales Volume`,
          description: `${Math.abs(growth).toFixed(1)}% ${growth > 0 ? 'increase' : 'decrease'} compared to previous period`
        });
      }
    }

    // Top product analysis
    const topProduct = getTopPerformers(kgsData, basePeriodIndex)[0];
    if (topProduct) {
      insights.push({
        type: 'info',
        title: 'Top Performing Product',
        description: `${topProduct.productGroup} leads with ${(topProduct.rawValues[basePeriodIndex] || 0).toLocaleString()} KGS`
      });
    }

    // Customer concentration
    if (customerData.length > 0) {
      const topCustomerValue = customerData[0]?.rawValues[basePeriodIndex] || 0;
      const totalCustomerValue = customerData.reduce((sum, customer) => 
        sum + (customer.rawValues[basePeriodIndex] || 0), 0);
      
      if (totalCustomerValue > 0) {
        const concentration = (topCustomerValue / totalCustomerValue) * 100;
        insights.push({
          type: concentration > 50 ? 'warning' : 'info',
          title: 'Customer Concentration',
          description: `Top customer represents ${concentration.toFixed(1)}% of total sales`
        });
      }
    }

    return insights;
  };

  // Calculate performance metrics
  const calculatePerformanceMetrics = (kgsData, amountData) => {
    if (!columnOrder || basePeriodIndex === null) return {};

    const kgsTotal = calculateTotals(kgsData)[basePeriodIndex] || 0;
    const amountTotal = calculateTotals(amountData)[basePeriodIndex] || 0;
    
    return {
      totalKgs: kgsTotal,
      totalAmount: amountTotal,
      avgPricePerKg: kgsTotal > 0 ? amountTotal / kgsTotal : 0,
      productCount: kgsData.filter(item => (item.rawValues[basePeriodIndex] || 0) > 0).length,
      customerCount: customerData.filter(customer => (customer.rawValues[basePeriodIndex] || 0) > 0).length
    };
  };

  if (loading) {
    return (
      <div className="sales-rep-report-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Generating comprehensive report for {toProperCase(rep)}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sales-rep-report-content">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Report</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="sales-rep-report-content">
        <div className="no-data-container">
          <div className="no-data-icon">📊</div>
          <h3>No Data Available</h3>
          <p>Please select periods to generate the report for {toProperCase(rep)}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-rep-report-content">
      <div className="report-container">
        <ReportHeader 
          rep={rep} 
          basePeriod={reportData.basePeriod}
          toProperCase={toProperCase}
        />
        
        <ExecutiveSummary 
          performanceMetrics={reportData.performanceMetrics}
          reportData={reportData}
          kgsData={kgsData}
          basePeriodIndex={basePeriodIndex}
        />
        
        <PerformanceDashboard 
          reportData={reportData}
        />
        
        <ProductPerformanceTable 
          reportData={reportData}
          amountData={amountData}
          basePeriodIndex={basePeriodIndex}
          performanceMetrics={reportData.performanceMetrics}
        />
        
        <KeyInsights 
          insights={reportData.insights}
        />
        
        <TopCustomersTable 
          topCustomers={reportData.topCustomers}
          basePeriodIndex={basePeriodIndex}
          totalKgs={reportData.performanceMetrics.totalKgs}
        />
        
        {reportData.prevPeriod && (
          <PeriodComparison 
            prevPeriod={reportData.prevPeriod}
            basePeriod={reportData.basePeriod}
            nextPeriod={reportData.nextPeriod}
            kgsTotals={reportData.kgsTotals}
            basePeriodIndex={basePeriodIndex}
          />
        )}
        
        <ExportActions 
          rep={rep}
          toProperCase={toProperCase}
        />
      </div>
    </div>
  );
};

export default SalesRepReport;
