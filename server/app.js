const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));



app.get('/',
(req, res) => {
  res.render('index');
});

app.get('/create',
(req, res) => {
  res.render('index');
});

app.get('/links',
(req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post('/links',
(req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/


// signup
app.post('/signup', (req, res, next) => {

  let username = req.body.username;
  let password = req.body.password;

  models.Users.create({username, password})
   .then(() => {
    res.redirect('/');
  })
  .error(error => {
    res.redirect('/signup');
  })
});


// login
app.post('/login', (req, res, next) => {

  let user = req.body.username;
  let attempted = req.body.password       // attempted password
  console.log("User :", user)
  return models.Users.get({username: user})
    //'Users that do not exist are kept on login page'
    // .catch(error => {
    //   console.log('err')
    //   res.redirect('/login')
    // })

    .then(data => {
      let password = data.password  // password
      let theSalt = data.salt       // Salt
      console.log("the object!!!!!", data)  // Worked!
      if(!data || !models.Users.compare({attempted, password, theSalt})) {
        throw new Error("Did not work")
      }


      console.log("attempted :", attempted)
      console.log("Password :", password)
      console.log("salt :", theSalt)
      console.log(models.Users.compare({attempted, password, theSalt}))
      // if (models.Users.compare({attempted, password, theSalt})) {
      //   //'Users that enter an incorrect password are kept on login page'
      //   res.redirect('/');
      // } else {
      //   res.redirect('/login')
      //   done()
      // }

    })
    return models.Sessions.update({hash: req.session.hash}, {userId: user.id})
    .then(() => {
      res.redirect('/')
    })
    .error(error => {
      res.status(500).send(error)
    })
    .catch(() => {
      res.redirect('/login')
    })

});

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
