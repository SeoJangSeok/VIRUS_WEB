const express = require('express')
const multer = require('multer')
const User = require('./models/User')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const bodyParser = require('body-parser')

const MongoClient = require('mongodb').MongoClient
const app = express()

const { ObjectId } = require('mongodb')

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const session = require('express-session')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.urlencoded({ extended: true }))

app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())
app.use('/public', express.static('public'))
app.use(express.static('public'))

app.set('view engine', 'ejs')

require('dotenv').config()

let uploadFilePath = ''
let db

const scanEngine = [
  'Bkav',
  'Lionic',
  'tehtris',
  'DrWeb',
  'ClamAV',
  'CMC',
  'CAT-QuickHeal',
  'ALYac',
  'Malwarebytes',
  'Zillya',
  'Paloalto',
  'Sangfor',
  'K7AntiVirus',
  'Alibaba',
  'K7GW',
  'CrowdStrike',
  'BitDefenderTheta',
  'VirIT',
  'Cyren',
  'SymantecMobileInsight',
  'Symantec',
  'Elastic',
  'ESET-NOD32',
  'APEX',
  'TrendMicro-HouseCall',
  'Avast',
  'Cynet',
  'Kaspersky',
  'BitDefender',
  'NANO-Antivirus',
  'SUPERAntiSpyware',
  'MicroWorld-eScan',
  'Tencent',
  'Trustlook',
  'TACHYON',
  'Sophos',
  'F-Secure',
  'Baidu',
  'TrendMicro',
  'McAfee-GW-Edition',
  'Trapmine',
  'FireEye',
  'Emsisoft',
  'SentinelOne',
  'GData',
  'Jiangmin',
  'Webroot',
  'Avira',
  'Antiy-AVL',
  'Gridinsoft',
  'Xcitium',
  'Arcabit',
  'ViRobot',
  'ZoneAlarm',
  'Avast-Mobile',
  'Microsoft',
  'Google',
  'BitDefenderFalx',
  'AhnLab-V3',
  'Acronis',
  'McAfee',
  'MAX',
  'VBA32',
  'Cylance',
  'Zoner',
  'Rising',
  'Yandex',
  'Ikarus',
  'MaxSecure',
  'Fortinet',
  'AVG',
  'Panda',
]

MongoClient.connect(process.env.MONGODB_URL, function (error, client) {
  if (error) return console.log(error)
  db = client.db('virus_scan')
  app.listen(8000, function () {
    console.log('listening on 8000')
  })
})

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
})

app.get('/login', function (req, res) {
  res.render('login.ejs')
})

app.get('/register', function (req, res) {
  res.render('register.ejs')
})

app.post('/register', async function (req, res) {
  const { 성, 이름, 아이디, 이메일, 비밀번호, 주소, 국가, 세부지역 } = req.body

  try {
    let user = await db.collection('users').findOne({ 이메일 })
    if (user) {
      return res
        .status(400)
        .json({ errors: [{ message: '이미 가입된 이메일입니다.' }] })
    }

    const hashedPassword = await bcrypt.hash(비밀번호, 10)
    user = new User({
      성,
      이름,
      아이디,
      이메일,
      비밀번호: hashedPassword,
      주소,
      국가,
      세부지역,
    })

    db.collection('users').insertOne(user)

    res.redirect('/login')
  } catch (error) {
    console.log(error)
    res.status(500).send('오류 발생')
  }
})

app.post(
  '/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/')
  }
)

passport.use(
  new LocalStrategy(
    {
      usernameField: 'inputEmail',
      passwordField: 'inputPassword',
      session: true,
      passReqToCallback: false,
    },
    function (inputEmail, inputPassword, done) {
      db.collection('users').findOne(
        { 이메일: inputEmail },
        function (err, result) {
          if (err) return done(err)
          if (!result)
            return done(null, false, { message: '가입되지 않은 이메일입니다.' })
          if (bcrypt.compareSync(inputPassword, result.비밀번호)) {
            return done(null, result)
          } else {
            return done(null, false, { message: '비밀번호가 틀렸습니다' })
          }
        }
      )
    }
  )
)

