// import http and fs
import http from "http";
import fs from "fs";
const port = 8001;

// helper function for our responses
const setResponse = (res, code, type) => {
    res.statusCode = code;
    let contentType = type === "json" ? "application/json" : "text/plain";
    res.setHeader("Content-type", contentType);
    return;
}

// create our server
const server = http.createServer((req, res) => {
    // split our url into parameters (params) to use later
    let params = req.url.split("/"); // ["", "pets", "index"]

    // if the url is something weird, kick back the request
    if (params[1] !== "pets") {
        setResponse(res, 404, "text");
        res.end('404 -- Not found');
        return;
    }

    // this master switch determines what code to run based on the request method
    switch (req.method) {
        case "GET": {
            // read the pets.json file
            fs.readFile("../pets.json", "utf-8", (error, jsonData) => {

                // if we have an error, throw it back
                if (error) {
                    console.error(error.message);
                    setResponse(res, 500, "text");
                    res.end('500 -- Internal Server Error');
                    return;
                }

                // our index will be the third item in "params"
                let index = params[2];

                // if it's undefined, perform "GET ALL"
                if (index === undefined) {
                    setResponse(res, 200, "json");
                    res.end(jsonData);
                    return;
                }

                // otherwise, let's parse our jsonData into a petsArray
                let petsArray = JSON.parse(jsonData);

                // parse our index into an integer
                index = parseInt(index);

                // if index is NaN or doesn't exist in our data, kick back the request
                if (isNaN(index) || !petsArray[index]) {
                    setResponse(res, 400, "text");
                    res.end('404 - Not found');
                    return;
                }

                // otherwise we can use it to perform "GET ONE"
                else {
                    let output = JSON.stringify(petsArray[index]);
                    setResponse(res, 200, "json");
                    res.end(output);
                    return;
                }
            });
            break;
        }
        case "POST": {
            // create an array to catch our chunks
            let body = [];
            // when we catch a chunk, add it to the body
            req.on('data', chunk => body.push(chunk));

            // after all the chunks are received, we can continue
            req.on('end', () => {
                // parse the chunks into a string, then an object
                body = JSON.parse(body[0].toString());
                // we should have name/age/kind
                let { name, age, kind } = body;
                // bad request
                if (!name || isNaN(parseInt(age)) || !kind) {
                    setResponse(res, 400, "text");
                    res.end('400 -- Bad Request (include name, age, kind)');
                    return;
                }
                // good request
                else {
                    // create our object that we'll add to pets.json
                    let newPet = { name, age, kind };
                    // attempt to read the file
                    fs.readFile("../pets.json", "utf-8", (error, json) => {
                        // error reading the file
                        if (error) {
                            console.error(error.message);
                            setResponse(res, 500, "text");
                            res.end('500 -- Internal Server Error');
                            return;
                        }
                        // parse the json into an array
                        let array = JSON.parse(json);
                        // add our new pet to the array
                        array.push(newPet);
                        // parse the array back into JSON
                        array = JSON.stringify(array);
                        // attempt to write to the file
                        fs.writeFile("../pets.json", array, "utf-8", (error) => {
                            // error writing to the file
                            if (error) {
                                console.error(error.message);
                                setResponse(res, 500, "text");
                                res.end('500 -- Internal Server Error');
                                return;
                            }
                            // no error -- everything worked
                            else {
                                let jsonPet = JSON.stringify(newPet);
                                setResponse(res, 201, "json");
                                res.end(jsonPet);
                                return;
                            }
                        });
                    });
                }
            });
            break;
        }
        default: {
            // code that runs if the method isn't listed above
            res.statusCode = 400;
            res.setHeader('Content-type', 'text/plain');
            res.end('400 -- Bad request');
            return;
        }
    }
});

server.listen(port, () => {
    console.log(`Server running, listening on port ${port}...`)
});