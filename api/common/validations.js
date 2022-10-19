const e = require('express');
const {validationResult, query, body, param} = require('express-validator');
const req = require('express/lib/request');
const { off } = require('../routes');
const {mainModel} = require('./models');
exports.filterData=(keys, data)=>{
    return Object.keys(data)
    .filter(key => keys.includes(key))
    .reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
    },{});
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function fetchRequireData(data, req={}){
    return new Promise(async (resolve, reject)=>{
        var returnData = [];
        await data.map(async x=>{
            var data = {};
            if(x.source=="database"){
                var model = new mainModel(x.table);
                var search = {}
                await fetchRequireData(x.search_data, req).then(fetchedData=>{
                    fetchedData.map(x=>{
                        search[Object.keys(x)[0]] = x[Object.keys(x)[0]];
                    });
                })
                
                await model.get(search).then(x=>{
                    
                    data = {[x.keyword]:JSON.parse(JSON.stringify(x))[x.keyword]}
                }).catch(err=>{
                    reject(err);
                })
            }else if(x.source=="middleware_variable"){
                data = {[x.keyword]:req[x.variable][x.keyword]}
            }else if(x.source=="input_manual"){
                data = {[x.keyword]:x.value}
            }
            if(x.alias!==undefined){
                data[x.alias] = data[x.keyword];
                delete data[x.keyword];
            }
            returnData.push([data,x]);
        })  
        resolve(returnData)
    })
}

exports.limitation_validate = () =>{
    return [
        query('limit', 'content cannot be empty').optional().notEmpty().isNumeric(),
        query('offset', 'content cannot be empty').optional().notEmpty().isNumeric()
    ]
}
var validator_template = (req, opt) =>{
    var ret_type = opt.method;
    if(opt.requirements!==undefined){
        switch(opt.requirements){
            case "optional_notempty":
                
                if(req.forceValidationRequired!==undefined && req.forceValidationRequired){
                    ret_type = ret_type.exists();    
                }else{
                    ret_type = ret_type.optional();
                }
                ret_type = ret_type.notEmpty().withMessage("Tidak boleh kosong");
            break;
            case "exists_notempty":
                ret_type = ret_type.exists().withMessage("Harus ada").notEmpty().withMessage("Tidak Boleh Kosong")
            break;
            
        }
    }
   
    if(opt.type!==undefined){
        switch(opt.type){
            case "uuid":
                ret_type = ret_type.isUUID().withMessage("Harus UUID");
            break;
            case "string":
                ret_type = ret_type.isString().withMessage("Harus Teks");
            break;
            case "numeric":
                ret_type = ret_type.isNumeric().withMessage("Harus angka");
            break;
            case "json":
                ret_type = ret_type.isObject().withMessage("Harus json");
            break;
            case "array":
                ret_type = ret_type.isArray().withMessage("Harus array");
            break;
            case "file":
                if(req.isMulti){
                    ret_type = ret_type.isArray().withMessage("Harus array");
                }else{
                    ret_type = ret_type.isObject().withMessage("Harus JSON");
                }
            break;
        }
    }
    if(opt.req_length!==undefined){
        if(opt.req_length.min!==undefined || opt.req_length.max!==undefined){
            var len = {};
            var text_message = [];
            ['min','max'].map(x=>{
                len[x] = opt.req_length[x];
                text_message.push(x+": "+len[x]);
            })
            if(Object.keys(len).length>0){
                
                ret_type = ret_type.isLength(opt.req_length).withMessage("Panjang teks "+text_message.join(","));
            }
        }
    }
    if(opt.accepted_value!==undefined){
        if(Array.isArray(opt.accepted_value)){
            ret_type = ret_type.custom(value=>opt.accepted_value.includes(value)).withMessage("Hanya menerima data : "+opt.accepted_value.join(","))
        }
    }
    return ret_type;
};

