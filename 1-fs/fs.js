#! node
// import fs module
import fs from "fs";

// the global petshop object will handle everything we need to do
const petshop = {
    read: (index) => {
        // fetch the data from pets.json using fs.readFile
        fs.readFile("../pets.json", "utf-8", (error, text) => {
            // if there is an error, display it
            if (error) { throw error };
            const pets = JSON.parse(text);
            // if the index is undefined, display all pets
            if (index === undefined) {
                console.log(`-- Displaying all pets --`)
                console.log(pets); process.exit();
            }
            // if the index is defined, parse it
            else {
                let i = parseInt(index);
                // if it's an out-of-bounds index
                if (!pets[i]) {
                    // output an error
                    console.log(`-- Pet at index ${i} not found --`)
                    console.error("Usage: node fs.js read int(INDEX)");
                    process.exitCode = 1; process.exit();
                }
                // if it's a valid index
                else {
                    // output just that pet
                    console.log(`-- Displaying pet at index ${i} --`)
                    console.log(pets[i]); process.exit();
                }
            }
        });
    },
    create: (age, kind, name) => {
        // if any of the given values are bad, end the process
        if (isNaN(parseInt(age)) || !kind || !name) {
            console.error("Usage: node fs.js create int(AGE) string(KIND() string(NAME)");
            process.exitCode = 1; process.exit();
        }
        // create a newPet object using the data passed in
        let newPet = { age: parseInt(age), kind: kind, name: name }

        // attempt to read the pets.json file
        fs.readFile("../pets.json", "utf-8", (error, text) => {
            // if there is an error reading, display it
            if (error) { throw error };
            // parse the JSON string into an array
            let pets = JSON.parse(text);
            // add the new pet to the array of pets using .push()
            pets.push(newPet);
            // turn the array back into a string
            pets = JSON.stringify(pets);

            // attempt to write to the pets.json file
            fs.writeFile("../pets.json", pets, "utf-8", (error) => {
                // if there is an error writing, display it
                if (error) { throw error };
                // otherwise, log the new pet that we just created
                console.log(`-- Created a new pet --`);
                console.log(newPet); process.exit();
            });
        });
    },
    delete: (index) => {
        // if there's no index, display usage
        if (index === undefined) {
            console.error("Usage: node fs.js destroy int(INDEX)");
            process.exitCode = 1; process.exit();
        }
        // parse the index if it exists
        let i = parseInt(index);

        // attempt to read the pets.json file
        fs.readFile("../pets.json", "utf-8", (error, text) => {
            // if there's an error reading the file, display it
            if (error) { throw error; }

            // parse the text into an array using JSON.parse()
            let pets = JSON.parse(text);

            // if there isn't an item at the given index, display usage
            if (!pets[i]) {
                console.error(`Did not find pet at index ${i}`);
                console.error("Usage: node fs.js destroy int(INDEX)");
                process.exitCode = 1; process.exit();
            }
            // otherwise, delete the item at index i using .splice(i, 1)
            else {
                let deleted = pets.splice(i, 1);
                // stringify the pets array
                pets = JSON.stringify(pets);

                // attempt to write to file
                fs.writeFile("../pets.json", pets, "utf-8", (error) => {
                    // if there's an error writing to file, display it
                    if (error) { throw error; }
                    // otherwise, log the removed pet
                    else {
                        console.log(`Removed the pet at index ${i}`);
                        console.log(deleted); process.exit();
                    }
                });
            }
        });
    }
}

// this switch case executes different behavior based on the third argument value
switch (process.argv[2]) {
    case "read":
        petshop.read(process.argv[3]);
        break;
    case "create":
        petshop.create(process.argv[3], process.argv[4], process.argv[5]);
        break;
    case "update":
        // petshop.update() (not yet created)
        break;
    case "destroy":
        petshop.delete(process.argv[3]);
        break;
    default:
        console.error("Usage: node fs.js [read | create | update | destroy]");
        process.exitCode = 1; process.exit();
}