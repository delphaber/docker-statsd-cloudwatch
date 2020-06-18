FROM phusion/baseimage
MAINTAINER Stefano Verna <s.verna@datocms.com>

ENV DEBIAN_FRONTEND=noninteractive

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get -y update && apt-get -y -o Dpkg::Options::="--force-confold" upgrade
RUN apt-get -y --force-yes install git nodejs

RUN git clone https://github.com/etsy/statsd.git statsd
ADD config.js ./statsd/config.js

ADD backends/redisHash ./statsd/backends/redisHash
ADD backends/redisSortedSet ./statsd/backends/redisSortedSet
ADD backends/cloudwatch ./statsd/backends/cloudwatch

RUN cd statsd/backends/redisHash && npm install
RUN cd statsd/backends/redisSortedSet && npm install
RUN cd statsd/backends/cloudwatch && npm install

EXPOSE 8125:8125/udp
EXPOSE 8126:8126/tcp

CMD ["/usr/bin/nodejs", "/statsd/stats.js", "/statsd/config.js"]