# Set the password for the session
$env:PGPASSWORD = "654883"

# Path to your CSV file
$input = "D:\IPDashboard 10.7\IPDash\fp_data.csv"

# Optional: Backup current table before replacing
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -p 5432 -U postgres -d postgres -c "COPY fp_data TO 'D:/IPDashboard 10.7/IPDash/fp_data_backup.csv' CSV HEADER;"

# Truncate the table to remove all existing data
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -p 5432 -U postgres -d postgres -c "TRUNCATE TABLE fp_data;"

# Import the CSV into the table
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -p 5432 -U postgres -d postgres -c "\COPY fp_data FROM '$input' CSV HEADER;"

Write-Host "Imported fp_data from $input"