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

//generates 6 alpha-numeric string
function generateRandomString() {
  return Math.random().toString(36).slice(2, 8);
}

//route handler for /urls and res.render() to pass the url data into out template
app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});
//endpoint to go to page and add a new url to database
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
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
//get request to go to main website page saved in shortURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});
//endpoint to go to shortURL page
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
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

//endpoint triggered when user login
app.post("/login", (req, res) => {
  console.log(req.body.username);
  res.cookie('username', req.body.username);
  res.redirect(`/urls`);
});
//logout endppoint triggered when user logout and cookie is cleared, user redirected to /urls
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect(`/urls`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

