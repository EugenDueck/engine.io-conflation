var eio = require('../../engine.io/index')
  , eioc = require('engine.io-client')
  , expect = require('expect.js')
  , createConflater = require('../main').createConflater;

var listen = function listen(opts, fn) {
  if ('function' == typeof opts) {
    fn = opts;
    opts = {};
  }

  var e = eio.listen(null, opts, function () {
    fn(e.httpServer.address().port);
  });

  return e;
}

var asIsConflater = createConflater(function asIsConflater(messages) {
  return messages; });

var droppingConflater = createConflater(function droppingConflater(messages) {
  return []; });

var dropEveryOtherMessageConflater = createConflater(function localScope() {
  var other = false;
  return function droppingConflater(messages) {
      return messages.filter(function (msg) { other = !other; return other; });
  }}());

var upCasingConflater = createConflater(function upCasingConflater(messages) {
  return messages.map(function (msg) { return msg.toUpperCase(); }); });

var duplicatingConflater = createConflater(function upCasingConflater(messages) {
  return messages.reduce(function (acc, msg) { acc.push(msg); acc.push(msg); return acc; }, []); });

describe('conflation', function(){

  describe('pass-through conflater', function(){

    it('should let a single message pass through as is', function(done) {
      var engine = listen(function (port) {
        var socket = new eioc.Socket('ws://localhost:' + port)
          , expected = ['a']
          , i = 0;

        engine.on('flush', asIsConflater);

        engine.on('connection', function (conn) {
          conn.send('a');

          conn.on('close', function () {
            // since close fires right after the buffer is drained
            setTimeout(function () {
              expect(i).to.be(expected.length);
              done();
            }, 50);
          });

          conn.close();
        });

        socket.on('open', function () {
          socket.on('message', function (msg) {
              expect(msg).to.be(expected[i++]);
          });
        });
      });
    });

    it('should let multiple messages pass through as is', function(done) {
      var engine = listen(function (port) {
        var socket = new eioc.Socket('ws://localhost:' + port)
          , expected = ['a', 'b', 'c', 'd']
          , i = 0;

        engine.on('flush', asIsConflater);

        engine.on('connection', function (conn) {

          conn.send('a');
          conn.send('b');

          // also send some of the messages in a later batch
          setTimeout(function () {
            conn.send('c');
            conn.send('d');

            setTimeout(function () {
              conn.close();
            }, 50);
          }, 50);

          conn.on('close', function () {
            // since close fires right after the buffer is drained
            setTimeout(function () {
              expect(i).to.be(expected.length);
              done();
            }, 50);
          });

        });

        socket.on('open', function () {
          socket.on('message', function (msg) {
              expect(msg).to.be(expected[i++]);
          });
        });
      });
    });

  });

  describe('duplicating conflater', function(){

    it('should duplicate a single message', function(done) {
      var engine = listen(function (port) {
        var socket = new eioc.Socket('ws://localhost:' + port)
          , expected = ['a', 'a']
          , i = 0;

        engine.on('flush', duplicatingConflater);

        engine.on('connection', function (conn) {
          conn.send('a');

          conn.on('close', function () {
            // since close fires right after the buffer is drained
            setTimeout(function () {
              expect(i).to.be(expected.length);
              done();
            }, 50);
          });

          conn.close();
        });

        socket.on('open', function () {
          socket.on('message', function (msg) {
              expect(msg).to.be(expected[i++]);
          });
        });
      });
    });

    it('should duplicate multiple messages', function(done) {
      var engine = listen(function (port) {
        var socket = new eioc.Socket('ws://localhost:' + port)
          , expected = ['a', 'a', 'b', 'b', 'c', 'c', 'd', 'd']
          , i = 0;

        engine.on('flush', duplicatingConflater);

        engine.on('connection', function (conn) {

          conn.send('a');
          conn.send('b');

          // also send some of the messages in a later batch
          setTimeout(function () {
            conn.send('c');
            conn.send('d');

            setTimeout(function () {
              conn.close();
            }, 50);
          }, 50);

          conn.on('close', function () {
            // since close fires right after the buffer is drained
            setTimeout(function () {
              expect(i).to.be(expected.length);
              done();
            }, 50);
          });

        });

        socket.on('open', function () {
          socket.on('message', function (msg) {
              expect(msg).to.be(expected[i++]);
          });
        });
      });
    });

  });

  describe('message dropping conflater', function(){

    it('should swallow a single message', function(done) {
      var engine = listen(function (port) {
        var socket = new eioc.Socket('ws://localhost:' + port)
          , expected = []
          , i = 0;

        engine.on('flush', droppingConflater);

        engine.on('connection', function (conn) {
          conn.send('a');

          conn.on('close', function () {
            // since close fires right after the buffer is drained
            setTimeout(function () {
              expect(i).to.be(expected.length);
              done();
            }, 50);
          });
          conn.close();
        });

        socket.on('open', function () {
          socket.on('message', function (msg) {
              expect(msg).to.be(expected[i++]);
          });
        });
      });
    });

    it('should swallow multiple messages', function(done) {
      var engine = listen(function (port) {
        var socket = new eioc.Socket('ws://localhost:' + port)
          , expected = []
          , i = 0;

        engine.on('flush', droppingConflater);

        engine.on('connection', function (conn) {
          conn.send('a');
          conn.send('b');

          // also send some of the messages in a later batch
          setTimeout(function () {
            conn.send('c');
            conn.send('d');
            conn.on('close', function () {
              // since close fires right after the buffer is drained
              setTimeout(function () {
                expect(i).to.be(expected.length);
                done();
              }, 50);
            });
            setTimeout(function () {
              conn.close();
            }, 50);
          }, 50);
        });

        socket.on('open', function () {
          socket.on('message', function (msg) {
              expect(msg).to.be(expected[i++]);
          });
        });
      });
    });

    it('should drop every other message', function(done) {
      var engine = listen(function (port) {
        var socket = new eioc.Socket('ws://localhost:' + port)
          , expected = ['a', 'c']
          , i = 0;

        engine.on('flush', dropEveryOtherMessageConflater);

        engine.on('connection', function (conn) {

          conn.send('a');
          conn.send('b');

          // also send some of the messages in a later batch
          setTimeout(function () {
            conn.send('c');
            conn.send('d');

            setTimeout(function () {
              conn.close();
            }, 50);
          }, 50);

          conn.on('close', function () {
            // since close fires right after the buffer is drained
            setTimeout(function () {
              expect(i).to.be(expected.length);
              done();
            }, 50);
          });

        });

        socket.on('open', function () {
          socket.on('message', function (msg) {
              expect(msg).to.be(expected[i++]);
          });
        });
      });
    });

  });

  describe('message modifying conflater', function(){

    it('should upcase a single message', function(done) {
      var engine = listen(function (port) {
        var socket = new eioc.Socket('ws://localhost:' + port)
          , expected = ['A']
          , i = 0;

        engine.on('flush', upCasingConflater);

        engine.on('connection', function (conn) {
          conn.send('a');

          conn.on('close', function () {
            // since close fires right after the buffer is drained
            setTimeout(function () {
              expect(i).to.be(expected.length);
              done();
            }, 50);
          });

          conn.close();
        });

        socket.on('open', function () {
          socket.on('message', function (msg) {
              expect(msg).to.be(expected[i++]);
          });
        });
      });
    });

    it('should upcase multiple messages', function(done) {
      var engine = listen(function (port) {
        var socket = new eioc.Socket('ws://localhost:' + port)
          , expected = ['A', 'B', 'C', 'D']
          , i = 0;

        engine.on('flush', upCasingConflater);

        engine.on('connection', function (conn) {

          conn.send('a');
          conn.send('b');

          // also send some of the messages in a later batch
          setTimeout(function () {
            conn.send('c');
            conn.send('d');

            setTimeout(function () {
              conn.close();
            }, 50);
          }, 50);

          conn.on('close', function () {
            // since close fires right after the buffer is drained
            setTimeout(function () {
              expect(i).to.be(expected.length);
              done();
            }, 50);
          });

        });

        socket.on('open', function () {
          socket.on('message', function (msg) {
              expect(msg).to.be(expected[i++]);
          });
        });
      });
    });

  });

});