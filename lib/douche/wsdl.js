var url = require('url'),
    http = require('http'),
    xml2js = require('xml2js');

var WSDL = function(href) {
  this.href = href;
  this.target_namespace = '';
  this.namespaces = {};
  this.operations = {};
  this.element_form_default = 'unqualified';
}

module.exports = WSDL;

WSDL.prototype.parse = function(cb) {
  var self = this;
  
  this._get(function(err,xml) {
    self._read_namespaces(xml['@']);
    self._read_tag(xml);
    
    console.log(self.operations);
  });
}

WSDL.prototype._read_tag = function(attrs, parent_path) {
  parent_path = parent_path == undefined ? [] : parent_path;
  
  var prefixes = {
    soap: '',
    wsdl: '',
    xsd: ''
  };
  
  this.namespaces.forEach(function(prefix,url) {
    if(prefix != '_xmlns') {
      if(url.indexOf('http://schemas.xmlsoap.org/wsdl/soap') == 0) {
        prefixes.soap = prefix + ':';
      }
      if(url.indexOf('http://schemas.xmlsoap.org/wsdl') == 0) {
        prefixes.wsdl = prefix + ':';
      }
      if(url.indexOf('http://www.w3.org/2001/XMLSchema') == 0) {
        prefixes.xsd = prefix + ':';
      }
    }
  });
  
  for(var tag in attrs[prefixes.wsdl + 'types']) {
    if(prefixes.xsd + tag == 'schema') {
      this.element_form_default = attrs[prefixes.wsdl + 'types'][tag]['@']['elementFormDefault'];
      break;
    }
  }
  
  for(var tag in attrs[prefixes.wsdl + 'binding']) {
    if(tag == prefixes.wsdl + 'operation') {
      var name = attrs[prefixes.wsdl + 'binding'][tag]['@']['name'];
      var location = attrs[prefixes.wsdl + 'binding'][tag][prefixes.soap + 'operation']['@']['soapAction'];
      
      this.operations[name] = {
        location: location
      };
    }
  }
  
  return;
}

WSDL.prototype._read_namespaces = function(attrs) {
  var self = this;
  attrs.forEach(function(value,index) {
    if(index == 'targetNamespace') {
      self.target_namespace = value;
    }
    if(index == 'xmlns') {
      self.namespaces[value] = '';
    }
    if(index.indexOf('xmlns:') == 0) {
      self.namespaces[value] = index.split(':')[1];
    }
  });
}

WSDL.prototype._get = function(cb) {
  var url_parts = url.parse(this.href);
  
  http.get({
    host: url_parts.host,
    port: url_parts.port || 80,
    path: (url_parts.pathname || '/') + (url_parts.search || ''),
  }, function(res) {
    var xml = '';
    res.setEncoding('utf8');
    res.on('data',function(chunk) {
      xml += chunk;
    }).on('end',function() {
      var parser = new xml2js.Parser();
      parser.parseString(xml);
      cb(null,parser.resultObject);
    });
  }).on('error', function(err) {
    cb(err,null);
  });
}