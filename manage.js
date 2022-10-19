const { exec } = require('child_process');
var parse = require('pg-connection-string').parse;
var nodemon_file = null;
try{
    nodemon_file = require('./nodemon.json');
}catch(err){
    console.log("Nodemon File not exists");
}

var args = process.argv;
var fs = require('fs');
var validators = {        
    "table":"",
    "table_id":"",
    "route_data":[]
}
if(args.findIndex(x=>x=="createroute")>-1){
    var routename = args[args.findIndex(x=>x=="createroute")+1]
    if(routename!==undefined){
        try{
            fs.readFileSync("./api/routes/"+routename)
        }catch(err){
            console.log(err.errno);
            if(err.errno==-4058){
                fs.mkdirSync("./api/routes/"+routename);
                validators['table']=routename;
                validators['table_id']=routename+"_id";
                fs.writeFileSync("./api/routes/"+routename+"/validator.json",JSON.stringify(validators,null,"\t")); 
            }else{
                console.log(err);
            }

        }
        // fs.mkdirSync("./api/routes/"+routename);
    }
}else if(args.findIndex(x=>x=="generatedocs")>-1){
    require('./api/routes/doc_gen.js').runScript();
}else if(args.findIndex(x=>x=="dbmodelgenerate")>-1){
    if(nodemon_file!=null){
        var conn = parse(nodemon_file.env.DB);
        var runnable = true;
        Object.keys(conn).filter(x=>x!="password").map(x=>{
            if(conn[x]==null || conn[x]==""){
                runnable = false;
            }
        })
        
        if(runnable){
            exec("cd api/model && npx cross-env USER="+conn.user+" PASS="+conn.password+" DATABASE="+conn.database+" DIALECT=postgres HOST="+conn.host+" node sequelize-auto.js",(err, stdout)=>{
                if(err){
                    console.log(err);
                }else{
                    console.log(stdout)
                    console.log("Model Generation Success")
                }
            })
        }else{
            console.log("Invalid connection : "+nodemon_file.env.DB)
        }
    }else{
        console.log("Nodemon file not exists")
    }
    
}else if(args.findIndex(x=>x=="dbfillseeders")>-1){
    if(nodemon_file!=null){
        process.env.DB = nodemon_file.env.DB;
        var mainModel = require('./api/model/mainModel');
        var table_list = require('./api/model/migration_extras.json').table_list;
        table_list.map(x=>{
            var model = new mainModel(x.table);
            var ignore = ["created_date","last_update"]
            var sendData = {
                "data":{}
            }
            Object.keys(model.models.rawAttributes).map(y=>{
                if(!ignore.includes(y)){
                    sendData['data'][y] = "";
                }
                
            })
            
            fs.writeFileSync('./api/model/seeders/'+x.table+'.json',JSON.stringify(sendData,null,"\t"))
        })
        
        
    }else{
        console.log("Nodemon file not exists")
    }
    
}else if(args.findIndex(x=>x=="generatenodemon")>-1){
    if(nodemon_file==null){
        var default_file = {
            "env":{
                "DB":"",
                "PORT":"3000",
                "CORS_ORIGIN":"*",
                "NODE_ENV":"development"
            }
        }
        fs.writeFileSync("./nodemon.json",JSON.stringify(default_file,null,"\t"));
        console.log("Nodemon file created!")
    }else{
        console.log("Nodemon Exists");
    }
    
}else if(args.findIndex(x=>x=="help")>-1){
console.log(`
  List command: 
    - createroute : Create new route
    - generatedocs : Generate documentation
    - generatenodemon : Generate Nodemon.json file
    - dbmodelgenerate : Generate Database ORM Model
`)
}else{
console.log("Command not found, try this command");
console.log(`
  List command: 
    - createroute : Create new route
    - generatedocs : Generate documentation
    - generatenodemon : Generate Nodemon.json file
    - dbmodelgenerate : Generate Database ORM Model
`)
}