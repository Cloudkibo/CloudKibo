***Chat Message Status Flow - Developers Document***

The following two variables are added in the table of userchat:

- status    (String)
- uniqueid  (String)

The chat message stanza which is sent to server from device should contain the following fields:

- to
- from:
- fromFullName
- msg
- uniqueid
- status
- type
- file_type

For each chat message, socket server listens for 'im' and replies with callback function (ack). This callback function has following structure:

    {status : 'sent', uniqueid : '<unique id of message>'}

This means the message sent with 'uniqueid' has now reached server. Mobile client should update the chat status. If this acknowledgement is not received by mobile, it means both mobile and server are not connected. Mobile should try sending the message again using sync.

The recipient device should listen 'im' to get chat message. The recipient can receive the message either using socket.io or using sync. In both cases, the recipient will have to send the following structure to server:

    {status : '<delivered or seen>', uniqueid : '<unique id of message>', sender : '<cell number of sender>'}
    // 'delivered' means message is received but not read, 'seen' means message is also read now.

For the above, message server listens for 'messageStatusUpdate'. In callback function, server would send the following structure to recipient:

    {status : 'statusUpdated', uniqueid : '<unique id of message>'}

If this acknowledgement is not received by recipient mobile, it means both mobile and server are not connected. Mobile should try sending the message status again using sync. Mobile client should be responsible to keep track of messages which are delivered to it or read by user but server has not been communicated for this.

The initial sender of the message should always listen for 'messageStatusUpdate'. The server will send the status ('delivered' or 'seen') of the message on this route. The server will send the following structure to sender to acknowledge the new status of message:

    {status : '<delivered or seen>', uniqueid : '<unique id of message>'}

The sender mobile should keep track of message status to keep it updated with what is current on server.
