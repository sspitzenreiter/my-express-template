var fs = require('fs');
var mapping = require('./mapping.json');
var sequence = require('./sequence')
var indexes = require('./indexes')
exports.generateTable=(sequelize, migration_directory, enable_view=false, table_list=[])=>{
    var queryInterface = sequelize.getQueryInterface();
    return new Promise(async (resolve, reject)=>{
        var original_view_list = [];
        var original_table_list = [];
        var schema_list = [];
        var fetch_list = [];
        var sequence_list = [];
        var indexes_list = [];
        var migration_indicator = "02";
        var text = "";
        await queryInterface.showAllSchemas().then(x=>{
            x.push("public");
            if(table_list.length>0){
                table_list.map(y=>{
                    var cleaned_data = y.split(".");
                    if(x.includes(cleaned_data[0])){
                        schema_list.push(cleaned_data[0]);
                    }
                })
            }else{
                schema_list = x;
            }
        }).catch(err=>{
            reject(err);
        })

        await sequelize.query("select table_name, table_schema, table_type from INFORMATION_SCHEMA.tables WHERE table_schema in ('"+schema_list.join("','")+"')").then((tables)=>{
            original_view_list = tables[0].filter(x=>x.table_type=="VIEW").map(x=>x.table_schema+"."+x.table_name);
            original_table_list = tables[0].filter(x=>x.table_type=="BASE TABLE").map(x=>x.table_schema+"."+x.table_name);
        }).catch(err=>{
            reject(err);
        })
        
        if(table_list.length==0){
            table_list = [
                ...original_table_list,
            ]
            if(enable_view){
                table_list = [
                    ...table_list,
                    ...original_view_list
                ]
            }
        }

        table_list.map(x=>{
            var table = x.split(".");
            
            fetch_list.push(new Promise((resolve, reject)=>{
                
                queryInterface.describeTable(table[1],{"schema":table[0]}).then(data=>{
                    // console.log(data);
                    resolve([table[0],table[1],data])
                }).catch(err=>{ 
                    reject(err);
                })
            }));
        })

        Promise.all(fetch_list).then(async x=>{
            
            await x.map(async y=>{
                var model_desc = {};
                Object.keys(y[2]).map(z=>{
                    try{
                        var opt = {
                            allowNull: y[2][z].allowNull
                        };
                        var type = y[2][z].type.split("(")
                        var type_data = mapping.datatypes.find(typ=>typ[0]==type[0]);
                        if(type_data!=null){
                            if(type.length>1){
                                
                                opt['type'] = "DataTypes."+type_data[1]+"("+parseInt(type[1].replace("(","")).toString()+")";
                            }else{
                                opt['type'] = "DataTypes."+type_data[1];
                            }
                        }
    
                        if(y[2][z].defaultValue!=null){
                            var parsingDefaultValue = mapping.default_value.find(pars=>pars[0]==y[2][z]['defaultValue']);
                            if(parsingDefaultValue!=null){
                                opt['defaultValue'] = parsingDefaultValue[1];
                            }else if(y[2][z]['defaultValue'].indexOf("nextval")>-1){
                                var cleaned_name = y[2][z]['defaultValue'].replace("nextval(","").replace("::regclass","").replace(")","")
                                opt['defaultValue'] = "sequelize.Sequelize.literal(`nextval('"+cleaned_name+"'::regclass)`)";
                                sequence_list.push(cleaned_name)                            
                            }else{
                                opt['defaultValue'] = "$$$"+y[2][z]['defaultValue']+"$$$";
                            }
                        }
                        if(y[2][z].primaryKey){
                            opt['primaryKey'] = true;
                        }
                        model_desc[z] = opt;
                    }catch(err){
                        reject(err);
                    }
                })


                await sequelize.query("select * from pg_indexes where schemaname='"+y[0]+"' and tablename='"+y[1]+"';").then((tables)=>{
                    if(tables[0].length>0){
                        tables[0].map(ind=>{
                            indexes_list.push(ind.indexname)
                        })
                        
                    }
                })

                //Assigning primary key to view
                if(original_view_list.includes(y[0]+"."+y[1])){
                    model_desc[Object.keys(model_desc)[0]]['primaryKey'] = true;
                }
                if(original_table_list.includes(y[0]+"."+y[1])){
                    text = `
'use strict';
var sequelize = require('sequelize');
var DataTypes = sequelize.DataTypes;
const table = { schema: '`+y[0]+`', tableName: '`+y[1]+`' }
const attributes = `+JSON.stringify(model_desc,null,"\t").replace(/\"/g,"").replaceAll("$$$",'"')+`
module.exports = {
    up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(table, attributes);
    },
    down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable(table);
    }
};
`;
                    }

                    if(original_view_list.includes(y[0]+"."+y[1])){
                        await sequelize.query("select pg_get_viewdef('"+y[0]+"."+y[1]+"', true)").then((tables)=>{
                            var query_create = "create view "+y[0]+"."+y[1]+" as "+tables[0][0]['pg_get_viewdef']+"";
                            var query_delete = "drop view "+y[0]+"."+y[1];
                            text = `
'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.query(\``+query_create+`\`);
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.query(\``+query_delete+`\`);
    }
};
`;  
                        }).catch(err=>{
                            reject(err);
                        })
                        console.log(text);
                        
                    }
                    if(text!=""){
                        try{
                            fs.writeFileSync(migration_directory+'/'+migration_indicator+"-"+y[1]+"_migration.js", text)
                            
                            
                        }catch(err){
                            reject(err);
                        }
                        
                        
                        
                        
                    }

            })
            await sequence.generateSequence(sequelize, migration_directory,sequence_list).then(x=>{
                            
            }).catch(err=>{
                reject(err);
            })
            
            await indexes.generateIndexes(sequelize, migration_directory,indexes_list).then(x=>{
                            
            }).catch(err=>{
                reject(err);
            })
            resolve();
        }).catch(err=>{
            reject(err);
        })
    })
}