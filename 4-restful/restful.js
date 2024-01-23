// express, for server routes
import express from "express";

// dotenv for environment variables (for later use)
import dotenv from "dotenv";

// cors for cors issues
import cors from "cors";

// pg to read our postgres database
import pkg from "pg";

// configure environment variables
dotenv.config();

// create our port
const port = 1776 || process.env.PORT;

// configure our data pool
const { Pool } = pkg;
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'pets'
});

// initialize our express application
const app = express();

// body parser and cors
app.use(express.json(), cors({ origin: "*" }));

// GET ALL route
app.get('/pets', (req, res) => {
    pool.query("SELECT * FROM pets")
        .then((results) => {
            try {
                res.status(200).json(results.rows);
            }
            catch (error) {
                res.status(500).send(`Internal Server Error -- failed while trying to 'select * from pets'`); return;
            }
        });
});

// GET ONE route
app.get('/pets/:id', (req, res) => {
    // destruct the id from request object
    const { id } = req.params;
    // const id = req.params.id;

    // ensure the id is a number
    if (isNaN(parseInt(id))) {
        res.status(400).send(`Bad request -- '${id}' is not an integer`); return;
    }

    pool.query(`select * from pets where id = ${id}`)
        .then((results) => {
            try {
                if (results.rowCount < 1) {
                    res.status(404).send(`Not found -- pet at index ${id}`); return;
                }
                else {
                    res.status(200).json(results.rows[0]); return;
                }
            }
            catch (error) {
                console.error(error.message);
                res.status(500).send(`Internal Server Error -- failed while trying to 'select * from pets'`); return;
            }
        });
});

// POST ONE route
app.post('/pets', (req, res) => {
    // attempt to destruct req.body
    const { age, kind, name } = req.body;

    // validate data
    if (isNaN(parseInt(age)) || !kind || !name) {
        res.status(400).send('Bad request -- POST request requires name (any), kind (any), age (integer)'); return;
    }

    pool.query(`INSERT INTO pets (name, age, kind) VALUES ($1, $2, $3) RETURNING *`,
        [name, age, kind])
        .then((results) => {
            try {
                res.status(201).json(results.rows[0]); return;
            }
            catch (error) {
                console.error(error.message);
                res.status(500).send(`Internal Server Error -- failed while trying to 'insert into pets'`); return;
            }
        });

});

// UPDATE ONE route with partial data (patch)
app.patch('/pets/:id', (req, res) => {
    // destruct the id off of the request parameters
    const { id } = req.params;

    // destruct name, kind, age off of the request body
    const { name, age, kind } = req.body;

    // if age exists AND it's not an integer, kick back the request
    if (age !== undefined && isNaN(parseInt(age))) {
        res.status(400).send(`Bad Request -- age must be an integer, if it exists`); return;
    }

    // if the id isn't an integer, kick back the request
    if (isNaN(parseInt(id))) {
        res.status(400).send(`Bad Request -- id must be an integer`); return;
    }

    // query our pool
    pool.query(`UPDATE pets SET name = coalesce($1, name), age = coalesce($2, age), kind = coalesce($3, kind) WHERE id = $4 RETURNING *`,
        [name, age, kind, id])
        .then((results) => {
            try {
                // if we don't get any results back, then send a 404
                if (results.rowCount < 1) {
                    res.status(404).send(`Not found -- pet at index ${id} was not found`); return;
                }
                // if we do get data back
                else {
                    res.status(200).json(results.rows[0]); return;
                }
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send(`Internal Server Error -- failed while trying to 'update pets'`); return;
            }
        });
});

// UPDATE ONE route with all data (put)
app.put('/pets/:id', (req, res) => {
    // destruct id off of request parameters
    const { id } = req.params;

    // destruct age, kind, and name off request body
    const { age, kind, name } = req.body;

    // validate id, age, kind and name
    if (isNaN(parseInt(id)) || isNaN(parseInt(age)) || !kind || !name) {
        res.status(400).send("Bad request -- include age, kind, name in body, and id in params msut be a number"); return;
    }

    // if everything is good, we can attempt to read our data pool
    pool.query(`update pets set name = '${name}', age = ${age}, kind = '${kind}' where id = ${id} returning *`)
        .then((results) => {
            try {
                if (!results.rows[0]) {
                    res.status(404).send(`Not found -- pet at index ${id}`); return;
                }
                else {
                    res.status(200).send(results.rows[0]); return;
                }
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Error trying to UPDATE pets'); return;
            }
        });
});

// tell the server to listen
app.listen(port, () => {
    console.log(`Server running, listening on port ${port}`);
});