engine.io-conflation
====================

`engine.io-conflation` is an [engine.io](https://github.com/LearnBoost/engine.io) (>= 0.2.0) plugin that makes **[conflation](http://magmasystems.blogspot.jp/2006/08/conflation.html)**, **aggregation**, **alteration** and **filtering** of messages straightforward, especially when it has to based on the client's performance consuming messages from the server.

This is useful to **reduce the size of the payload for slow consumers** that cannot keep up with the frequency of messages, because of a low bandwidth connection, or low processing power. But it is generic enough to allow for not only conflation, i.e. deletion of messages, but also additions and modifications, for whatever purpose that might be useful.

To use it, you have to create a function, lets call it `myConflater`, and register it by means of `server.on('flush', createConflater(myConflater)`.

Your function will then be called every time the buffered array of messages is about to be flushed to the client, which happens only when the client has consumed the previous batch of messages, i.e. the client is ready to receive again. The array of messages that `myConflater` returns is what will then actually be sent to the client.

# Usage #
---------

## A simple example that simply changes all messages to upper case ##

```js
var engine = require('engine.io')
  , server = engine.listen(80)
  , createConflater = require('engine.io-conflation').createConflater;

server.on('connection', function (socket) {
  socket.send('utf 8 string');
});

var myConflater = function (messages) {
  return messages.map(function (msg) { return msg.toUpperCase(); });
};

server.on('flush', createConflater(myConflater));

```

In the example above, `myConflater` would make the message *'UTF 8 STRING'* (upper case) be sent to the client.

## A more realistic example that does conflation ##
```js
var engine = require('engine.io')
  , server = engine.listen(80)
  , createConflater = require('engine.io-conflation').createConflater
  , symbols = [ 'Wheat', 'Corn', 'Soybeans' ]
  , randomInt = function(maxInt) { return Math.floor(Math.random() * maxInt); }

function PriceQuote(symbol, price) {
  this.symbol = symbol;
  this.price = price;
}
// toString() is used by engine.io to serialize the data before sending it
PriceQuote.prototype.toString = function() { return JSON.stringify(this); }

var keepLastQuoteOnlyConflater = function(quotes) {
  var lastQuotes = {};
  for (var i = 0, l = quotes.length; i < l; i++) {
    lastQuotes[quotes[i].symbol] = quotes[i];
  }
  var lastQuotesArray = [];
  for (var grain in lastQuotes)
    lastQuotesArray.push(lastQuotes[grain]);
  return lastQuotesArray;
}

server.on('connection', function (socket) {
  while (true) { // generate random price quotes in rapid succession
    socket.send(new PriceQuote(symbols[randomInt(symbols.length)], 500 + randomInt(50)));
  }
});

server.on('flush', createConflater(keepLastQuoteOnlyConflater));

```

With the above conflater, the client will only get the most recent price quotes when it is ready. Quotes that *come in* while the client is still processing the current buffer will silently overwrite previous quotes with the same `symbol` key, and the client will not receive those overwritten values.

# How it works internally #
---------------------------

`createConflater` returns a function that takes the internal buffer of messages as provided by `engine.io`'s `flush` event. This buffer may contain heartbeats and other low-level messages that the actual conflater is neither interested in nor should mess with. `createConflater` then passes only the high-level messages (i.e. those sent via `socket.send(msg)`) to `myConflater`, so that the latter can work on the level of abstraction that users of `engine.io` normally work on.


# Hacking engine.io-conflation #
--------------------------------

In case you want to start hacking `engine.io-conflation`, start by making sure that the tests run:

```
npm install
make test
```

Then after any code change, make sure the tests still run.