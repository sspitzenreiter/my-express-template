const express = require('express');
const router = express.Router();
const {verify} = require('../common/validations');
var main_router = require('./main_router');
var mainClass = new main_router();
const authorization = require('./authorization');
const {mainModel} = require('../common/models');
var not_included_routes = [];
exports.setRouter=(locationdir,routes,x, externalPath="/")=>{
    console.log(locationdir)
    try{
        //Get validator.json
        validator = require(locationdir+'/'+x+"/validator.json");
    }catch(err){
        console.error("Skipped route: "+x);
        console.error("Reason: "+err.message+"\n")
        validator = null;
    }
    if(validator != null){
        var route_list_validated = validator.route_data.map(y=>y.routes);
        var not_routes = [];
        
        //Set Default Validator
        routes.use((externalPath=="/"?externalPath:externalPath+"/")+x,(req, res, next)=>{
            req.validator = validator
            req.routemodel = new mainModel(req.validator.table || "");
            req.mainPath = "/"+x;
            next();
        })

        //Authenticate with middleware
        routes.use((externalPath=="/"?externalPath:externalPath+"/")+x,authorization.validate_user,(req, res, next)=>{
            next()
        });
        
        var indexer_call_avail = false; //Custom route activation
        var indexer_call = null; //Custom Route file (index.js)

        if(validator.custom_index){
            routes.use((externalPath=="/"?externalPath:externalPath+"/")+x,require(locationdir+'/'+x));
        }else{
            validator.route_data.map(y=>{
                var route_string = (y.routes=="/"?"":y.routes);
                if(y.custom_route!==undefined && !indexer_call_avail){
                    indexer_call_avail = true;
                    indexer_call = require(locationdir+'/'+x);
                }
                switch(y.method){
                    case "get":
                        routes.get((externalPath=="/"?externalPath:externalPath+"/")+x+route_string,(y.custom_route!==undefined?indexer_call[y.custom_route]:[verify,mainClass.getAll]));
                    break;
                    case "get_one":
                        routes.get((externalPath=="/"?externalPath:externalPath+"/")+x+route_string,(y.custom_route!==undefined?indexer_call[y.custom_route]:[verify,mainClass.getOne]));
                    break;
                    case "post":
                        if(y.bulk){
                            routes.post((externalPath=="/"?externalPath:externalPath+"/")+x+route_string,(y.custom_route!==undefined?indexer_call[y.custom_route]:[verify,mainClass.postMany]));
                        }else{
                            routes.post((externalPath=="/"?externalPath:externalPath+"/")+x+route_string,(y.custom_route!==undefined?indexer_call[y.custom_route]:[verify,mainClass.post]));
                        }
                        
                    break;
                    case "patch":
                        routes.patch((externalPath=="/"?externalPath:externalPath+"/")+x+route_string,(y.custom_route!==undefined?indexer_call[y.custom_route]:[verify,mainClass.patch]));
                    break;
                    case "delete":
                        routes.delete((externalPath=="/"?externalPath:externalPath+"/")+x+route_string,(y.custom_route!==undefined?indexer_call[y.custom_route]:[verify,mainClass.delete]));
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
    return routes
}