/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Userchat = require('./meetingchat.model.js');

exports.register = function(socket) {
  Userchat.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Userchat.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('userchat:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('userchat:remove', doc);
}
