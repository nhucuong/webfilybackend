// middleware/authMiddleware.js
module.exports.AuthMiddleware = (req, res, next) => {
  // Agar session me adminId hai, aage allow karo
  if (req.session && req.session.adminId) {
    return next();
  }
  // Agar login nahi hai, redirect karo login page pe
  return res.redirect('/loginpage');
};
