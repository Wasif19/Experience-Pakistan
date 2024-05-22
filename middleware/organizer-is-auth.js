module.exports = (req, res, next) => {
  if (!req.session.Organizer) {
    res.redirect("/organizer/login");
  } else {
    next();
  }
};
