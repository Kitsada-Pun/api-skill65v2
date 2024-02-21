const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const jwtCheck = require("./middleware/jwt-check");
const config = require("./config");

const app = express();
app.use(express.static("./uploads"));
app.use(bodyParser.json());
app.use(cors());
const port = 9000;
const db = require("knex")({
  client: "mysql",
  connection: {
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    //  database : 'activity_62',
    database: "member",
  },
});

// SET STORAGE
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    let ext = file.originalname.substring(
      file.originalname.lastIndexOf("."),
      file.originalname.length
    );
    cb(null, "e5-" + Date.now() + ext);
  },
});
var upload = multer({ storage: storage });
app.get("/", (req, res) => {
  console.log("root");
  res.send({
    status: 1,
  });
});
app.post("/signin_student", async (req, res) => {
  console.log("signin", req.body);
  try {
    let user = await db("userscommittee")
      .where("username", req.body.username)
      .where("password", req.body.password)
      .then((rows) => rows[0]);

    if (!user) {
      throw new Error("Username or Password incorrect");
    }

    let data = {
      id: user.id,
      user: user.username,
    };
    let token = jwt.sign(data, config.jwt.secret, config.jwt.options);
    console.log("token=>", token);
    res.send({
      ok: 1,
      token,
    });
  } catch (e) {
    res.send({
      ok: 0,
      error: e.message,
    });
  }
});
app.post("/signin", async (req, res) => {
  console.log("signin", req.body);
  try {
    let user = await db("users")
      .where("username", req.body.username)
      .where("password", req.body.password)
      .then((rows) => rows[0]);

    if (!user) {
      throw new Error("Username or Password incorrect");
    }

    let data = {
      id: user.id,
      user: user.username,
    };
    let token = jwt.sign(data, config.jwt.secret, config.jwt.options);
    console.log("token=>", token);
    res.send({
      ok: 1,
      token,
    });
  } catch (e) {
    res.send({
      ok: 0,
      error: e.message,
    });
  }
});
app.post("/add", upload.none(), async (req, res) => {
  try {
    // Assuming "user1" is the table name
    const ids = await db("users").insert({
      id_std1: req.body.id_std1,
      std_name: req.body.std_name,
      last_name: req.body.last_name,
      password: req.body.password,
      classroom: req.body.classroom,
    });

    console.log(ids, id_std1, std_name, last_name, password, classroom);

    res.send({
      ok: 1,
      ids: ids[0],
      id_std1: req.body.id_std1,
      std_name: req.body.std_name,
      last_name: req.body.last_name,
      classroom: req.body.classroom,
    });
  } catch (e) {
    console.error(e.message);
    res.send({
      ok: 0,
      error: e.message,
    });
  }
});

app.get("/profile", jwtCheck, async (req, res) => {
  try {
    let user = await db("users")
      .where("id", req.token.id)
      .then((rows) => rows[0]);
    res.send({
      ok: 1,
      profile: user,
    });
  } catch (e) {
    res.send({
      ok: 0,
      error: e.message,
    });
  }
});
app.post("/upload", upload.any(), (req, res) => {
  console.log("all=>", req.files);
  console.log("file[0]=>", req.files[0].filename);
  console.log("คุณสมบัติของfile:", req.files);
  console.log("lengt=>", req.files[0].originalname.length);
  console.log("lastIndex=>", req.files[0].originalname.lastIndexOf("."));

  res.send({ status: true, filesname: req.files[0].filename });
});

