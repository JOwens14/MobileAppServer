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
    let email = req.body['email'];   
    let theirPw = req.body['password'];    
    let wasSuccessful = false;    
    if(email && theirPw) {        
        //Using the 'one' method means that only one row should be returned        
        db.one('SELECT * FROM Members left join push_token on members.memberid = push_token.memberid WHERE members.Email=$1 and members.verification=1', [email])        
        .then(row => { 
            //If successful, run function passed into .then()            
            let salt = row['salt'];            
            //Retrieve our copy of the password            
            let ourSaltedHash = row['password'];             
            //Combined their password with our salt, then hash            
            let theirSaltedHash = getHash(theirPw, salt);             
            //Did our salted hash match their salted hash?            
            let wasCorrectPw = ourSaltedHash === theirSaltedHash;             
            if (wasCorrectPw) {                
                //credentials match. get a new JWT                
                let token = jwt.sign({username: email},                    
                    config.secret,                    
                    {                         
                        expiresIn: '24h' // expires in 24 hours                    
                    }                
                );                
                //package and send the results
                res.json({                    
                    success: true,                    
                    message: 'Authentication successful!',
                    username: row['username'],
                    firstname: row['firstname'],  
                    lastname: row['lastname'],                  
                    token: token                  
                });            
            } else {                
                //credentials dod not match                
                res.send({                    
                    success: false                 
                });            
            }        
        })        
        //More than one row shouldn't be found, since table has constraint on it        
        .catch((err) => {           
             //If anything happened, it wasn't successful            
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

    router.post('/pushy', (req, res) => {
        let email = req.body['email'];
        let theirPw = req.body['password'];
        let pushyToken = req.body['token'];
        let wasSuccessful = false;
        if(email && theirPw && pushyToken) {
            //Using the 'one' method means that only one row should be returned
            db.one('SELECT * FROM Members left join push_token on members.memberid = push_token.memberid WHERE members.Email=$1 and members.verification=1', [email])        
            .then(row => { //If successful, run function passed into .then()
                let salt = row['salt'];
                //Retrieve our copy of the password
                let ourSaltedHash = row['password']; 
                
                //Combined their password with our salt, then hash
                let theirSaltedHash = getHash(theirPw, salt); 
    
                //Did our salted hash match their salted hash?
                let wasCorrectPw = ourSaltedHash === theirSaltedHash; 
    
                if (wasCorrectPw) {
                    //credentials match. get a new JWT
                    let token = jwt.sign({username: email},
                        config.secret,
                        { 
                            expiresIn: '24h' // expires in 24 hours
                        }
                    );
                    
                    if (row['token'] != null && row['token'].length > 10) {
                        res.json({                   
                            success: true,
                                message: 'Authentication successful!',
                                username: row['username'],
                                username: row['username'],
                                firstname: row['firstname'],  
                                lastname: row['lastname'],
                                memberid: row['memberid'],
                                token: pushyToken,
                                jwtToken:token             
                        });  
                    } 
                    let params = [row['memberid'], pushyToken];
                    db.manyOrNone('INSERT INTO Push_Token (memberId, token) VALUES ($1, $2) ON CONFLICT (memberId) DO UPDATE SET token=$2;', params)
                    .then(row => {
                        //package and send the results
                        res.json({
                            success: true,
                            message: 'Authentication successful!',
                            username: row['username'],
                            username: row['username'],
                            firstname: row['firstname'],  
                            lastname: row['lastname'],
                            token: pushyToken,
                            jwtToken:token
                        });
                    })
                    .catch(err => {
                        console.log("error on insert");
                        console.log(err);
                        //If anything happened, it wasn't successful
                        //some error on pushy token insert. See console logs
                        res.send({
                            success: false 
                        });
                    });
                } else {
                    //credentials dod not match
                    res.send({
                        success: false 
                    });
                }
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