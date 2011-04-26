var douche = require('../../douche');

var client = new douche('http://api.search.live.net/search.wsdl');
client.wsdl.parse(function(wsdl) {
  console.log(wsdl);
});

var client = new douche('http://soap.amazon.com/schemas3/AmazonWebServices.wsdl');
client.wsdl.parse(function(wsdl) {
  console.log(wsdl);
});