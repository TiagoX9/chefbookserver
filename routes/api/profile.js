const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");
const multer = require("multer");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// Image Upload
const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

// Get current users profile
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Profile.findOne({ user: req.user.id })
      .populate("user", ["name"])
      .then((profile) => {
        if (!profile) {
          errors.noprofile = "There is no profile for this user";
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch((err) => res.status(404).json(err));
  }
);

// Get all profiles
router.get("/all", (req, res) => {
  Profile.find()
    .populate("user")
    .then((profiles) => {
      if (!profiles) {
        return res.status(404).json();
      }
      res.json(profiles);
    })
    .catch((err) => {
      res.status(404).json({ profile: "There are no profiles" });
    });
});

// Get profile by user ID
router.get("/user/:user_id", (req, res) => {
  const errors = {};
  Profile.findOne({ user: req.params.user_id })
    .populate("user")
    .then((profile) => {
      if (!profile) {
        console.log("There is no profile for this user ID");
      } else {
        res.json(profile);
      }
    })
    .catch((err) => {
      
    });
});

// Get profile by profile ID
router.get("/:profile_id", (req, res) => {
  const errors = {};
  Profile.findById(req.params.profile_id)
    .populate("profile")
    .then((profile) => {
      if (!profile) {
        errors.noprofile = "There is no user with this id";
        res.status(404)
      }
      res.json(profile);
    })
    .catch((err) =>
      res.status(404)
    );
});

// Create or Edit current user profile
router.post(
  "/",
  uploadOptions.single("profilePic"),
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.file) {
      var file = req.file;
      var fileName = file.filename;
      var basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    }

    const editedProfilePic = req.body.profilePic ? req.body.profilePic : null;

    Profile.findOne({ user: req.user.id }).then((profile) => {
      if (profile) {
        // Update
        Profile.findOneAndUpdate(
          { user: req.user.id },
          {
            user: req.user.id,
            displayName: req.body.displayName,
            profilePic: req.file ? `${basePath}${fileName}` : editedProfilePic,
            restaurant: req.body.restaurant,
            website: req.body.website,
            location: req.body.location,
            bio: req.body.bio,
            youtube: req.body.youtube,
            twitter: req.body.twitter,
            facebook: req.body.facebook,
            instagram: req.body.instagram,
          },
          { new: true }
        ).then((profile) => res.json(profile));
      } else {
        // Create
        new Profile({
          user: req.user.id,
          displayName: req.body.displayName,
          profilePic: req.file ? `${basePath}${fileName}` : null,
          restaurant: req.body.restaurant,
          website: req.body.website,
          location: req.body.location,
          bio: req.body.bio,
          youtube: req.body.youtube,
          twitter: req.body.twitter,
          facebook: req.body.facebook,
          instagram: req.body.instagram,
        }).save((profile) => res.json(profile));
      }
    });
  }
);

// Delete user and profile
router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOneAndRemove({ user: req.user.id }).then(() => {
      User.findOneAndRemove({ _id: req.user.id }).then(() => {
        res.json({ success: true });
      });
    });
  }
);

// Follow User
router.post(
  "/follow/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then((profile) => {
      // Add user id to following array
      if (
        profile.following.filter(
          (following) => following.user.toString() === req.params.id
        ).length > 0
      ) {
        return console.log("You already follow this user");
      } else {
        profile.following.unshift({ user: req.params.id });
      }
      Profile.findOne({user: req.params.id})
        .then((profile) => {
          if (
            profile.followers.filter(
              (follow) => follow.user.toString() === req.user.id
            ).length > 0
          ) {
            return console.log("This user is alredy followed by you");
          }
          // Add user id to followers array
          profile.followers.unshift({ user: req.user.id });
          profile.save();
        })
        .catch((err) => console.log("Follow error",err));
      profile.save();
    });
  }
);

// Unfollow user
router.post(
  "/unfollow/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then((profile) => {
      // Add user id to following array
      if (
        profile.following.filter(
          (following) => following.user.toString() === req.params.id
        ).length === 0
      ) {
        return console.log("You dont follow this user yet");
      } else {
        const removeIndex = profile.following
          .map((item) => item.user.toString())
          .indexOf(req.params.id);

        // Splice out of array
        profile.following.splice(removeIndex, 1);
      }
      Profile.findOne({user: req.params.id})
        .then((profile) => {
          if (
            profile.followers.filter(
              (follow) => follow.user.toString() === req.user.id
            ).length === 0
          ) {
            return console.log("This user is not followed by you yet");
          }

          // Get the remove index
          const removeIndex = profile.followers
            .map((item) => item.user.toString())
            .indexOf(req.user.id);

          // Splice out of array
          profile.followers.splice(removeIndex, 1);

          // Save
          profile.save();
        })
        .catch((err) => console.log("Unfollow error", err));
      profile.save();
    });
  }
);

module.exports = router;
