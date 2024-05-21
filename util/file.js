const fs = require("fs");

const deleteFile = (filePath) => {
  console.log(filePath);
  fs.unlink(filePath, (err) => {
    if (err) {
      throw err;
    }
  });
};

exports.deleteFile = deleteFile;
