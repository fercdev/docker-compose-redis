const express = require("express");
const { Pool } = require("pg");
const { createClient } = require("redis");

const app = express();
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:6379`
});

redisClient.on("error", (error) => console.log("Redis error", error));

async function start () {
    await redisClient.connect();
    console.log("Redis conectado correctamente..");
}


app.get("/health", (req, res) => {
    res.send("API OK!!");
});

app.get("/products/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const key = `product:${id}`;

    const recordCached = await redisClient.get(key);

    if (recordCached) {
        console.log("1- Registro en cache(REDIS) encontrado...", recordCached);
        console.log("-------------------------------------------------------");
        return res.json(JSON.parse(recordCached));
    }

    console.log(`0- Producto: ${id} en REDIS no encontrado..`);

    console.log("1- Consultando producto:", id);

    const resultDb = await pool.query(
        "SELECT * FROM products WHERE id = $1",
        [id]
    );

    console.log("2- Resultado consulta DB:", resultDb.rows);
    
    if (resultDb.rows.length === 0) {
        return res.status(404).json({ error: "Record not found"});
    }

    await redisClient.setEx(
        key,
        3600,
        JSON.stringify(resultDb.rows[0])
    );
    console.log("3- Registrando producto en redis:", resultDb.rows[0]);
    console.log("-------------------------------------------------------");
    res.json(resultDb.rows[0]);
});

app.listen(9090, async () => {
    await start();
    console.log("API escuchando en el puerto: 9090...");
});