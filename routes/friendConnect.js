// import ActionType from './actionTypes';
//express is the framework we're going to use to handle requests
const express = require('express');
//Create connection to Heroku Database
let db = require('./utilities/utils').db;
let getHash = require('./utilities/utils').getHash;
var router = express.Router();
const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
router.use(bodyParser.json());

let msg_functions = require('./utilities/utils').messaging;

let config = {    
    secret: process.env.JSON_WEB_TOKEN
};

let ActionTypes = {
    DeleteConnection:"Connected",
    AcceptFriendRequest:"FriendRequestFrom",
    SendFriendRequest:"FriendRequestTo",
    CancelFriendRequest:"CancelFriendRequest",
    BlockUser:"BlockUser"
};

function SendFriendRequest (myId, myEmail, friendEmail_Nickname) {

}

function AcceptFriendRequest(friendId,myId) {

}

function CancelFriendRequest(myId, friendId) {

}

//faketoken -> in push_token.token
// ActionType
router.post('/', (req, res) => {
    let emailA = req.body['emailA'];    // request sender
    let nickname = req.body['nickname']   + "(" + emailA + ")"; // nickname - email request sender
    let email_nickname = req.body['email_nickname'];   // request receiver 
    let message = req.body['message']; 
    let actionType = req.body['actionType'];    // type of request acction
    let memberid_a = req.body['memberid_a'];
    let memberid_b = req.body['memberid_b'];
    let myToken = req.body['token'];

    switch (actionType) {
        case ""://ActionType.FriendRequestFrom:
            AcceptFriendRequest(memberid_b, memberid_a);
            break;
        case ""://ActionType.FriendRequestTo:
            SendFriendRequest(memberid_a, emailA, email_nickname);
            break;
        case ""://ActionType.CancelFriendRequest:
            CancelFriendRequest(memberid_a, memberid_b);
            break;
        case ""://ActionType.DeleteConnection:
            break;
        default:
            break;
    }

    if (actionType) {
        let acceptSql = `Update Contacts Set verified = 1 where memberid_a='${memberid_a}' and where memberid_b='${memberid_b}'`;
        db.manyOrNone(acceptSql)
        .then(row => {
            res.send({
                success: true
            });
        })
        .catch((err) => {           
            //If anything happened, it wasn't successful            
            res.send({                
                success: false,                
                message: err            
               });        
           }); 
    } else if (deny) {
        let acceptSql = `Update Contacts`;
    }
    else if(email_nickname) {        
        //Using the 'one' method means that only one row should be returned        
        db.one('SELECT * FROM Members left join push_token on members.memberid = push_token.memberid WHERE members.Email=$1 or members.username=$1;', [email_nickname])        
        .then(row => {            
            if (row['email'] != null) {
                let receiverToken = row['token'];
                let sqlQuery = `INSERT INTO Contacts(memberid_a, memberid_b, verified) VALUES ((select memberid from members where email='${emailA}'), ${row['memberid']},0);`;
                //db.manyOrNone('INSERT INTO Contacts(memberid_a, memberid_b, verified) VALUES ($1, $2,0);', emailA, row['email'])
                db.manyOrNone(sqlQuery)
                .then(row => { // senderToken
                    //build the message for FCM to send
                    var data = {
                        "type": ActionType.FriendRequestTo,
                        "sender": nickname,
                        "message": message,
                        "myToken": myToken
                    };
                    msg_functions.sendFriendRequest(receiverToken, data);
                    res.send({
                        success: true
                    });
                })
                .catch(err => {
                    //Friend request has been sent.
                    res.send({
                        success: false,
                        message: sqlQuery,
                        token:receiverToken,
                        error_details: err
                    });
                });
            } else {
                // send a friend request to 
                res.send({
                    success: false,
                    message: 'Account does not exist!'
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
        
    module.exports = router;