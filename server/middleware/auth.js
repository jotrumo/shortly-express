const models = require('../models');
const Promise = require('bluebird');


module.exports.createSession = (req, res, next) => {

  if (Object.keys(req.cookies).length === 0) {
    return models.Sessions.create()
    .then(data => {
      let session = {};
      session['hash'] = data
      req.session = session
      let cookies = {};

      cookies['shortlyid'].value = data
      res.cookies = cookies
      next();
    })
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