app.get("/list", async (req, res) => {
  console.log("list=>", req.query);
  groupCodes = req.query.g || null;
  try {
    let students;
    if (groupCodes) {
      students = await db("users", "list").whereIn("classroom", groupCodes);
    } else {
      students = await db("users", "list");
      console.log("list all");
    }
    const studentIds = students.map((student) => student.id_std1);
    const week = await db("week");
    const list = await db("list").whereIn("id_std1", studentIds);
    students = students.map((student) => {
      student.list = list.filter((item) => item.id_std1 == student.id_std1);
      return student
    })
    res.send({
      status: 1,
      week,
      students,
    });
    // res.send({
    //   status: 1,
    //   datas: students,
    // });
  } catch (e) {
    res.send({
      status: "error",
      msg: e.message,
    });
  }
});
app.get("/list_cmt", async (req, res) => {
  console.log("list=>", req.query);
  try {
    let row = await db("userscommittee");
    res.send({
      status: 1,
      datas: row,
    });
  } catch (e) {
    res.send({
      status: "error",
      msg: e.message,
    });
  }
});
app.get("/list_group", async (req, res) => {
  console.log("list=>", req.query);
  try {
    // let row = await db.select('users_student.firstname,users_advisor.firstname').from('advisors_groups')
    //           .innerJoin('users_student', 'advisors_groups.group_id', '=', 'users_student.group_id')
    //           .innerJoin('users_advisor', 'users_advisor.user_id', '=', 'advisors_groups.advisor_id')
    //           .where('users_student.group_id', '=', 256)
    let row = await db.raw(
      "SELECT users_student.firstname AS f,users_student.lastname AS f2,users_advisor.firstname AS f1 FROM advisors_groups JOIN users_student ON advisors_groups.group_id = users_student.group_id JOIN users_advisor ON users_advisor.user_id = advisors_groups.advisor_id where users_student.group_id = 256"
    );
    res.send({
      status: 1,
      datas: row[0],
    });
  } catch (e) {
    res.send({
      status: "error",
      msg: e.message,
    });
  }
});
app.get("/savecheck", (req, res) => {
  console.log("check=>", req.query);
  res.send({
    status: 1,
    datas: req.query,
  });
});
app.get("/edit", async (req, res) => {
  console.log("list_edit=>", req.query);
  let row = await db("user_d5").where({ std_id: req.query.std_id });
  res.send({
    status: 1,
    row: row[0],
  });
});
app.get("/del", async (req, res) => {
  console.log("list_del=>", req.query);
  try {
    let row = await db("user_d5").del().where({ std_id: req.query.std_id });
    res.send({
      status: 1,
      msg: "ลบข้อมูลเรียบร้อย",
    });
  } catch (e) {
    console.log("error_delete");
    console.log(e.message);
    res.send({
      status: 0,
      error: e.message,
    });
  }
});
app.post("/save", async (req, res) => {
  console.log("data_upload=", req.body);
  try {
    let row1 = await db("user_d5").where({ std_id: req.body.id });
    console.log("row1", row1[0]);
    // check duplicate data
    if (row1[0]) {
      console.log("no insert");
      res.send({
        status: 0,
        msg: "มีข้อมูลผู้ใช้ในระบบแล้ว",
      });
    }
    let row = await db("user_d5").insert({
      std_id: req.body.id,
      title: req.body.title,
      dep_id: req.body.dep_id,
      teacher_id: req.body.teacher_id,
      passwd: req.body.pass,
      fname: req.body.fname,
      lname: req.body.lname,
      img: req.body.img,
    });
    res.send({
      status: 1,
      msg: "บันทึกสำเร็จ",
    });
  } catch (e) {
    console.log("error");
    console.log(e.message);
    res.send({
      status: 0,
      error: e.message,
    });
  }
});
app.post("/update", async (req, res) => {
  console.log("update_data=", req.body);
  try {
    let row = await db("user_d5").where({ std_id: req.body.std_id }).update({
      title: req.body.title,
      dep_id: req.body.dep_id,
      teacher_id: req.body.teacher_id,
      passwd: req.body.pass,
      fname: req.body.fname,
      lname: req.body.lname,
      img: req.body.img,
    });
    res.send({
      status: 1,
      msg: "ปรับปรุงข้อมูลสำเร็จ",
    });
  } catch (e) {
    console.log("error");
    console.log(e.message);
    res.send({
      status: 0,
      error: e.message,
    });
  }
});
app.get("/", (req, res) => {
  // http://127.0.0.1:9000   http://localhost:9000
  res.send({
    id: 1,
    status: 1,
  });
});

app.get("/student/:studentId", async (req, res) => {
  const studentId = req.params.studentId;
  try {
    let row = await db("users").where("id_std1", studentId).first();
    console.log("row=>", row);
    res.send({
      status: 1,
      data: row,
    });
  } catch (e) {
    res.send({
      status: "error",
      msg: e.message,
    });
  }
});
app.post("/addface", async (req, res) => {
  // console.log('addface=>', req.body);
  // Assuming `id_face` is extracted from req.body or some other source
  const id_face = req.body.id_face;
  const id_std1 = req.body.id_std1;
  try {
    await db("users").where({ id_std1: id_std1 }).update({ id_face: id_face });

    // Fetch the updated row if needed
    let updatedRow = await db("users").where("id_std1", id_std1).first();
    console.log("Updated row:", updatedRow);

    res.send({
      status: 1,
      message: "id_face updated successfully",
      data: updatedRow, // You can send the updated row back if needed
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      status: 0,
      message: "Internal Server Error",
    });
  }
});
app.post("/add_event", async (req, res) => {
  console.log("update_data=", req.body);
  console.log(typeof req.body.stopDay, req.body.stopDay);
  try {
    let row2 = await db("week").where({ week: req.body.week });
    if (row2 && row2.length > 0) {
      console.log("no insert");
      return res.send({
        status: 0,
        msg: `มีข้อมูลสับดาห์ที่ ${req.body.week} ในระบบแล้ว`,
      });
    }

    row = await db("week").insert({
      week: req.body.week,
      status: req.body.stopDay ? 2 : 0,
    });

    console.log("row=>", row);
    res.send({
      status: 1,
      data: row,
    });
  } catch (e) {
    res.send({
      status: 0,
      msg: e.message,
    });
  }
});

