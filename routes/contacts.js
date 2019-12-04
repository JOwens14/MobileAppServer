//express is the framework we're going to use to handle requests
const express = require('express');
//Create connection to Heroku Database
let db = require('./utilities/utils').db;
let getHash = require('./utilities/utils').getHash;
var router = express.Router();
const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());
//Pull in the JWT module along with out asecret key
let jwt = require('jsonwebtoken');
let config = {
    secret: process.env.JSON_WEB_TOKEN
};

router.post('/', (req, res) => {
    //let email = req.body['email'];
    let memberid = req.body['memberid'];

    if(memberid) {
        let sqlText = `SELECT * FROM Members left join push_token on members.memberid = push_token.memberid WHERE members.memberid in (select memberid_a from contacts where memberid_b = ${memberid} and verified = 1 union select memberid_b from contacts where memberid_a = ${memberid} and verified = 1);`;
        //Using the 'one' method means that only one row should be returned
        db.manyOrNone(sqlText)
        .then(row => { //If successful, run function passed into .then()

            res.json({
                success: true,
                data:row
            });
            //test comment      

        })
        //More than one row shouldn't be found, since table has constraint on it
        .catch((err) => {
            //If anything happened, it wasn't successful
            console.log("Here (login) on error " + err);
            res.send({
                success: false,
                message: err
            });
        });
    } else {
        res.send({
            success: false,
            message: 'missing credentials'
        });
    }
});


    module.exports = router;
