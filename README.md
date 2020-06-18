# Statsd + Cloudwatch Docker image

A Docker container running statsd, using AWS Cloudwatch as backend.

```
docker swarm init

docker network create -d overlay statsd

docker service create \
    --name statsd \
    --network statsd \
    -p 8125:8125/udp \
    --replicas 1 \
    -e "AWS_ACCESS_KEY_ID=XXX" \
    -e "AWS_SECRET_ACCESS_KEY=YYY" \
    -e "REDIS_URL=redis://foobar:14491" \
    stefanoverna/statsd-cloudwatch:1.0

docker service create \
    --name statsd-http-proxy \
    -p 80:80 \
    --network statsd \
    gometric/statsd-http-proxy:latest \
    --verbose \
    --statsd-host=statsd \
    --jwt-secret=ZZZ
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

# remove service
docker service rm statsd

# view logs
docker service logs statsd -f --tail 100

# locally build your image
docker build --tag statsd-cloudwatch:1.0 .
```
