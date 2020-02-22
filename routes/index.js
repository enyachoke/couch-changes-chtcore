const docsController = require('../controllers').docs;

module.exports = (app) => {
  app.get('/api', (req, res) => res.status(200).send({
    message: 'Welcome to the Docs API!',
  }));

  app.get('/api/doc-ids', docsController.list);
};