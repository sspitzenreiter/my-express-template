var fs = require('fs');
exports.generateIndexes=(sequelize, migration_directory, indexes_list=[])=>{
    var queryInterface = sequelize.getQueryInterface();
    return new Promise(async (resolve, reject)=>{
        var schema = [];
        var indexes_sql = "";
    
        await queryInterface.showAllSchemas().then(x=>{
            schema = x;
            schema.push("public")
        })
        if(indexes_list.length>0){
            indexes_sql = "and indexname in ('"+indexes_list.join("','")+"')";
        }
        await sequelize.query("select * from pg_indexes where schemaname in ('"+schema.join("','")+"') "+indexes_sql).then((tables)=>{
            if(tables[0].length>0){
                tables[0].map(x=>{
                    var query = `
'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.query('`+x.indexdef+`');
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.query('ALTER TABLE `+x.schemaname+`.`+x.tablename+` DROP CONSTRAINT `+x.indexname+`');
    }
};
`; 
                    try{
                        fs.writeFileSync(migration_directory+"/03-index-"+x.schemaname+"."+x.indexname+".js",query);
                    }catch(err){
                        reject(err);
                    }
                    
                })

            }
        })
       
        
        resolve();
        
    })
}