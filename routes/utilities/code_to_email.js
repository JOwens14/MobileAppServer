//express is the framework we're going to use to handle requests
const express = require('express');

//We use this create the SHA256 hash
const crypto = require("crypto");

//retrieve the router pobject from express
var router = express.Router();

//Create connection to Heroku Database
let db = require('./utils').db;
let sendEmail = require('./utils').sendEmail;

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

router.post('/', (req, res) => {
    res.type("application/json");
    //Retrieve data from query params
    var email = req.body['email'];
    var code = req.body['code'];
//    let pushyToken = req.body['token'];
    //Verify that the caller supplied all the parameters
    //In js, empty strings or null values evaluate to false
    if(email && code) {
        //Use .none() since no result gets returned from an INSERT in SQL
        //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        //If you want to read more: https://stackoverflow.com/a/8265319
        let params = [email, code];
        let emailContent = "<strong>Forgotten your password? </strong></br><strong>Please type in the password code into the app! </br>"
        + `CODE: ${code}</strong>`;
        sendEmail("noreply.register.uwchat@gmail.com", email, "Password Code Here!", emailContent);
    } else {
        res.send({
            success: false,
            input: req.body,
            error: "Missing required user information"
        });
    }
});

// Obtained from register.js
router.get("/",(req,res) => {
    db.manyOrNone('SELECT * FROM Members')
    //If successful, run function passed into .then()
    .then((data) => {
        res.send({
            success: true,
            names: data
        });
    }).catch((error) => {
        console.log(error);
            res.send({
                success: false,
                error: error
            })
    });
});

module.exports = router;
