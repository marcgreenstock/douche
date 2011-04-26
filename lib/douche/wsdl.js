var url = require('url'),
    http = require('http'),
    xml2js = require('xml2js');

var WSDL = function(href) {
  this.href = href;
  this.target_namespace = '';
  this.namespaces = {};
  this.operations = {};
  this.endpoint = '';
  this.element_form_default = 'unqualified';
}

module.exports = WSDL;

WSDL.prototype.parse = function(cb) {
  var self = this;
  
  this._get(function(err,xml) {
    self._read_namespaces(xml['@']);
    self._read_xml(xml);
    cb(self);
  });
}

WSDL.prototype._read_xml = function(attrs) {
  var self = this;  
  
  var types_tag = this._read_tag(attrs,'types','http://schemas.xmlsoap.org/wsdl/');
  var schema_tag = this._read_tag(types_tag,'schema','http://www.w3.org/2001/XMLSchema');
  
  this.element_form_default = schema_tag['@']['elementFormDefault'] || this.element_form_default;
  
  var binding_tag = this._read_tag(attrs,'binding','http://schemas.xmlsoap.org/wsdl/');
  var operation_tag = this._read_tag(binding_tag,'operation','http://schemas.xmlsoap.org/wsdl/');
  
  if(operation_tag instanceof Array) {
    operation_tag.forEach(function(operation_tag,index) {
      var name = operation_tag['@']['name'];
      var soap_action = self._read_tag(operation_tag,'operation','http://schemas.xmlsoap.org/wsdl/soap/')['@']['soapAction'];
      self.operations[name] = {
        soap_action: soap_action
      };
    });
  } else {
    var name = operation_tag['@']['name'];
    var soap_action = self._read_tag(operation_tag,'operation','http://schemas.xmlsoap.org/wsdl/soap/')['@']['soapAction'];
    self.operations[name] = {
      soap_action: soap_action
    };
  }
  
  var service_tag = this._read_tag(attrs,'service','http://schemas.xmlsoap.org/wsdl/');
  var port_tag = this._read_tag(service_tag,'port','http://schemas.xmlsoap.org/wsdl/');
  this.endpoint = this._read_tag(port_tag,'address','http://schemas.xmlsoap.org/wsdl/soap/')['@']['location'];
  return;
}

WSDL.prototype._read_tag = function(attrs,tag_name,namespace) {
  for(var prefix in this.namespaces) {
    if(namespace == this.namespaces[prefix]) {
      if(prefix == '_xmlns' && attrs[tag_name]) {
        return attrs[tag_name];
      } else if(attrs[prefix + ':' + tag_name]) {
        return attrs[prefix + ':' + tag_name];
      }
    }
  }
  return false;
}

WSDL.prototype._read_namespaces = function(attrs) {
  var self = this;
  attrs.forEach(function(url,index) {
    if(index == 'targetNamespace') {
      self.target_namespace = url;
    }
    if(index == 'xmlns') {
      self.namespaces['_xmlns'] = url;
    }
    if(index.indexOf('xmlns:') == 0) {
      self.namespaces[index.split(':')[1]] = url;
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