var Docker = require("dockerode");

const docker = new Docker({ socketPath: "../var/run/docker.sock" });
//const docker = new Docker();

module.exports = docker;
