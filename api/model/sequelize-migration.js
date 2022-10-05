const { Error } = require('sequelize');
const { exec } = require('child_process');
var parse = require('pg-connection-string').parse;
var url = process.argv[process.argv.findIndex(x=>x=="--url")+1];
var url_parse = parse(url)
console.log(url_parse)
const pgp = require("pg-promise")({});
const db = pgp(url)
var extras = require('./migration_extras.json');
var runProm = () =>{
    new Promise((resolve, reject)=>{
        db.connect()
        .then(obj => {
            // Can check the server version here (pg-promise v10.1.0+):
            console.log("AA")
            resolve(obj)
        })
        .catch(async error => {
            if(error.code=="3D000"){
                console.log("Database unavailable, creating...")
                const db_create = pgp("postgres://"+url_parse['user']+":"+url_parse['password']+"@"+url_parse['host']+":"+url_parse['port']);
                await db_create.connect().then(async obj=>{
                    await db_create.none("CREATE DATABASE "+url_parse['database']).then(data=>{
                        console.log("Database created! Restarting process")
                        runProm();
                    }).catch(err=>{
                        reject(err);
                    })
                })
                
            }else{
                await reject(error)
            }
            
        });
    }).then(async (conn)=>{
        console.log("Creating schema..")
        var args = []
        extras.schema_list.map(x=>{
            args.push('create schema if not exists '+x);
        })
        await db.none(args.join(";")).then(y=>{
            console.log("Schema completed")
            
        }).catch(err=>{
            reject(err);
        })
        return null;
        
    }).then(x=>{
        exec('npx sequelize-cli db:migrate --url '+url, (err, stdout, stderr)=>{
            if(err) throw err;
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            pgp.end();
        })
    }).catch(err=>{
        console.error(err)
        process.exit(0)
    })
}
var runPromUndo = () =>{
    new Promise((resolve, reject)=>{
        exec('npx sequelize-cli db:migrate --url '+url, (err, stdout, stderr)=>{
            if(err) throw err;
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            resolve()
        })
        
    }).then(async (conn)=>{
        const db_create = pgp("postgres://"+url_parse['user']+":"+url_parse['password']+"@"+url_parse['host']+":"+url_parse['port']);
        await db_create.connect().then(async obj=>{
            await db_create.none("DROP DATABASE "+url_parse['database']).then(data=>{
                console.log("Database dropped! Restarting process")
            }).catch(err=>{
                throw err;
            })
        })
        
    }).catch(err=>{
        console.error(err)
        process.exit(0)
    })
}
if(process.argv.findIndex(x=>x=="--undo")>-1){
    runPromUndo();
}else{
    runProm();
}


// new Promise((resolve, reject)=>{
//     client.query('create database '+x, (err, res) => {
//         if (err) {
//           reject(err);
//         } 
//         resolve();
//     })
// }).then(()=>{
//     extras.schema_list.map(async x=>{
//         await client.query('create schema if not exists '+x, (err, res) => {
//             if (err) {
//               console.log(err.stack)
//             } else {
//               console.log(res.rows[0])
//             }
//         })
//     })
// }).catch(err=>{
//     console.error(err);
// })



