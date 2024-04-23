const jwt = require('jsonwebtoken');
require('dotenv').config();

const preventBack = (req, res, next) => {
  const token = req.cookies.user_jwt;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        next();
      } else {
        res.redirect('/'); 
      }
    });
  } else {
    next();
  }
};
const disableCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

module.exports = {preventBack,disableCache};
