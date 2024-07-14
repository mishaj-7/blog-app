import express from "express";
import mongoose from "mongoose";
import 'dotenv/config'
import bcrypt from 'bcrypt';

const server = express();
let PORT = 3001;

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

//console.log(emailRegex.test('amstig100@gmail.c')) rege test funciton return boolean

server.use(express.json());

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex:true
});

server.post('/signup', (req, res) => {
    let {fullname, email, password} = req.body;

    //validating the data from frontend
    if(fullname.length < 3){
      return res.status(403).json({"error":"Full name must be atleast 3 letter long"})
    }
    if(!email.length){
      return res.status(403).json({"error": "Enter Email"})
    }
    if(!emailRegex.test(email)){
      return res.status(403).json({"error":"Email is invalid"})
    }
    if(!passwordRegex.test(password)){
      return res.status(403).json({"error":"Password should be 6 to 20 charecter long with a numberic, 1 lowercase and 1 uppercase letter"})
    }

    bcrypt.hash(password, 10, (err, hashed_password) => {
      
      let username = email.split("@")[0]; ''

      let user = new User



      console.log(hashed_password)
    })


    return res.status(200).json({"status" : "okay"})
});

server.listen(PORT, () => {
  console.log("listening on port ->" + PORT);
});


