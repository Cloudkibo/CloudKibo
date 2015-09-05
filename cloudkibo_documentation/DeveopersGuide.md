
# Developers guide 
## Overview

Cloudkibo uses nodejs on server side and angularjs on client side. Instead of html, Cloudkibo use jade templates which are then converted to html when served to client.
Great care has been taken to separate the server side code from client side. To maintain great modularity, code has been separated into files according to role.
Cloudkibo has configuration files on both server side and client side.Cloudkibo database, Mongodb, tables are defined in the code on server side with all the constraints defined with them.


On client side, Cloudkibo have modules to separate code. One of the core module, KiboRTC, is webrtc module. Currently conference services in this are not in use and have been replaced by new logic.
However, new conference logic has been placed in conference folder. Othere such modules are:
socket.io module, authentication module, rest api and sound module.

## Architecture 

Cloudkibo application uses purchased droplet from digitalocean (https://www.digitalocean.com/) for deployment. Our mongodb database is running in same droplet as of our application. For sending emails, we have integrated our application with sendgrid service. Turn server is running on IP address 45.55.232.65 and this droplet is named as ** “kibosupporttest” **. Application’s basic architecture was generated using Angular-FullStack generator. On every commit, our repository tested and built on shippable. Next, we would integrate our application with docker also for auto-deployment.

![Architecture](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/architecture.PNG)

Currently, our deployments are manual. We push the code to github and then access our droplet by ssh and pull the latest code there. With docker, we would just make a code push and docker will make build image for us.

## Design

![Client](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/client-design-diagram.PNG)

![Server](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/Server-Architecture.PNG)

### Authentication Management



Cloudkibo uses Passport as authentication middleware for it's Node server. As passport support authentication using a username and password, Facebook, Google and Microsoft. Passport recognizes that each application has unique authentication requirements.
The verify callback for local authentication accepts username and password arguments, which are submitted to the Cloudkibo application via login form. Cloudkibo login form allows the user to enter their credentials and log in.

The login form is submitted to the Cloudkibo server via the POST method. Using authenticate() with the local strategy which will handle the login request. It authenticates with passport and jade templete is updated for the user who has logged in. This view is updated by angular.js, it is now the application. Angularjs now handles all the requests i.e. requests data from server and sends data to server. 

![authentication](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/authenication-server.PNG)

## Rest APIs

On server side, we have directory ‘api’. All the mongodb collections (relations) with their constraints and test code are defined there. 


From there, we also expose the REST API for clients. The URI for any resource is often like this “/api/users/me”.
Code for this on server side can be located by looking at URI alone. We have folder api, then users folder and then we go to index.js file to fine route ‘/me’ and its controller.

On client side, we have an Angularjs service which has all the URIs written at one place. The angularjs application uses them whenever needs to do http request.
With this, we don’t have to modify the URI at all the places where it is used on client if URI is changed on server. We have to modify the Rest Service file only.

For example if we have entity **User** and the link **/api/users/:id/password** , the URI would be
www.cloudkibo.com/api/users/:id/password

This link is used when user wants to change their password.

Following are the REST API used by Cloudkibo. It shows the HTTP methode type **Get, Post, Delete, Put**

#### User Entity

**/api/users/**

This gets list of users
###### HTTP Method:GET

**/api/users/:id**

Deletes the user
###### HTTP Method: DELETE

**/api/usesr/me**

This fetches user Profile details
###### HTTP Method: GET

**/api/users/:id/password**

Changes user's password
###### HTTP Method: PUT

To see complete Cloudkibo Rest APIs:  https://github.com/Cloudkibo/CloudKibo/wiki/Cloudkibo-Rest-API 

## Server side code 
In separate md file, we would give details of server side code.
Most of the main server side code is written in api folder.  The purpose of REST API folder is defined in above section
Later, we define authentication strategies in auth folder. We do local, facebook, google and windows based authentications.
In configuration, we define several configurations for development environment, production environment and test environment.
All the database connections strings are defined here.
In socketio.js, we have all the server side code of socket.io. This code is often visited.
App.js is the main file of server side application and serves as starting point of our code. ViewRoutes has controllers for all the views requested by client.
Routes has all the API route handlers and other 404 route handlers

##### CloudKibo Server Side Files and Folders Structure

Cloudkibo server side files and folders are categorized for clarification and understanding. Each link makes a URI and the complete URI can be seen as:

www.cloudkibo.com/[folder-name]/[link-of-File]

For example we have folder **API** and the link **/callrecord/callrecord.model.js** , the complete URI will be

www.cloudkibo.com/api//callrecord/callrecord.model.js

Following shows the complete server side folder and file. And each file has a description of the code it contains.

##### API (Folder)

**/callrecord/callrecord.model.js**

File Description: Code for MongoDB Collection for Calls Data

File Category: Mongodb model

**/contactlist/contactlist.controller.js**

File Description: Route Handlers for Contact List

File Category: Route Handlers

**/contactlist/contactlist.model.js**

File Description: Code for MongoDB Collection for Contact List

File Category: MongoDB model

Complete Cloudkibo Server side structure can be found here: 
https://github.com/Cloudkibo/CloudKibo/wiki/Cloukibo-Server-Structure

## Client side code 

In separate md file, we would give details of client side code.
On client side, we are using angularjs so most of the client application follows the angularjs patter of modularity.
We have dependencies which are injected into each other when required. We have defined controllers, services, directives and filters.
We have a separate module for webrtc code called KiboRTC. Conference code in this module is deprecated and has been replaced by new conference logic which is defined in /components/conference/app/main contains all the main application code it has angularjs controllers.

Cloudkibo is single-page-application therefore we often request views from the server according to route.
Client side routes are handled separately by angularjs and server side routes are not exposed to normal user.
All the authentication and password management logic can be found in /app/account folder.
Super user code on client side is defined in the /app/admin folder
Most of the services are defined in the components folder
All the other folders are related to theme templates and images.
Bower_components folder is automatically created and managed by bower. We don’t need to do anything with this folder.

/components/kibortc is the code of our webrtc angularjs library. The conference code of this library is not used anymore and is deprecated. Instead for conference, we use cod inside folder /components/conference.

/components/auth has the angularjs services for maintaining authentication and user related information.

/components/sound is used to control sounds in application.

/components/rest is angularjs service written to separate addresses of REST API URIs at one place, application uses this whenever there is need to make http request.

##### CloudKibo Client Side Files and Folders Structure

Cloudkibo client side files and folders are categorized for clarification and understanding. Each link makes a URI and the complete URI can be seen as:

www.cloudkibo.com/[folder-name]/[link-of-File]

For example we have folder **App* and the link */account/account.js* , the complete URI will be

www.cloudkibo.com/app/account/account.js

Following show the complete client side folder and file. And each file has a description of the code it contains.

##### APP(Folder)

**/cloudkiboApp.js**

File Description: Contains Entry point for AngularJS code

File Category: Main Application

**/account/account.js**

File Description: Client-side URL routers are handled for accounts

File Category: User Accounts


**/account/login/login.controller.js**

File Description: Controller for Logic of Login

File Category: User Accounts

Complete Cloudkibo Client side structure can be found here: 
https://github.com/Cloudkibo/CloudKibo/wiki/Cloudkibo-Client-Structure

### Integration

It only require us to run npm install and bower install commands and this install all libraries. All the server side libraries are defined in package.json file. All the client side libraries are defined in bower.json. Sendgrid api is accessed using nodejs library and Cloudkibo has username and password which can be changed from super user account. Cloudkibo can define addresses of TURN server in client/components/kibortc/rtcconfig.service.js.

Cloudkibo has feature to register with Windos, Facebook and Google accounts. The integration with facebook, google and windows is done on server side and all the credentials are defined on the super user UI. Super user has all right to change the configuration.

Application is integrated with shippable which automatically runs all the tests on each github commit and sends the email on test failure. Shippable uses the grunt file to run the tests. All the automated processes run by shippable are defined in grunt file.

To see how they have been integrated follow the link: https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/OperationGuide.md

## Libraries

#### Server-side libraries
The main libraries on server side are

  - socket.io
  - passport
  - passport facebook
  - passport windows
  - passport google
  - sendgrid
  - winston loggly
  
#### Client-side libraries 
Following are the main client side libraries:

  - Angular bootstrap
  - Event Emitter
  - Angular loggly logger
  - angular socket io

## Database

We use mongoose library of nodejs to connect to our mongodb database. In operations guide, we have described how to setup mongodb database for cloudkibo. Here we would look how tables (collectionds) are defined in code. In mongodb, we don't defined ER diagrams for tables. In code, we defined structure of tables and they are automatically created when first time used.

All of our tables on server side are in API folder. For each entity we have a table, e.g. we have "users" table. Now, any file whicn ends in '.model.js' is the file which describes the structure and constraints of any table. You would find these files in api folder on server side code.

Here is the sample of a table defined in userchats.model.js file.

    var userchat = new Schema({
         to : String,
         from : String,
         fromFullName : String,
         msg : String,
         date : {type: Date, default: Date.now },
         owneruser : String
    });

    module.exports = mongoose.model('userchat', userchat);

All the tables will be defined in same way in their respective files.
