"use strict";

//모듈
const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



//라우팅
const home = require("./routes/home");

// MySQL 설정
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234567',
    database: 'mysql_practice',
    port: 3306 // MySQL 서버의 포트 번호
});

// 연결 테스트
connection.connect((err) => {
    if (err) {
        console.error('데이터 베이스 연결에 에러가 발생했습니다.:', err);
    } else {
        console.log('데이터 베이스에 연결됐습니다.');
    }
});


try{
    fs.readdirSync('uploads');
}catch(error){
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
}

// Multer 설정 (이미지 업로드를 위한 미들웨어)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

//앱 세팅
app.use("/", home); //미들웨어를 등록해주는 메서드

// 라우트 설정
app.post('/api/data', upload.single('image'), async (req, res) => {
    const device_id = req.body.device_id;
    const gps_latitude = req.body.gps_latitude;
    const gps_longitude = req.body.gps_longitude;
    const battery_level = req.body.battery_level;
    const motion_detected = req.body.motion_detected;
    const image_path = req.file.path;

    // 이미지 파일을 바이너리 데이터로 읽어오기
    const imageData = await fs.promises.readFile(image_path);

    // 이미지 데이터를 Photos 테이블에 저장하는 쿼리
    const queryphotos = `
        INSERT INTO photos (device_id, imageData)
        VALUES (?, ?);
    `

    // 이미지 데이터를 Photos 테이블에 저장
    connection.query(queryphotos, [device_id, imageData], (err, result) => {
        if (err) {
            console.error('Error inserting image data:', err);
            res.status(500).send({ message: 'Error inserting image data' });
        } else {
            console.log('Image data inserted successfully');
        }
    });

    const querydevice = `
        INSERT INTO device (device_id, gps_latitude, gps_longitude, battery_level, motion_detected)
        VALUES (?, ?, ?, ?, ?);
    `;

    connection.query(querydevice, [device_id, gps_latitude, gps_longitude, battery_level, motion_detected], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).send({ message: 'Error inserting data' });
        } else {
            res.status(200).send({ message: 'Data inserted successfully' });
        }
    });
});

// 라우트 설정 - 특정 기기 데이터 반환
app.get('/api/data/:device_id', (req, res) => {
    const device_id = req.params.device_id;

    const query = `
        SELECT * FROM device
        WHERE device_id = ?
        ORDER BY timestamp DESC
        LIMIT 1;
    `

    connection.query(query, [device_id], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).send({ message: 'Error fetching data' });
        } else if (results.length === 0) {
            res.status(404).send({ message: 'Device not found' });
        } else {
            res.status(200).send(results[0]);
        }
    });
});    

module.exports = app;
