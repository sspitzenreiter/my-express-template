module.exports = class MainRouter {

    getAll(req, res, next){
        var limit = req.query.limit || 100;
        var offset = req.query.offset || 0;
        var opts = {
            "limit":limit,
            "offset":offset
        }
        if(req.data_opt_extras!==undefined){
            if(req.data_opt_extras.table_data_attributes!==undefined){
                opts['attributes'] = req.data_opt_extras.table_data_attributes;
                
            }
            if(req.data_opt_extras.table_data_order!==undefined){
                opts['order'] = req.data_opt_extras.table_data_order;
                
            }
    
            if(req.data_opt_extras.table_data_override_where!==undefined){
                opts['where'] = req.data_opt_extras.table_data_override_where
                
            }
        }
        
        
        req.routemodel.getAll(req.filtered['query'], opts).then(x=>{
            if(req.isNext==true){
                req.isNext = false;
                req.returnData = x;
                next();
            }else{
                if(res.result_modifier!==undefined){
                    res.send({
                        message:"Data sent successfully",
                        total_data:x.length,
                        data:JSON.parse(JSON.stringify(x)).map(y=>{
                            res.result_modifier.map(z=>{
                                if(Object.keys(y).includes(z.keyword)){
                                    switch(z.type){
                                        case "json":
                                            y[z.keyword] = JSON.parse(y[z.keyword])
                                        break;
                                    }
                                }
                            });
                            return y;
                        })
                    });
                }else{
                    res.send({
                        message:"Data sent successfully",
                        total_data:x.length,
                        data:x
                    });
                }
            }
             
        }).catch(err=>{
            if(req.catchError==true){
                req.returnError = err;
                next();
            }else{
                next(err);
            }
            
        })
    }

    getOne(req, res, next){
        req.routemodel.get(req.filtered['params']).then(x=>{
            if(req.isNext==true){
                req.isNext = false;
                req.returnData = x;
                next();
            }else{
                res.send({
                    message:"Data sent successfully",
                    data:x
                });
            }
        }).catch(err=>{
            if(req.catchError==true){
                req.returnError = err;
                next();
            }else{
                next(err);
            }
        })
    }

    post(req, res, next){
        req.routemodel.post(req.filtered['body']).then(x=>{
            if(req.isNext==true){
                req.isNext = false;
                req.returnData = x;
                next();
            }else{
                res.send({
                    message:"Input successful",  // {message:x.nama_barang + ' has been added with Id : ' + x.id_barang}
                    data:x
                });
            }
        }).catch(err=>{
            if(req.catchError==true){
                req.returnError = err;
                next();
            }else{
                next(err);
            }
        })
    }

    postMany(req, res, next){
        req.routemodel.bulkPost(req.filtered['body']).then(x=>{
            if(req.isNext==true){
                req.isNext = false;
                req.returnData = x;
                next();
            }else{
                res.send({
                    message:"Input successful",
                    data:x  // {message:x.nama_barang + ' has been added with Id : ' + x.id_barang}
                });
            }
        }).catch(err=>{
            if(req.catchError==true){
                req.returnError = err;
                next();
            }else{
                next(err);
            }
        })
    }

    patch(req, res, next){
        
        req.routemodel.patch(req.filtered['body'],req.filtered['params']).then(x=>{
            if(x[0]>0){
                if(req.isNext==true){
                    req.isNext = false;
                    next();
                }else{
                    res.send({
                        message: "Berhasil ubah input"
                    });
                }
            }else{
                res.status(406).send({
                    message:"Tidak ada data yang diubah, silahkan cek lagi data"
                })
            }
        }).catch(err=>{
            
            if(req.catchError==true){
                req.returnError = err;
                next();
            }else{
                next(err);
            }
        })
    }

    delete(req, res, next){
        req.routemodel.delete(req.filtered['params']).then(x=>{
            if(req.isNext==true){
                req.isNext = false;
                next();
            }else{
                res.send({message:'Data Successfully deleted'}); 
            }
        }).catch(err=>{
            if(req.catchError==true){
                req.returnError = err;
                next();
            }else{
                next(err);
            }
        })
    }
}