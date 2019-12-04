//express is the framework we're going to use to handle requests
const express = require('express');

//We use this cretate the SHA256 hash
const crypto = require("crypto");

//retrieve the router pobject from express
var router = express.Router();

//Create connection to Heroku Database
let db = require('./utilities/utils').db;
let getHash = require('./utilities/utils').getHash;
let sendEmail = require('./utilities/utils').sendEmail;

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

router.post('/', (req, res) => {
    res.type("application/json");
    //Retrieve data from query params
    var first = req.body['first'];
    var last = req.body['last'];
    var username = req.body['username'];
    var email = req.body['email'];
    var password = req.body['password'];
    let pushyToken = req.body['token'];
    //Verify that the caller supplied all the parameters
    //In js, empty strings or null values evaluate to false
    if(first && last && username && email && password) {
        //We're storing salted hashes to make our application more secure
        //If you're interested as to what that is, and why we should use it
        //watch this youtube video: https://www.youtube.com/watch?v=8ZtInClXe1Q
        let salt = crypto.randomBytes(32).toString("hex");
        let salted_hash = getHash(password, salt);
        //Use .none() since no result gets returned from an INSERT in SQL
        //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        //If you want to read more: https://stackoverflow.com/a/8265319
        let params = [first, last, username, email, salted_hash, salt];
        let linkNoHtml = `</br>https://hopp-lab4-backend.herokuapp.com/verification?token=${salted_hash}`
        let linkVerification = `<a href=\"hopp-lab4-backend.herokuapp.com/verification?token=${salted_hash}\">Click here!</a>`
        let emailContent = "<strong>Welcome to our app!</strong></br><strong>You or someone else have used this email address to register our service! </br> "
        + `Please click the link to verify your accout ${linkVerification}</strong> </br> In case your email not supported html, please copy this link to run on your web brower ${linkNoHtml}</br><h3 color='blue'>Ignore this email if not you. </h3></br>`;        
        db.none("INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt) VALUES ($1, $2, $3, $4, $5, $6)", params)
        .then(() => {
            let sqlInsert = `INSERT INTO Push_Token (memberId, token) VALUES ((select memberid from members where members.email = '${email}'), '${pushyToken}')`;
            db.manyOrNone(sqlInsert)
                    .then(row => {
                        //We successfully added the user, let the user know
                        sendEmail("noreply.register.uwchat@gmail.com", email, "Welcome to UWChat Group 5!", emailContent);
                        //package and send the results
                        res.send({
                            success: true
                        });
                    })
                    .catch(err => {
                        console.log("error on insert push token at register time");
                        console.log(err);
                        //If anything happened, it wasn't successful
                        //some error on pushy token insert. See console logs
                        res.send({
                            success: false 
                        });
                    });

        }).catch((err) => {
            //log the error
            console.log(err);
            //If we get an error, it most likely means the account already exists
            //Therefore, let the requester know they tried to create an account that already exists
            res.send({
                success: false,
                error: err
            });
        });
    } else {
        res.send({
            success: false,
            input: req.body,
            error: "Missing required user information"
        });
    }
});

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
