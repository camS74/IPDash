const { pool } = require('./config');

class FPDataService {
  // Get all unique sales representatives
  async getSalesReps() {
    try {
      const query = 'SELECT DISTINCT salesrepname FROM fp_database WHERE salesrepname IS NOT NULL ORDER BY salesrepname';
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
      const query = 'SELECT DISTINCT pgcombine FROM fp_database WHERE pgcombine IS NOT NULL ORDER BY pgcombine';
      const result = await pool.query(query);
      return result.rows.map(row => row.pgcombine);
    } catch (err) {
      console.error('Error fetching product groups:', err);
      throw err;
    }
  }

  // Get product groups for a specific sales representative
  async getProductGroupsBySalesRep(salesRep) {
    try {
      const query = 'SELECT DISTINCT pgcombine FROM fp_database WHERE salesrepname = $1 AND pgcombine IS NOT NULL ORDER BY pgcombine';
      const result = await pool.query(query, [salesRep]);
      return result.rows.map(row => row.pgcombine);
    } catch (err) {
      console.error('Error fetching product groups for sales rep:', err);
      throw err;
    }
  }






}

module.exports = new FPDataService();