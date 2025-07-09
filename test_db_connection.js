const { Client } = require('pg');

// Database connection configuration
const client = new Client({
  host: 'localhost', // Replace with your database host
  port: 5432,        // Default PostgreSQL port
  user: 'your_username', // Replace with your database username
  password: 'your_password', // Replace with your database password
  database: 'your_database_name' // Replace with your database name
});

// Connect to the database
client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
    return client.query('SELECT NOW()'); // Simple query to test connection
  })
  .then(res => {
    console.log('Current time:', res.rows[0]);
  })
  .catch(err => {
    console.error('Connection error', err.stack);
  })
  .finally(() => {
    client.end(); // Close the connection
  });

