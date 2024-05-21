module.exports = (req, res, next) => {
  if (!req.session.Admin) {
    res.redirect("/admin/admin-login");
  } else {
    next();
  }
};
