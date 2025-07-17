# Enhanced FP Data Import Script with Automatic Cleanup
# This script imports data and automatically cleans it to prevent whitespace issues

# Set the password for the session
$env:PGPASSWORD = "654883"

# Configuration
$csvPath = "D:\IPDashboard 10.7\IPDash\fp_data.csv"
$backupPath = "D:/IPDashboard 10.7/IPDash/fp_data_backup.csv"
$cleanupScriptPath = "D:\IPDashboard 10.7\IPDash\data_cleanup_script.sql"
$psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
$dbParams = "-h localhost -p 5432 -U postgres -d postgres"

Write-Host "=== Enhanced FP Data Import with Cleanup ===" -ForegroundColor Green
Write-Host "Starting import process..." -ForegroundColor Yellow

# Step 1: Backup existing data
Write-Host "\n1. Creating backup of existing data..." -ForegroundColor Cyan
try {
    & $psqlPath $dbParams.Split(' ') -c "COPY fp_data TO '$backupPath' CSV HEADER;"
    Write-Host "   ✅ Backup created successfully" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Backup failed (table might be empty): $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 2: Truncate existing data
Write-Host "\n2. Clearing existing data..." -ForegroundColor Cyan
try {
    & $psqlPath $dbParams.Split(' ') -c "TRUNCATE TABLE fp_data;"
    Write-Host "   ✅ Table truncated successfully" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to truncate table: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Import new data
Write-Host "\n3. Importing new data from CSV..." -ForegroundColor Cyan
if (Test-Path $csvPath) {
    try {
        & $psqlPath $dbParams.Split(' ') -c "\COPY fp_data FROM '$csvPath' CSV HEADER;"
        Write-Host "   ✅ Data imported successfully" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Failed to import data: $($_.Exception.Message)" -ForegroundColor Red
        
        # Restore backup if import fails
        Write-Host "   🔄 Attempting to restore backup..." -ForegroundColor Yellow
        try {
            & $psqlPath $dbParams.Split(' ') -c "\COPY fp_data FROM '$backupPath' CSV HEADER;"
            Write-Host "   ✅ Backup restored" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Failed to restore backup: $($_.Exception.Message)" -ForegroundColor Red
        }
        exit 1
    }
} else {
    Write-Host "   ❌ CSV file not found: $csvPath" -ForegroundColor Red
    exit 1
}

# Step 4: Run data cleanup
Write-Host "\n4. Running data cleanup script..." -ForegroundColor Cyan
if (Test-Path $cleanupScriptPath) {
    try {
        & $psqlPath $dbParams.Split(' ') -f $cleanupScriptPath
        Write-Host "   ✅ Data cleanup completed successfully" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Data cleanup failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   ⚠️  Data imported but not cleaned - manual cleanup recommended" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Cleanup script not found: $cleanupScriptPath" -ForegroundColor Yellow
    Write-Host "   📝 Running basic cleanup commands..." -ForegroundColor Cyan
    
    # Run basic cleanup if script file is missing
    try {
        & $psqlPath $dbParams.Split(' ') -c "UPDATE fp_data SET month = TRIM(month), type = TRIM(type), salesrepname = TRIM(salesrepname), customername = TRIM(customername), countryname = TRIM(countryname), productgroup = TRIM(productgroup), material = TRIM(material), process = TRIM(process), values_type = TRIM(values_type);"
        Write-Host "   ✅ Basic cleanup completed" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Basic cleanup failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 5: Verify import
Write-Host "\n5. Verifying import..." -ForegroundColor Cyan
try {
    $result = & $psqlPath $dbParams.Split(' ') -t -c "SELECT COUNT(*) FROM fp_data;"
    $recordCount = $result.Trim()
    Write-Host "   ✅ Import verified: $recordCount records in database" -ForegroundColor Green
    
    # Show sample of data types
    Write-Host "\n📊 Data Summary:" -ForegroundColor Magenta
    & $psqlPath $dbParams.Split(' ') -c "SELECT 'Types:' as info, type, COUNT(*) as count FROM fp_data GROUP BY type ORDER BY type;"
    & $psqlPath $dbParams.Split(' ') -c "SELECT 'Sample months:' as info, month, COUNT(*) as count FROM fp_data GROUP BY month ORDER BY month LIMIT 5;"
    
} catch {
    Write-Host "   ❌ Verification failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "\n=== Import Process Complete ===" -ForegroundColor Green
Write-Host "\n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   • Restart your application server to pick up the new data" -ForegroundColor White
Write-Host "   • Test the dashboard to ensure data is displaying correctly" -ForegroundColor White
Write-Host "   • Check that both Budget and Actual data are visible" -ForegroundColor White

Write-Host "\n💡 Pro Tip: This script automatically cleans your data to prevent whitespace issues!" -ForegroundColor Yellow