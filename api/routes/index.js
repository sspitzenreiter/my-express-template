const express = require('express');
const authorization = require('./authorization');
const routes = express();
const {mainModel} = require('../common/models');
var fs = require('fs');
var route_list = fs.readdirSync(__dirname);
const {verify} = require('../common/validations');
var main_router = require('./main_router');
var mainClass = new main_router();
routes.use((req, res, next)=>{
    next();
})
var not_included_routes = [];
if(process.env.NODE_ENV=="development"){
    require('./doc_gen.js').runScript();
}
route_list.filter(x=>x.search(".js")==-1).map(x=>{
    var validator = null;
    //Check if route valid
    try{
        //Get validator.json
        validator = require('./'+x+"/validator.json");
    }catch(err){
        console.error("Skipped route: "+x);
        console.error("Reason: "+err.message+"\n")
        validator = null;
    }
    if(validator != null){
        var route_list_validated = validator.route_data.map(y=>y.routes);
        var not_routes = [];
        
        //Set Default Validator
        routes.use('/'+x,(req, res, next)=>{
            req.validator = validator
            req.routemodel = new mainModel(req.validator.table || "");
            req.mainPath = "/"+x;
            next();
        })

        //Authenticate with middleware
        routes.use('/'+x,(req, res, next)=>{
            next()
        });
        
        var indexer_call_avail = false; //Custom route activation
        var indexer_call = null; //Custom Route file (index.js)

        if(validator.custom_index){
            routes.use('/'+x,require('./'+x));
        }else{
            validator.route_data.map(y=>{
                var route_string = (y.routes=="/"?"":y.routes);
                if(y.custom_route!==undefined && !indexer_call_avail){
                    indexer_call_avail = true;
                    indexer_call = require('./'+x);
                }
                routes.use('/'+x+route_string,(req, res, next)=>{
                    if(y.table!==undefined){
                        req.routemodel = new mainModel(y.table);
                    }
                    console.log(req.routemodel)
                    next();
                })
                switch(y.method){
                    case "get":
                        routes.get('/'+x+route_string,(y.custom_route!==undefined?indexer_call[y.custom_route]:[verify,mainClass.getAll]));
                    break;
                    case "get_one":
                        routes.get('/'+x+route_string,(y.custom_route!==undefined?indexer_call[y.custom_route]:[verify,mainClass.getOne]));
                    break;
                    case "post":
                        if(y.bulk){
                            routes.post('/'+x+route_string,(y.custom_route!==undefined?indexer_call[y.custom_route]:[verify,mainClass.postMany]));
                        }else{
                            routes.post('/'+x+route_string,(y.custom_route!==undefined?indexer_call[y.custom_route]:[verify,mainClass.post]));
                        }
                        
                    break;
                    case "patch":
                        routes.patch('/'+x+route_string,(y.custom_route!==undefined?indexer_call[y.custom_route]:[verify,mainClass.patch]));
                    break;
                    case "delete":
                        routes.delete('/'+x+route_string,(y.custom_route!==undefined?indexer_call[y.custom_route]:[verify,mainClass.delete]));
                    break;
                }
                
            });
        }
        
        
        
        not_included_routes.push({
            "routes":x,
            "not_included":not_routes
        })
        if(not_routes.length>0){
            console.log("Not Included", not_routes)
        }
    }
    
});
module.exports = routes;