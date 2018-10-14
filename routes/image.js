var express = require("express");
var router = express.Router();
var Docker = require("dockerode");
const docker = new Docker({ socketPath: "../var/run/docker.sock" });

router.get("/", function(req, res, next) {
  docker.listImages({ all: false }, function(err, images) {
    newImage = images.map(image => {
      let date = new Date(image.Created * 1000);
      image.Created =
        (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) +
        "/" +
        (date.getMonth() + 1 < 10
          ? "0" + (date.getMonth() + 1)
          : date.getMonth() + 1) +
        "/" +
        date.getFullYear();
      image.Size = convertBytes(image.Size);
      return image;
    });
    res.render("images", {
      title: "Images",
      images: newImage,
      imageIndex: true
    });
  });
});

router.get("/delete/:id", function(req, res, next) {
  let id = req.params.id;
  docker.getImage(id).remove({}, function() {
    res.redirect("/image");
  });
});
router.get("/new", function(req, res, next) {
  res.render("imageForm", { title: "New Image" });
});

router.get("/search/:name", function(req, res, next) {
  docker.searchImages({ term: req.params.name }, function(err, imagesList) {
    res.send(imagesList);
  });
});

router.get("/download/:name", function(req, res, next) {});

router.emitDownload = async function(socket, img) {
  var pourcentArray = [];
  var idArray = [];
  docker.pull(img + ":latest", (err, stream) => {
    docker.modem.followProgress(stream, onFinished, onProgress);
    function onFinished(err, output) {
      if (!err) {
        console.log("\nDone pulling.");
        socket.emit("done pulling");
      } else {
        console.log(err);
      }
    }
    function onProgress(event) {
      if (event.status == "Downloading") {
        if (idArray.indexOf(event.id) === -1) {
          pourcentArray.push(
            Math.round(
              (event.progressDetail.current * 100) / event.progressDetail.total
            )
          );
          idArray.push(event.id);
        } else {
          pourcentArray[idArray.indexOf(event.id)] = Math.round(
            (event.progressDetail.current * 100) / event.progressDetail.total
          );
        }
        socket.emit("download output", pourcentArray);
      }
    }
  });
};

function convertBytes(bytes) {
  if (bytes < 1024) return bytes + " Bytes";
  else if (bytes < 1048576)
    return Math.round((bytes / 1024) * 100) / 100 + " KB";
  else if (bytes < 1073741824)
    return Math.round((bytes / 1048576) * 100) / 100 + " MB";
  else return Math.round((bytes / 1073741824) * 100) / 100 + " GB";
}

module.exports = router;
