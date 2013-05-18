
var util = require('util');
var events = require('events');
var request = require('request');
var url = require('url');
var qs = require('querystring');

var Pipeline = function(options) {
  this.steps = options.steps || (util.isArray(options) && options) || [];
  events.EventEmitter.call(this);

  return this;
};

util.inherits(Pipeline, events.EventEmitter);

var remote_step = function(remoteHost, stepFrom, stepTo) {
  var remoteUrl = url.parse(remoteHost);
  remoteUrl.query = { from: stepFrom };

  if (stepTo || stepTo === 0) {
    remoteUrl.query.to = stepTo;
  }

  return function(data, next) {
    var isJson = !(data instanceof Buffer);
    var headers = {};
    if (isJson) {
      headers['content-type'] = 'text/json';
      data = JSON.stringify(data);
    }
    else {
      headers['content-type'] = 'application/octet-stream';
    }

    request({
      uri: url.format(remoteUrl),      
      method: 'POST',
      headers: headers,
      encoding: null,
      body: data
    }, function(err, resp, body) {
      if (err) {
        return next(err);
      }

      if (resp && resp.headers['content-type'] === 'text/json') {
        body = JSON.parse(body.toString());
      }

      if (resp.statusCode !== 200) {
        err = body.error;
      }

      next(err, body);
    });
  };
};

Pipeline.prototype.preprocess = function(options) {
  var remoteHost = options.remoteHost;
  var remoteSteps = options.remoteSteps || [];
  var steps = this.steps;
  var remoteFrom, remoteTo;
  var remoteStep;

  if (remoteHost && remoteSteps.length) {
    steps = steps.slice();
    remoteFrom = remoteTo = remoteSteps[0];
    for (var i=0; i<remoteSteps.length; i++) {
      remoteStep = remoteSteps[i];
      // find the sequential remote steps
      if (remoteSteps[i+1] === remoteStep + 1) {
        remoteTo = remoteSteps[i+1];
        continue;
      }

      if (remoteTo !== remoteFrom) {
        // splice out the sequantial steps, besides the first one, 
        // and replace it with a single remote call for the sequence
        steps.splice(remoteFrom + 1, remoteTo);
        steps[remoteFrom] = remote_step(remoteHost, remoteFrom, remoteTo);
      }
      else {        
        steps[remoteStep] = remote_step(remoteHost, remoteStep, remoteStep);
      }
      remoteFrom = remoteFrom = remoteSteps[i+1];
    };
  }

  return steps;
};

Pipeline.prototype.run = function(options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  options = options || {};
  cb = cb || function() {};

  var self = this;
  var steps = this.preprocess(options);
  var from = options.from || 0;
  var lastStep = steps.length - 1;
  var to = options.to || lastStep;

  if (to > lastStep) {
    to = lastStep;
  }

  var step = from;

  var next = function(err, result) {
    if (step > to) { // done return whatever we got
      cb(null, result); 
      return self.emit('done', result);
    }
    if (err) { // in case of an error we stop the pipeline
      cb(err);
      return self.emit('error', err);
    }

    self.emit('step', step, result);
    steps[step++](result, next);
  };

  // start the pipeline
  return next(null, options.data);
};

var readData = function(req, cb) {
  if (req._body) {
    return cb(null, req.body);
  }

  req._body = true;

  var buffers = [];
  req.on('data', function(chunk){ buffers.push(chunk); });
  req.on('end', function() {
    req.body = Buffer.concat(buffers);
    cb(null, req.body);
  });
}

var toJson = function(req) {
  var buf = req.body.toString('utf8');
  try {
    req.body = JSON.parse(buf);
    return null;
  } catch (err){
    err.body = buf;
    err.status = 400;
    return err;
  }
}

Pipeline.prototype.processRemoteRequest = function(req, res) {
  var reqUrl = url.parse(req.url);
  var options = qs.parse(reqUrl.query);
  var self = this;

  readData(req, function(err, data) {
    if (!err && req.headers['content-type'] === 'text/json') {
      err = toJson(req);  
    }

    if (err) {
      res.writeHead(400, {'Content-Type': 'text/json'});
      return  res.end(JSON.stringify({error: err.message}));
    }

    options.data = req.body;

    self.run(options, function(err, result) {    
      result = result || "";
      if (err) {
        res.writeHead(400, {'Content-Type': 'text/json'});
        return  res.end(JSON.stringify({error: err.message}));
      }

      if (result instanceof Buffer) {
        res.writeHead(200, {'Content-Type': 'application/octet-stream'});
        return res.end(result);    
      }

      res.writeHead(200, {'Content-Type': 'text/json'});
      return res.end(JSON.stringify(result || ''));
    });
  });
};

module.exports = function(options) {
  return new Pipeline(options);
}

module.exports.Pipeline = Pipeline;