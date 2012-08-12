exports.createConflater = function createConflater(conflater) {
  return function conflateOnFlush(socket, writeBuffer) {
    
    var nonMessages = [];
    var messages = [];

    for (var i = 0, l = writeBuffer.length; i < l; i++) {
      var current = writeBuffer[i];
      if (current.type === 'message') {
        messages.push(current.data);
      } else {
        nonMessages.push(current);
      }
    }

    if (messages.length > 0) {
      messages = conflater(messages);

      messages = Array.prototype.map.call(messages, function(msg) { return { type: 'message', data: msg }; }, []);
      writeBuffer.length = 0;
      Array.prototype.push.apply(writeBuffer, nonMessages);
      Array.prototype.push.apply(writeBuffer, messages);
    }
  };
}
