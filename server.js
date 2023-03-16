const { raw } = require("express");
const express = require("express");
const app = express();
const path = require("path");
const users = require("./users.json");
const fs = require("fs").promises;

// server config
const PORT = 8080;

app.use(express.urlencoded({ extended: false }));

app.listen(PORT, () => console.log(`The server is alive on port ${PORT}!`));

//get Requests
app.get("/", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/index.html"));
});

app.get("/register", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "register.html"));
});

app.get("/login", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "login.html"));
});

app.get("/info", (req, res) => {
  const infoObject = {
    name: "NodeJs server!",
    purpose: "Testing Purposes",
  };
  res.status(200).send(JSON.stringify(infoObject));
});

app.get("/ioana", (req, res) => {
  const infoObject = {
    name: "Esanu",
    surname: "Ioana",
  };
  res.status(200).send(JSON.stringify(infoObject));
});

//post Requests
app.post("/register", (req, res) => {
  const { email, psw, pswrepeat } = req.body;
  const user = users.users.find((e) => e.email == email);
  try {
    if (psw !== pswrepeat) {
      throw "Passwords do not match!";
    } else if (user != undefined) throw "User already exists!";
  } catch (error) {
    if (error === 'Passwords do not match!') {
      res.status(400).sendFile(path.join(__dirname, "./error.html"));
      return false;
    } else if (error === 'User already exists!') {
      res.status(400).sendFile(path.join(__dirname, "./userErrors.html"));
      return false;
    }
  }
  const newUser = {
    email: email,
    psw: psw,
  };
  if (users.users.length === 0) newUser.id = 0;
  else {
    const id = users.users.length;
    newUser.id = id;
  }
  users.users.push(newUser);
  fs.writeFile("./users.json", JSON.stringify(users), "utf-8")
    .then(() => {
      res.redirect("/login");
    })
    .catch((error) => {
      console.log(error);
    });
});
