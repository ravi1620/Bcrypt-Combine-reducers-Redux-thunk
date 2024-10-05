const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
dotenv.config();

let app = express();
app.use(cors());
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },

  filename: (req, file, cb) => {
    console.log(file);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

let userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  mobile: String,
  profilePic: String,
});

let User = new mongoose.model("user", userSchema);

app.post("/validateToken",upload.none(),async (req,res)=>{
console.log(req.body);

let decryptedCred = jwt.verify(req.body.token,"abacabac");

let userDetails = await User.find().and({ email:decryptedCred.email });

if (userDetails.length > 0) {
  console.log(userDetails);

  if (userDetails[0].password === decryptedCred.password) {

    let loginDetails = {
      firstName: userDetails[0].firstName,
      lastName: userDetails[0].lastName,
      email: userDetails[0].email,
      mobile: userDetails[0].mobile,
      profilePic: userDetails[0].profilePic,
    };

    res.json({ status: "Success", data: loginDetails });
  } else {
    res.json({ status: "Failed", msg: "Invalid Password" });
  }
} else {
  res.json({ status: "Failed", msg: "USer doesnot exist" });
}

});

app.post("/Login", upload.none(), async (req, res) => {
  console.log(req.body);
  let userDetails = await User.find().and({ email: req.body.email });

  console.log(userDetails);

  if (userDetails.length > 0) {
   
    let ispasswordValid = await bcrypt.compare(req.body.password,userDetails[0].password);

    if (ispasswordValid == true) {

 let encryptedCred = jwt.sign({ email:req.body.email , password:req.body.password},"abacabac");

      let loginDetails = {
        firstName: userDetails[0].firstName,
        lastName: userDetails[0].lastName,
        email: userDetails[0].email,
        mobile: userDetails[0].mobile,
        profilePic: userDetails[0].profilePic,
        token:encryptedCred,
      };

      res.json({ status: "Success", data: loginDetails });
    } else {
      res.json({ status: "Failed", msg: "Invalid Password" });
    }
  } else {
    res.json({ status: "Failed", msg: "USer doesnot exist" });
  }
});

app.post("/Signup", upload.single("profilePic"), async (req, res) => {
  console.log(req.body);
  console.log(req.file);

let hashedPassword = await bcrypt.hash(req.body.password,10);

  try {
    let user1 = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
      mobile: req.body.mobile,
      profilePic: req.file.path,
    });

    await User.insertMany([user1]);

    res.json({ status: "Success", msg: "Successfully created User" });
  } catch (error) {
    res.json({ status: "Failed", msg: "Unable to create User", error });
  }
});

app.patch("/update", upload.single('profilePic'), async (req, res) => {
  // req.body will contain the parsed JSON data
  // req.file will contain the uploaded file
console.log(req.body);
  try {
    if (req.body.firstName.trim().length > 0) {
      await User.updateMany({ email: req.body.email },
        { firstName: req.body.firstName });
    }
  
    if (req.body.lastName.trim().length > 0) {
      await User.updateMany({ email: req.body.email },
        { lastName: req.body.lastName });
    }
  
    if (req.body.password.length > 0) {
      await User.updateMany({ email: req.body.email },
        { password: req.body.password });
    }
  
    if (req.body.mobile.trim().length > 0) {
      await User.updateMany({ email: req.body.email },
        { mobile: req.body.mobile });
    }
  
    if (req.file) {
      await User.updateMany({ email: req.body.email },
        { profilePic: req.file.path });
    }
  
    res.json({ status: "Success", msg: "Profile updated succesfully" });
  } catch (error) {
    res.json({ status: "Failed", msg: "Can't update profile",error});
  }
});

app.delete("/deleteProfile",async(req,res)=>{

  let delResult = await User.deleteMany({email:req.query.email});
  console.log(delResult);
  res.json({status:"Success",msg:"Successfully deleted the account"});
})

app.listen(process.env.port, () => {
  console.log(`Listening to Port ${process.env.port}`);
});

let connectToDB = async () => {
  try {
    await mongoose.connect(process.env.mdburl);
    console.log("Succesfully connected to DB");
  } catch (error) {
    console.log("Failed to create database", error);
  }
};

connectToDB();
