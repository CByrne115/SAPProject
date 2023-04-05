const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
const mysql2 = require('mysql2')
const cookieParser = require('cookie-parser')
const session = require('express-session')


const db = mysql2.createPool({
    host: "localhost",
    user: "root",
    password: "admin",
    database: "sap_app",
});

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser());

const bcrypt = require('bcrypt')
const saltRounds = 10


app.use(
    cors({
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
        allowedHeaders: "Content-Type, Authorization",
    })
);


app.use(
    session({
        key: "sessionId",
        secret: "987654321",
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 60 * 60 * 12,
        },
    })
);

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user[0].isAdmin) {
      next();
    } else {
      res.status(403).send("Unauthorized");
    }
  };


  app.get('/api/get', (req, res) => {
    const sqlSelect = "SELECT * FROM users";
    db.query(sqlSelect, (err, result) => {
        res.send(result)
    });
});

app.post('/api/insert', (req, res) => {
    const employeeName = req.body.employeeName
    const employeeEmail = req.body.employeeEmail;
    const employeePassword = req.body.employeePassword

    const sqlInsert =
        "INSERT INTO users (employeeName, employeeEmail, employeePassword) VALUES (?,?,?);"
    db.query(sqlInsert, [employeeName, employeeEmail, employeePassword], (err, result) => {
        console.log(result);
    });
});

app.delete('/api/delete/:employeeName', (req, res) => {
    withCredentials: true
    const name = req.params.employeeName
    const sqlDelete = "DELETE FROM users WHERE employeeName = ?";

    db.query(sqlDelete, name, (err, result) => {
        if (err) console.log(err);
    });
});


app.put("/api/update/name", (req, res) => {
    const oldName = req.body.oldName
    const newName = req.body.newName
    const sqlUpdate = "UPDATE users SET employeeName = ? WHERE employeeName = ?";

    db.query(sqlUpdate, [newName, oldName], (err, result) => {
        if (err) console.log(err);
        else res.send(result);
    });
});


app.put("/api/update/email", (req, res) => {
    const name = req.body.employeeName
    const email = req.body.employeeEmail
    const sqlUpdate = "UPDATE users SET employeeEmail = ? WHERE employeeName = ?";

    db.query(sqlUpdate, [email, name], (err, result) => {
        if (err) console.log(err);
        else res.send(result);
    });
});


app.put("/api/update/password", (req, res) => {
    const name = req.body.employeeName
    const password = req.body.employeePassword
    const sqlUpdate = "UPDATE users SET employeePassword = ? WHERE employeeName = ?";

    db.query(sqlUpdate, [password, name], (err, result) => {
        if (err) console.log(err);
        else res.send(result);
    });
});

    app.post('/api/login/register', (req, res) => {
        const username = req.body.username;
        const password = req.body.password;
    
        bcrypt.genSalt(saltRounds, (err, salt) => {
            if (err) {
              console.log(err);
            }
            bcrypt.hash(password, salt, (err, hash) => {
              if (err) {
                console.log(err);
              }
    
              db.query(
                'INSERT INTO login (username, password) VALUES (?, ?)',
                [username, hash],
                (err, result) => {
                  if (err) {
                    console.log(err);
                    res.status(500).send('Internal Server Error');
                  } else {
                    console.log(result);
                    res.status(200).send('User registered successfully');
                  }
                }
              );
            });
        });
    });
    

app.get('/api/login/login', (req, res) => {
    if (req.session.user) {
        res.send({ loggedIn: true, user: req.session.user });
    } else {
        res.send({ loggedIn: false });
    }
});

app.post('/api/login/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    db.query(
        "SELECT * FROM login WHERE username = ?;",
        username,
        (err, result) => {
            if (err) {
                res.send({ err: err });
            }

            if (result.length > 0) {
                bcrypt.compare(password, result[0].password, (error, response) => {
                    if (response) {
                        req.session.user = result;
                        console.log(req.session.user);
                        res.send(result);
                    } else {
                        res.send({ message: "Wrong username/password combination!" });
                    }
                });
            } else {
                res.send({ message: "User doesn't exist" });
            }

        }
    );
});



app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log(err);
        } else {
            res.clearCookie('sessionId');
            res.send({ message: "User Logged Out" });;
        }
    });
});


app.listen(3001, () => {
    console.log('Server running on port 3001')
});
