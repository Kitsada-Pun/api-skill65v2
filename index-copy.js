const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer');
const cors = require('cors')
const jwt = require('jsonwebtoken')
const jwtCheck = require('./middleware/jwt-check')
const config = require('./config')

const app = express()
app.use(express.static('./uploads'))
app.use(bodyParser.json())
app.use(cors())
const port = 9000
const db = require('knex')({
  client: 'mysql',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'root',
    password : '',
  //  database : 'activity_62',
    database : 'member'
  }
});


// SET STORAGE
var storage = multer.diskStorage({
  destination:  (req, file, cb) => {
    cb(null, 'uploads')
  },
  filename:  (req, file, cb) => {
     let ext = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
     cb(null, 'e5-' + Date.now() + ext )
  }
})
var upload = multer({ storage: storage })
app.get('/', (req, res) => {

  console.log('root')
  res.send({
    status: 1
  })
})
app.post('/api/signin', async (req, res) => {
  console.log('signin',req.body)
  try {
    let user = await db('users')
      .where('username', req.body.username)
      .where('password', req.body.password)
      .then(rows => rows[0])

    if (!user) {
      throw new Error('Username or Password incorrect')
    }

    let data = {
      id: user.id,
      user: user.username,
    }
    let token = jwt.sign(data, config.jwt.secret, config.jwt.options)
    console.log('token=>',token)
    res.send({
      ok: 1,
      token,
    })
  } catch (e) {
    res.send({
      ok: 0,
      error: e.message,
    })
  }
})

app.get('/profile', jwtCheck, async (req, res) => {
  try {
    let user = await db('user')
      .where('id', req.token.id)
      .then(rows => rows[0])
    res.send({
      ok: 1, 
      profile: user,
    })
  } catch (e) {
    res.send({
      ok: 0,
      error: e.message,
    })
  }
})
app.post('/upload',upload.any(),(req, res) => {
  console.log('all=>', req.files)
  console.log('file[0]=>',req.files[0].filename);
  console.log('คุณสมบัติของfile:',req.files)
  console.log('lengt=>', req.files[0].originalname.length)
  console.log('lastIndex=>',req.files[0].originalname.lastIndexOf('.'))

  
  res.send({ status: true, filesname: req.files[0].filename })
})

app.get('/list',async (req, res) =>{
  console.log('list=>', req.query)
  try {
  let row = await db('user_d5')
  res.send({
    status: 1,
    datas: row
  })
  } catch (e) {
    res.send({
      status: 'error',
      msg: e.message
    })
  }
})
app.get('/list_group',async (req, res) =>{
  console.log('list=>', req.query)
  try {
 
  // let row = await db.select('users_student.firstname,users_advisor.firstname').from('advisors_groups')
  //           .innerJoin('users_student', 'advisors_groups.group_id', '=', 'users_student.group_id')
  //           .innerJoin('users_advisor', 'users_advisor.user_id', '=', 'advisors_groups.advisor_id')
  //           .where('users_student.group_id', '=', 256)
  let row = await db.raw('SELECT users_student.firstname AS f,users_student.lastname AS f2,users_advisor.firstname AS f1 FROM advisors_groups JOIN users_student ON advisors_groups.group_id = users_student.group_id JOIN users_advisor ON users_advisor.user_id = advisors_groups.advisor_id where users_student.group_id = 256')
  res.send({
    status: 1,
    datas: row[0]
  })
  } catch (e) {
    res.send({
      status: 'error',
      msg: e.message
    })
  }
})
app.get('/savecheck',  (req, res) =>{
  
  console.log('check=>', req.query)
   res.send({
     status: 1,
     datas:  req.query
   })

}),
app.get('/edit', async (req, res) =>{
  
  console.log('list_edit=>', req.query)
  let row = await db('user_d5').where({std_id: req.query.std_id})
   res.send({
     status: 1,
     row: row[0]
   })

}),
app.get('/del', async (req, res) =>{
  
  console.log('list_del=>', req.query)
  try {
    let row = await db('user_d5')
  .del()
  .where({std_id: req.query.std_id})
   res.send({
     status: 1,
     msg: "ลบข้อมูลเรียบร้อย"
   })

  } catch (e) {
    console.log('error_delete')
    console.log(e.message)
    res.send({
      status: 0,
      error: e.message,
    }) 
  }
  
}),

app.post('/save',async (req, res) => {
   console.log('data_upload=',req.body)
   try {
    let row1 = await db('user_d5').where({std_id: req.body.id})
    console.log('row1', row1[0])
    // check duplicate data
    if(row1[0]){
      console.log('no insert')
      res.send({
        status: 0,
        msg: 'มีข้อมูลผู้ใช้ในระบบแล้ว'
      })
    }
    let row = await db('user_d5').insert({
      std_id: req.body.id,
      title: req.body.title,
      dep_id: req.body.dep_id,
      teacher_id: req.body.teacher_id,
      passwd: req.body.pass,
      fname: req.body.fname,
      lname: req.body.lname,
      img: req.body.img
    })
    res.send({
      status: 1,
      msg: 'บันทึกสำเร็จ'
    })
   } catch (e) {
    console.log('error')
    console.log(e.message)
    res.send({
      status: 0,
      error: e.message,
    })
   }
   
})
app.post('/update',async (req, res) => {
  console.log('update_data=',req.body)
  try {
    let row = await db('user_d5')
    .where({std_id: req.body.std_id})
    .update({
     title: req.body.title,
     dep_id: req.body.dep_id,
     teacher_id: req.body.teacher_id,
     passwd: req.body.pass,
     fname: req.body.fname,
     lname: req.body.lname,
     img: req.body.img
   })
   res.send({
     status: 1,
     msg: 'ปรับปรุงข้อมูลสำเร็จ'
   })
  } catch (e) {
   console.log('error')
   console.log(e.message)
   res.send({
     status: 0,
     error: e.message,
   })
  }
  
})
app.get('/', (req, res) => { // http://127.0.0.1:9000   http://localhost:9000
  res.send({ 
            id:1,
            status: 1
          })
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})