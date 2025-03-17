const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { JsonWebTokenError } = require("jsonwebtoken");
const jwt = require("jsonwebtoken");
const { error } = require("console");

// Middleware
app.use(express.json()); // Parses JSON responses
app.use(cors()); // Enables CORS for the server

// Database Connection with MongoDB
mongoose.connect("mongodb+srv://afthalahamad01:%40Afthal6523@cluster0.miezb.mongodb.net/e-commerse")
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("MongoDB connection error:", error));


// API Creation
app.get("/", (req, res) => {
    res.send("Express app is running..");
});

// Image Storage Engine with Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "./upload/images";
        cb(null, uploadPath); // Set destination folder
    },
    filename: (req, file, cb) => {
        const uniqueName = `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName); // Create a unique filename
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only image files are allowed"), false);
        }
        cb(null, true);
    },
});
app.use(cors());

// Serve Uploaded Images as Static Files
app.use('/images', express.static("upload/images"));

// POST Endpoint for File Upload
app.post("/upload", upload.single("product"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: 0, message: "No file uploaded" });
        }
        const imageUrl = `http://localhost:${port}/images/${req.file.filename}`;
        res.json({
            success: 1,
            image_url: imageUrl,
        });
    } catch (error) {
        console.error("Error during file upload:", error);
        res.status(500).json({ success: 0, message: "Internal server error" });
    }
});

//schema for creating products

const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    },
})

app.post("/addproduct", async (req, res) => {
    let products = await Product.find({});
    let id;
    if (products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    }
    else {
        id = 1;
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success: true,
        name: req.body.name,
    })
})

//deleting a product

app.post("/removeproduct", async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Removed!");
    res.json({
        success: true,
        name: req.body.name
    })
})

//creating API for getting all products

app.get("/allproducts", async (req, res) => {
    let products = await Product.find({});
    console.log("All products fetched!");
    res.send(products);
})

//schema creating for user model

const Users = mongoose.model('Users', {
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    },
})

//creating endpoints for registering users

app.post('/signup',async (req,res)=> {
    console.log("Received headers:", req.headers);
    console.log("Received request data:", req.body);

    if (!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).json({ success: false, errors: "Missing required fields" });
    }

    let check = await Users.findOne({email: req.body.email});
    if(check){
        return res.status(400).json({success:false, errors:"Existing user found with same email address."})
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
        
    }
    const user = new Users({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    })

    await user.save();

    //JWT authentication
    const data = {
        user:{
            id: user.id
        }
    }

    const token = jwt.sign(data,'secret_ecom');
    res.json({success:true, token})
})

//creating end point to user login

app.post('/login', async (req,res) => {
    let user = await Users.findOne({email:req.body.email});
    if (user){
        const passCompare = req.body.password === user.password;
        if(passCompare){
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data, 'secret_ecom');
            res.json({success:true,token});
        }
        else{
            res.json({success:false, error:"Wrong Password!"});
        }
    }
    else{
        res.json({success:false,error:"Invalid email id"});
    }
})

// creating endpoint for new collections

app.get('/newcollections', async (req,res) => {
    let product = await Product.find({});
    let newCollection = product.slice(1).slice(-8);
    console.log("New collections fetched.");
    res.send(newCollection);
})

// Start Server
app.listen(port, (error) => {
    if (!error) {
        console.log("Server running on port " + port);
    } else {
        console.error("Could not connect to server:", error);
    }
});
