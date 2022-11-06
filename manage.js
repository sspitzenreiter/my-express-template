const { exec } = require('child_process');
const { faker } = require('@faker-js/faker');

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
function getIndexQuery(tablename, schemaname){
    return `SELECT DISTINCT
    tc.constraint_name as constraint_name,
    tc.constraint_type as constraint_type,
    tc.constraint_schema as source_schema,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN ccu.constraint_schema ELSE null END AS target_schema,
    CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN ccu.table_name ELSE null END AS target_table,
    CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN ccu.column_name ELSE null END AS target_column,
    co.column_default as extra,
    co.identity_generation as generation
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.table_schema = kcu.table_schema AND tc.table_name = kcu.table_name AND tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_schema = tc.constraint_schema AND ccu.constraint_name = tc.constraint_name
    JOIN information_schema.columns AS co
      ON co.table_schema = kcu.table_schema AND co.table_name = kcu.table_name AND co.column_name = kcu.column_name
      where tc.table_name='`+tablename+`' and tc.table_schema='`+schemaname+`'`
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
}else if(args.findIndex(x=>x=="generateoneroute")>-1){
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question("Target Route: ",function(route){
        rl.question("Path: ",function(path){
            rl.question("Method [GET,GET_ONE,POST,PUT,PATCH,DELETE]: ",function(method){
                rl.question("Follow up with table attributes [y/n]: ",function(follow_up){
                    if(nodemon_file!=null){
                        process.env.DB = nodemon_file.env.DB;
                        var {mainModel} = require('./api/common/models');
                        try{
                            var validator = require('./api/routes/'+route+"/validator.json");
                            var route_find = validator.route_data.find(x=>x.method==method.toLowerCase() && x.routes==path);
                            if(route_find!=null){
                                console.log("Route exists!")
                            }else{
                                rl.question("Table (Default: using default route): ",function(table){
                                    if(table==""){
                                        table = validator.table;
                                    }
                                    var model = new mainModel(table);
                                    var values = [];
                                    Object.keys(model.models.rawAttributes).map(x=>{
                                        var model_attr = model.models.rawAttributes[x];
                                        var attr = {
                                            "keyword":x
                                        };
                                        attr['description'] = x;
                                        if(model_attr.type=="UUID"){
                                            attr['type'] = "uuid";
                                        }else if(['INTEGER'].includes(model_attr.type)){
                                            attr['type'] = "numeric";
                                        }else{
                                            attr['type'] = "string";
                                        }
                                        if(model_attr.primaryKey){
                                            if(['PATCH','DELETE'].includes(method)){
                                                attr['method'] = "params";
                                                path = path+":"+x;
                                                attr['requirements'] = "exists_notempty";
                                            }
                                        }else{
                                            if(method=="GET"){
                                                attr['method'] = "query";
                                            }else{
                                                attr['method'] = "body";
                                            }
                                            if(!model_attr.allowNull){
                                                attr['requirements'] = "exists_notempty";
                                                if(method!="PATCH" && method!="GET" && method!="GET_ONE"){
                                                    attr['requirements'] = "exists_notempty";
                                                }else{
                                                    attr['requirements'] = "optional_notempty";
                                                }
                                            }else{
                                                attr['requirements'] = "optional_notempty";
                                                
                                            }
                                        }
                                        if(method!="DELETE" || attr['method']=="params"){
                                            values.push(attr);
                                        }
                                    })

                                    validator.route_data.push({
                                        "routes":path,
                                        "name":route+"_"+method,
                                        "method":method.toLowerCase(),
                                        "values":values
                                    })
                                    fs.writeFileSync('./api/routes/'+route+"/validator.json",JSON.stringify(validator,null,"\t"));
                                });
                            }
                        }catch(err){
                            console.log(err);
                        }
                        
                    }else{
                        console.log("No nodemon file found")
                    }
                })
            })
        })
    })
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
            exec("cd api/model && npx cross-env USER="+conn.user+" PASS="+conn.password+" DB="+conn.database+" DIALECT=postgres HOST="+conn.host+" node sequelize-auto.js",(err)=>{
                if(err){
                    console.log(err);
                }else{
                    console.log("Model Generation Success")
                }
            })
        }else{
            console.log("Invalid connection : "+nodemon_file.env.DB)
        }
    }else{
        console.log("Nodemon file not exists")
    }
    
}else if(args.findIndex(x=>x=="generatemigrations")>-1){
    if(nodemon_file!=null){
        process.env.DB = nodemon_file.env.DB;
        var table_list = nodemon_file.migration.table_list;
        var Sequelize = require('sequelize');
            
        var sequelize = new Sequelize(nodemon_file.env.DB,{
            logging: false
        });
        // var sequence = require('./migrate-auto/sequence');
        // sequence.generateSequence(sequelize, './api/model/migrations',['config.dapodik_config_id_config_seq']).then(x=>{
        //     console.log(x)
        // }).catch(err=>{
        //     console.log(err);
        // })

        var sequence = require('./api/services/migrate-auto/table');
        sequence.generateTable(sequelize, './api/model/migrations',false,table_list).then(x=>{
            console.log(x)
        }).catch(err=>{
            console.log(err);
        })
    }
}else if(args.findIndex(x=>x=="generatetesting")>-1){
    if(nodemon_file!=null){
        process.env.DB = nodemon_file.env.DB;
        var utest = require('./api/services/unit-testing');
        
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
                console.log(model.models.rawAttributes[y])
                if(!ignore.includes(y)){
                    var value = "";
                    switch(model.models.rawAttributes[y].type){
                        case "STRING":
                            
                        break;
                    }
                    
                    sendData['data'][y] = value;
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