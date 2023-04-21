const express = require("express");
let cookieSession = require('cookie-session');
const { findUserByEmail } = require('./helpers.js');
let morgan = require('morgan');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

//sets view engine ti ejs template
app.set("view engine", "ejs");
//---->Middleware------> route
app.use(morgan('dev'));
//this parses the req.body for html to read
app.use(express.urlencoded({ extended: true }));
//cookie session
app.use(cookieSession({
  name: 'session',
  keys: ['test', '12345', 'app']
}));
//parses the cookie information stored in user's browser to pass with the get/post request
//app.use(cookieParser());
//--------> middleware----------//



const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  b5ae9v: {
    longURL: "https://www.sephora.com",
    userID: "ima6gv",
  },
  ku4mnm: {
    longURL: "http://www.bing.com",
    userID: "ima6gv",
  },
  scvyr4: {
    longURL: "https://www.apple.ca",
    userID: "ima6gv",
  },
  gq3zlk: {
    longURL: "http://www.sephora.com",
    userID: "z8q89n",
  }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  ima6gv: {
    id: "ima6gv",
    email: "user2@example.com",
    password: "123",
  },
  z8q89n: {
    id: "z8q89n",
    email: "testing3@gmail.com",
    password: "123",
  }
};

//generates 6 alpha-numeric string
function generateRandomString() {
  return Math.random().toString(36).slice(2, 8);
}


//function to return URLs which have userID === user_id(cookie)
const urlsForUser = (id) => {
  let urls = [];
  for (let key in urlDatabase) {
    //console.log('database key', urlDatabase[key], urlDatabase[key].userID === id);
    if (urlDatabase[key].userID === id) {
      urls.push(urlDatabase[key].longURL);
    }
  }
  return urls;
};

const objectsForUser = (id) => {
  let userDatabase = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      userDatabase[key] = urlDatabase[key];
      console.log(userDatabase);
    }
  }
  return userDatabase;
};

//route handler for /urls and res.render() to pass the url data into out template
app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.status(401).send('Login to view your URLs');
  }
  const myDatabase = objectsForUser(user.id);
  const templateVars = {
    user,
    urls: myDatabase
  };
  res.render("urls_index", templateVars);
});

//endpoint to go to page and add a new url to database
app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
  }
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

//endpoint to post the new url to /urls
app.post("/urls", (req, res) => {
  console.log(req.body);
  const user = users[req.session.user_id];
  if (!user) {
    res.status(401).send('You must be logged in to shorten URLs');
    return;
  } else {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: user.id
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

// Authentication Routes (End-Points)

// REGISTER

// get register

//GET route for /register which renders the registration template
app.get("/register", (req, res) => {
  //redirect the user to /urls page if user already logged in
  const user = users[req.session.user_id];
  if (user) {
    res.redirect("/urls");
  }
  const templateVars = { user: null };
  res.render("register", templateVars);
});

//POST Register

//POST /register endpoint, saves the user data into users object
app.post("/register", (req, res) => {
  console.log(req.body);
  //destructuring
  //const { email, password } = req.body;

  // const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  console.log("hash:", hash);

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
    password: hash
  };

  //set the cookie
  //res.cookie('user_id', userRandomID);
  req.session.user_id = userRandomID;
  //check the users object
  console.log(users);
  //redirect to /urls page
  res.redirect("/urls");
});

// LOGIN

app.get("/login", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    res.redirect("/urls");
  }
  const templateVars = { user: null };
  res.render("login", templateVars);
});

//endpoint triggered when user login
app.post("/login", (req, res) => {
  console.log(req.body);
  //extract email and password
  //const { email, password } = req.body;
  const email = req.body.email;
  const password = req.body.password;

  //validate if user exists
  const user = findUserByEmail(email, users);
  //console.log("user", user);
  if (user && user.email === email) {
    console.log("user password", user.password);
    if (bcrypt.compareSync(password, user.password)) {
      //setting the cookie 
      //res.cookie("user_id", user.id);
      req.session.user_id = user.id;
      res.redirect("/urls");
    } else {
      res.status(403).send('Bad credentials');
    }
  } else {
    res.status(403).send('Email and password not found');
  }

});

//get request to go to main website page saved in shortURL
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(401).send('ShortURL does not exist!');
    return;
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

//endpoint to go to shortURL page
app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(401).send('ShortURL does not exist!');
    return;
  }
  const user = req.session.user_id;
  const myURLs = urlsForUser(user);
  console.log("myURLs:", myURLs);

  const templateVars = {
    user: users[user],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };

  //console.log("urls includes", myURLs.includes(templateVars.longURL));

  if (!user) {
    res.status(401).send('Login to view your URLs');
    return;
  } else if (!myURLs.includes(templateVars.longURL)) {
    res.status(401).send('You do not own this URL');
    return;
  } else {
    res.render("urls_show", templateVars);
  }
});

//endpoint triggered when user hits delete button
app.post("/urls/:id/delete", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(401).send('ShortURL does not exist!');
    return;
  }
  //console.log(req.params.id);
  const user = users[req.session.user_id];
  const myURLs = urlsForUser(user.id);

  const templateVars = {
    longURL: urlDatabase[req.params.id].longURL
  };

  if (!user) {
    res.status(401).send('Login to view your URLs');
    return;
  } else if (!myURLs.includes(templateVars.longURL)) {
    res.status(401).send('You do not own this URL');
    return;
  } else {
    delete urlDatabase[req.params.id];
    res.redirect(`/urls`);
  }
});

//endpoint triggered when user edits a longURL
app.post("/urls/:id/updated", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(401).send('ShortURL does not exist!');
    return;
  }
  //console.log(req.body);
  const user = users[req.session.user_id]; //user is an object
  const myURLs = urlsForUser(user.id);

  const templateVars = {
    longURL: urlDatabase[req.params.id].longURL
  };

  if (!user) {
    res.status(401).send('Login to view your URLs');
    return;
  } else if (!myURLs.includes(templateVars.longURL)) {
    res.status(401).send('You do not own this URL');
    return;
  } else {
    urlDatabase[req.params.id]["longURL"] = req.body.longURL;
    res.redirect(`/urls`);
  }
});

//logout endpoint triggered when user logout and cookie is cleared, user redirected to /urls
app.post("/logout", (req, res) => {
  //res.clearCookie('user_id');
  req.session = null;
  res.redirect(`/login`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