passport.serializeUser(function (user, done) {
  done(null, user.이메일)
})
passport.deserializeUser(function (email, done) {
  db.collection('users').findOne({ 이메일: email }, function (err, result) {
    done(null, result)
  })
})

// 파일 저장 디렉토리 설정
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'upload/')
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname)
  },
})

// 파일 업로드 미들웨어 생성
const upload = multer({ storage: storage })

// 파일 업로드 처리 라우터
app.post('/upload', upload.single('file'), (req, res) => {
  // single 메서드를 이용하여 하나의 파일만 업로드하도록 설정
  // 'file'은 프론트엔드에서 업로드할 때 사용한 name 속성 값입니다.

  if (!req.file) {
    res.status(400).send('파일이 업로드되지 않았습니다.')
  } else {
    const filePath = path.resolve(req.file.path)
    console.log('업로드 완료!')
    uploadFilePath = filePath
    res.redirect(`/scan`)
  }
})
//파일 삭제 처리 함수
const deleteFile = filePath =>{
  fs.unlink(filePath,(err)=>{
    if (err) {
      console.error('파일 삭제 오류', error)
    } else {
      console.log('파일삭제 완료')
    }
  }) 
}
//파이썬 프로그램 호출 및 파일 경로 전송
app.get('/scan', (req, res) => {
  const filePath = uploadFilePath
  const absFilePath = path
    .resolve(filePath)
    .replace(new RegExp(`\\${path.sep}`, 'g'), `\\\\`)
  console.log(`스캔 요청 - 파일 경로: ${absFilePath}`)
  const { spawn } = require('child_process')

  const command = 'python'
  const args = ['scanfile.py', absFilePath]
  const options = {
    cwd: __dirname, // scanfile.py 파일이 있는 디렉토리로 설정
  }

  const pythonProcess = spawn(command, args, options)

  let pythonResult = ''

  pythonProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
    pythonResult += data
  })

  pythonProcess.stdout.on('end', () => {
    console.log('Python process ended')
    deleteFile(uploadFilePath)
    // DB에서 이미 저장된 결과값인지 검색
    db.collection('scanresult').findOne({ result: pythonResult }, (error, existingResult) => {
      if (error) {
        console.error('MongoDB 조회 오류', error);
        res.status(500).send('Internal Server Error');
        return;
      }
      
      console.log('DB 확인');
      if (!existingResult) {
        // pythonResult가 이미 저장되지 않은 경우
        db.collection('scanresult').insertOne({ result: pythonResult }, (error, result) => {
          if (error) {
            console.error('MongoDB 저장 오류', error);
            res.status(500).send('Internal Server Error');
            return;
          }
          const savedId = result.insertedId;  // 삽입된 문서의 _id 값
          console.log(savedId);
          console.log('결과 저장 완료');
          res.redirect(`/result/${savedId}`);  
        });
      } else {
        // pythonResult가 이미 저장된 경우
        const findId = existingResult._id;  // 이미 저장된 문서의 _id 값
        console.log(findId);
        res.redirect(`/result/${findId}`);  
      }
    })
  })

  pythonProcess.stderr.on('data', (data) => {
    if (data.includes('에러')) {
      console.error(`stderr: ${data}`)
      res.status(500).send('Internal Server Error')
    }
  })

  pythonProcess.on('close', (code) => {
    console.log(`child process exited with code ${code}`)
  })
})

app.get('/result/:id', function (req, res) {
  const id = req.params.id
  const objectId = new ObjectId(id)
  console.log(objectId)
  db.collection('scanresult').findOne(
    { _id: objectId },
    function (err, result) {
      if (err) {
        console.error('데이터베이스 조회 오류', err)
        res.status(500).send('Internal Server Error')
        return
      }

      if (!result) {
        console.error('결과를 찾을 수 없습니다')
        res.status(404).send('Not Found')
        return
      }

      try {
        jsonResult = JSON.parse(result.result)
        console.log(jsonResult)
        res.render('result.ejs', { scanResult: jsonResult, scanEngine })
      } catch (error) {
        console.error('JSON 파싱 오류', error)
        res.status(500).send('Internal Server Error')
      }
    }
  )
})
