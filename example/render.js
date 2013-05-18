module.exports = function(data, next) {
  var b = new Buffer(data);
  var dataUri = 'data:image/jpeg;base64,' + b.toString('base64');
  var html = '<html><body><img src="' + dataUri + '" /></body></html>';

  return next(null, html);
};