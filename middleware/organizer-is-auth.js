module.exports = (req, res, next) => {
  if (!req.session.Organizer) {
    res.redirect("/organizer/organizer-login");
  } else {
    next();
  }
};
