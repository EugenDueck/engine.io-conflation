engine.io-conflation
====================

An [engine.io](https://github.com/LearnBoost/engine.io) plugin that allows **conflation**, **aggregation**, **modification** and **filtering** of messages just before they get flushed to the socket.

This is especially useful to reduce the size of the payload for **slow consumers** that **cannot keep up with the frequency of messages**, say because they have a low bandwidth connection, or low processing power.

To use it, you have to create a function, lets call it `myConflaterFunction`, and register it by means of `server.on('flush', createConflater(myConflaterFunction)`. Your function will then be called every time the buffered array of messages is to be flushed to the client. The array of messages that `myConflaterFunction` returns will then actually be sent to the client.

# Usage #
---------

A simple example that just changes all messages to upper case:

```
var engine = require('engine.io')
  , server = engine.listen(80)
  , createConflater = require('engine.io-conflation').createConflater;

server.on('connection', function (socket) {
  socket.send('utf 8 string');
});

var myConflaterFunction = function (messages) {
  return messages.map(function (msg) { return msg.toUpperCase(); });
};

server.on('flush', createConflater(myConflaterFunction));

```

In the example above, myConflaterFunction would make the message 'utf 8 string' be sent to the client in upper case.