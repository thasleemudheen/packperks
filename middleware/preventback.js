const preventBack = (req, res, next) => {
    if (req.isAuthenticated()) {
      // If the user is logged in, redirect them to the home page
      res.redirect('/');
    } else {
      next(); // If not logged in, proceed to the next middleware
    }
  };
  
  module.exports = preventBack;
  