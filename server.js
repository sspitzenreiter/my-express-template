const http = require('http');
const cluster = require('cluster');
const cpu = require('os').cpus().length;
const app = require('./app');

//Clustering process
if(process.env.MODE=="build"){
    const server = http.createServer(app);
    server.listen(process.env.PORT || 3000);
    process.exit(0);
}else if(process.env.NODE_ENV!="production"){
    const server = http.createServer(app);
    console.log('Server is '+'\u001b[' + 32 + 'm' + 'running' + '\u001b[0m'+' on port '+'\u001b[' + 1 + 'm' + process.env.PORT + '\u001b[0m');
    server.listen(process.env.PORT || 3000);
}else{
    if (cluster.isMaster) {
        console.log('Master running process on pid: ' + process.pid);
        for (let i = 0; i < cpu; i++) {
            cluster.fork();
        }
    } else {
        //TesD
        const port = process.env.PORT || 54188;
        const server = http.createServer(app);
        console.log('Worker running process on pid: ' + process.pid);
        server.listen(port);
    }
}
