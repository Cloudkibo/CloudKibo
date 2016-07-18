***One to One Call Flow - Developers Document***

The caller device should send the following variables with 'callthisperson' message.

- callerphone
- calleephone

Server would send the acknowledgement to the caller with following variables.

- status : 'ok'
- calleephone

Caller should wait for 15 seconds, if there is no ack message from server, then the call should be terminated automatically.

Server, after sending ack message to sender, would check the presence of the callee on socket.io room. If callee is not online, the server would send the message 'message' to caller with following variables:

- msg
- - calleephone
- - callerphone
- - status : 'calleeoffline'

If callee is online, server would send the message 'areyoufreeforcall' message to callee with following variables.

- callerphone
- calleephone

If callee is busy in other call, then the callee device should send the following message to server 'message' with following variables:

- to
- msg
- - callerphone
- - calleephone
- - status : 'calleeisbusy'

If callee is available for call, then the callee device should send the message 'message' to server with following variables:

- to
- msg
- - callerphone
- - calleephone
- - status : 'calleeisavailable'

Caller device should show to user that other side (callee) is now ringing. Caller should wait for callee to pick or reject the call.

If the callee rejects the call, then device should send the message 'message' to server with following variables:

- to
- msg
- - callerphone
- - calleephone
- - status : 'callrejected'

If the callee accepts the call, then device should send the message 'message' to server with following variables:

- to
- msg
- - callerphone
- - calleephone
- - status : 'callaccepted'

The caller should generated the random room name and then send the message 'message' to server with following variables:

- to
- msg
- - callerphone
- - calleephone
- - type : 'room_name'
- - room_name : random room name

Both the caller and callee should join the room and signaling should start. In the mean time, when callee is ringing, the caller can switch on the video or switch it off. Signaling should take care of this and inform callee that video is being shared or not by caller. Signaling data flow is standard as defined by webrtc and there is no change in this.


[Flow Chart](https://www.lucidchart.com/publicSegments/view/3cc925a4-16db-4c1c-a3e4-9110f5ae0a15/image.png)