exports.validator_template = validator_template;
exports.fetchValidators = (req, res, next)=>{
    req.fetchValidator = req.validator.route_data.find(x=>x.routes==req.route.path && x.method==req.method.toString().toLowerCase());
    next();
}
exports.verify = async (req, res, next) =>{
    req.filtered = {
        "query":{
            
        },
        "body":{
            
        },
        "params":{
            
        }
    };
    res.value_modifier = {};
    var validators = req.validator.route_data.find(x=>req.mainPath+(x.routes=="/"?"":x.routes)==(req.useOriginalUrl?req.originalUrl:req.route.path) && x.method.replace("_one","")==req.method.toString().toLowerCase());
    console.log(req.mainPath,req.validator.route_data.find(x=>req.mainPath==(req.useOriginalUrl?req.originalUrl:req.route.path)));
    if(validators.roles!==undefined){
        if(req.auth_data!==undefined){
            if(!validators.roles.includes(req.auth_data.role)){
                res.status(401).send({
                    message:"Akses Tidak Diperbolehkan"
                })
                return    
            }
        }else{
            res.status(401).send({
                message:"Akses Tidak Diperbolehkan"
            })
            return
        }        
    }
    if(req.required_data!==undefined){
        if(req.method.toString().toLowerCase()=="get"){
            req.filtered['query'] = {
                ...req.required_data,
                ...req.filtered['query']
            }
        }else{
            req.filtered['body'] = {
                ...req.required_data,
                ...req.filtered['body']
            }
        }
    }
    req.data_opt_extras = {}
    var opt_extras_keys = ['table_data_attributes','table_data_order','table_data_override_where'];
    opt_extras_keys.map(x=>{
        if(validators[x]!==undefined){
            if(validators[x].length>1){
                req.data_opt_extras[x] = validators[x];
            }else{
                req.data_opt_extras[x] = validators[x];
            }
            
        }
        
    })
    
    var value_validator = validators.values;
    if(!Array.isArray(value_validator) && isJson(JSON.stringify(value_validator))){
        if(req.auth_data!==undefined){
            if(Object.keys(value_validator).includes(""+req.auth_data.role)){
                value_validator = value_validator[""+req.auth_data.role];
            }else if(Object.keys(value_validator).includes("any")){
                value_validator = value_validator["any"];
            }else{
                value_validator = [];
            }
        }else{
            if(Object.keys(value_validator).includes("any")){
                value_validator = value_validator["any"];
            }
        }
        
    }
    if(validators.bulk!==undefined && validators.bulk){
        req.filtered['body'] = req['body'][validators.main_array_data]
    }
    var valid = value_validator.map(x=>{
        var method = null
        if(validators.bulk===undefined){
            //Insert data
            if(req[x.method][x.keyword]!==undefined){
                switch(x.type){
                    case "json":
                        
                        req.filtered[x.method][x.keyword] = JSON.stringify(req[x.method][x.keyword])
                    break;
                    case "file":
                        
                        req.filtered[x.method][x.keyword] = JSON.stringify(req[x.method][x.keyword])
                    break;
                    default:req.filtered[x.method][x.keyword] = req[x.method][x.keyword]
                }
                
            }
        }
        
        
        // req.filtered[x.method][x.keyword] = req[x.method][x.keyword]
        switch(x.method){
            case "query":
                method = query(x.keyword);
            break;
            case "body":
                method = body(x.keyword);
            break;
            case "params":
                method = param(x.keyword);
            break;
        }
        var opt = {
            method: method,
            requirements: x.requirements,
            type: x.type,
            req_length: x.req_length,
            accepted_value: x.accepted_value
        }
        return validator_template(req,opt,x.type).run(req);
    });
    
        var database_check = [];
        if(validators.required_data!==undefined){
            await fetchRequireData(validators.required_data, req).then(x=>{
                x.map(y=>{
                    if(y[1].assigned_to!==undefined){
                        req.filtered[y[1].assigned_to] = {
                            ...req.filtered[y[1].assigned_to],
                            ...y[0]
                        }
                    }else{
                        if(req.method=="GET"){
                            req.filtered['query'] = {
                                ...req.filtered['query'],
                                ...y[0]
                            }    
                        }else{
                            x.map(y=>{
                                req.filtered['body'] = {
                                    ...req.filtered['body'],
                                    ...y[0]
                                }    
                            })
                        }
                    }
                    
                })
            }).catch(err=>{
                console.log(err);
                res.status(500).send({
                    message:"Validation Error"
                })
            })
        }
    
    if(validators.result!==undefined){
        res.result_modifier = validators.result;
    }
    await Promise.all(valid);
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(422).json({
                errors:errors.array()
            })
            return;
        }else{
            return next();
        }
    }catch(err){
      return next(err);
    }
}

exports.referensi_input_verification = async (req, res, next)=>{
    if(req.referensi_input!==undefined){
        var konten = req.referensi_input.konten;
        var rincian_asset = req.referensi_input.rincian_asset;
    }
    next();
}