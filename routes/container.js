var express = require("express");
var router = express.Router();
const docker = require("../bin/docker");

router.get("/", function(req, res, next) {
  docker.listContainers({ all: true }, function(err, containers) {
    let newContainer = containers
      .filter(container => {
        return container.Image != "kinematic:latest";
      })
      .map(container => {
        container.Names[0] = container.Names[0].split("/")[1];
        switch (container.State) {
          case "running":
            container.StateNum = 0;
            break;
          case "exited":
            container.StateNum = 1;
            break;
          case "paused":
            container.StateNum = 2;
            break;
          case "created":
            container.StateNum = 3;
            break;
          case "restarting":
            container.StateNum = 4;
            break;
          case "dead":
            container.StateNum = 5;
            break;
        }
        return container;
      });
    res.render("containers", {
      title: "Containers",
      containers: newContainer,
      containerIndex: true
    });
  });
});

router.get("/stop/:id", function(req, res, next) {
  let id = req.params.id;
  docker.getContainer(id).stop({}, function() {
    res.redirect(req.headers.referer);
  });
});

router.get("/log/:id", function(req, res, next) {});

router.get("/start/:id", function(req, res, next) {
  let id = req.params.id;
  docker.getContainer(id).start({}, function() {
    res.redirect(req.headers.referer);
  });
});

router.get("/remove/:id", function(req, res, next) {
  let id = req.params.id;
  docker.getContainer(id).remove({}, function() {
    res.redirect("/container");
  });
});

router.get("/new", function(req, res, next) {
  docker.listImages({ all: false }, function(err, images) {
    let imageNameList = "";
    images.map((image, index) => {
      imageNameList += image.RepoTags[0];
      if (index != images.length - 1) {
        imageNameList += ",";
      }
    });
    res.render("containerForm", {
      title: "New Containers",
      imageNameList: imageNameList
    });
  });
});

router.post("/new", function(req, res, next) {
  let body = req.body;
  docker.getImage(req.body.image).inspect(function(err, image) {
    if (image) {
      let portBindingsObject = {};
      let exposedPortsObject = {};
      if (body.portFrom != "") {
        if (Array.isArray(body.portFrom)) {
          body.portFrom.map((port, index) => {
            portBindingsObject[
              port + "/" + body.portType[index].toLowerCase()
            ] = [{ HostIp: "", HostPort: body.portTo[index] }];
          });
          body.portTo.map((port, index) => {
            exposedPortsObject[
              port + "/" + body.portType[index].toLowerCase()
            ] = {};
          });
        } else {
          portBindingsObject[
            body.portFrom + "/" + body.portType.toLowerCase()
          ] = [{ HostIp: "", HostPort: body.portTo }];
          exposedPortsObject[
            body.portTo + "/" + body.portType.toLowerCase()
          ] = {};
        }
      }
      let envVarArray = [];
      if (body.envVarName != "") {
        if (Array.isArray(body.envVarName)) {
          envVarArray = body.envVarName.map((name, index) => {
            return name + "=" + body.envVarValue[index];
          });
        } else {
          envVarArray.push(body.envVarName + "=" + body.envVarValue);
        }
      }
      let volArray = [];
      if ((body.volFrom = "")) {
        if (Array.isArray(body.volFrom)) {
          volArray = body.volFrom.map((from, index) => {
            return from + ":" + body.volTo[index];
          });
        } else {
          volArray.push(body.volFrom + ":" + body.volTo);
        }
      }
      docker.createContainer(
        {
          Env: envVarArray,
          Image: body.image,
          name: body.nom,
          ExposedPorts: exposedPortsObject,
          HostConfig: {
            Binds: volArray,
            Memory: parseInt(body.memory * 1048576),
            NanoCpus: parseInt(body.cpu * 10000000),
            PortBindings: portBindingsObject
          }
        },
        function(err, container) {
          if (!err) {
            container.start(function(err, data) {
              res.redirect("/container");
            });
          } else {
            console.log(err);
          }
        }
      );
    } else {
      console.log(err);
      res.redirect("/container/new");
    }
  });
});

router.get("/:id", function(req, res, next) {
  let id = req.params.id;

  docker.getContainer(id).inspect({}, function(err, container) {
    console.log(container);
    container.State.StartedAt = formatToDatetime(
      new Date(container.State.StartedAt)
    );
    container.State.FinishedAt = formatToDatetime(
      new Date(container.State.FinishedAt)
    );
    container.HostConfig.Memory =
      container.HostConfig.Memory > 0
        ? convertBytes(container.HostConfig.Memory)
        : "Non Limité";
    container.HostConfig.NanoCpus =
      container.HostConfig.NanoCpus > 0
        ? container.HostConfig.NanoCpus / 10000000 + "%"
        : "Non Limité";
    res.render("container", {
      title: "Containers",
      container: container
    });
  });
});

function formatToDatetime(date) {
  return (
    (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) +
    "/" +
    (date.getMonth() + 1 < 10
      ? "0" + (date.getMonth() + 1)
      : date.getMonth() + 1) +
    "/" +
    date.getFullYear() +
    " " +
    (date.getHours() + 2 < 10
      ? "0" + (date.getHours() + 2)
      : date.getHours() + 2) +
    ":" +
    (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes())
  );
}

router.emitLogs = async function(socket) {
  const id = getIdFromUrl(socket.handshake.headers.referer);
  const container = docker.getContainer(id);
  const logsStream = await container.logs({
    follow: true,
    stdout: true,
    stderr: true
  });
  logsStream.on("data", data => {
    socket.emit("logs output", data.toString());
  });
};

function getIdFromUrl(url) {
  const arr = url.split("/");
  return arr[arr.length - 1];
}

function convertBytes(bytes) {
  if (bytes < 1024) return bytes + " Bytes";
  else if (bytes < 1048576)
    return Math.round((bytes / 1024) * 100) / 100 + " KB";
  else if (bytes < 1073741824)
    return Math.round((bytes / 1048576) * 100) / 100 + " MB";
  else return Math.round((bytes / 1073741824) * 100) / 100 + " GB";
}
module.exports = router;
