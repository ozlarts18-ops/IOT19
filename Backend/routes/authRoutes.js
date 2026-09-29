const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

console.log("✅ NEW AUTH ROUTES FILE LOADED");


// ======================================================
// REGISTER
// ======================================================

router.post("/register", async (req, res) => {

    console.log("🔥 NEW REGISTER ROUTE HIT");
    console.log("DATA RECEIVED:", req.body);

    try {

        const {
            name,
            email,
            password,
            phone,
            role,
            college
        } = req.body;


        // Check required fields
        if (!name || !email || !password) {

            console.log("❌ Required field missing");

            return res.status(400).json({
                message: "Name, email and password are required"
            });

        }


        // Check existing email
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });


        if (existingUser) {

            return res.status(400).json({
                message: "Email already registered"
            });

        }


        // Hash password
        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Create user
        const user = new User({

            name: name.trim(),

            email: email.toLowerCase().trim(),

            password: hashedPassword,

            phone: phone || "",

            role: role || "Student",

            college: college || ""

        });


        await user.save();


        console.log(
            "🎉 USER CREATED:",
            user._id
        );


        res.status(201).json({

            message: "Registration successful",

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                phone: user.phone,

                role: user.role,

                college: user.college

            }

        });


    } catch (error) {

        console.error(
            "❌ REGISTER ERROR:",
            error
        );

        res.status(500).json({

            message: error.message

        });

    }

});


// ======================================================
// LOGIN
// ======================================================

router.post("/login", async (req, res) => {

    console.log("🔥 LOGIN ROUTE HIT");

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({

                message:
                    "Email and password are required"

            });

        }


        const user = await User.findOne({

            email:
                email.toLowerCase().trim()

        });


        if (!user) {

            return res.status(401).json({

                message:
                    "Invalid email or password"

            });

        }


        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({

                message:
                    "Invalid email or password"

            });

        }


        const token = jwt.sign(

            {
                id: user._id,
                email: user.email,
                role: user.role
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "1d"
            }

        );


        res.json({

            message: "Login successful",

            token,

            user: {

                id: user._id,

                name: user.name,

                email: user.email,

                phone: user.phone,

                role: user.role,

                college: user.college

            }

        });


    } catch (error) {

        console.error(
            "❌ LOGIN ERROR:",
            error
        );


        res.status(500).json({

            message: error.message

        });

    }

});


module.exports = router;