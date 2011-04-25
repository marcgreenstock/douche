var wsdl = require('./wsdl');

var Client = function(wsdl_url) {
  this.wsdl = new wsdl(wsdl_url);
}

module.exports = Client;
