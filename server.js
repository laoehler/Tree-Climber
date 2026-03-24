const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "oehler", 
  database: "fal26"
});

app.get("/courses", (req, res) => {
    db.query(`
    SELECT 
        c.crn,
        c.course_code,
        c.course_title,
        m.weekdays,
        m.class_time,
        m.room
    FROM course c
    JOIN meeting m ON c.crn = m.crn
    `, (err, results) => {
    if (err) {
      res.status(500).send("error");
      return;
    }
    const coursesMap = {};

    results.forEach(row => {
    if (!coursesMap[row.crn]) {
        coursesMap[row.crn] = {
        crn: row.crn,
        courseSection: row.course_code,
        title: row.course_title,
        meetings: []
        };
    }

    coursesMap[row.crn].meetings.push({
        days: row.weekdays,
        time: row.class_time,
        room: row.room
    });
    });

    const formatted = Object.values(coursesMap);

    res.json(formatted);
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});