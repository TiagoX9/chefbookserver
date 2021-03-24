const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const path = require("path");
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');

const users = require("./routes/api/users");
const profile = require("./routes/api/profile");
const posts = require("./routes/api/posts");

const app = express();

app.use(cors());
app.options('*', cors())

// Body parser middleware
app.use(bodyParser.json());
app.use(morgan('tiny'));


// DB Config
const db = require("./config/keys").mongoURI;

// Connect to MongoDB
mongoose
  .connect(db, { 
    useNewUrlParser: true,
     useUnifiedTopology: true,
    useFindAndModify: false,
  dbName: 'chefbook_dev' })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Passport middleware
app.use(passport.initialize());

// Passport Config
require("./config/passport")(passport);

// Use routes
app.use("/api/users", users);
app.use("/api/profile", profile);
app.use("/api/posts", posts);
// Image Folder
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));

// Server static assets if in production
// if (process.env.NODE.ENV === "production") {
//   // Set static folder
//   app.use(express.static("client/build"));

//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
//   });
// }

const port = process.env.PORT || 5000; // First port for deployment, second for local development

app.listen(port, () => console.log(`Server running on port ${port}`));

