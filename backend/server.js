const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const Bcrypt = require("bcrypt");
const { findUserAndSendHelper } = require("./helper/userHelper");

const BCRYPT_SALT_ROUNDS = 12;
const BCRYPT_SMALL_SALT_ROUND = 1;

//App Config
const app = express();
const port = process.env.PORT || 8000;

//middleware
app.use(express.json());
app.use(cors());
// app.use(bodyParser.json());

//Db config
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "traveldb",
  multipleStatements: true,
});

db.connect(function (err) {
  if (err) {
    console.log(err);
    console.log("this is a error");
  } else {
    console.log("DB Connected!");
  }
});

//routes
app.get("/", (req, res) => res.status(200).send("hello"));

app.post("/register", (req, res) => {
  const newUser = req.body;
  Bcrypt.hash(newUser.password, BCRYPT_SALT_ROUNDS).then((hashedPassword) => {
    db.query(
      "INSERT INTO users (name, email, password,phone) VALUES (?,?,?,?)",
      [newUser.name, newUser.email, hashedPassword, newUser.phone],
      (err, user) => {
        if (err) {
          console.log(err);
          return res.status(400);
        } else {
          return res.status(200).send(true);
        }
      }
    );
  });
});

app.post("/validate", (req, res) => {
  console.log(req.body.email);
  db.query(
    "SELECT email FROM users WHERE email= ?",
    req.body.email,

    (err, user) => {
      if (user.length < 1) {
        return res.status(200).send(true);
      } else {
        return res.status(200).send(false);
      }
    }
  );
});

app.post("/loginuser", (req, res) => {
  const loginUser = req.body;
  db.query(
    "SELECT * FROM users WHERE email = ?",
    [loginUser.email],
    (err, user) => {
      if (err) {
        return res
          .status(404)
          .send({ message: "Oops! Something went wrong! Try again." });
      }

      if (user.length > 0) {
        Bcrypt.compare(req.body.password, user[0].password, (err, result) => {
          if (result === true) {
            return res.status(200).send({ message: "Login successfull" });
          } else {
            return res.status(404).send({ message: "password do not match." });
          }
        });
      } else {
        return res
          .status(404)
          .send({ message: "Username/password do not match." });
      }
    }
  );
});

app.post(`/getuser`, (req, res) => {
  db.query(
    "SELECT * FROM users WHERE email= ?",
    [req.body.email],

    (err, user) => {
      if (user.length >= 1) {
        return res.status(200).send(user);
      } else {
        return res.status(401).send(false);
      }
    }
  );
});

app.post(`/gethotels`, (req, res) => {
  const hotel_location = req.body.location;
  db.query(
    "SELECT * FROM hotels WHERE location=?",
    [hotel_location],
    (err, hotels) => {
      if (hotels.length >= 1) {
        return res.status(200).send(hotels);
      } else {
        return res
          .status(404)
          .send({ message: "Oops! Do not find the hotels in this location." });
      }
    }
  );
});

app.post("/booking", (req, res) => {
  db.query(
    "INSERT INTO booking (hotel_id,user_id,arrival_location,departure_location,arrival_date,departure_date) VALUES (?,?,?,?,?,?)",
    [
      req.body.hotel_id,
      req.body.user_id,
      req.body.arrival_location,
      req.body.departure_location,
      req.body.arrival_date,
      req.body.departure_date,
    ],
    (err, booking) => {
      if (err) {
        console.log(err);
        return res.status(400);
      } else {
        return res.status(200).send(true);
      }
    }
  );
});

app.post(`/getBookings`, (req, res) => {
  const user_id = req.body.user_id;
  db.query(
    "select * from booking join hotels on booking.hotel_id=hotels.hotel_id where user_id=?",
    [user_id],
    (err, bookings) => {
      if (bookings.length >= 1) {
        return res.status(200).send(bookings);
      } else {
        return res.status(404).send({
          message: "Oops! it looks like you havent made any bookings.",
        });
      }
    }
  );
});
app.post("/deleteBooking", (req, res) => {
  db.query(
    "delete from booking where booking_id=?",
    [req.body.booking_id],
    (err, booking) => {
      if (err) {
        console.log(err);
        return res.status(400);
      } else {
        return res.status(200).send(true);
      }
    }
  );
});

//Listener
app.listen(port, function () {
  console.log(`listening on localHost: ${port}`);
});
