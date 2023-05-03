"use strict";

const app = require("../app");

//서버 포트 설정
const PORT = 3000;
app.set('port', PORT);

app.listen(app.get('port'), () => {
    console.log(`서버가 ${PORT}포트에서 가동됩니다.`);
});