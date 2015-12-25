## MongoDB structure for Cloudkibo

#### 1. contactslist
This table stores information of contact list of user.

`contactid : {type: Schema.ObjectId, ref: 'accounts'},`  
Unique ideentifier for each contact is stored here.

`unreadMessage : {type: Boolean, default: false },`  
Check if chat message of particular contact is read by user or not

`detailsshared: {type : String, default :'No'}`  
Check if contact has accepted the add reuest and shared the information

#### 2.ConfigurationSchema
This table stores cloudkibo configuration settings.

  `googleid : String,`
  
  `googlesecret : String,`
  
  `facebookid : String,`
  
  `facebooksecret : String,`
  
  `windowsid : String,`
  
  `windowssecret : String,`
  
  `sendgridusername : String,`
  
  `sendgridpassword : String,`
  
  `selectLogo : { type: String, default: 'Logo 1' },`
  
  `numberofpeopleincontactlist: Number,` max limit to add contacts to contact list
  
  `numberofpeopleinconference: Number,` max number of people in conference
  
  `sitedomain : {type: String},`
  
  `kibodomain : {type: String}`
  
#### 3. callrecord
This table stores information of one to one call

`caller : String,`
name of caller

`callee : String,` name of callee 

`starttime : {type: Date, default: Date.now },` Time when call was started

`endtime : {type: Date, default: Date.now }` Time when call was ended

#### 4. feedbackcall
This table stores feed back that is given by users after the call has ended.

`userid : {type: Schema.ObjectId, ref: 'accounts'},`
Identity of user ho is sending feed back

`audio : Number,` Audio quality quality rating number given by user

`video : Number,` Video quality quality rating number given by user

`screen : Number,` Screen sharing quality quality rating number given by user

`filetransfer : Number,` File transfer quality quality rating number given by user

`comment : String,`  Other comments given by user

`datetime : {type: Date, default: Date.now }`  Time when feedback was sent

#### 5. feedbackvisitor

This table stores feed back provided by any user to Cloudkibo

`name : String,` Name of user sending feed back

`email : String,` email address of user

`message : String,` message sent by user

`datetime : {type: Date, default: Date.now }` time and date when feedback was sent

#### 6. groupuser
This table stores all groups information.

`creator_id : {type: Schema.ObjectId, ref: 'accounts'},`
User object who created group
 
`groupid : {type: Schema.ObjectId, ref: 'Groupcall'},`
 Unique identity of group
 
`user_id : {type: Schema.ObjectId, ref: 'accounts'}`
User indentity who are added to group

#### 7. groupcall
This table stores information about group call

`groupname : String,`
Name of group

`groupowner : String,`
Name of owner of the group

`createdate : {type: Date, default: Date.now }`
Group created date

#### 8. meetingrecord
This table stores information of conference call.

`creator : String,`
Name of user who started the coonference

`roomname : String,`
Room name, this name to conference

`members : [String],` 
Name of paticipants in a conference

`starttime : {type: Date, default: Date.now },`
Time when conference was started

`endtime : {type: Date, default: Date.now }`
Time when conference call was ended

#### 9. passwordResetTokenSchema
This table stores information of token to reset a password.

`user : {type: Schema.ObjectId, required: true, ref: 'Account'},`
User object who has sent request to reset password

`token : {type: String, required: true},`
Stores token which will expire after 4 hours from creation.

`createdAt : {type: Date, required: true, default: Date.now, expires: '4h'}`
Request created time

#### 10. Verificationtoken
This table stores information of verification token, when user sign up

`user : {type: Schema.ObjectId, required: true, ref: 'Account'},`
User object who has signed in 

`token : {type: String, required: true},`
Unique token string

`createdAt : {type: Date, required: true, default: Date.now, expires: '4h'}`
time when token was created

#### 11. userchat
This table stores chat of user with the contact.

`to : String` 
Email address of user to which chat is sent

`from : String` 
Email address of user who is sending chat

`fromFullName : String` 
Name address of user who is sending chat

`msg : String`
Chat message sent to user

`date : {type: Date, default: Date.now }` 
Date and time when chat is sent

`owneruser : String` 
Who started the chat, owner of the chat 

#### 12. UserSchema
This table stores information about the user and chan be edited from UI under user profile option.

`username : String,`
Cloudkibo username of user

`firstname : String,`
  First name of user
  
  `lastname : String,`
  Last name of user
  
  `email: { type: String, lowercase: true },`
  Email address of user
  
  `phone : String, `
  Phone number of user
  
  `country : String,`
  Country of user 
  
  `city : String,`
  City where user lives 
  
  `state : String,`
  State where user lives 
  
  `gender : String,`
  Gender of user
  
  `role: {type: String,default: 'user'},`
  Role of user defines the ownership. It can be either user or admin
  
  `fb_photo: String,`
  If user signup via Facebook its facebook photo is stored here
  
  `google_photo: String,`
  If user signup via Google+ its google+ photo is stored here
  
  `windows_photo: String,`
  If user signup via Microsoft account its windows photo is stored here
  
  `isOwner : String,`
  Check if user is Owner
  
  `picture: String,`
  If user signup via signup regular form, Cloudkibo gives option to upload photo and is stored here stored here
  
  `accountVerified : {type: String, default: 'No' },`
  Check if user has verified the account after signup
  
  `date  :  { type: Date, default: Date.now },`
  Date when account was created
  
  `initialTesting : String,`
  Initial testing checks if user audio video settings are set
  
  `status : {type: String, default: 'I am on CloudKibo' },`
  User can update their status
  
  `hashedPassword: String,`
  Account password is stored in hash encryption
  
  `facebook: {},`
  Facebook object of user information is stored here 
  
  `twitter: {},`
  Twitter object of user information is stored here (future implemention) 
  
  `google: {},`
  Google object of user information is stored here 
  
  `windowslive: {},`
  Microsoft object of user information is stored here 
  
  `github: {}`
  Github object of user information is stored here. (future implemention) 



















