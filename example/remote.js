var pipeline = require('../index');

var drawStep = require('./draw');
var renderStep = require('./render');

var steps = [
  drawStep,
  renderStep
];

var local_pipeline = pipeline({ steps: steps});

var http = require('http');
http.createServer(function(req, res) {
  local_pipeline.processRemoteRequest(req, res);
}).listen(3000);