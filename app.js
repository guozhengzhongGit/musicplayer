const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const url = require("url");
const request = require("request");
app.use(express.static("./public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine","ejs");
//用户请求歌曲的路由
app.use('/download',function (req,res) {
    console.log(req.url);
    var url = "http://music.163.com/api/playlist/detail"+req.url;
    req.pipe(request(url)).pipe(res);
});
app.listen(8000,"127.0.0.1");
