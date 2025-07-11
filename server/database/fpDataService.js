const { pool } = require('./config');

class FPDataService {
  // Get all unique sales representatives
  async getSalesReps() {
    try {
      const query = 'SELECT DISTINCT salesrepname FROM fp_data WHERE salesrepname IS NOT NULL ORDER BY salesrepname';
      const result = await pool.query(query);
      return result.rows.map(row => row.salesrepname);
    } catch (err) {
      console.error('Error fetching sales reps:', err);
      throw err;
    }
  }

  // Get all unique product groups
  async getProductGroups() {
    try {
      const query = 'SELECT DISTINCT productgroup FROM fp_data WHERE productgroup IS NOT NULL ORDER BY productgroup';
      const result = await pool.query(query);
      return result.rows.map(row => row.productgroup);
    } catch (err) {
      console.error('Error fetching product groups:', err);
      throw err;
    }
  }

  // Get product groups for a specific sales representative
  async getProductGroupsBySalesRep(salesRep) {
    try {
      const query = 'SELECT DISTINCT productgroup FROM fp_data WHERE salesrepname = $1 AND productgroup IS NOT NULL ORDER BY productgroup';
      const result = await pool.query(query, [salesRep]);
      return result.rows.map(row => row.productgroup);
    } catch (err) {
      console.error('Error fetching product groups for sales rep:', err);
      throw err;
    }
  }

  // Get sales data for a specific sales rep, product group, and period
  async getSalesData(salesRep, productGroup, valueType, year, month) {
    try {
      const query = `
        SELECT SUM(values) as total_value 
        FROM fp_data 
        WHERE salesrepname = $1 
        AND productgroup = $2 
        AND values_type = $3
        AND year = $4
        AND month = $5
        AND type = 'Actual'
      `;
      
      const result = await pool.query(query, [salesRep, productGroup, valueType, year, this.getMonthName(month)]);
      return parseFloat(result.rows[0]?.total_value || 0);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      throw err;
    }
  }

  // Get sales data for multiple sales reps (for groups), product group, and period
  async getSalesDataForGroup(salesReps, productGroup, valueType, year, month, dataType = 'Actual') {
    try {
      if (!salesReps || salesReps.length === 0) {
        return 0;
      }

      // Create placeholders for the IN clause
      const placeholders = salesReps.map((_, index) => `$${index + 1}`).join(', ');
      
      const query = `
        SELECT SUM(values) as total_value 
        FROM fp_data 
        WHERE salesrepname IN (${placeholders}) 
        AND productgroup = $${salesReps.length + 1}
        AND values_type = $${salesReps.length + 2}
        AND year = $${salesReps.length + 3}
        AND month = $${salesReps.length + 4}
        AND type = $${salesReps.length + 5}
      `;
      
      const params = [...salesReps, productGroup, valueType, year, this.getMonthName(month), dataType];
      const result = await pool.query(query, params);
      return parseFloat(result.rows[0]?.total_value || 0);
    } catch (err) {
      console.error('Error fetching sales data for group:', err);
      throw err;
    }
  }

  // Get sales data by value type (Kgs vs Amount)
  async getSalesDataByValueType(salesRep, productGroup, valueType, year, month, dataType = 'Actual') {
    try {
      const query = `
        SELECT SUM(values) as total_value 
        FROM fp_data 
        WHERE salesrepname = $1 
        AND productgroup = $2 
        AND values_type = $3
        AND year = $4
        AND month = $5
        AND type = $6
      `;
      
      const result = await pool.query(query, [salesRep, productGroup, valueType, year, this.getMonthName(month), dataType]);
      return parseFloat(result.rows[0]?.total_value || 0);
    } catch (err) {
      console.error('Error fetching sales data by value type:', err);
      throw err;
    }
  }

