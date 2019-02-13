var _ = require('lodash');
var redis = require('redis');


exports.init = function instrumental_init(startup_time, config, events) {
  var redisStats = {};

  var redisConfig = {
    connect_url: 'redis://localhost:6379',
    prefix_whitelist: ''
  };

  if (config.redis) {
    _.extend(redisConfig, config.redis);
  }

  var client = redis.createClient({
    url: redisConfig.connect_url
  });

  redisStats.last_flush = startup_time;
  redisStats.last_exception = startup_time;


  function flush(timeStamp, metrics) {
    prefix_whitelist = redisConfig.prefix_whitelist.replace(/\s+/g, '').split(',')
    _.each(metrics.counters, function (value, key) {
      key = key.split(".")
      prefix = key[0]
      if (key.length < 2) {
        return;
      }
      if (key.length > 1 && !prefix_whitelist.indexOf(prefix) == -1) {
        return;
      }
      site_id = parseInt(key[1].replace(/[^\d.]/g, ''));
      client.hincrby(prefix, site_id, value, function (err, res) {
        if (err) {
          redisStats.last_exception = timeStamp;
          console.error(err);
        }
      });
    });
  }

  events.on("flush", flush);
  return true;
};
