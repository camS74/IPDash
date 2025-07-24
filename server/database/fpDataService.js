const { pool } = require('./config');

class FPDataService {
  // Helper function to format names to proper case (Xxxx Xxxx)
  formatToProperCase(name) {
    if (!name || typeof name !== 'string') return name;
    
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

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

  // Helper function to get month name
  getMonthName(monthNumber) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return months[monthNumber - 1];
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
      // Return original names - formatting will be handled in the frontend for display only
      return result.rows.map(row => row.customername);
    } catch (err) {
      console.error('Error fetching customers for sales rep:', err);
      throw err;
    }
  }

  // Get all unique customers from the entire fp_data table
  async getAllCustomers() {
    try {
      const query = 'SELECT DISTINCT customername FROM fp_data WHERE customername IS NOT NULL AND TRIM(customername) != \'\' ORDER BY customername';
      const result = await pool.query(query);
      // Return original names - formatting will be handled in the frontend for display only
      return result.rows.map(row => row.customername);
    } catch (err) {
      console.error('Error fetching all customers:', err);
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
      // Return original names - formatting will be handled in the frontend for display only
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

  // Get yearly budget total for a specific sales rep, year, and value type
  async getYearlyBudget(salesRep, year, valuesType, groupMembers = null) {
    try {
      let query, params;
      
      if (groupMembers && groupMembers.length > 0) {
        // It's a group - get budget for all members
        const placeholders = groupMembers.map((_, index) => `$${index + 1}`).join(', ');
        
        query = `
          SELECT SUM(values) as total_value 
          FROM fp_data 
          WHERE salesrepname IN (${placeholders}) 
          AND values_type = $${groupMembers.length + 1}
          AND year = $${groupMembers.length + 2}
          AND type = 'Budget'
        `;
        
        params = [...groupMembers, valuesType, year];
      } else {
        // Individual sales rep
        query = `
          SELECT SUM(values) as total_value 
          FROM fp_data 
          WHERE salesrepname = $1 
          AND values_type = $2
          AND year = $3
          AND type = 'Budget'
        `;
        
        params = [salesRep, valuesType, year];
      }
      
      const result = await pool.query(query, params);
      return parseFloat(result.rows[0]?.total_value || 0);
    } catch (err) {
      console.error('Error fetching yearly budget:', err);
      throw err;
    }
  }

  // Get sales by country for a specific sales rep, year, months (array), and data type
  async getSalesByCountry(salesRep, year, months, dataType = 'Actual', groupMembers = null) {
    try {
      let query, params;
      // Support both string and array for months
      const monthsArray = Array.isArray(months) ? months : [months];
      if (groupMembers && groupMembers.length > 0) {
        // It's a group - get sales by country for all members
        const placeholders = groupMembers.map((_, index) => `$${index + 1}`).join(', ');
        const monthPlaceholders = monthsArray.map((_, idx) => `$${groupMembers.length + 2 + idx}`).join(', ');
        query = `
          SELECT countryname, SUM(values) as total_value 
          FROM fp_data 
          WHERE salesrepname IN (${placeholders}) 
          AND year = $${groupMembers.length + 1}
          AND month IN (${monthPlaceholders})
          AND type = $${groupMembers.length + 2 + monthsArray.length}
          AND countryname IS NOT NULL
          AND TRIM(countryname) != ''
          GROUP BY countryname
          ORDER BY total_value DESC
        `;
        params = [...groupMembers, year, ...monthsArray, dataType];
      } else {
        // Individual sales rep
        const monthPlaceholders = monthsArray.map((_, idx) => `$${3 + idx}`).join(', ');
        query = `
          SELECT countryname, SUM(values) as total_value 
          FROM fp_data 
          WHERE salesrepname = $1 
          AND year = $2
          AND month IN (${monthPlaceholders})
          AND type = $${3 + monthsArray.length}
          AND countryname IS NOT NULL
          AND TRIM(countryname) != ''
          GROUP BY countryname
          ORDER BY total_value DESC
        `;
        params = [salesRep, year, ...monthsArray, dataType];
      }
      const result = await pool.query(query, params);
      return result.rows.map(row => ({
        country: row.countryname,
        value: parseFloat(row.total_value || 0)
      }));
    } catch (err) {
      console.error('Error fetching sales by country:', err);
      throw err;
    }
  }

  // Get unique countries from fp_data table
  async getCountriesFromDatabase() {
    try {
      const query = `
        SELECT DISTINCT countryname, 
               COUNT(*) as record_count,
               SUM(CASE WHEN values_type = 'KGS' THEN values ELSE 0 END) as total_kgs,
               SUM(CASE WHEN values_type = 'Amount' THEN values ELSE 0 END) as total_amount
        FROM fp_data 
        WHERE countryname IS NOT NULL 
        AND TRIM(countryname) != '' 
        AND countryname != '(blank)'
        GROUP BY countryname
        ORDER BY total_kgs DESC, countryname ASC
      `;
      
      const result = await pool.query(query);
      return result.rows.map(row => ({
        country: row.countryname,
        recordCount: parseInt(row.record_count),
        totalKgs: parseFloat(row.total_kgs || 0),
        totalAmount: parseFloat(row.total_amount || 0)
      }));
    } catch (err) {
      console.error('Error fetching countries from database:', err);
      throw err;
    }
  }

  // Get countries with sales data for a specific sales rep (for country reference)
  async getCountriesBySalesRep(salesRep, groupMembers = null) {
    try {
      let query, params;
      
      if (groupMembers && groupMembers.length > 0) {
        // It's a group - get countries for all members
        const placeholders = groupMembers.map((_, index) => `$${index + 1}`).join(', ');
        
        query = `
          SELECT DISTINCT countryname,
                 SUM(CASE WHEN values_type = 'KGS' THEN values ELSE 0 END) as total_kgs,
                 SUM(CASE WHEN values_type = 'Amount' THEN values ELSE 0 END) as total_amount,
                 COUNT(*) as record_count
          FROM fp_data 
          WHERE salesrepname IN (${placeholders}) 
          AND countryname IS NOT NULL 
          AND TRIM(countryname) != '' 
          AND countryname != '(blank)'
          GROUP BY countryname
          ORDER BY total_kgs DESC, countryname ASC
        `;
        
        params = [...groupMembers];
      } else {
        // Individual sales rep
        query = `
          SELECT DISTINCT countryname,
                 SUM(CASE WHEN values_type = 'KGS' THEN values ELSE 0 END) as total_kgs,
                 SUM(CASE WHEN values_type = 'Amount' THEN values ELSE 0 END) as total_amount,
                 COUNT(*) as record_count
          FROM fp_data 
          WHERE salesrepname = $1 
          AND countryname IS NOT NULL 
          AND TRIM(countryname) != '' 
          AND countryname != '(blank)'
          GROUP BY countryname
          ORDER BY total_kgs DESC, countryname ASC
        `;
        
        params = [salesRep];
      }
      
      const result = await pool.query(query, params);
      return result.rows.map(row => ({
        country: row.countryname,
        totalKgs: parseFloat(row.total_kgs || 0),
        totalAmount: parseFloat(row.total_amount || 0),
        recordCount: parseInt(row.record_count)
      }));
    } catch (err) {
      console.error('Error fetching countries by sales rep:', err);
      throw err;
    }
  }

}

module.exports = new FPDataService();