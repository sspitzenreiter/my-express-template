var common = require('./common')
require('dotenv').config()
const request = common.request;
const app = common.app;
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const http = require('http')
function importTest(name, path){
    describe(name, function(){
        require(path);
    })
}

describe("Unit Test : "+new Date()/*+", "+console.log(process.env)*/, function () {
    console.log(basename)
    before(function () {
        const server = http.createServer(app);
        server.listen(process.env.PORT || 3601);
        console.log("Database URL: "+process.env.DB)
        console.log("Run in port:"+process.env.PORT)
        console.log("Init Test");
    });
    
    fs
    .readdirSync(__dirname+"/routes")
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        importTest("Routes test "+file,path.join(__dirname+"/routes/"+file));
    });
    //importTest("Routes test ",path.join(__dirname+"/routes/"+"asset.js"));
    after(function () {
        console.log("Test Completed");
    });
});
