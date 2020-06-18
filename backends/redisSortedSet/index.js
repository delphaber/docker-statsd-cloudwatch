var _ = require('lodash');
var redis = require('redis');

exports.init = function instrumental_init(startupTime, globalConfig, events) {
  var config = {
    connectUrl: 'redis://localhost:6379',
    prefixWhitelist: ''
  };

  if (globalConfig.redisSortedSet) {
    _.extend(config, globalConfig.redisSortedSet);
  }

  var client = redis.createClient({
    url: config.connectUrl
  });

  function flush(timeStamp, metrics) {
    var prefixWhitelist = config.prefixWhitelist.split(/\s*,\s*/);

    _.each(metrics.counters, function (value, key) {
      // key = "cma_api_calls.site_XXXX" (metrics are counters)

      key = key.split(".")

      if (key.length < 3) {
        return;
      }

      var prefix = key[0]

      if (prefixWhitelist.indexOf(prefix) === -1) {
        return;
      }

      var siteId = key[1].replace(/site_/g, '');

      client.hincrby('site_usages:' + prefix, siteId, value, function (err, res) {
        if (err) {
          console.error(err);
        }
      });
    });
  }

  events.on("flush", flush);
  return true;
};
