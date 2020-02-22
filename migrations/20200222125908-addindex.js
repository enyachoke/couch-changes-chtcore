'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addIndex('changes', ['_id']),
      queryInterface.addIndex('changes', ['change_key']),
      queryInterface.addIndex('changes', ['seq_id'])])
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
   return Promise.all([queryInterface.removeIndex('change', ['_id']),
    queryInterface.removeIndex('changes', ['change_key']),
    queryInterface.removeIndex('changes', ['seq_id'])]);
  }
};
