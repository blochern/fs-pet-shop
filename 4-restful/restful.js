// import dependencies
import express from "express";
import fs from "fs";

// create a server port
const port = 1776;

// initialize our express application
const app = express();

// express.json() middleware, for parsing bodies
app.use(express.json());

// handle requests with routes

// GET ALL route
app.get('/pets', (req, res) => {
    fs.readFile('../pets.json', 'utf-8', (error, json) => {
        if (error) {
            console.error(error.message);
            res.status(500).send('Error reading pets.json file'); return;
        } else {
            res.status(200).send(json);
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
            const array = JSON.parse(json);

            // check if id is out of bounds
            if (!array[id]) {
                res.status(404).send(`Could not find item at index ${id}`); return;
            }

            // if id is in bounds, send that element
            else {
                res.status(200).send(JSON.stringify(array[id])); return;
            }
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
    // create a new pet using this data
    let newPet = { age, kind, name };
    // attempt to read the file
    fs.readFile('../pets.json', (error, json) => {
        // error reading the file
        if (error) {
            console.error(error.message);
            res.status(500).send("Error reading the pets.json file");
        }
        // otherwise, parse the received json to a JavaScript array
        let array = JSON.parse(json);
        // add our newPet to this array
        array.push(newPet);
        // attempt to write to the file
        fs.writeFile("../pets.json", JSON.stringify(array), (error) => {
            // error writing to file
            if (error) {
                console.error(error.message);
                res.status(500).send("Error writing to file"); return;
            }
            // on success, send the newPet back
            res.status(201).send(JSON.stringify(newPet));
        });
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