#
# Node.js w/ Bower & Grunt runtime Dockerfile
#
# https://github.com/DigitallySeamless/nodejs-bower-grunt-runtime
#

# Pull base image.
FROM ubuntu
MAINTAINER Jawaid Ekram, jekram@hotmail.com

RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
RUN echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | tee /etc/apt/sources.list.d/10gen.list
RUN apt-get update -y
RUN apt-get install mongodb-10gen=2.4.5

ENTRYPOINT ["mongod", "-f", "/data/mongodb.conf"]

# Install image libs
ONBUILD RUN apt-get update && apt-get install -y graphicsmagick imagemagick && \
            apt-get clean && \
            rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set instructions on build.
ONBUILD ADD package.json /app/
ONBUILD RUN npm install
ONBUILD ADD bower.json /app/
ONBUILD ADD .bowerrc /app/
ONBUILD RUN bower install
ONBUILD ADD . /app
ONBUILD RUN grunt build
ONBUILD WORKDIR /app/dist
ONBUILD ENV NODE_ENV production
ONBUILD RUN npm install

# Define working directory.
WORKDIR /app

# Define default command.
CMD ["npm", "start"]

# Expose ports.
EXPOSE 8080
