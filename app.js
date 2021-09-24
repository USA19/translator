const express = require("express");
const ejs = require("ejs");
const db = require("./util/database");
const path = require("path");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));

const port = 3000 || process.env.port;

app.get("/", (req, res) => {
  res.render("index", {
    userInput: "",
    response: "",
    errorMessage: "",
  });
});

app.post("/", async (req, res) => {
  const urdu = req.body.urdu;
  const romanUrdu = req.body.romanUrdu;
  if (!urdu && !romanUrdu) {
    // errorMessage;
    res.render("index", {
      userInput: "",
      response: "",
      errorMessage: "You must enter either of the value to be translated",
    });
  }

  if (urdu) {
    const userStatement = urdu.split(" ");
    let responseArray = [];

    db.all(`SELECT * FROM  roman_urdu`, (err, rows) => {
      userStatement.forEach((userWord, i) => {
        rows.forEach((dbWord) => {
          if (userWord === dbWord.urdu) {
            responseArray.push(dbWord.romanUrdu);
          }
        });
        if (typeof responseArray[i] === "undefined") {
          responseArray.push(userWord);
        }
      });

      res.render("index", {
        userInput: urdu,
        response: responseArray.join(" "),
        errorMessage: "",
      });
    });
  } else {
    console.log(romanUrdu);
    const userStatement = romanUrdu.split(" ");
    let responseArray = [];

    db.all(`SELECT * FROM  roman_urdu`, (err, rows) => {
      userStatement.forEach((userWord, i) => {
        rows.forEach((dbWord) => {
          if (userWord === dbWord.romanUrdu) {
            responseArray.push(dbWord.urdu);
          }
        });
        if (!responseArray[i]) {
          responseArray.push(userWord);
        }
      });

      res.render("index", {
        userInput: responseArray.join(" "), //reversed the case since userInput is urdu textbar value on front-end
        //so to use the same page reversed the case
        response: romanUrdu,
        errorMessage: "",
      });
    });
  }
});

app.post("/romanToUrdu", async (req, res) => {
  const romanUrdu = req.body.romanUrdu;

  const userStatement = romanUrdu.split(" ");
  let responseArray = [];

  db.all(`SELECT * FROM  roman_urdu`, (err, rows) => {
    userStatement.forEach((userWord, i) => {
      rows.forEach((dbWord) => {
        if (userWord === dbWord.romanUrdu) {
          responseArray.push(dbWord.urdu);
        }
      });
      if (typeof responseArray[i] === "undefined") {
        responseArray.push(userWord);
      }
    });

    res.render("index", {
      userInput: responseArray.join(" "), //reversed the case since userInput is urdu textbar value on front-end
      //so to use the same page reversed the case
      response: romanUrdu,
    });
  });
});
app.get("/dictionary", (req, res) => {
  db.all("SELECT * FROM roman_urdu", (err, rows) => {
    if (err) {
      return console.log(err.message);
    }

    res.render("dictionaryList", {
      dictionary: rows,
    });
  });
});
app.get("/addDictionary", (req, res) => {
  res.render("dictionary", {
    errorMessage: null,
  });
});
app.post("/addDictionary", (req, res) => {
  const urdu = req.body.urdu;
  const romanUrdu = req.body.romanUrdu;

  db.all(`SELECT * FROM  roman_urdu WHERE Urdu=?`, [urdu], function (err, row) {
    if (row.length === 0) {
      db.run(
        `INSERT INTO roman_urdu(Urdu,romanUrdu) VALUES(?,?)`,
        [urdu, romanUrdu],
        function (err) {
          if (err) {
            return console.log(err.message);
          }
        }
      );
      res.redirect("/addDictionary");
    } else {
      res.render("dictionary", {
        errorMessage: "This Word Is Already In The Dictionary",
      });
    }
  });
});

app.get("/delete/:id", (req, res) => {
  const id = req.params.id;

  db.run(`DELETE FROM roman_urdu WHERE id=?`, [id], function (err) {
    if (err) {
      return console.log(err.message);
    }
    res.redirect("/dictionary");
  });
});

app.listen(port);
