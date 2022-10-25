const req = require('express/lib/request');
var fs = require('fs');
var dirlist = fs.readdirSync('./api/routes');
dirlist.filter(x=>x.search(".js")==-1).map(route=>{
var dir = __dirname+'/../routes/'+route;
var validator = require(dir+"/validator.json");
const { faker } = require('@faker-js/faker');
var text = 
`
exports.lastSync = 0;
var common = require("./../common");
var fs = require('fs')
const request = common.request;
const expect = common.chai.expect;
const app = common.app;
const { faker } = require('@faker-js/faker');
const path = "/`+route+`";
`;
    validator.route_data.map(data=>{
        // console.log(data);
        
        
text+=
`
describe("Testing route `+data.routes+` `+data.method+`", function(){`;
    var send = {};
    data.values.map(val=>{
        if(val.example_value!==undefined){
            
            if(val.example_value.source=="faker"){
                switch(val.example_value.type){
                    case "numeric":
                        if(val.req_length!==undefined){
                            if(val.req_length.min!==undefined || val.req_length.max!==undefined){
                                if(val.req_length.min == val.req_length.max){
                                    send[val.keyword] = "###faker.datatype.number("+val.req_length.min+")###";
                                }else if(val.req_length.max!==undefined){
                                    send[val.keyword] = "###faker.datatype.number("+val.req_length.max+")###";
                                }
                            }
                            
                            
                        }else if(val.example_value.range!==undefined){
                            send[val.keyword] = "###faker.datatype.number("+JSON.stringify(val.example_value.range)+")###";
                        }
                        
                    break;
                    case "name":
                        send[val.keyword] = "###faker.name.fullName()###";
                    break;
                }
            }else if(val.example_value.source=="legacy"){
                switch(val.example_value.type){
                    case "date":
                        send[val.keyword] = "###new Date().toISOString().split('T')[0]###";
                    break;
                }
            }
        }else if(val.accepted_value!==undefined){
            send[val.keyword] = '###faker.helpers.arrayElement('+JSON.stringify(val.accepted_value)+')###';
        }else{
            if(val.type=="numeric"){
                if(val.req_length!==undefined){
                    if(val.req_length.min!==undefined || val.req_length.max!==undefined){
                        if(val.req_length.min == val.req_length.max){
                            send[val.keyword] = "###faker.datatype.number("+val.req_length.min+")###";
                        }else if(val.req_length.max!==undefined){
                            send[val.keyword] = "###faker.datatype.number("+val.req_length.max+")###";
                        }
                    }
                    
                    
                }else{
                    send[val.keyword] = "###faker.datatype.string()###";
                }
                
            }
            if(val.type=="string"){
                if(val.req_length!==undefined){
                    if(val.req_length.min!==undefined || val.req_length.max!==undefined){
                        if(val.req_length.min == val.req_length.max){
                            send[val.keyword] = "###faker.datatype.string("+val.req_length.min+")###";
                        }else if(val.req_length.max!==undefined){
                            send[val.keyword] = "###faker.datatype.string("+val.req_length.max+")###";
                        }
                    }
                    
                    
                }else{
                    send[val.keyword] = "###faker.datatype.string()###";
                }
            }
        }
        
    });
    text+=`
    var send_data = `+JSON.stringify(send,null,"\t")+`
    it('/ 200', ()=>{
        return new Promise((resolve, reject)=>{
            request(app).`+(data.method=="get_one"?"get":data.method)+`(path`+(data.routes=="/"?"":'+"'+data.routes+'"')+`+"?limit=5")
                .set('Content-Type','application/json')
                .set('Accept', 'application/json')
                `+(data.method!="get"?".send(send_data)":"")+`
                .expect(200)
                .end((err, response)=>{
                    if(err){
                        console.log(response.body)
                        err.message = err.message+JSON.stringify(response.body)
                        reject(err);
                    }
                    
                    resolve();
                });
        });
    });`;
    if(data.values.find(val=>val.requirements=="exists_notempty")!=null){
    text+=`
    it('/ 422', ()=>{
        return new Promise((resolve, reject)=>{
            request(app).`+(data.method=="get_one"?"get":data.method)+`(path`+(data.routes=="/"?"":'+"'+data.routes+'"')+`+"?limit=5")
                .set('Content-Type','application/json')
                .set('Accept', 'application/json')
                .expect(422)
                .end((err, response)=>{
                    if(err){
                        console.log(response.body)
                        err.message = err.message+JSON.stringify(response.body)
                        reject(err);
                    }
                    
                    resolve();
                });
        });
    });`;
    }
text+=`});`;
    text = text
            .replaceAll('"###',"").replaceAll('###"',"").replaceAll("\\", '')
    
    })
    fs.writeFileSync('./test/routes/'+route+'.js',text)
});