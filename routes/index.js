const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const bcrypt = require("bcrypt");
const {body, validationResult} = require("express-validator");
const router = express.Router();
const db_url = "mongodb://localhost:27017";

router.route("/register")
.get((req, res) => {
        // res.send("Hello");
        res.render("register", { errors: null });
    }
)
.post([
    body("username").not().isEmpty().withMessage("Enter a valid username").escape(),
    body("email").not().isEmpty().withMessage("Enter a valid email")
    .isEmail().withMessage("Your e-mail is not valid!").escape(),
    body("password").not().isEmpty().withMessage("Enter a valid password")
    .isLength({ min: 8}).withMessage("The password must be at least 8 characters long!")
    ,
    body("confirm_password").custom((value, { req }) => {
        if(value !== req.body.password){
            throw new Error("The passwords don't match!");
        }
        return true;
    })
],
    async (req, res) => {
        const result = validationResult(req);
        if(!result.isEmpty()){
            // console.log(result.errors);
            res.status(422).render("register", { errors: result.errors});
        }
        let client = await MongoClient.connect(db_url, { useUnifiedTopology: true });
        let found = await userExists(client, req.body.username, req.body.password);
        if(found){
            res.render("register", { errors: [{ msg: "The user already exists!"}]});
        }
      

        let hashedPassword = await bcrypt.hash(req.body.password, 10);
        await client.db("blog_system").collection("users").insertOne({
                                username: req.body.username,
                                email: req.body.email,
                                password: hashedPassword

        });
        client.close();

        // MongoClient.connect(db_url, { useUnifiedTopology: true }, (err, client) => {
        //     if(err) throw new Error(err);

        //     bcrypt.hash(req.body.password, 10, (err, encrypted) => {
        //         client.db('blog_system').collection("users").findOne({ 
        //             $or:[
        //                 {username: req.body.username},
        //                 {email: req.body.email}
        //             ]
                    
        //         }, (err, found) => {
        //             if(found){
        //                 res.render("register", { errors: [{ msg: "The user already exists!"}]});
        //             } else{
        //                 client.db("blog_system").collection("users").insertOne({
        //                     username: req.body.username,
        //                     email: req.body.email,
        //                     password: encrypted
        //                 }, (err, result) => {
        //                     if(err) throw new Error(err);
        //                     client.close();
        //                 }
                        
        //                 );
        //             } 
        //         })
                
        //     });

           
        // });
});

async function userExists(client, username, email){
    
    let found = await client.db('blog_system').collection("users").findOne({ 
                    $or:[
                        {username: username},
                        {email: email}
                    ]
                    
                });
    if(found){
        // 
        return true;
    }
    return false;
}

module.exports = router;