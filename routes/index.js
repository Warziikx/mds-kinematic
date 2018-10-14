var express = require("express");
var router = express.Router();
var Docker = require("dockerode");
const docker = new Docker({ socketPath: "../var/run/docker.sock" });

router.get("/", function(req, res, next) {
  docker.info(function(err, info) {
    info.MemTotal = convertBytes(info.MemTotal);
    res.render("index", {
      title: "Home",
      info: info
    });
  });
});

function convertBytes(bytes) {
  if (bytes < 1024) return bytes + " Bytes";
  else if (bytes < 1048576)
    return Math.round((bytes / 1024) * 100) / 100 + " KB";
  else if (bytes < 1073741824)
    return Math.round((bytes / 1048576) * 100) / 100 + " MB";
  else return Math.round((bytes / 1073741824) * 100) / 100 + " GB";
}

module.exports = router;
