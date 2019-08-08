FROM phusion/baseimage
MAINTAINER Stefano Verna <s.verna@datocms.com>

RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get -y update && apt-get -y upgrade
RUN apt-get -y --force-yes install git nodejs yarn

RUN git clone https://github.com/etsy/statsd.git statsd
ADD config.js ./statsd/config.js
ADD backends/redis ./statsd/backends/redis
ADD backends/cloudwatch ./statsd/backends/cloudwatch
RUN cd statsd/backends/redis && yarn install
RUN cd statsd/backends/cloudwatch && yarn install

EXPOSE 8125:8125/udp
EXPOSE 8126:8126/tcp
CMD ["/usr/bin/nodejs", "/statsd/stats.js", "/statsd/config.js"]

