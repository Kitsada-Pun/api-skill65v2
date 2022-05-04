var express = require('express')
var app = express()
var multer  = require('multer')
var upload = multer()
app.post('/profile', upload.array('photos'), function (req, res, next) {
   
})