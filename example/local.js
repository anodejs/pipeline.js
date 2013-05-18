var pipeline = require('../index');

var drawStep = require('./draw');
var renderStep = require('./render');

var steps = [
  drawStep,
  renderStep
];

var local_pipeline = pipeline({ steps: steps});

local_pipeline
  .on('step', function(step, data) { console.log('performing step %d', step);})

var http = require('http');
http.createServer(function(req, res) {
  local_pipeline.run({ data: {width: 100, height: 100}, remoteSteps: [0], remoteHost: 'http://127.0.0.1:3000'}, function(err, result) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    return res.end(result);    
  });
}).listen(8000);