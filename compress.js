var fs = require('fs');
var brotli = require('brotli');
var data = brotli.compress(fs.readFileSync('src/uni_modules/zj-opencv/static/h5/opencv.wasm'));
fs.writeFileSync('src/uni_modules/zj-opencv/static/mp-weixin/opencv.wasm.br', data);
