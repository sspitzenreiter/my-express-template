//lib that loaded
const express = require('express');
const logging = require('morgan');
const fs = require('fs');
//const bodyParser = require('body-parser');
//express as a function
const app = express();
const path_main = require('path');
const winston = require('winston');
const cors = require('cors');
/**folder routing
 * Add folder route here
 */
const routerIndex = require('./api/routes');

/**DB Connection
 * line for DB con
 */
//MongoDB
// const dbpath = '//localhost/fatikom';
// mongoose.connect('mongodb:' + dbpath, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// });
//SQL Base

//Redis

/**Log system
 * log will sending to the file,
 * so admin can access directly to the file
 * temporary hardcoded for folder 
 */
const path = path_main.join(__dirname, "api/logapi");
const fileName = '/access.log';
try {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
} catch (err) {
    console.error(err);
}
var writeFile = fs.createWriteStream(path + fileName, { flags: 'a' });
app.use(logging('combined', { stream: writeFile }));

const logger = winston.createLogger({
    format:winston.format.json(),
    transports:[
        new winston.transports.File({filename:path+"/error.log", level:"error"}),
        new winston.transports.File({filename:path+"/info.log", level:"info"}),
    ]
})
//Body-Parser using for catching body parser (just in case needed)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//express-fileupload using for file upload
// app.use(fileupload({ useTempFiles: true, tempFileDir: './tmp/', createParentPath: true }));

/**CORS Avoidance.
 * Asterisk symbol(*) on Access-Control-Allow-Origin
 * should be replaced with url for security issue.
 * Only GET, POST, PATCH, DELETE method for now,
 * can add with PUT or others for further.
 */
app.use((req, res, next) => {
    
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if (req.method === 'OPTIONS') {
        res.header(
            'Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE'
        );
        return res.status(200).json({});
    }
    next();
});

/**route which should handle
 * Add route in here
 */


if(process.env.NODE_ENV=="development"){
    const swaggerJSDoc = require('swagger-jsdoc');
    const swaggerUi = require('swagger-ui-express');
    console.log("API Docs running");
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(require('./documentation')));
    // const swaggerUi = require('swagger-ui-express');
    // swaggerDocument = require('./swagger.yaml');
    // app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.use('/', routerIndex);
app.use('/attachment',express.static(path_main.join(__dirname, "public/files/attachment")))
// app.use('/attachment/materi',express.static(path_main.join(__dirname, "public/files/attachment/materi/")))

//Handling incorrect url & db con error
app.use((req, res, next) => {
    var error = new Error('Not Found');
    error.status = 404;
    next(error);
});
app.use((error, req, res, next) => {
    console.log("Error");
    console.log(error)
    logger.error(error)
    res.status(error.status || 500);
    res.json({
        message: error.message
    });
});

//module export
module.exports = app;
