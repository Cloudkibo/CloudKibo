## Operation Guide
### Overview
Cloudkibo is developed with strategy  to separate server from client. 
Server side code is separated from Client side code.To build Cloudkibo application is built using Grunt (http://gruntjs.com/) commands.
Then this folder is deployed to server for production.

Cloudkio uses Nodejs (https://nodejs.org/) as its server and Angularjs (https://angularjs.org/) as its Client. 
All server side libraries are istalled using npm commands, these libraries are saved in node_modues folder. 
On server side, libraries are defined in package.json. These can be installed using bower command and are defined in bower.js.

Our database is managed by moongoDB. After defining database in mongodb, 
write the respective database connection strings in files in server/config/environment

## Architecture
Cloudkibo application uses purchased droplet from digitalocean (https://www.digitalocean.com/) for deployment. 
Our database is running in same droplet as of our application. For sending emails, we have integrated application with sendgrid service.
Turn server is running on following IP address 45.55.232.65 and this droplet is name as “kibosupporttest”

## Design
## Implementation

To run Cloudkibo application follow the steps bellow
>Step-1 
Install nodejs, mongodb, forever, grunt, npm, bower

>Step-2
clone the application from the github

>Step-3
Run npm install command to install server libraries

>Step-4
Run bower install command to install angularjs dependencies

>Step-5
To run development version: node server/app.js

>Step-5
To run production version: node dist/server/app.js



Run using forever to make it run continuously
In the app.js file, you can set the running mode either as production or as development

SSL certificates are stored in server/security and can be defined in app.js file

## Administration

Cloudkibo super user account is for Cloudkibo owner. 
This is administrator account and administrator sets application configurtions for sepecific Cloudkibo features.
Super user can modify certain cloudkibo features from there, or remove user accounts. It can see acounts created and removed and can view happenings n Cloudkibbo application.
There is no way to make super user account from user interface, this is secure and one needs to create manual user account at cloudkibo, then we can change the role from database manually for that user to be super user.
This is for security reasons.

## Integration

Integrating libraries for Cloukibo is way simples. It only require to run npm install and bower install commands and this install all libraries.
Sendgrid api is accessed using nodejs library and Cloudkibo have username and password which can be changed from super user account
Cloudkibo can define addresses of TURN server in client/components/kibortc/rtcconfig.service.js.


Cloudkibo has feature to register with Windos, Facebook and Google accounts. The integration with facebook, google and windows is done on server side 
and all the credentials are defined on the super user UI. Super user has all right to change the configuration.


Application is integrated with shippable which automatically runs all the tests on each github commit and sends the email on test failure
Shippable uses the grunt file to run the tests. All the automated processes run by shippable are defined in grunt file.
