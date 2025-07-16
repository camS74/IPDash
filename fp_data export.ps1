$today = Get-Date -Format "yyyy-MM-dd"
$output = "./fp_data_export_$today.csv"
$env:PGPASSWORD = "654883"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -p 5432 -U postgres -d postgres -c "COPY fp_data TO STDOUT WITH CSV HEADER" | Out-File -Encoding utf8 $output
Write-Host "Exported fp_data to $output"