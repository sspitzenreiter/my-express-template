var fs = require('fs');
exports.generateSequence=(sequelize, migration_directory, sequence_list=[])=>{
    var queryInterface = sequelize.getQueryInterface();
    return new Promise((resolve, reject)=>{
        sequelize.query("SELECT * FROM information_schema.sequences ORDER BY sequence_name").then((data)=>{
            data[0].map(x=>{
                if(sequence_list==[] || sequence_list.includes(x.sequence_schema+"."+x.sequence_name)){
                    try{
                        var query = `
'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.query('create sequence `+x.sequence_schema+"."+x.sequence_name+` start 1');
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.query('drop sequence `+x.sequence_schema+"."+x.sequence_name+`');
    }
};
`;                
                        fs.writeFileSync(migration_directory+"/01-sequence-"+x.sequence_schema+"."+x.sequence_name+".js",query);
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