# Statsd + Cloudwatch Docker image

A Docker container running statsd, using AWS Cloudwatch as backend.

```
docker swarm init

docker network create -d overlay statsd

docker service rm statsd

docker service create \
    --name statsd \
    --network statsd \
    -p 8125:8125/udp \
    --replicas 1 \
    -e "AWS_ACCESS_KEY_ID=XXX" \
    -e "AWS_SECRET_ACCESS_KEY=YYY+DsA704FDX" \
    -e "REDIS_URL=redis://foobar:14491" \
    -e "AWS_REGION=EU_WEST_1" \
    -e "CLOUDWATCH_PROCESS_KEY_FOR_NAMESPACE=true" \
    -e "REDIS_PREFIX_WHITELIST=cma_api_calls,cda_api_calls,cda_bandwidth,assets_bandwidth" \
    -e "CLOUDWATCH_WHITELIST=cda-response_time,rails-status_error,rails-status_success" \
    -e "STATSD_FLUSH_INTERVAL=60000" \
    -e "CLOUDWATCH_PROCESS_KEY_FOR_NAMESPACE=true" \
    stefanoverna/statsd-cloudwatch:1.0

docker service create \
    --name statsd-http-proxy \
    -p 80:80 \
    --network statsd \
    sokil/statsd-http-proxy:latest \
    --verbose \
    --statsd-host=statsd
```

Useful commands:

```
# find process ID for services
docker service ls

# show envs and other info about current service
docker service inspect <ID>

# change/add env variable
docker service update --env-add "FOO=bar" statsd

# update image to the latest available in the registry
docker pull stefanoverna/statsd-cloudwatch:1.0

# change/update image
docker service update --image stefanoverna/statsd-cloudwatch:1.0 statsd

# view logs
docker service logs statsd -f --tail 100
```