var $ = window.$ = require('jquery');
var Visualize = require('./visualize').Visualize;
var visualize;
var btc = window.btc = require("./lib/bitcoin");
var Wallet = require('./wallet').Wallet;
var wallet;
var ApplianceShim = require('appliance_shim').ApplianceShim;
var best;

var start = function (time) {
  var attempts = parseInt(window.localStorage.getItem('attempts'), 10) || 0;
  wallet.on('progress', function(e){
    $("#latest").html(e.result.diff.join(', '));
    best = Wallet.vs(e.result, best);
    if (best.key === e.result.key) {
      visualize.generate(best.key);
      localStorage.setItem('best', JSON.stringify(best));
    }
    attempts += parseInt(e.attempts, 10);
    localStorage.setItem('attempts', attempts);
    $("#best").html(best.attempt.join(":") + " - " + best.matches + " out of 20");
    $("#attempts").html(attempts);
  });
  wallet.runAttack(time);
  wallet.getValueUSD(function(err, res){
    $("#price").html(Wallet.formatUSD(res));
  })
}

window.btcr = {
  wallet: wallet
  , Wallet: Wallet
  , btc: btc
  , start: start
}

function clickAndHold(el, callback) {
  var timeoutId = 0;
  el.mousedown(function() {
    timeoutId = setTimeout(callback, 2000);
  }).bind('mouseup mouseleave', function() {
    clearTimeout(timeoutId);
  });
}

$(document).ready(function(){
  wallet = new Wallet(location.hash.slice(1));
  start(3000);
  var Appliance = new ApplianceShim();
  Appliance.setOrientation("L")
  var el = $("#backgroundCanvas");
  var width = window.innerWidth;
  var height = window.innerHeight;
  el.width(width).height(height);
  el.attr('width', width).attr('height', height);
  visualize = new Visualize(document.getElementById('backgroundCanvas'))
  best = window.localStorage.getItem('best');
  if (best) {
    best = JSON.parse(best);
    console.log(best);
    visualize.generate(best.key);
  }
  clickAndHold($('#price'), function(){
    localStorage.removeItem('best');
    localStorage.removeItem('attempts');
  });

})
