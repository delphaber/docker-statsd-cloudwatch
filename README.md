# Statsd + Cloudwatch Docker image

A Docker container running statsd, using AWS Cloudwatch as backend.

Statsd will save usages data (api calls, bandwidth, etc) to Production/Staging Redis instance and will send metrics (response time, errors count) to CloudWatch (where status.datocms.com fetch its data to show the graphs).

## Development

Update your code and then ...

```bash
# locally build your image
docker build --tag datocms/statsd-cloudwatch:1.0 .

# login to docker hub
docker login

# push to our docker hub team (ask other team members to add you to the team!)
docker push datocms/statsd-cloudwatch
```

## Provisioning on the server

```bash
docker swarm init
```

If you see an error like:

```
Error response from daemon: could not choose an IP address to advertise since this system has multiple addresses on interface eth0 (138.68.58.48 and 10.19.0.5) - specify one with --advertise-addr
```

...select the public IP (e.g. 138.68.58.48 in this example), and run the command again with --advertise-addr, e.g.:

```bash
docker swarm init --advertise-addr 138.68.58.48
```

Then

```bash
docker network create -d overlay statsd
```

---

Take `AWS_ACCESS_KEY_ID` and `AWS_ACCESS_KEY_ID` from our password manager. Search for `statsd`

Take `REDIS_URL` from Heroku. Make sure it's the "stable" redis URL, not the "cache" redis one.

*For production provisioning*:

```bash
docker service create \
    --name statsd \
    --network statsd \
    -p 8125:8125/udp \
    --replicas 1 \
    -e "AWS_ACCESS_KEY_ID=XXX" \
    -e "AWS_SECRET_ACCESS_KEY=YYY" \
    -e "REDIS_URL=redis://foobar:14491" \
    datocms/statsd-cloudwatch:1.0
```

*For staging provisioning*:

We do not want to send metrics to CloudWatch, so we define an empty
CloudWatch whitelist.

```bash
docker service create \
    --name statsd \
    --network statsd \
    -p 8125:8125/udp \
    --replicas 1 \
    -e "AWS_ACCESS_KEY_ID=XXX" \
    -e "AWS_SECRET_ACCESS_KEY=YYY" \
    -e "REDIS_URL=redis://foobar:14491" \
    -e "CLOUDWATCH_WHITELIST=none" \
    datocms/statsd-cloudwatch:1.0
```

---

Generate a long password and use it in the following comand in place of A_JWT_SECRET
(e.g.: y0WzF6miaf2VX0bC8bgOAvaGILF1QN)

```bash
docker service create \
    --name statsd-http-proxy \
    --network statsd \
    -p 80:80 \
    gometric/statsd-http-proxy:0.9.0 \
    --verbose \
    --statsd-host=statsd \
    --jwt-secret=A_JWT_SECRET
```

## Useful commands (on the server)

```bash
# find process ID for services
docker service ls

# show envs and other info about current service
docker service inspect <ID>

# change/add env variable
docker service update --env-add "FOO=bar" statsd

# update image to the latest available in the registry
docker pull datocms/statsd-cloudwatch:1.0

# change/update image
docker service update --image datocms/statsd-cloudwatch:1.0 statsd

# remove service
docker service rm statsd

# view logs
docker service logs statsd -f --tail 100

# view logs (when stats are sent to redis)
docker service logs statsd -f --tail 100 | grep 'REDIS SORTED SET'
```
