require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const fp = require("fs").promises;
const fs = require("fs");
const passDoNotMatch = "Passwords do not match!";
const userExists = "User already exists!";
const session = require("express-session");
const store = new session.MemoryStore();
var id = 0;
// server config
const PORT = parseInt(process.env.PORT) || 8080;
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname)));
app.use(
  session({
    secret: "somerandomdata",
    resave: false,
    cookie: { maxAge: 60000 },
    saveUninitialized: false,
    store,
  })
);

app.use((req, res, next) => {
  console.log(`${req.method} - ${req.url}`);
  // console.log(Object.keys(store.sessions));
  // console.log(req.session);
  next();
});
app.listen(PORT, () => console.log(`The server is alive on port ${PORT}!`));

//get Requests
app.get("/", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/index.html"));
});

app.get("/register", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/register.html"));
});

app.get("/login", (req, res) => {
  req.session.user
    ? res.status(200).sendFile(path.join(__dirname, "/home.html"))
    : res.status(200).sendFile(path.join(__dirname, "/login.html"));
});

app.get("/delete", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/deleteUser.html"));
});

app.get("/update", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/updateUser.html"));
});

app.get("/logout", (req, res) => {
  res.redirect("/");
  req.session.destroy();
});

//post Requests
app.post("/register", async (req, res) => {
  const { email, psw, pswrepeat } = await req.body;
  const readResponse = await fp.readFile(
    path.join(__dirname, "..", "users.json"),
    "utf-8"
  );
  const data = JSON.parse(readResponse);
  const users = data.users;
  const user = users.find((user) => user.email === email);

  try {
    if (psw !== pswrepeat) throw passDoNotMatch;
    else if (user) throw userExists;
    else {
      const newUser = {
        email: email,
        psw: psw,
      };
      newUser.id = users.length > 0 ? users.length : 0;
      const usersArray = [...users, newUser];
      data.users = usersArray;
      fp.writeFile(
        path.join(__dirname, "..", "/users.json"),
        JSON.stringify(data, null, 2)
      ).then(() => {
        res.redirect("/login");
      });
    }
  } catch (error) {
    if (error === passDoNotMatch) {
      res.status(400).sendFile(path.join(__dirname, "/passwordError.html"));
    } else if (error === userExists) {
      res.status(400).sendFile(path.join(__dirname, "/userErrors.html"));
    } else {
      res.status(400).send(error.toString());
    }
  }
});

app.post("/login", async (req, res) => {
  const { email, psw } = await req.body;
  try {
    const readResponse = await fp.readFile(
      path.join(__dirname, "..", "users.json"),
      "utf-8"
    );
    const users = JSON.parse(readResponse).users;
    const user = users.find((user) => user.email === email);
    if (!user) res.status(200).send("Invalid Email");
    else if (user.psw !== psw) res.status(200).send("Invalid Password");
    else {
      res.status(200).sendFile(path.join(__dirname, "/home.html"));
      req.session.user = { email, psw, isAuthenticated: true };
    }
  } catch (error) {
    res.status(400).send(error.toString());
  }
});

//delete Request
app.post("/delete", async (req, res) => {
  try {
    const readResponse = await fp.readFile(
      path.join(__dirname, "..", "users.json"),
      "utf-8"
    );
    const data = JSON.parse(readResponse);
    const users = data.users;

    if (!checkEmail(users, req.body)) res.status(200).send("Invalid Email");
    else if (!checkPassword(users, req.body))
      res.status(200).send("Invalid Password");
    else {
      const notUser = remainingUsers(users, req.body);
      const newUsers = notUser.length < 1 ? [] : correctIndex(notUser);
      data.users = newUsers;
      fp.writeFile(
        path.join(__dirname, "..", "users.json"),
        JSON.stringify(data, null, 2)
      ).then(res.status(200).send("User succesfully deleted!"));
    }
  } catch (error) {
    res.status(400).send(error.toString());
  }
});

//update Request
app.post("/update", async (req, res) => {
  try {
    const readResponse = await fp.readFile(
      path.join(__dirname, "..", "users.json"),
      "utf-8"
    );
    const data = JSON.parse(readResponse);
    const users = data.users;
    if (!checkEmail(users, req.body)) res.status(200).send("Invalid Email!");
    else if (!checkPassword(users, req.body))
      res.status(200).send("Invalid Password!");
    else {
      if (!checkForNewUser(users, req.body)) {
        const userIndex = getUserIndex(users, req.body);
        data.users[userIndex].email = req.body.uemail;
        data.users[userIndex].psw = req.body.upsw;
        await fp
          .writeFile(
            path.join(__dirname, "..", "users.json"),
            JSON.stringify(data, null, 2)
          )
          .then(res.redirect("/update"));
      } else res.status(200).send("Email already registered by another user!");
    }
  } catch (error) {
    res.status(200).send(error.toString());
  }
});

const correctIndex = (users) => {
  for (let i = 0; i < users.length; i++) {
    users[i].id = i;
  }
  return users;
};

const checkEmail = (users, { email }) => {
  return users.find((user) => user.email === email);
};
const checkPassword = (users, { psw }) => {
  return users.find((user) => user.psw === psw);
};
const getUserIndex = (users, { email, psw }) => {
  return users.findIndex((user) => user.psw === psw && user.email === email);
};

const checkForNewUser = (users, { uemail }) => {
  return users.find((user) => user.email === uemail);
};

const remainingUsers = (users, { email, psw }) => {
  return users.filter((user) => user.email !== email && user.psw !== psw);
};
