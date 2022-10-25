var fs = require('fs');
exports.generateSchema=(sequelize, migration_directory, schema_list=[])=>{
    var queryInterface = sequelize.getQueryInterface();
    return new Promise((resolve, reject)=>{
        queryInterface.showAllSchemas()
        .then(data=>{
            data.map(x=>{
                if(schema_list==[] || !schema_list.includes(x)){

                
                    try{
                        var query = `
'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.query('create schema if not exists `+x+`');
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.query('drop schema `+x+`');
    }
};
`;         
                        fs.writeFileSync(migration_directory+"/00-schema-"+x+".js",query);
                    }catch(err){
                        reject(err);
                    }
                }
            });
            resolve();
        }).catch(err=>{
            reject(err);
        })
    })
}