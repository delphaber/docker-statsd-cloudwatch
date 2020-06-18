const _ = require("lodash");
const redis = require("redis");

exports.init = function instrumental_init(startupTime, globalConfig, events) {
  const config = {
    connectUrl: "redis://localhost:6379",
    prefixWhitelist: "",
    keepTop: 100,
  };

  if (globalConfig.redisSortedSet) {
    _.extend(config, globalConfig.redisSortedSet);
  }

  const client = redis.createClient({
    url: config.connectUrl,
  });

  var prefixWhitelist = config.prefixWhitelist.split(/\s*,\s*/);

  let lastTimestamp = 0;
  const touchedSets = new Set();

  events.on("flush", (timestamp, metrics) => {
    let batchOp = client.batch();

    _.each(metrics.counters, function (count, key) {
      // usage: curl -X POST '/count/assets_referral.site_XXXX.<BASE64-VALUE>' --data "value=1" -H "X-JWT-Token: ZZZZ"
      // key = "cma_api_calls.site_XXXX.<BASE64-VALUE>" (metrics are counters)

      const chunks = key.split(".", 3);

      if (chunks.length < 3) {
        return;
      }

      var prefix = chunks[0];

      if (prefixWhitelist.indexOf(prefix) === -1) {
        return;
      }

      var siteId = chunks[1].replace(/site_/g, "");

      const set = config.redisKeyPrefix + prefix + ":" + siteId;
      touchedSets.add(set);

      batchOp = batchOp.ZINCRBY(set, count, new Buffer(chunks[2], 'base64').toString('ascii'));
    });

    if (timestamp - lastTimestamp > config.pruneFrequency / 1000) {
      lastTimestamp = timestamp;

      console.log(`[REDIS SORTED SET] Pruning to keep top ${config.keepTop} results...`);

      for (let set of touchedSets.values()) {
        batchOp = batchOp.ZREMRANGEBYRANK(set, 0, -(config.keepTop + 1));
      }
      touchedSets.clear();
    }

    batchOp.exec((err, replies) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(
        `[REDIS SORTED SET] Sent ${replies.length} commands successfully.`
      );
    });
  });
  return true;
};
