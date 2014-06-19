var $ = require('jquery');
var btc = require("./lib/bitcoin");
var EventEmitter = require('events').EventEmitter;
var util = require('util')
var OUTPUT_TIME_INTERVAL = 1500;


var Wallet = exports.Wallet = function(address, bestAttempt) {
  var address = this.address = btc.Address(address);
  var attempts = 0;
  var start = Date.now();

  var attempt = function(best) {
    var i, key, result;
    key = new btc.Key();
    result = compare(address, key);
    return vs(result, best)
  }

  this.getValueUSD = function(callback) {
    $.ajax("https://api.biteasy.com/blockchain/v1/addresses/" + address.toString(), {
             success: function(resp){
               var amount = resp.data.balance/Math.pow(10,8);
               $.ajax("http://api.coindesk.com/v1/bpi/currentprice.json", { success: function(resp){
                 callback(null, resp.bpi.USD.rate * amount);
               }, dataType:'json'});
             }
           });
  }

  this.runAttack = function(timeInterval, bestAttempt) {
    var self = this;
    var result = attempt(bestAttempt);
    attempts++;
    if (Date.now() - timeInterval > start) {
      start = Date.now();
      this.emit("progress", {result: result, attempts: attempts})
      result = null;
      attempts = 0;
    }
    setTimeout(function(){self.runAttack(timeInterval, result)},0);
  }
}

util.inherits(Wallet, EventEmitter);

var compare = Wallet.compare = function(addr, key) {
  addr = addr.hash || addr;
  attempt = key.getAddress().hash;
  var i, d, matches = 0, distance = 0, diff = [];
  for(i=0; i < addr.length; i++) {
    d = addr[i] - attempt[i]
    if (d === 0) {
      matches++;
    }
    if (d < 0) {
      // Prevents a bias towards
      // octects in the middle. Ex. 127 would never
      // see a diff of > 127, whereas 0 would have
      // up to 255
      d += 255;
    }
    diff.push(d);
    distance += d;
  }
  return {
    distance: distance
    , key: key.toString()
    , attempt: attempt
    , matches: matches
    , diff: diff
  }
}

var vs = Wallet.vs = function(resultA, resultB) {
  var best = resultA;
  if (!resultB) {
    // ResultA
  } else if (resultA.matches < resultB.matches) {
    best = resultB;
  } else if (resultA.matches === resultB.matches && resultA.distance > resultB.distance) {
    best = resultB;
  }
  return best;
}

Wallet.formatUSD = function(total) {
  var neg = false;
  if(total < 0) {
    neg = true;
    total = Math.abs(total);
  }
  return (neg ? "-$" : '$') +
    parseFloat(total, 10)
    .toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,").toString();
}