app.get("/week", async (req, res) => {
  try {
    let row = await db("week");
    console.log("row=>", row);
    res.send({
      status: 1,
      data: row,
    });
  } catch (e) {
    res.send({
      status: 0,
      msg: e.message,
    });
  }
});

app.post("/close-week", async (req, res) => {
  const weekId = req.body.id;
  try {
    const row = await db("week").where({ id: weekId }).update({
      status: 0,
    });
    res.send({
      status: 1,
      data: row,
    });
  } catch (e) {
    res.send({
      status: 0,
      msg: e.message,
    });
  }
});

app.post("/open-week", async (req, res) => {
  const weekId = req.body.id;
  try {
    await db("week").where({ status: 1 }).update({
      status: 0,
    });
    const row = await db("week").where({ id: weekId }).update({
      status: 1,
    });
    res.send({
      status: 1,
      data: row,
    });
  } catch (e) {
    res.send({
      status: 0,
      msg: e.message,
    });
  }
});

app.post("/check-activity", async (req, res) => {
  console.log("check-activity=>", req.body);
  const id_std1 = req.body.id;
  const week = await db("week").where({ status: 1 }).first();
  if (!week) {
    return res.send({
      status: 0,
      msg: "ไม่พบสับดาห์ที่เปิดอยู่",
    });
  }
  const weekId = week.id;
  try {
    const student = await db("users").where({ id_std1: id_std1 }).first();
    if (!student) {
      return res.send({
        status: 0,
        msg: "ไม่พบข้อมูลนักศึกษา",
      });
    }
    const list = await db("list").where({ id_std1: id_std1, week_id: weekId });
    if (list && list.length > 0) {
      return res.send({
        status: 0,
        msg: `${id_std1} ${student.std_name} ${student.last_name} ได้เช็คในสับดาห์นี้แล้ว`,
      });
    }
    const id = await db("list").insert({
      id_std1: id_std1,
      week_id: weekId,
      check_from: 'face',
    });

    res.send({
      status: 1,
      id: id,
      student: student,
    });
  } catch (e) {
    res.send({
      status: 0,
      msg: e.message,
    });
  }
});

app.post("/card-check-activity", async (req, res) => {
  console.log("check-activity=>", req.body);
  res.send({
    status: 1,
  })
})

app.get("/card-check-activity", async (req, res) => {
  console.log("check-activity=>", req.body);
  res.send({
    status: 1,
  })
})
app.get("/card-check-activity/:id", async (req, res) => {
  console.log("card-check-activity=>", req.params); 
  const id_std1 = req.params.id;
  const week = await db("week").where({ status: 1 }).first();
  if (!week) {
    return res.send({
      status: 0,
      msg: "ไม่พบสับดาห์ที่เปิดอยู่",
    });
  }
  const weekId = week.id;
  try {
    const student = await db("users").where({ id_std1: id_std1 }).first();
    if (!student) {
      return res.send({
        status: 0,
        msg: "ไม่พบข้อมูลนักศึกษา",
      });
    }
    const list = await db("list").where({ id_std1: id_std1, week_id: weekId });
    if (list && list.length > 0) {
      return res.send({
        status: 0,
        msg: `${id_std1} ${student.std_name} ${student.last_name} ได้เช็คในสับดาห์นี้แล้ว`,
      });
    }
    const id = await db("list").insert({
      id_std1: id_std1,
      week_id: weekId,
      check_from: 'face',
    });

    res.send({
      status: 1,
      id: id,
      student: student,
    });
  } catch (e) {
    res.send({
      status: 0,
      msg: e.message,
    });
  }
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
