var SequelizeAuto = require('sequelize-auto');
var target = ['HOST','DIALECT','USER','PASS','DB','PORT'];
var config = {};
// var config = {
//   DB:'SyncDapo2020',
//   DIALECT:'postgres',
//   USER:'postgre',
//   HOST:'180.178.111.188',
//   PASS:'Tikomdikdb2020',
//   PORT:'5432'
// };
target.map(x=>{
  config[x]=(typeof process.env[x]!=='undefined'?process.env[x]:null)
});
var auto = new SequelizeAuto(config.DB, config.USER, config.PASS, {
    host: config.HOST,
    dialect: config.DIALECT,
    port: config.PORT,
    additional: {
        timestamps: false
    },
    tables:[
      "public.user"
    ]
});
const { exec } = require('child_process');
var fs = require('fs');
auto.run().then(data=>{
  var schema_list = [];
  var extras = {};
  console.log(auto.options.tables)
  Object.keys(data.tables).map(x=>{
    var args = []
    var input = Object.keys(data.tables[x]).map(y=>{
      return data.tables[x][y];
    })
var table_schema = x.split(".");
schema_list.indexOf(table_schema[0]) === -1 ? schema_list.push(table_schema[0]) : console.log("Schema exists in array")
text=`'use strict';
const table = { schema: '`+table_schema[0]+`', tableName: '`+table_schema[1]+`' }
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(table, {`+Object.keys(data.tables[x]).map(y=>{
      console.log(data.tables[x][y])
      var argu = [];
      Object.keys(data.tables[x][y]).map(z=>{
        if(z=="type"){
          if(data.tables[x][y][z].search("TIMESTAMP WITHOUT TIME ZONE")>-1){
            data.tables[x][y][z] = "DATE";
          }
          if(data.tables[x][y][z].search("CHARACTER VARYING")>-1){
            data.tables[x][y][z] = data.tables[x][y][z].replace(/CHARACTER VARYING/g,"STRING")
          }
          if(data.tables[x][y][z].search("CHARACTER")>-1){
            data.tables[x][y][z] = data.tables[x][y][z].replace(/CHARACTER/g,"CHAR")
          }
          if(data.tables[x][y][z].search("NUMERIC")>-1){
            data.tables[x][y][z] = "INTEGER"
          }
          
          argu.push("type: Sequelize."+data.tables[x][y][z]);
        }
        if(z=="primaryKey"){
          if(data.tables[x][y][z]=="true"){
            argu.push("primaryKey: "+data.tables[x][y][z]);
          }
          
        }
        if(z=="allowNull"){
          argu.push("allowNull: "+data.tables[x][y][z]);
        }
        console.log(z+":"+data.tables[x][y][z])
      })
      return y+":{\n"+argu.join(",\n")+"}"
    }).join(",\n")+`
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable(table);
  }
};`;
  fs.writeFileSync('./migrations/'+x+".js", text)
  })
  extras['schema_list'] = schema_list;
  fs.writeFileSync('./migration_extras.json', JSON.stringify(extras));
}).catch(err=>{
  if (err) throw err;
});



