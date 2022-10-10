var fs = require('fs');
var uuid = require('uuid');
console.log(uuid.v4())
console.log(__dirname);
var uuidexample = "40880952-60b3-41fc-8b24-c4a2afce508b";
function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
function runScript(){


fs.readdir(__dirname, (err, files) => {
    
    var changes_done = false;
    files.filter(x=>x.search(".js")==-1).forEach(file => {
        var stats_validator = null;
        var stats_docs = 0;
        try{
            var dir = __dirname+'/'+file;
            try{
                stats_validator = fs.statSync(dir+"/validator.json");
                
                
            }catch(err){
                console.log(err);
            }
            try{
                stats_docs = require(dir+"/docs.js");
                if(stats_docs!==undefined){
                    stats_docs = stats_docs.last_sync
                }else{
                    
                    stats_docs = null;
                }
            }catch(err){
                console.log(err);
            }
            console.log(dir)
            var list_validations = require(dir+"/validator.json");
            
                //Start of sync docs
            if(stats_docs != stats_validator.mtimeMs){
            changes_done = true;
            
            var text = `exports.last_sync = "`+stats_validator.mtimeMs+`";`;
        list_validations.route_data.map(x=>{
var route_values = x.values;
var route_keys = ["all"];
var route_type = "default";
console.log(route_values)
if(!Array.isArray(route_values) && isJson(JSON.stringify(route_values))){
    route_keys = Object.keys(route_values)
    route_type = "custom"
}
if(x.roles!==undefined){
    route_keys = x.roles;
}
console.log(x.routes,route_keys)
route_keys.map(y=>{
    
if(route_type!="default"){
    console.log(route_values)
    route_values = x.values[y];
}else{
    if(Array.isArray(y)){
        y = y.join(",")
    }
    
}
text += 
`
/**
 * @swagger
 * `+(x.routes=="/"?"/"+file:"/"+file+x.routes)+` | (Role `+y+`):
 *   `+(x.method=="get_one"?"get":x.method)+`:
 *     summary: `+x.routes+`
 *     description: `+x.routes+`
 *     tags:
 *        - /`+file+`
 *     parameters:`
console.log(file)
console.log(route_keys)
route_values.map(y=>{
    if(y.type=="numeric"){
        y.type = "integer"
    }
     example = "";
     if(y.example===undefined){
        switch(y.type){
            case "uuid": example = uuidexample; break;
            case "string": example = "Ini sebuah tulisan"; break;
            case "integer": example = 101; y.format = "numeric"; y.type = "string"; break;
        }
     }
     description = (y.description!==undefined?y.description:`None`);
     if(y.relation!==undefined){
        if(y.relation.route!==undefined){
            description += " (Relation: "+y.relation.route+")";
        }else{
            description += " (Relation: /"+y.relation.table+")";
        }
        if(y.relation.column!==undefined){
            description += " (Relation Key: "+y.relation.column+")";
        }
     }
     
     text+=`
 *        - name: '`+y.keyword+`'
 *          in: '`+y.method+`'
 *          description: "`+description+`"
 *          required: `+(y.requirements=="exists_notempty"?"true":"false")+`
 *          schema:
 *            type: `+y.type+`
 *            example: `+(y.example!==undefined?y.example:example)+`
 *            `+(y.format!==undefined?"format: "+y.format:"")
 })
 text+="\n*/"
        })
            
            
        })
        fs.writeFileSync(dir+'/docs.js',text);
        //End of sync docs
    }else{
        console.log("Already synced")
    }
    }catch(ex){
        console.log(ex)
    }

    });
    if(changes_done){
    try{
        var text = ``;
text+=
`
/**
 * @swagger
 *  tags:`;     
        files.filter(x=>x.search(".js")==-1).forEach(file=>{
text+=`
    *    - name: /`+file+`
    *      description: Data isi dari `+file;
        });
text+=` 
    *
*/`;
        fs.writeFileSync(__dirname+'/main_docs.js',text);
    }catch(ex){
        console.log(ex);
    }
    }else{
        console.log("No changes done, skipping sync")
    }
    
    files.filter(x=>x.search(".js")==-1).forEach(file => {
        try{
            var dir = './'+file;
            var list_validations = require(dir+"/validator.json");
            
                
        if(list_validations.run_testing!==undefined && !list_validations.run_testing){

        }else{

        
        var text = 
`
var common = require("./../common");
const request = common.request;
const expect = common.chai.expect;
const app = common.app;
const path = "/`+file+`";
`;
        list_validations.route_data.map(x=>{

if(x.method=="get"){
text+=
`
describe("Testing route `+x.routes+` `+x.method+`", function(){
    it('/ 200', ()=>{
        return new Promise((resolve, reject)=>{
            request(app).`+x.method+`(path+"?limit=5")
                .set('Content-Type','application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .end((err)=>{
                    if(err){
                        console.log(err)
                        reject(err);
                    }
                    
                    resolve();
                });
        });
    });`;
if(x.values.length>0){
    text+=`it('/ 422', ()=>{
        return new Promise((resolve, reject)=>{
            request(app).`+x.method+`(path+"?limit=5&forceValidationRequired=1")
                .set('Content-Type','application/json')
                .set('Accept', 'application/json')
                .expect(422)
                .end((err)=>{
                    if(err){
                        console.log(err)
                        reject(err);
                    }
                    
                    resolve();
                });
        });
    });
    

`
}
text+=`
})`;
}
// if(x.method=="post"){
// text+=
// `
// describe("Testing route `+x.routes+` `+x.method+`", function(){
//     it('/ 201', ()=>{
//         return new Promise((resolve, reject)=>{
//             request(app).`+x.method+`(path)
//                 .set('Content-Type','application/json')
//                 .set('Accept', 'application/json')
//                 .expect(201)
//                 .end((err)=>{
//                     if(err){
//                         reject(err);
//                     }
//                     resolve();
//                 });
//         });
//     });
//     it('/ 422', ()=>{
//         return new Promise((resolve, reject)=>{
//             request(app).`+x.method+`(path)
//                 .set('Content-Type','application/json')
//                 .set('Accept', 'application/json')
//                 .expect(422)
//                 .end((err)=>{
//                     if(err){
//                         reject(err);
//                     }
//                     resolve();
//                 });
//         });
//     });
// })
// `
// }
// if(x.method=="patch"){
// text+=
// `
// describe("Testing route `+x.routes+` `+x.method+`", function(){
//     it('/ 201', ()=>{
//         return new Promise((resolve, reject)=>{
//             request(app).`+x.method+`(path)
//                 .set('Content-Type','application/json')
//                 .set('Accept', 'application/json')
//                 .expect(201)
//                 .end((err)=>{
//                     if(err){
//                         reject(err);
//                     }
//                     resolve();
//                 });
//         });
//     });
//     it('/ 422', ()=>{
//         return new Promise((resolve, reject)=>{
//             request(app).`+x.method+`(path)
//                 .set('Content-Type','application/json')
//                 .set('Accept', 'application/json')
//                 .expect(422)
//                 .end((err)=>{
//                     if(err){
//                         reject(err);
//                     }
//                     resolve();
//                 });
//         });
//     });
// })
// `
// }
// if(x.method=="delete"){
// text+=
// `
// describe("Testing route `+x.routes+` `+x.method+`", function(){
//     it('/ 204', ()=>{
//         return new Promise((resolve, reject)=>{
//             request(app).`+x.method+`(path)
//                 .set('Content-Type','application/json')
//                 .set('Accept', 'application/json')
//                 .expect(204)
//                 .end((err)=>{
//                     if(err){
//                         reject(err);
//                     }
//                     resolve();
//                 });
//         });
//     });
//     it('/ 422', ()=>{
//         return new Promise((resolve, reject)=>{
//             request(app).`+x.method+`(path)
//                 .set('Content-Type','application/json')
//                 .set('Accept', 'application/json')
//                 .expect(422)
//                 .end((err)=>{
//                     if(err){
//                         reject(err);
//                     }
//                     resolve();
//                 });
//         });
//     });
// })
// `
// }
    text+="\n"
        })
            // fs.writeFileSync(__dirname+'/../../test/routes/'+file+'.js',text);
        }
    }catch(ex){
        console.log(ex);
    }
        
    });

});
}

exports.runScript = runScript;