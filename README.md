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
    -e "AWS_ACCESS_KEY_ID=YOUR_KEY" \
    -e "AWS_SECRET_ACCESS_KEY=YOUR_SECRET" \
    stefanoverna/statsd-cloudwatch:1.0

docker service create \
    --name statsd-http-proxy \
    -p 80:80 \
    --network statsd \
    sokil/statsd-http-proxy:latest \
    --verbose \
    --statsd-host=statsd
```

