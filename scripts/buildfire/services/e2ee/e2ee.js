if (typeof (buildfire) === 'undefined') throw ('please add buildfire.js first to use BuildFire services');

if (typeof (buildfire.services) === 'undefined') buildfire.services = {};
if (typeof (buildfire.services.e2ee) === 'undefined') buildfire.services.e2ee = {};

buildfire.services.e2ee = {
  generate: function (pinCode, callback) {
    if (!pinCode) {
      throw new Error("A pin code is required to initiate a new keys pair.");
    }
    if (!/^\d{6}$/.test(pinCode)) {
      throw new Error("The pin code must be exactly 6 digits.");
    }
    
    var packetId = null;
    var command = "e2ee.generate";
    
    var packet = new Packet(packetId, command, {pinCode});
    
    buildfire._sendPacket(packet, callback);
    
  },
  
  showPinCode: function (options, callback) {
    options = options || {};
    if (!options.id) {
      throw new Error("Id is required");
    }
    var packetId = null;
    var command = "e2ee.showPinCode";
    
    var packet = new Packet(packetId, command, options);
    
    buildfire._sendPacket(packet, callback);
    
  },
  
  retrieve: function (pinCode, callback) {
    if (!pinCode) {
      throw new Error("A pin code is required.");
    }
    if (!/^\d{6}$/.test(pinCode)) {
      throw new Error("The pin code must be exactly 6 digits.");
    }
    
    var packetId = null;
    var command = "e2ee.retrieve";
    
    var packet = new Packet(packetId, command, {pinCode});
    
    buildfire._sendPacket(packet, callback);
  },
  
  reset: function (pinCode, callback) {
    if (!pinCode) {
      throw new Error("A pin code is required.");
    }
    if (!/^\d{6}$/.test(pinCode)) {
      throw new Error("The pin code must be exactly 6 digits.");
    }
    
    var packetId = null;
    var command = "e2ee.reset";
    
    var packet = new Packet(packetId, command, {pinCode});
    
    buildfire._sendPacket(packet, callback);
    
  },
};
