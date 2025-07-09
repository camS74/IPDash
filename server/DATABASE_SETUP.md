# IPDashboard Database Setup Guide

## Prerequisites

1. **PostgreSQL Installation**: Ensure PostgreSQL is installed and running on your system
2. **pgAdmin 4**: Install pgAdmin 4 for database management (optional but recommended)
3. **Node.js Dependencies**: The required packages (`pg`, `csv-parser`) are already added to package.json

## Setup Instructions

### Step 1: Configure Database Connection

1. Open the `.env` file in the server directory
2. Update the database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=IPDashboard
DB_USER=postgres
DB_PASSWORD=your_actual_password_here

# Server Configuration
PORT=3001
```

**Important**: Replace `your_actual_password_here` with your actual PostgreSQL password.

### Step 2: Run Database Setup

The setup script will:
- Create the `IPDashboard` database
- Create the `fp_database` table with all necessary columns
- Import data from `fp_database.csv`

Run the setup script:

```bash
cd server
node database/setup.js
```

### Step 3: Verify Setup

1. **Check Database**: Open pgAdmin 4 and verify:
   - `IPDashboard` database exists
   - `fp_database` table exists with data

2. **Test API Connection**: Start the server and test the database connection:

```bash
node server.js
```

Then visit: `http://localhost:3001/api/db/test`

## Database Schema

The `fp_database` table includes:

- **Basic Info**: `salesrepname`, `customername`, `countryname`, `pgcombine`, `values_type`
- **Time Series Data**: Monthly actual and budget values from 2019-2025
- **Metadata**: `id` (auto-increment), `created_at` (timestamp)

## API Endpoints

Once setup is complete, the following endpoints will be available:

### Database Test
- `GET /api/db/test` - Test database connection

### FP Data Endpoints
- `GET /api/fp/sales-reps` - Get all sales representatives
- `GET /api/fp/product-groups` - Get all product groups (optionally filtered by sales rep)

### Query Parameters

The product groups endpoint supports filtering:
- `salesRep` - Filter product groups by sales representative

## Troubleshooting

### Common Issues

1. **Connection Failed**:
   - Verify PostgreSQL is running
   - Check credentials in `.env` file
   - Ensure database user has necessary permissions

2. **CSV Import Failed**:
   - Verify `fp_database.csv` exists at `D:\Dashboard\IPDash\fp_database.csv`
   - Check CSV file format and encoding

3. **Permission Errors**:
   - Ensure PostgreSQL user has CREATE DATABASE permissions
   - Run pgAdmin as administrator if needed

### Manual Database Creation

If automatic setup fails, you can manually create the database:

1. Open pgAdmin 4
2. Right-click on "Databases"
3. Select "Create" > "Database"
4. Name it "IPDashboard"
5. Run the setup script again

## Next Steps

After successful setup:
1. The database is ready for FP division data
2. Additional tables can be added for other divisions (SB, TF, HCM)
3. Frontend components can be updated to use the new API endpoints
4. Excel dependencies can be gradually replaced with database queries

## Future Enhancements

- **Multiple Divisions**: Create separate tables or schemas for SB, TF, HCM divisions
- **Data Validation**: Add constraints and validation rules
- **Indexing**: Add indexes for better query performance
- **Backup Strategy**: Implement regular database backups
- **User Management**: Add role-based access control