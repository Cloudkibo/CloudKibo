/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var CompanyAccount = require('./companyaccount.model.js');

exports.register = function(socket) {
  CompanyAccount.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  CompanyAccount.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}


function createListener(event, socket) {
  return function(doc) {
    socket.emit(event, doc);
  };
}

function removeListener(event, listener) {
  return function() {
    CompanyaccountEvents.removeListener(event, listener);
  };
}
