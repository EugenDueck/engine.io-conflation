engine.io-conflation
====================

`engine.io-conflation` is an [engine.io](https://github.com/LearnBoost/engine.io) plugin that makes **[conflation](http://magmasystems.blogspot.jp/2006/08/conflation.html)**, **aggregation**, **modification** and **filtering** of messages straightforward, especially when it has to based on the client's performance consuming messages from the server.

This is especially useful to reduce the size of the payload for **slow consumers** that **cannot keep up with the frequency of messages**, because of a low bandwidth connection, or low processing power.

To use it, you have to create a function, lets call it `myConflaterFunction`, and register it by means of `server.on('flush', createConflater(myConflaterFunction)`.

Your function will then be called every time the buffered array of messages is to be flushed to the client, which happens only when the client has consumed the previous batch of messages, i.e. the client is ready to receive again. The array of messages that `myConflaterFunction` returns is what will then actually be sent to the client.

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

# How it works internally #
---------------------------

`createConflater` returns a function that takes the internal buffer of messages as provided by `engine.io`'s `flush` event. This buffer contains heartbeats and other low-level messages that the actual conflater is neither interested in nor should mess with. `createConflater` then passes only the high-level messages (as sent via `engine.io-client`'s `send(msg)`) to `myConflaterFunction`, so that the latter can work on the level of abstraction that engine.io users normally work on.