#pipline.js
node.js async pipline with remote execution support

example
=======

```javascript
  var pipeline = require('pipeline');
  
  var steps = [
    function multiplyByTwo(x, next) {
      return next(null, x*2);
    },
    function addThree(x, next) {
      return next(null, x+3);
    },
    function powerOf2(x, next) {
      return next(null, x*x);
    }
  ];

  var local_pipeline = pipeline({ steps: steps});
  var remote_pipeline = pipeline({ steps: steps});

  local_pipeline
    .on('step', function(step, data) { console.log('[local] performing step %d', step, data);})
    .on('done', function(result) { console.log('[local] final result', result); })
    .on('error', function(err) { console.error('[local] error:', err); });

  remote_pipeline
    .on('step', function(step, data) { console.log('[remote] performing step %d', step, data);})
    .on('done', function(result) { console.log('[remote] final result', result); })
    .on('error', function(err) { console.error('[remote] error:', err); });

  var http = require('http');
  var server = http.createServer(function(req, res) {
    remote_pipeline.processRemoteRequest(req, res);
  });

  server.listen(9999, function() {
    local_pipeline.run({ data: 1, remoteSteps: [2], remoteHost: 'http://127.0.0.1:9999'}, function(err, result) {
      console.log('final result: %d', result);
    });
  });

```

license
=======
MIT
