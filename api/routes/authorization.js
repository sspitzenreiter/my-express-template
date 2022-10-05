const axios = require('axios');
const {mainModel, authModel} = require('../common/models');
const model = new mainModel("user");
const jwt = require('jsonwebtoken');
// const authmodel = new authModel();
exports.get_token_content = (req, res, next) =>{
    console.log(req.token)
    jwt.verify(req.token, process.env.TOKEN_KEY, function(err, decoded) {
        if(err){
            next(err);
        }
        req.decoded_data = decoded;
        
        next();
    });
}



exports.validate_user = (req, res, next) =>{
    
    // req.instansi_id = data['instansi_id'];
    if(req.headers['x-access-user']!==undefined){
        // axios.post(process.env.AUTH_URL,{
        //     "token":req.headers['x-access-user']
        // }, {
        //     headers:{
        //         "api-key":process.env.API_KEY
        //     }
        // }).then(x=>{
        //     console.log(x.data);
        //     req.auth_data = x.data;
        //     req.auth_data.role = x.data['level']+"";
        //     req.token = x.data.accessToken;
        //     next();
        // }).catch(err=>{
        //     next(err);
        // })
        var data = JSON.parse(req.headers['x-access-user']);
        req.auth_data = data;
        req.auth_data.role = data['level']+"";
        // req.token = data.accessToken;
        next();
    }else{
        res.status(422).send({
            message:"Token tidak tersedia"
        })
    }
}
