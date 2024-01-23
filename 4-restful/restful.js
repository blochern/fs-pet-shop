// express, for server routes
import express from "express";

// fs for reading pets.json (remove)
import fs from "fs";

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
                res.status(500).send("Internal fucky wucky");
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
        res.status(400).send("Bad request -- index must be a number"); return;
    }

    pool.query(`select * from pets where id = ${id}`)
        .then((results) => {
            try {
                if (results.rowCount === 0) {
                    res.status(404).send("Can't find it"); return;
                }
                else {
                    res.status(200).json(results.rows[0]); return;
                }
            }
            catch (error) {
                console.error(error.message);
                res.status(500).send("Internal oopsie poopsie"); return;
            }
        });
});

// POST ONE route
app.post('/pets', (req, res) => {
    // attempt to destruct req.body
    const { age, kind, name } = req.body;

    // validate data
    if (isNaN(+age) || !kind || !name) {
        res.status(400).send("Bad request -- include age, kind, name"); return;
    }

    pool.query(`INSERT INTO pets (name, age, kind) VALUES ('${name}', ${age}, '${kind}') RETURNING *`)
        .then((results) => {
            try {
                res.status(201).json(results.rows[0]); return;
            }
            catch (error) {
                console.error(error.message);
                res.status(500).send("Internal oopsie poopsie"); return;
            }
        });

});

// UPDATE ONE route with partial data (patch)
app.patch('/pets/:id', (req, res) => {
    // destruct the id from request parameters
    const { id } = req.params;

    // destruct name, age, kind from request body
    const { name, age, kind } = req.body

    // check to ensure id is a number and age (if it exists) is a number
    if (age !== undefined && isNaN(parseInt(age)) || isNaN(parseInt(id))) {
        res.status(400).send('Either id or age is not an integer'); return;
    }

    // query the data pool using COALESCE to update the values that exist
    pool.query(`update pets set name = coalesce($1, name), age = coalesce($2, age), kind = coalesce($3, kind) where id = $4 returning *`,
        [name, age, kind, id])
        .then((results) => {
            try {
                if (results.rowCount < 1) {
                    res.status(404).send(`Pet at id ${id} not found`); return;
                }
                else {
                    res.status(200).json(results.rows[0]); return;
                }
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Error trying to update pets'); return;
            }
        })
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
                    res.status(404).send(`Could not find pet at index ${id}`); return;
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

// DELETE ONE route
app.delete('/pets/:id', (req, res) => {
    // destruct the id from request object
    const { id } = req.params;

    // ensure the id is a number
    if (isNaN(parseInt(id))) {
        res.status(400).send("Bad request -- index must be a number"); return;
    }

    // attempt to read the file
    fs.readFile('../pets.json', 'utf-8', (error, json) => {

        // handle if there's an error reading the file
        if (error) {
            console.error(error.message);
            res.status(500).send('Error reading pets.json file'); return;
        }

        // if reading the file went well
        else {
            // parse the array into something usable
            let array = JSON.parse(json);

            // check if id is out of bounds
            if (!array[id]) {
                res.status(404).send(`Could not find item at index ${id}`); return;
            }

            // if id is in bounds, delete the element
            else {
                let deleted = array.splice(id, 1);

                // attempt to write to the file
                fs.writeFile('../pets.json', JSON.stringify(array), (err) => {
                    // error writing to file
                    if (error) {
                        console.error(error.message);
                        res.status(500).send("Error writing to file"); return;
                    }
                    // otherwise, send the deleted pet back as JSON
                    res.status(200).send(JSON.stringify(deleted)); return;
                });
            }
        }
    });
});

// tell the server to listen
app.listen(port, () => {
    console.log(`Server running, listening on port ${port}`);
});