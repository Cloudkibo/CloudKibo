## Operation Guide
### Overview
Cloudkibo is developed with strategy  to separate server from client. 
Server side code is separated from Client side code.And to build Cloudkibo application, use Grunt (http://gruntjs.com/) commands.
The built application is stored in dist folder. Then this folder is deployed to server for production.

Cloudkio uses Nodejs (https://nodejs.org/) as its server and Angularjs (https://angularjs.org/) as its Client. 
All server side libraries are istalled using npm install command, these libraries are saved in node_modules folder. 
On server side, libraries are defined in package.json. 

Client side libraries can be installed using [bower install] command and are defined in bower.json.

Our database is managed by moongoDB. Define database in mongodb to 
write the respective database connection strings in files in server/config/environment

## Architecture
Cloudkibo application uses purchased droplet from digitalocean (https://www.digitalocean.com/) for deployment. 
Our database is running in same droplet as of our application. For sending emails, we have integrated application with sendgrid service.
Turn server is running on IP address 45.55.232.65 and this droplet is named as “kibosupporttest”

## Design



## Implementation

![Implementation steps](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/Design.PNG)

#### Install nodejs

In order to get this version, we just have to use the apt package manager. We should refresh our local package index prior and then install from the repositories:


    sudo apt-get update
    sudo apt-get install nodejs

install npm, which is the Node.js package manager

    sudo apt-get install npm

source: https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-an-ubuntu-14-04-server



#### Install MongoDB

First have to import they key for the official MongoDB repository

    $ sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10

After successfully importing the key you will see:

    Output
    gpg: Total number processed: 1
    gpg:              imported: 1  (RSA: 1)

Issue the following command to create a list file for MongoDB
    echo "deb http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" | sudo tee          /etc/apt/sources.list.d/mongodb-org-3.0.list

After adding the repository details, we need to update the packages list

    sudo apt-get update

Now we can install the MongoDB package itself.

    sudo apt-get install -y mongodb-org

After package installation MongoDB will be automatically started. You can check this by running the following command.

    service mongod status

If MongoDB is running, you'll see an output like this (with a different process ID).

    Output
    mongod start/running, process 1611

You can also stop, start, and restart MongoDB using the service command (e.g. service mongod stop, server mongod start).

source: https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-14-04

#### Install Forever

To install forever run the following command:

    npm install forever -g

#### Install Grunt
To install grunt run the following command:

    npm install -g grunt-cli

#### Install Bower

To install bower run the following command:

    npm install -g bower

#### Clone the application on server from github:
    git clone https://www.github.com/Cloudkibo/CloudKibo

Install server side libraries using:

    npm install

Now, install client side libraries using:

    bower install

Now, build the application using grunt command (make sure in app.js file, mode is set to production)

    grunt

In order to run the application, use forever:

    forever start dist/server/app.js

#### Redirect the ports to our application ports
Run following two commands

    iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000
    iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 443 -j REDIRECT --to-port 8443

#### Updates

If there is update in code, then we need to pull the code. Go to folder of CloudKibo using "cd Cloudkibo". Run following commands

    git pull origin master

Now build the application again using command:

    grunt

Stop the server using command: 

    forever stop dist/server/app.js

Start the server again using command:

    forever start dist/server/app.js

SSL certificates are stored in server/security and can be defined in app.js file

## Administration

Cloudkibo super user account is for Cloudkibo owner. 
This is administrator account and administrator sets application configurtion for sepecific Cloudkibo features.
Super user can modify certain cloudkibo features and can remove user accounts. It can see accounts created and can view happenings in Cloudkibbo application.
There is no way to make super user account from user interface, this is secure. One needs to create manual user account at cloudkibo first, then we can change the role from database manually for that user to be super user.
This is for security reasons.

When super user login, a separate tab is shown to the admin "Admin Dashboard"

![Admin Dashboard Tab](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/adminDashboard1.PNG)

Admin can see details like 


  - Username
  - First Name
  - Last Name
  - Email id
  - Phone number
  - Country
  - Role
  - Joining date
  - Option

![Admin Dashboard detail](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/adminDashboard2.PNG)

Admin has option to remove the contact.
Admin can set configuration like:

  - SendGrid Username
  - SendGrid Password
  - Cloudkibo Logo
  - Number of people in Conference
  - Number of people in Contact list
  - Google Id
  - Google secrete

![Admin Dashboard configuration](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/adminDashboard3.PNG)



## Integration

It only require us to run npm install and bower install commands, this install all libraries.
Sendgrid api is accessed using nodejs library and Cloudkibo has username and password which can be changed from super user account.
Cloudkibo can define addresses of TURN server in client/components/kibortc/rtcconfig.service.js.


Cloudkibo has feature to register with Windows, Facebook and Google accounts. The integration with facebook, google and windows is done on server side and all the credentials are defined on the super user UI. Super user has all right to change the configuration.


Application is integrated with shippable which automatically runs all the tests on each github commit and sends the email on test failure.
Shippable uses the grunt file to run the tests and all the automated processes run by shippable are defined in grunt file.
