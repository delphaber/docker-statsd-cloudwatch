var util = require("util");

var awssum = require("awssum");
var amazon = awssum.load("amazon/amazon");
var CloudWatch = awssum.load("amazon/cloudwatch").CloudWatch;
var fmt = require("fmt");

function CloudwatchBackend(startupTime, config, emitter) {
  var self = this;

  config.cloudwatch.region = config.cloudwatch.region
    ? amazon[config.cloudwatch.region]
    : null;
  config.cloudwatch.whitelist =
    config.cloudwatch.whitelist &&
    config.cloudwatch.whitelist.split(/\s*,\s*/g);

  this.config = config.cloudwatch || {};

  // attach
  emitter.on("flush", function (timestamp, metrics) {
    self.flush(timestamp, metrics);
  });
}

CloudwatchBackend.prototype.processKey = function (key) {
  var parts = key.split(/[\.\/-]/);
  return {
    metricName: parts[parts.length - 1],
    namespace:
      parts.length > 1 ? parts.splice(0, parts.length - 1).join("/") : null,
  };
};

CloudwatchBackend.prototype.isBlacklisted = function (key) {
  if (
    this.config.whitelist &&
    this.config.whitelist.length > 0 &&
    this.config.whitelist.indexOf(key) >= 0
  ) {
    return false;
  }

  return true;
};

CloudwatchBackend.prototype.flush = function (timestamp, metrics) {
  var cloudwatch = new CloudWatch(this.config);

  console.log(new Date(timestamp * 1000).toISOString());

  var counters = metrics.counters;
  var timers = metrics.timers;

  for (key in counters) {
    if (key.indexOf("statsd.") == 0) continue;

    if (this.isBlacklisted(key)) {
      continue;
    }

    names = this.config.processKeyForNamespace ? this.processKey(key) : {};
    var namespace =
      this.config.namespace || names.namespace || "AwsCloudWatchStatsdBackend";
    var metricName = names.metricName || key;

    cloudwatch.PutMetricData(
      {
        MetricData: [
          {
            MetricName: metricName,
            Unit: "Count",
            Timestamp: new Date(timestamp * 1000).toISOString(),
            Value: counters[key],
          },
        ],
        Namespace: namespace,
      },
      function (err, data) {
        fmt.dump(err, "Err");
        fmt.dump(data, "Data");
      }
    );
  }

  for (key in timers) {
    if (this.isBlacklisted(key)) {
      continue;
    }

    if (timers[key].length > 0) {
      var values = timers[key].sort(function (a, b) {
        return a - b;
      });
      var count = values.length;
      var min = values[0];
      var max = values[count - 1];

      var cumulativeValues = [min];
      for (var i = 1; i < count; i++) {
        cumulativeValues.push(values[i] + cumulativeValues[i - 1]);
      }

      var sum = min;

      sum = cumulativeValues[count - 1];
      mean = sum / count;

      names = this.config.processKeyForNamespace ? this.processKey(key) : {};
      var namespace =
        this.config.namespace ||
        names.namespace ||
        "AwsCloudWatchStatsdBackend";
      var metricName = names.metricName || key;

      cloudwatch.PutMetricData(
        {
          MetricData: [
            {
              MetricName: metricName,
              Unit: "Milliseconds",
              Timestamp: new Date(timestamp * 1000).toISOString(),
              StatisticValues: {
                Minimum: min,
                Maximum: max,
                Sum: sum,
                SampleCount: count,
              },
            },
          ],
          Namespace: namespace,
        },
        function (err, data) {
          fmt.dump(err, "Err");
          fmt.dump(data, "Data");
        }
      );
    }
  }
};

exports.init = function (startupTime, config, events) {
  var instance = new CloudwatchBackend(startupTime, config, events);
  return true;
};
