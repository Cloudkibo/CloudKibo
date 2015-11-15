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

![Architecture](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/architecture.PNG)

## Design

![Client](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/client-design-diagramm.PNG)

![Server](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/Server-Architecture.PNG)
## Implementation

![Implementation steps](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/Design.PNG)

#### Install nodejs

In order to get this version, we just have to use the apt package manager. We should refresh our local package index prior and then install from the repositories:


    sudo apt-get update
    sudo apt-get install nodejs
    sudo ln -s `which nodejs` /usr/local/bin/node

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

#### Install Git

    sudo apt-get update
    sudo apt-get install git

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

### Implementing and Integrating TURN server

We would install the rfc5766-turn-server, an open-source project, on Ubuntu

Step 1: Install the dependencies

    sudo apt-get install libssl-dev
    sudo apt-get install libevent-dev

Step 2: Download the tar file and untar it

    wget http://turnserver.open-sys.org/downloads/v3.2.5.9/turnserver-3.2.5.9-debian-wheezy-ubuntu-mint-x86-64bits.tar.gz
  
You can download the latest version by going to the downloads section in this link: https://code.google.com/p/rfc5766-turn-server

Now, open it up.

    tar xfz turnserver-3.2.5.9-debian-wheezy-ubuntu-mint-x86-64bits.tar.gz

You would get *.deb file and INSTALL file. 

Step 3: Installation

    sudo apt-get update
    sudo apt-get install gdebi-core

If you get unmet dependency error on above command then run the following command before running this command.

    sudo apt-get -f install

Next, we would use gdebi with *.deb file.

    sudo gdebi rfc5766*.deb 

It will install the TURN on your file system. It would put documentations, binaries and configuration files in different directories. You would like to read some documentation in /usr/share/doc/rfc5766-turn-server directory.
Also check following manuals.

    man turnserver
    man turnadmin
    man turnutils

Step 4: Configuration
Edit this file /etc/turnserver.conf. Leave everything as it is and write the following statement in it.
    listening-ip=<your IP address>
We would use the long term credentials. For this, you need to edit this file /etc/turnuserdb.conf. Insert the following statement in this file.

    username:password

Now, in order to run turn server as a daemon, edit this file /etc/default/rfc5766-turn-server and make sure following is set to 1.

    TURNSERVER_ENABLED=1

Step 5: Start the server

Go to this directory /usr/bin and run the following command to start the server.

    turnserver -o -a -r -f

### Sendgrid Integration

Sendgrid is an email service provider api which CloudKibo uses to send automatic emails to users. In package.json file, we have defined which version of sendgrid api we integrate with our server. Simple npm install command would work and install this module along with all other required modules. The username and password is given to us by Sendgrid which is provided when we use this API. We have stored the username and password in database so that super user can easily modify them according to need:

![send grid](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/sendgrid.PNG)

### Integration with Facebook, Google and Windows

CloudKibo is integrated with Facebook, Google and Windows for authentication purposes. All the secrets and keys are defined in database so that they can be easily changed by super user.

Facebook:

![facebook](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/facebook.PNG)

Google

![google](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/google.PNG)

Windows

![windows](https://github.com/Cloudkibo/CloudKibo/blob/master/cloudkibo_documentation/windows.PNG)

### Mongodb Integration

Assuming that mongodb has been installed using steps provided in above section, we would need to create database now. Use the following command in mongo console to create database named cloudkibo:

    use cloudkibo

Use the following steps to create username and password for that database and run mongo server in authentication mode:
(http://docs.mongodb.org/manual/tutorial/enable-authentication-without-bypass/)

#### Procedure

##### Start the MongoDB instance without authentication.

Start the mongod or mongos instance without the authorization or keyFile setting. For example:

    mongod --port 27017 --dbpath /data/db1

For details on starting a mongod or mongos, see Manage mongod Processes or Deploy a Sharded Cluster.

##### Create the system user administrator.

Add the user with the userAdminAnyDatabase role, and only that role.
The following example creates the user siteUserAdmin user on the cloudkibo database:

    use cloudkibo
    db.createUser(
      {
        user: "siteUserAdmin",
        pwd: "password",
        roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
      }
    )


##### Re-start the MongoDB instance with authentication enabled. 

Re-start the mongod or mongos instance with the authorization or keyFile setting. Use authorization on a standalone instance. Use keyFile on an instance in a replica set or sharded cluster.
The following example enables authentication on a standalone mongod using the authorization command-line option:

    mongod --auth --config /etc/mongodb/mongodb.conf

##### Create additional users. 

Log in with the user administrator’s credentials and create additional users. See Manage User and Roles.



















