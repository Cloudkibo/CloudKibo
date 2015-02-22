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
                listUsers: '/api/users/',

                /**
                 * Deletes the user
                 *
                 */
                deleteUsers: '/api/user/:id',

                /**
                 * Get user profile
                 *
                 */
                getListOfUser: '/api/user/me',

                /**
                 * Changes user's password
                 *
                 */
                changeUserPassword: '/api/user/:id/password',

                /**
                 * Get single user
                 *
                 */
                getSingleUser: '/api/user/:id',

                /**
                 * Create new user
                 *
                 */
                newUser: '/api/user/',

                /**
                 * Update user image
                 *
                 */
                imageUpdate: '/api/user/userimage/update',

                /**
                 * Get user image
                 *
                 */
                getUserImage: '/api/user/userimage/:image',

                /**
                 * Change user profile
                 *
                 */
                changeUserProfile: '/api/user/update',

                /**
                 * Search by user name
                 *
                 */
                searchByUsername: '/api/user/searchbyusername',

                /**
                 * Search by user email
                 *
                 */
                searchByUserEmail: '/api/user/searchbyuseremail',

                /**
                 * Invite by email
                 *
                 */
                inviteContactByEmail: '/api/user/invitebyemail',

                /**
                 * Initial testing of webcam and webRTC support is done here
                 *
                 */
                initialTesting: '/api/user/initialtestingdone',

                /**
                 * Sets the status message of user
                 *
                 */
                statusMessage: '/api/user/setstatusmessage',

                /**
                 * Password reset route
                 *
                 */
                resetPasswordRequest: '/api/user/resetpasswordrequest',

                /**
                 * When user gives new password
                 *
                 */
                newPassword: '/api/user/changepassword',

                /**
                 * Save username, email and phone number for Federated authenticated user
                 *
                 */
                saveUserDetailForFedreatedAuthentiaation: '/api/user/saveusername'

            },

            contacts : {

                /**
                 * Returns contact list of user
                 *
                 */
                contactListOfUser: '/api/contactslist/',

                /**
                 * Retrun list of pending add request
                 *
                 */
                pendingAddRequest: '/api/contactslist/pendingcontacts',

                /**
                 * Add contact with cloudkibo username
                 *
                 */
                addContactByName: '/api/contactslist/addbyusername',

                /**
                 * Add contact with email address
                 *
                 */
                addContactByEmail: '/api/contactslist/addbyemail',

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
                 * feedback from visitor/user
                 *
                 */
                feedbackByUser: '/api/feedback/'
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
