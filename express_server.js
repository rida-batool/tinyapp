const express = require("express");
var cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

//sets view engine ti ejs template
app.set("view engine", "ejs");
//this parses the req.body for html to read
app.use(express.urlencoded({ extended: true }));
//parses the cookie information stored in user's browser to pass with the get/post request
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

//generates 6 alpha-numeric string
function generateRandomString() {
  return Math.random().toString(36).slice(2, 8);
}

const findUserByEmail = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};


//route handler for /urls and res.render() to pass the url data into out template
app.get("/urls", (req, res) => {
  const user = req.cookies["user_id"];
  const templateVars = {
    user: users[user],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});
//endpoint to go to page and add a new url to database
app.get("/urls/new", (req, res) => {
  const user = req.cookies["user_id"];
  const templateVars = {
    user: users[user],
  };
  res.render("urls_new", templateVars);
});

//endpoint to post the new url to /urls
app.post("/urls", (req, res) => {
  console.log(req.body);
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// Authentication Routes (End-Points)

// REGISTER

// get register

//GET route for /register which renders the registration template
app.get("/register", (req, res) => {
  res.render("register");
});

//POST Register

//POST /register endpoint, saves the user data into users object
app.post("/register", (req, res) => {
  console.log(req.body);
  //destructuring
  const { email, password } = req.body;

  // const name = req.body.name;
  // const email = req.body.email;
  // const password = req.body.password;

  // validation
  // Check if user exists? => look for that email
  for (let userId in users) {
    if (req.body.email === "" || req.body.password === "") {
      res.status(400).send("Email or password cannot be empty");
      return;
    }
    else if (users[userId].email === email) {
      // user exist
      res.status(400).send('User already exists!');
      return;
    }
  }
  // adding the user to the users DB
  const userRandomID = generateRandomString();
  users[userRandomID] = {
    id: userRandomID,
    email,
    password
  };
  //set the cookie
  res.cookie('user_id', userRandomID);
  //check the users object
  console.log(users);
  //redirect to /urls page
  res.redirect("/urls");
});

// LOGIN

app.get("/login", (req, res) => {
  const templateVars = { user: null };
  res.render("login", templateVars);
});

//endpoint triggered when user login
app.post("/login", (req, res) => {
  console.log(req.body);
  //extract email and password
  const { email, password } = req.body;
  //validate if user exists
  const user = findUserByEmail(email, users);
  if (user && user.email === email) {
    if (user.password === password) {
      //setting the cookie 
      res.cookie("user_id", user.id);
      res.redirect("/urls");
    } else {
      res.status(403).send('Bad credentials');
    }

  } else {
    res.status(403).send('Email not found');
  }

});

//get request to go to main website page saved in shortURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});
//endpoint to go to shortURL page
app.get("/urls/:id", (req, res) => {
  const user = req.cookies["user_id"];
  const templateVars = {
    user: users[user],
    id: req.params.id, longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

//endpoint triggered when user hits delete button
app.post("/urls/:id/delete", (req, res) => {
  console.log(req.params.id);
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

//endpoint triggered when user edits a longURL
app.post("/urls/:id/updated", (req, res) => {
  console.log(req.body);
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls`);
});

//logout endpoint triggered when user logout and cookie is cleared, user redirected to /urls
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect(`/urls`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

