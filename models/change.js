'use strict';
module.exports = (sequelize, DataTypes) => {
  const change = sequelize.define('change', {
    _id: DataTypes.TEXT,
    change_key: DataTypes.TEXT,
    change_value: DataTypes.JSON,
    seq_id: DataTypes.TEXT
  }, {});
  change.associate = function(models) {
    // associations can be defined here
  };
  return change;
};