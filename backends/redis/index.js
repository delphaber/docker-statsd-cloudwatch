var _ = require('lodash');
var redis = require('redis');

exports.init = function instrumental_init(startup_time, config, events) {
  var redisConfig = {
    connect_url: 'redis://localhost:6379',
    prefixWhitelist: ''
  };

  if (config.redis) {
    _.extend(redisConfig, config.redis);
  }

  var client = redis.createClient({
    url: redisConfig.connect_url
  });

  function flush(timeStamp, metrics) {
    var prefixWhitelist = redisConfig.prefixWhitelist.split(/\s*,\s*/);

    _.each(metrics.counters, function (value, key) {
      key = key.split(".")

      if (key.length < 2) {
        return;
      }

      var prefix = key[0]

      if (prefixWhitelist.indexOf(prefix) === -1) {
        return;
      }

      var siteId = parseInt(key[1].replace(/[^\d]/g, ''));

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
