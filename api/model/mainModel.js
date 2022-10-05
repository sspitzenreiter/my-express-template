const {Op, Model, DataTypes, Sequelize} = require('sequelize');
const sequelize = require('./models');

class mainModel {
    constructor(model_name=""){
        this.models = sequelize[model_name];
    }

    get(where={}, attr=this.models.rawAttributes){
        return this.models.findOne({
            where:where,
            attributes:attr
        },{
            sequelize
        })
    }

    getAll(where={}, opts={}){
        if(opts['attributes']===undefined){
            opts['attributes'] = this.models.rawAttributes
        }
        if(opts['limit']===undefined){
            opts['limit'] = 100;
        }
        if(opts['offset']===undefined){
            opts['offset'] = 0;
        }
        if(opts['where'] !== undefined){
            opts['where'] = opts['where']['data'];
        }else{
            opts['where'] = where;
        }
        
        if(opts['limit']>0){
            opts['limit'] = opts['limit'];
        }
        if(opts['offset']<0){
            opts['offset'] = 0;
        }else{
            opts['offset'] = opts['offset'];
        }
        return this.models.findAll(opts,{
            sequelize
        })
    }

    post(data){
        return this.models.create(data,{
            fields:Object.keys(data)
        })
    }

    bulkPost(data){
        return this.models.bulkCreate(data)
    }

    patch(data, where){
        return this.models.update(data, {
            where:where,
            //fields:Object.keys(data)
        })
    }

    delete(where){
        return this.models.destroy({
            where:where
        })
    }
}

module.exports = mainModel;