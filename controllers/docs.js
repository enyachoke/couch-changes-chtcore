const Change = require('../models').change;

module.exports = {
  list(req, res) {
    let keys = req.body.keys;
    return Change
      .findAll({
        attributes: [['_id', 'id'],['change_key','key'],['change_value','value']],
        where: {
          change_key: keys
        }
      })
      .then((docs) => res.status(200).send({ rows: docs }))
      .catch((error) => res.status(400).send(error));
  },

};