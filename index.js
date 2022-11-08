const express = require('express')
const app = express()
const port = 5000
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const config = require('./config/key');

const { User } = require("./models/User");

// application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended : true}));

app.use(bodyParser.json());
app.use(cookieParser());

const mongoose = require('mongoose')
mongoose.connect(config.mongoURI, {})
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err))

app.get('/', (req, res) => {
  res.send('Hello World! R U OK? nodemon')
})

app.post('/register',(req, res) => {
  // 회원 가입 할 때 필요한 정보들을 client에서 가져오면
  // 그것들을 DB에 넣어준다
  const user = new User(req.body)
  user.save((err, userInfo) => {
    if(err) return res.json({ success : false, err})
    return res.status(200).json({
      success : true
    })
  })
})

app.post('/api/users/login', (req, res) => {
  // 요청된 이메일을 데이터베이스에서 있는지 찾는다.
  User.findOne({ email : req.body.email }, (err, user) => {
    if(!user) {
      return res.json({
        loginSuccess : false,
        message : "제공된 이메일에 해당하는 유저가 없습니다."
      })
    }
    // 요청된 이메일이 데이터 베이스에 있으면 비밀번호가 일치하는지 확인.
    user.comparePassword(req.body.password , (err, isMatch ) => {
      if(!isMatch) {
        return ( res.json({ 
          loginSuccess : false, 
          message : "비밀번호가 틀렸습니다."
        })
      )
    }
    // 비밀번호 맞으면 토큰 생성
    user.generateToken((err, user) => {
        if(err) return res.status(400).send(err);
          //토큰 저장 - 위치? ⓐ쿠키 ⓑ로컬스토리지
          res.cookie("x_auth", user.token)
          .status(200)
          .json({ 
            loginSuccess:true,
            userId: user._id 
          })
      })
    })
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})