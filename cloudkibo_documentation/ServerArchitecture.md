## CloudKibo Server Side Files and Folders Structure

## API (Folder)

**/callrecord/callrecord.model.js**

File Description: Code for MongoDB Collection for Calls Data

File Category: Mongodb model

**/contactlist/contactlist.controller.js**

File Description: Route Handlers for Contact List

File Category: Route Handlers

**/contactlist/contactlist.model.js**

File Description: Code for MongoDB Collection for Contact List

File Category: MongoDB model

**/contactlist/index.js**

File Description: Indexes the REST URIs for contact list

File Category: REST API URI Index

**/feedback/feedback.model.js**

File Description: Code for MongoDB Collection for Feedback Data

File Category: MongoDB model

**/meetingrecor/meetingrecord.model.js**

File Description: Code for MongoDB Collection for Meeting Data

File Category: MongoDB model

**/news/news.model.js**

File Description: Code for MongoDB Collection for News Data

File Category: MongoDB model

**/tokens/passwordresettoken.model.js**

File Description: Code for MongoDB Collection for password tokens

File Category: MongoDB model

**/tokens/verificationtoken.model.js**

File Description: Code for MongoDB Collection for verification tokens

File Category: MongoDB model

**/user/index.js**

File Description: Indexes the REST URIs for User

File Category: REST API URI Index

**/user/user.controller.js**

File Description: Route Handlers for User

File Category: Route Handlers

**/user/user.model.js**

File Description: Code for MongoDB Collection for User

File Category: MongoDB model

**/user/user.model.spec.js**

File Description: Test Code

File Category: Test Code

**/userchat/index.js**

File Description: Indexes the REST URIs for Chat

File Category: userchat

**/userchat/meetingchat.controller.js**

File Description: Route Handlers for Chat

File Category: Route Handlers

**/userchat/meetingchat.model.js**

File Description: Code for MongoDB Collection for Chat

File Category: MongoDB model

### Auth (Folder)


**/auth.service.js**

File Description: Has the code to assign the tokens, check roles, sets token cookies, and checks authentication status of client side

File Category: Authentication

**/index.js**

File Description: Indexes the URIs for authentication

File Category: REST API URI Index

**/facebook/index.js**

File Description: Route Handlers for authentication

File Category: Facebook

**/facebook/passport.js**

File Description: Uses Passport for authentication and user data

File Category: Facebook

**/google/index.js**

File Description: Route Handlers for authentication

File Category: Google

**/google/passport.js**

File Description: Uses Passport for authentication and user data

File Category: Google

**/local/index.js**

File Description: Route Handlers for authentication

File Category: Local

**/local/passport.js**

File Description: Uses Passport for authentication and user data

File Category: Local

**/windowslive/index.js**

File Description: Route Handlers for authentication

File Category: Windows

**/windowslive/passport.js**

File Description: Uses Passport for authentication and user data

File Category: Windows

### Components (Folder)

**errors/index.js**

File Description: Error

File Category: Errors

### Config (Folder)

**/express.js**

File Description: ExpressJS Framework configuration code

File Category: Config

**/socket.io**

File Description: Server-Side Socket.io Code is done here

File Category: Socket.io

**/local.env.js**

File Description: 

File Category: Config

**/local.env.sample.js**

File Description: 

File Category: Config

**/enviornment/development.js**

File Description: Configurations for mongodb & others

File Category: environment configuration

**/environment/index.js**

File Description: Facebook, Google App Keys & other configuration

File Category: environment configuration

**/environment/production.js**

File Description: Configurations for mongodb & others

File Category: enviornment configuration

**/environment/test.js**

File Description: Configurations for mongodb & others

File Category: environment configuration

### View

**/404.jade**

File Description: Resources not found

File Category: Views

**/adminlogin.jade**

File Description: Admin Login Page

**/adminregistration.jade**

File Description: Admin Sign Up Page

**/app.jade**

File Description:Main Application Page, most of other jade files will be angular partials in this page.

**/displayuser.jade**

File Description: 

**/features.jade**

File Description: Features of CloudKibo are described for visitors

**/forgotpassword.jade**

File Description: 

**/header.jade**

File Description: Header Pane of Main View, contains the view code for Log out buttons. It is the main header

**/home.jade**

File Description: Main partial file for application, most of the CloudKibo view code is in this partial

**/index.jade**

File Description: Home Page for Visitors

**/livehelp.jade**

File Description: View Code for LiveHelp Page

**/login.jade**

File Description: Login Page

**/meetingroom.jade**

File Description: View Code for Meeting Page

**/newpassword.jade**

File Description: 

**/passwordrest-failure.jade**

File Description:

**/register.jade**

File Description: Registration Page

**/superuser.jade**

File Description: Super User Home Page

**/tabcontents.jade**

File Description: Menu which is below the header is coded here

**/userview.jade**

File Description: 

**/verification-faliure.jade**

File Description: 

**/verification-success.jade**

File Description: 

**/videocall.jade**

File Description: View Code for Video Call Page

**/viewschema.jade**

File Description: Super User page for looking inside tables
