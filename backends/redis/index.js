var _ = require('lodash');
var redis = require('redis');


exports.init = function instrumental_init(startup_time, config, events) {
  var redisStats = {};

  var redisConfig = {
    host: 'localhost',
    port: 6379,
    db: 0,
    regexp: null
  };

  if (config.redis) {
    _.extend(redisConfig, config.redis);
  }

  if (redisConfig.regexp) {
    redisConfig.regexp = new RegExp(redisConfig.regexp);
  }

  var client = redis.createClient(redisConfig.port, redisConfig.host);
  client.select(redisConfig.db);

  redisStats.last_flush = startup_time;
  redisStats.last_exception = startup_time;


  function flush(timeStamp, metrics) {
    _.each(metrics.counters, function (value, key) {
      if (redisConfig.regexp && !redisConfig.regexp.test(key)) {
        return;
      }

      key = key.split(".")
      site_id = parseInt(key[1].replace(/[^\d.]/g, ''));
      client.hincrby(key[0], site_id, value, function (err, res) {
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
