const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST || "mysql",
    user: process.env.DB_USER || "appuser",
    password: process.env.DB_PASSWORD || "password123",
    database: process.env.DB_NAME || "test_db"
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }

    console.log("Connected to MySQL Database");

    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            role ENUM('Admin', 'User') NOT NULL
        )
    `;

    db.query(createUsersTable, (err) => {
        if (err) {
            console.error("Failed to create users table:", err);
            process.exit(1);
        }

        console.log("Users table initialized successfully");
    });
});

module.exports = db;