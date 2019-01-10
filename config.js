(function() {
  return {
    port: parseInt(process.env.STATSD_PORT) || 8125,
    backends: ["./backends/console", "aws-cloudwatch-statsd-backend"],
    debug: process.env.STATSD_DEBUG == 'true',
    flushInterval: parseInt(process.env.STATSD_FLUSH_INTERVAL) || 5000,
    cloudwatch: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'key_id',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'secret',
      region: process.env.AWS_REGION || 'US_EAST_1',
      namespace: process.env.CLOUDWATCH_NAMESPACE,
      metricName: process.env.CLOUDWATCH_METRIC_NAME,
      processKeyForNamespace: process.env.CLOUDWATCH_PROCESS_KEY_FOR_NAMESPACE == 'true',
    }
  };
})()

