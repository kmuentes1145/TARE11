const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Pool de conexión
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
};

const db = mysql.createPool(dbConfig);

// ✅ Función para inicializar la base de datos
async function initDatabase() {
  const connection = await mysql.createConnection(dbConfig);

  // Crear tabla users
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100),
      email VARCHAR(100) UNIQUE,
      password VARCHAR(255)
    )
  `);

  // Crear tabla productos
  await connection.query(`
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

  // Insertar usuario admin si no existe
  const [existing] = await connection.execute(
    "SELECT id FROM users WHERE email = ?",
    ["admin@example.com"]
  );

  if (existing.length === 0) {
    const hash = await bcrypt.hash("admin123", 10);
    await connection.execute(
      "INSERT INTO users(nombre, email, password) VALUES(?, ?, ?)",
      ["Admin", "admin@example.com", hash]
    );
    console.log("✅ Usuario admin creado");
  }

  await connection.end();
  console.log("✅ Base de datos inicializada");
}

// Rutas
app.get("/", (req, res) => res.send("API OK"));

app.post("/auth/register", async (req, res) => {
  const { nombre, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await db.execute(
    "INSERT INTO users(nombre, email, password) VALUES(?, ?, ?)",
    [nombre, email, hash]
  );
  res.json({ msg: "Registrado" });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
  if (!users.length) return res.status(401).json({ msg: "Error" });
  const user = users[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ msg: "Error" });
  res.json({ usuario: { id: user.id, nombre: user.nombre, email: user.email } });
});

app.get("/productos", async (req, res) => {
  const [rows] = await db.execute("SELECT * FROM productos");
  res.json(rows);
});

app.post("/productos", async (req, res) => {
  const p = req.body;
  await db.execute(
    "INSERT INTO productos(nombre, codigo, categoria, precio, stock, descripcion) VALUES(?, ?, ?, ?, ?, ?)",
    [p.nombre, p.codigo, p.categoria, p.precio, p.stock, p.descripcion]
  );
  res.json({ msg: "Producto creado" });
});

app.delete("/productos/:id", async (req, res) => {
  await db.execute("DELETE FROM productos WHERE id = ?", [req.params.id]);
  res.json({ msg: "Eliminado" });
});

// ✅ Iniciar servidor + base de datos
initDatabase().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Backend activo en el puerto ${PORT}`);
  });
});
