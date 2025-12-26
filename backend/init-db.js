const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100),
      email VARCHAR(100) UNIQUE,
      password VARCHAR(255)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS productos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100),
      codigo VARCHAR(50),
      categoria VARCHAR(50),
      precio DECIMAL(10,2),
      stock INT,
      descripcion TEXT
    )
  `);

  const hash = await bcrypt.hash("admin123", 10);

  await db.query(
    "INSERT IGNORE INTO users(nombre, email, password) VALUES ('Admin', 'admin@example.com', ?)",
    [hash]
  );

  console.log("✅ Base de datos lista");
  process.exit();
})();
