const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const bcrypt = require("bcrypt");
const session = require("express-session");
const {body, validationResult} = require("express-validator");
const router = express.Router();
const db_url = "mongodb://localhost:27017";

router.route("/")
.get(isLoggedIn, async (req, res) => {
    let blogs = await listBlogs();
    res.render("index", { username: req.session.username, blogs: blogs });
    // console.log(req.session.username);
});

// router.get("/", (req, res) => {
//     res.render("index", { username: req.session.username });
//     // console.log(req.session.username);
// });

router.route("/register")
.get(isLoggedIn,(req, res) => {
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
          return res.status(422).render("register", { errors: result.errors});
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
        res.redirect("/login");

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

router.route("/login")
.get(isLoggedIn, (req, res) => {
    res.render("login", { errors: null });
})
.post([
    body("username_email").not().isEmpty().withMessage("Enter a valid username or email"),
    body("password").not().isEmpty().withMessage("Enter a valid password")
],
   async (req, res) => {
        result = validationResult(req);
        if(!result.isEmpty()){
           return res.status(422).render("login", { errors: result.errors })
        }

        let client = await MongoClient.connect(db_url, { useUnifiedTopology: true });
        let user = await userExists(client, req.body.username_email, req.body.username_email);
        if(user){
           if(await verifyPassword(req.body.password, user.password)){
                if(req.body.remember_me){
                    req.session.cookie.maxAge = 36000000;
                }
               req.session.login = true;
               req.session.username = user.username;
               return res.redirect("/");
           } 
           return res.render("login", { errors: [{ msg: "invalid credentials"}]});
        }
        return res.render("login", { errors: [{ msg: "The user doesn't exist!"}]});
});

router.get("/logout", (req, res) => {
    req.session.login = null;
    req.session.username = null;
    res.redirect("/login");
});

async function userExists(client, username, email){
    
    let user = await client.db('blog_system').collection("users").findOne({ 
                    $or:[
                        {username: username},
                        {email: email}
                    ]
                    
                });
    if(user){
        // 
        return user;
    }
    return false;
}

async function verifyPassword(password, hash){
    return await bcrypt.compare(password, hash);
   
}

async function listBlogs(){
    let client = await MongoClient.connect(db_url, { useUnifiedTopology: true});
    let blogs = await client.db("blog_system").collection("blogs").find({}, { title: 1, desription: 0}).toArray();

    if(blogs && blogs.length){
        return blogs;
    }
    return false;
}

function isLoggedIn(req, res, next){
    if(req,session.login){
        if(req.path !== "/"){
            return res.redirect("/");
        }
        return next("route");
        
    }
    next();
}

module.exports = router;