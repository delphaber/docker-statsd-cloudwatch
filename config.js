(function() {
  return {
    port: parseInt(process.env.STATSD_PORT) || 8125,
    backends: ["./backends/console", "aws-cloudwatch-statsd-backend", "./backends/redis"],
    debug: process.env.STATSD_DEBUG == 'true',
    flushInterval: parseInt(process.env.STATSD_FLUSH_INTERVAL) || 5000,
    cloudwatch: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'key_id',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'secret',
      region: process.env.AWS_REGION || 'US_EAST_1',
      namespace: process.env.CLOUDWATCH_NAMESPACE,
      metricName: process.env.CLOUDWATCH_METRIC_NAME,
      processKeyForNamespace: process.env.CLOUDWATCH_PROCESS_KEY_FOR_NAMESPACE == 'true',
    },
    redis: {
      connect_url: process.env.REDIS_URL || 'redis://host.docker.internal:6379/0',
      prefix_whitelist: process.env.REDIS_PREFIX_WHITELIST || 'cma_api_calls, cda_api_calls'
    }
  };
})()

