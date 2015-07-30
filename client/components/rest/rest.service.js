/**
 * Created by Saba on 02/21/2015.
 */
/**
 * Created by sojharo on 2/3/2015.
 */

'use strict';

angular.module('cloudKiboApp')
    .factory('RestApi', function Sound($rootScope) {

        return {

            user : {

                /**
                 * Get list of users
                 *
                 */
                listUsers: '/api/users/', // www.cloudkibo.com/api/users

                /**
                 * Deletes the user
                 *
                 */
                deleteUsers: '/api/users/:id',

                /**
                 * Get user profile
                 *
                 */
                getListOfUser: '/api/users/me',

                /**
                 * Changes user's password
                 *
                 */
                changeUserPassword: '/api/users/:id/password',

                /**
                 * Get single user
                 *
                 */
                getSingleUser: '/api/users/:id',

                /**
                 * Create new user
                 *
                 */
                newUser: '/api/users/',

                /**
                 * Update user image
                 *
                 */
                imageUpdate: '/api/users/userimage/update',

                /**
                 * Get user image
                 *
                 */
                getUserImage: '/api/users/userimage/:image',

                /**
                 * Change user profile
                 *
                 */
                changeUserProfile: '/api/users/update',

                /**
                 * Search by user name
                 *
                 */
                searchByUsername: '/api/users/searchbyusername',

                /**
                 * Search by user email
                 *
                 */
                searchByUserEmail: '/api/users/searchbyuseremail',

                /**
                 * Invite by email
                 *
                 */
                inviteContactByEmail: '/api/users/invitebyemail',

                /**
                 * Initial testing of webcam and webRTC support is done here
                 *
                 */
                initialTesting: '/api/users/initialtestingdone',

                /**
                 * Sets the status message of user
                 *
                 */
                statusMessage: '/api/users/setstatusmessage',

                /**
                 * Password reset route
                 *
                 */
                resetPasswordRequest: '/api/users/resetpasswordrequest',

                /**
                 * When user gives new password
                 *
                 */
                newPassword: '/api/users/changepassword',

                /**
                 * Save username, email and phone number for Federated authenticated user
                 *
                 */
                saveUserDetailForFedreatedAuthentication: '/api/users/saveusername'

            },

            contacts : {

                /**
                 * Returns contact list of user
                 *
                 */
                contactListOfUser: '/api/contactslist/', // www.cloudkibo.com/api/contactslist/

                /**
                 * Retrun list of pending add request
                 *
                 */
                pendingAddRequest: '/api/contactslist/pendingcontacts',

                /**
                 * Add contact with cloudkibo username
                 *
                 */
                addContactByName: '/api/contactslist/addbyusername', //www.cloudkibo.com/api/contactslist/addbyusername

                /**
                 * Add contact with email address
                 *
                 */
                addContactByEmail: '/api/contactslist/addbyemail', //www.cloudkibo.com/api/contactslist/addbyemail

                /**
                 * Accepts the contact add request
                 *
                 */
                acceptContactRequest: '/api/contactslist/approvefriendrequest',

                /**
                 * Reject the contact add request
                 *
                 */
                rejectContactRequest: '/api/contactslist/rejectfriendrequest',
                /**
                 * Remove contact from contact list
                 *
                 */
                removeFromContactList: '/api/contactslist/removefriend'
            },

            userchat : {
                /**
                 * Bring users chat
                 *
                 */
                userChats: '/api/userchat/',

                /**
                 * Saves contact chat
                 *
                 */
                saveChats: '/api/userchat/save',

                /**
                 * Marks unread message read
                 *
                 */
                markMessageAsRead: '/api/userchat/markasread',

                /**
                 * Removes chat history of the contact
                 *
                 */
                removeChatHistroy: '/api/userchat/removechathistory'
            },

            callrecord : {
                /**
                 * To Do
                 *
                 */
                getCallRecordData: '/api/callrecord/',

                /**
                 * To Do
                 *
                 */
                setCallRecordData: '/api/callrecord/'
            },

            news : {
                /**
                 * To Do
                 *
                 */
                getNews: '/api/news/',

                /**
                 * To Do
                 *
                 */
                saveNews: '/api/news/'
            },

            meetingrecord : {
                /**
                 * To Do
                 *
                 */
                getMeetingRecord: '/api/meetingrecord/',

                /**
                 * To Do
                 *
                 */
                setMeetingRecord: '/api/meetingrecord/'
            },

            auth : {
                /**
                 * Local Authentication
                 *
                 */
                local: '/auth/local/',

                /**
                 * Facebook Authentication
                 *
                 */
                facebook: '/auth/facebook/',

                /**
                 * Windows Authentication
                 *
                 */
                windowslive: '/auth/windowslive/',

                /**
                 * Google Authentication
                 *
                 */
                google: '/auth/google/'
            },

            feedback : {
                /**
                 * feedback from user after call
                 *
                 */
                feedbackByUser: '/api/feedback/',

                /**
                 * feedback from any visitor from contacts page
                 *
                 */
                feedbackByVisitor: '/api/feedback/visitor'
            },

            extensionlink : {
                /**
                 * screen sharing extension link
                 *
                 */
                screenSharingExtension: 'https://chrome.google.com/webstore/detail/hjfejjmhpakdodimneibbmgfhfhjedod'
            }

        };
    });
