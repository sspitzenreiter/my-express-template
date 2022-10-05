const {v4} =require('uuid')
const multer = require('multer');
const mime = require('mime-types');
var fs = require('fs');

var storage = multer.diskStorage({
    destination:function(req, file, cb){
        var dir = (process.env.UPLOAD_LOCATION || "./public/files/attachment")+"/"+req.upload_folder;
        if (!fs.existsSync(dir)){
            fs.promises.mkdir(dir, { recursive: true })
        }
        cb(null, dir)
    },
    filename: function(req, file, cb){
        var dir = (process.env.UPLOAD_LOCATION || "./public/files/attachment")+"/"+req.upload_folder;
        if (!fs.existsSync(dir)){
            fs.promises.mkdir(dir, { recursive: true })
        }
        if(req.fileMimeValidators!==undefined && !req.fileMimeValidators.includes(mime.extension(file.mimetype))){
            var error = new Error("File Type Allowed : "+JSON.stringify(req.fileMimeValidators))
            error.status = 422;
            return cb(error);
        }
        // req.body.attachment=nama_file+" - "+Date.now()+"."+mime.extension(file.mimetype);
        var nama_file = v4()
        var filename = req.upload_folder+"_"+nama_file+"_"+Date.now()+"."+mime.extension(file.mimetype);
        if(req.isMulti){
            if(req.body[req.file_param]===undefined){
                req.body[req.file_param] = [];
            }
            if(req.require_oldname){
                req.body[req.file_param].push(JSON.stringify({"name":filename,"mimetype":file.mimetype,"oldname":file.originalname, "type":"file"}));
            }else{
                req.body[req.file_param].push(JSON.stringify({"name":filename,"mimetype":file.mimetype, "type":"file"}));
            }
            
        }else{
            req.body[req.file_param] = JSON.stringify({"name":filename,"mimetype":file.mimetype, "type":"file"});
        }
        
        cb(null, filename);
    }
})

var upload = multer({storage:storage})

exports.uploadFile=(req, res, next)=>{
    
    var file_upload = upload.single(req.file_param);
    if(req.isMulti){
        file_upload = upload.array(req.file_param);
    }
    
    file_upload(req, res, (err)=>{
        if(err instanceof multer.MulterError){
            err.message = "Upload Error:Multer";
            next(err)
        }else if(err){
            if(err.status===undefined){
                err.message = "Upload Error";
            }
            next(err)
        }else{
            next();
        }
    })
}