  // Helper function to convert month number to month name or return month name as-is
  getMonthName(monthInput) {
    // If it's already a string month name, return it as-is
    if (typeof monthInput === 'string' && isNaN(parseInt(monthInput))) {
      return monthInput;
    }
    
    // If it's a number or numeric string, convert to month name
    const months = {
      1: 'January', 2: 'February', 3: 'March', 4: 'April',
      5: 'May', 6: 'June', 7: 'July', 8: 'August',
      9: 'September', 10: 'October', 11: 'November', 12: 'December'
    };
    return months[parseInt(monthInput)] || monthInput;
  }

  // Batch fetch sales data for multiple periods and value types
  async getBatchSalesData(salesRep, productGroups, valueTypes, periods) {
    try {
      const results = {};
      
      for (const productGroup of productGroups) {
        results[productGroup] = {};
        
        for (const valueType of valueTypes) {
          results[productGroup][valueType] = {};
          
          for (const period of periods) {
            const { year, month } = period;
            const data = await this.getSalesDataByValueType(salesRep, productGroup, valueType, year, month);
            results[productGroup][valueType][`${year}-${month}`] = data;
          }
        }
      }
      
      return results;
    } catch (err) {
      console.error('Error fetching batch sales data:', err);
      throw err;
    }
  }

  // Get all unique customers for a specific sales representative
  async getCustomersBySalesRep(salesRep) {
    try {
      const query = 'SELECT DISTINCT customername FROM fp_data WHERE salesrepname = $1 AND customername IS NOT NULL AND TRIM(customername) != \'\' ORDER BY customername';
      const result = await pool.query(query, [salesRep]);
      return result.rows.map(row => row.customername);
    } catch (err) {
      console.error('Error fetching customers for sales rep:', err);
      throw err;
    }
  }

  // Get customers for multiple sales reps (for groups)
  async getCustomersForGroup(salesReps) {
    try {
      if (!salesReps || salesReps.length === 0) {
        return [];
      }

      // Create placeholders for the IN clause
      const placeholders = salesReps.map((_, index) => `$${index + 1}`).join(', ');
      
      const query = `
        SELECT DISTINCT customername 
        FROM fp_data 
        WHERE salesrepname IN (${placeholders}) 
        AND customername IS NOT NULL 
        AND TRIM(customername) != ''
        ORDER BY customername
      `;
      
      const result = await pool.query(query, salesReps);
      return result.rows.map(row => row.customername);
    } catch (err) {
      console.error('Error fetching customers for group:', err);
      throw err;
    }
  }

  // Get customer sales data by value type (KGS only)
  async getCustomerSalesDataByValueType(salesRep, customerName, valueType, year, month, dataType = 'Actual') {
    try {
      const query = `
        SELECT SUM(values) as total_value 
        FROM fp_data 
        WHERE salesrepname = $1 
        AND customername = $2 
        AND values_type = $3
        AND year = $4
        AND month = $5
        AND type = $6
      `;
      
      const result = await pool.query(query, [salesRep, customerName, valueType, year, this.getMonthName(month), dataType]);
      return parseFloat(result.rows[0]?.total_value || 0);
    } catch (err) {
      console.error('Error fetching customer sales data by value type:', err);
      throw err;
    }
  }

  // Get customer sales data for multiple sales reps (for groups)
  async getCustomerSalesDataForGroup(salesReps, customerName, valueType, year, month, dataType = 'Actual') {
    try {
      if (!salesReps || salesReps.length === 0) {
        return 0;
      }

      // Create placeholders for the IN clause
      const placeholders = salesReps.map((_, index) => `$${index + 1}`).join(', ');
      
      const query = `
        SELECT SUM(values) as total_value 
        FROM fp_data 
        WHERE salesrepname IN (${placeholders}) 
        AND customername = $${salesReps.length + 1}
        AND values_type = $${salesReps.length + 2}
        AND year = $${salesReps.length + 3}
        AND month = $${salesReps.length + 4}
        AND type = $${salesReps.length + 5}
      `;
      
      const params = [...salesReps, customerName, valueType, year, this.getMonthName(month), dataType];
      const result = await pool.query(query, params);
      return parseFloat(result.rows[0]?.total_value || 0);
    } catch (err) {
      console.error('Error fetching customer sales data for group:', err);
      throw err;
    }
  }

}

module.exports = new FPDataService();