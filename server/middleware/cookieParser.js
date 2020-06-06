const parseCookies = (req, res, next) => {

  let cookie = req.headers.cookie
  if (!cookie) {
    return;
 }
  var cookieArr = cookie.split(' ')

  var cookies = {};
  for (var i = 0; i < cookieArr.length; i++) {

    var index = cookieArr[i].indexOf('=')
    var cookieProp = cookieArr[i].slice(0, index);
    var cookieVal = cookieArr[i].slice(index + 1);

    if(cookieVal[cookieVal.length - 1] === ';') {
      cookieVal = cookieVal.slice(0, cookieVal.length -1);
    }
    cookies[cookieProp] = cookieVal;
  }
  req.cookies = cookies
  next();
};

module.exports = parseCookies;