var buffer = require('buffer');
var path = require('path');
var fs = require('fs');

exports.decodeBase64 = (base64str, filename) => {
    let buf = Buffer.from(base64str,'base64');

    fs.writeFile(path.join(__dirname,'../public/',filename), buf, function(error){
        if(error){
            console.log(error)
        }else{
            console.log('File created from base64 string!');
            return true;
        }
    });
}
