'use strict';
const table = { schema: 'public', tableName: 'user' }
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(table, {username:{
type: Sequelize.STRING(100),
allowNull: false},
password:{
type: Sequelize.STRING(100),
allowNull: false}
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable(table);
  }
};