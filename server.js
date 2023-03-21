require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const fp = require("fs").promises;
const passDoNotMatch = "Passwords do not match!";
const userExists = "User already exists!";
var EventEmitter = require('events').EventEmitter;

// sesion expired variable
var expired = true;
const sesionString = "Sesion Expired";

var sesionExpired = new EventEmitter();

sesionExpired.on(sesionString, (data) =>{
  console.log('Event fired!');
  app.send(data);
});

// server config
const PORT = parseInt(process.env.PORT) || 8080;
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname)));
app.listen(PORT, () => console.log(`The server is alive on port ${PORT}!`));

//get Requests
app.get("/", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/index.html"));
});

app.get("/register", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/register.html"));
});

app.get("/login", (req, res) => {
  if (!expired) {
    res.status(200).sendFile(path.join(__dirname, "/home.html"));
  } else {
    res.status(200).sendFile(path.join(__dirname, "/login.html"));
  }
});

app.get("/delete", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/deleteUser.html"));
});

app.get("/update", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/updateUser.html"));
});

//post Requests
app.post("/register", async (req, res) => {
  const { email, psw, pswrepeat } = req.body;
  const readResponse = await fp.readFile(
    path.join(__dirname, "users.json"),
    "utf-8"
  );
  const users = await JSON.parse(readResponse);
  const user = users.find((user) => user.email === email);
  try {
    if (user) throw userExists;
    else if (psw !== pswrepeat) throw passDoNotMatch;
  } catch (error) {
    if (error === passDoNotMatch) {
      res.status(400).sendFile(path.join(__dirname, "/passwordError.html"));
      return false;
    } else if (error === userExists) {
      res.status(400).sendFile(path.join(__dirname, "/userErrors.html"));
      return false;
    }
  }
  const newUser = {
    email: email,
    psw: psw,
  };
  newUser.id = users.length > 0 ? users.length : 0;
  users.push(newUser);
  await fp.writeFile("users.json", JSON.stringify(users, null, 2));
  res.redirect("/login");
});

app.post("/login", async (req, res) => {
  const { email, psw } = req.body;
  const readResponse = await fp.readFile(
    path.join(__dirname, "users.json"),
    "utf-8"
  );
  const users = await JSON.parse(readResponse);
  const user = users.find((user) => user.email === email);
  if (!user) {
    res.status(200).send("Invalid Email");
  } else if (user.psw !== psw) {
    res.status(200).send("Invalid Password");
  } else {
    res.status(200).sendFile(path.join(__dirname, "/home.html"));
    expired = false;
    setTimeout(() => {
      console.log("Sesion expired!");
      expired = true;
      sesionExpired.emit('sesion_expired', sesionString);
    }, 5000);
  }
});

//delete Request
app.post("/delete", async (req, res) => {
  const { email, psw } = req.body;
  const readResponse = await fp.readFile(path.join(__dirname,"users.json"),"utf-8");
  const users = await JSON.parse(readResponse);
  const user = users.find((user) => user.email === email && user.psw === psw);
  const notUser = users.filter(
    (user) => user.email !== email && user.psw !== psw
  );
  if (!user) res.status(200).send("User not found");
  else {
    const userJson = !notUser ? new Array() : correctIndex(notUser);
    fs.writeFileSync("users.json", JSON.stringify(userJson, null, 2));
    res.status(200).send("User succesfully deleted!");
  }
});

app.post("/update", (req, res) => {
  const { email, psw, uemail, upsw } = req.body;
  const users = JSON.parse(fs.readFileSync("users.json"));
  const userIndex = users.findIndex(
    (user) => user.email === email && user.psw === psw
  );
  if (userIndex === -1) {
    res.status(200).send("User not found!");
    return false;
  }
  const checkForNewUser = users.find(
    (user) => user.email === uemail && user.psw === upsw
  );
  if (!checkForNewUser) {
    users[userIndex].email = uemail;
    users[userIndex].psw = upsw;
    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
    res.redirect("/update");
  } else
    res.status(200).send("Credentials already registered by another user!");
});

const correctIndex = (userJson) => {
  for (let i = 0; i < userJson.length; i++) {
    userJson[i].id = i;
  }
  return userJson;
};
