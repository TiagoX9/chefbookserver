const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

// Load Input Validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

// Load user model
const User = require("../../models/User");

// Register a user
router.post("/register", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      errors.email = "Email already exists";
      return res.status(400).json(errors);
    } else {
      const newUser = new User({
        email: req.body.email,
        password: req.body.password,
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then((user) => res.json(user))
            .catch((err) => console.log(err));
        });
      });
    }
  });
});

// Login User
router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  // Find user by email
  User.findOne({ email }).then((user) => {
    // Check for user
    if (!user) {
      errors.email = "User not found";
      return res.status(404).json(errors);
    }

    // Check Password

    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        // User Matched

        const payload = { id: user.id }; // Create JWT Payload

        // Sign Token
        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 3600 },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token,
            });
          }
        );
      } else {
        errors.password = "Password incorrect";
        return res.status(400).json(errors);
      }
    });
  });
});

// Get all users
router.get("/all", (req, res) => {
  const errors = {};

  User.find()
    .populate("user")
    .then((users) => {
      if (!users) {
        errors.nousers = "There are no users yet";
        return res.status(404).json();
      }

      res.json(users);
    })
    .catch((err) => {
      res.status(404).json({ users: "There are no users" });
    });
});

// Get user by user ID
router.get("/:user_id", (req, res) => {
  const errors = {};

  User.findById(req.params.user_id)
    .populate("user")
    .then((user) => {
      if (!user) {
        errors.noprofile = "There is no user with this id";
        res.status(404).json(errors);
      }
      res.json(user);
    })
    .catch((err) =>
      res.status(404).json({ user: "There is no user with this id" })
    );
});

module.exports = router;