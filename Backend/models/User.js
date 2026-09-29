const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            default: ""
        },

        role: {
            type: String,
            enum: [
                "Student",
                "Team Member",
                "Administrator"
            ],
            default: "Student"
        },

        college: {
            type: String,
            default: ""
        }
    },

    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);