//express is the framework we're going to use to handle requests
const express = require('express');

//We use this cretate the SHA256 hash
const crypto = require("crypto");

//retrieve the router pobject from express
var router = express.Router();

//Create connection to Heroku Database
let db = require('./utilities/utils').db;
let getHash = require('./utilities/utils').getHash;

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

router.post('/', (req, res) => {    
    res.type("application/json");    
    //Retrieve data from query params    
    var token = req.body['token'];    
 
    //Verify that the caller supplied all the parameters    
    //In js, empty strings or null values evaluate to false    
    if(token) {        
        db.none("UPDATE MEMBERS SET verification = 1  WHERE password='${token}'")        
        .then(() => {            
            //We successfully added the user, let the user know            
            res.send({                
                success: true,
                message: "Thank you for using UW Chat"         
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
            error: "Missing required user information here"        
        });    
    }
});

router.get("/",(req,res) => {
    //res.type("application/json");    
    res.setHeader('Content-type','text/html')
    //Retrieve data from query params    
    var token = req.param("token");   
    let sqlUpdate = `UPDATE MEMBERS SET verification = 1  WHERE password='${token}'`;
    //Verify that the caller supplied all the parameters    
    //In js, empty strings or null values evaluate to false  
      
    if(token) {        
        db.none(sqlUpdate)        
        .then((data) => {            
            //We successfully added the user, let the user know    
            let head = "<html><body><center><img src='https://pngochop.github.io/duck_logo_blue.png' height='500' width='500'></br><h1>Group 5! Little Duck</h1>"; 
            let foot = "</br><h3>Welcome to uw chat! Your account has been activated successfully. You can now login.</h3></center></body></html>";       
            res.send(head+foot);            
            
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
            input: req.param("token"),            
            error: "Missing required user information test"        
        });    
    }
});

module.exports = router;