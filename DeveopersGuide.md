
# Developers guide 
## Overview

Cloudkibo uses nodejs on server side and angularjs on client side. Instead of html, Cloudkibo use jade templates which are then converted to html when served to client.
Great care has been taken to separate the server side code from client side. To maintain great modularity, code has been separated into files according to role.
Cloudkibo has configuration files on both server side and client side.Cloudkibo database, Mongodb, tables are defined in the code on server side with all the constraints defined with them.


On client side, Cloudkibo have modules to separate code. One of the core module, KiboRTC, is webrtc module. Currently conference services in this are not in use and have been replaced by new logic.
However, new conference logic has been placed in conference folder. Othere such modules are:
socket.io module, authentication module, rest api and sound module.

## Architecture (created .md )

Cloudkibo application uses purchased droplet from digitalocean (https://www.digitalocean.com/) for deployment. Our mongodb database is running in same droplet as of our application. For sending emails, we have integrated our application with sendgrid service. Turn server is running on IP address 45.55.232.65 and this droplet is named as “kibosupporttest”. Application’s basic architecture was generated using Angular-FullStack generator. On every commit, our repository tested and built on shippable. Next, we would integrate our application with docker also for auto-deployment.
Currently, our deployments are manual. We push the code to github and then access our droplet by ssh and pull the latest code there. With docker, we would just make a code push and docker will make build image for us.

## Design
(  Design diagram would go here )

## Rest APIs

On server side, we have directory ‘api’. All the mongodb collections (relations) with their constraints and test code are defined there. 
From there, we also expose the REST API for clients. The URI for any resource is often like this “/api/users/me”.
Code for this on server side can be located by looking at URI alone. We have folder api, then users folder and then we go to index.js file to fine route ‘/me’ and its controller.
On client side, we have an Angularjs service which has all the URIs written at one place. The angularjs application uses them whenever needs to do http request.
With this, we don’t have to modify the URI at all the places where it is used on client if URI is changed on server. We have to modify the Rest Service file only.

To see Cloudkibo Rest APIs:  https://github.com/Cloudkibo/CloudKibo/wiki/Cloudkibo-Rest-API 

## Server side code 
In separate md file, we would give details of server side code.
Most of the main server side code is written in api folder.  The purpose of REST API folder is defined in above section
Later, we define authentication strategies in auth folder. We do local, facebook, google and windows based authentications.
In configuration, we define several configurations for development environment, production environment and test environment.
All the database connections strings are defined here.
In socketio.js, we have all the server side code of socket.io. This code is often visited.
App.js is the main file of server side application and serves as starting point of our code. ViewRoutes has controllers for all the views requested by client.
Routes has all the API route handlers and other 404 route handlers

To see Cloudkibo Server side code: https://github.com/Cloudkibo/CloudKibo/wiki/Cloukibo-Server-Structure

## Client side code 
## Integration
## Libraries
### Client-side libraries 
### Server-side libraries
## Database
