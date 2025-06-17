function decodeUplink(input) {
  var results = {};
  results.units = [];
  results.valueType = [];

  for (var i = 0; i < input.bytes.length; ) {
    switchVar = input.bytes[i + 1];
    var channel = input.bytes[i];
    var keyPrefix = `Ch${channel}_`;

    switch (switchVar) {
      case 114:
        var nodeID = input.bytes[i + 2];
        results[keyPrefix + "ID"] = nodeID;
        results.units.push("?");
        results.valueType.push("Tot");
        i = i + 3;
        break;
      case 101:
      var dummy = input.bytes[i + 2];
      results[keyPrefix + "Dummy"] = dummy;
      results.units.push("?");
      results.valueType.push("Tot");
      i = i + 3;
      break;
      case 112: 
        var PAR = decode8Uint(new Uint8Array([input.bytes[i + 2]]));
        results[keyPrefix + "PAR"] = PAR;
        results.units.push("?");
        results.valueType.push("Tot");
        i = i + 3;
        break;
      case 106:
        var Timestamp = decode32Uint(new Uint8Array([input.bytes[i + 2], input.bytes[i + 3], input.bytes[i + 4], input.bytes[i + 5]]));
        var date = new Date(Timestamp * 1000); // Timestamp in milliseconds
        results[keyPrefix + "Datetime"] = date.toISOString(); // ISO 8601 format
        results.units.push("TS");
        results.valueType.push(" ");
        i = i + 6;
        break;
      case 103:
        var Temp = decode32float(new Uint8Array([input.bytes[i + 2], input.bytes[i + 3], input.bytes[i + 4], input.bytes[i + 5]]));
        results[keyPrefix + "Temperature"] = Temp;
        results.units.push("°C");
        results.valueType.push("Tot");
        i = i + 6;
        break;
      case 104:
        var Humi = decode32float(new Uint8Array([input.bytes[i + 2], input.bytes[i + 3], input.bytes[i + 4], input.bytes[i + 5]]));
        results[keyPrefix + "Humidity"] = Humi;
        results.units.push("%");
        results.valueType.push("Tot");
        i = i + 6;
        break;
      case 107:
        var ShuntVoltage = decode32float(new Uint8Array([input.bytes[i + 2], input.bytes[i + 3], input.bytes[i + 4], input.bytes[i + 5]]));
        results[keyPrefix + "ShuntVoltage"] = ShuntVoltage;
        results.units.push("V");
        results.valueType.push("Tot");
        i = i + 6;
        break;
      case 108:
        var BusVoltage = decode32float(new Uint8Array([input.bytes[i + 2], input.bytes[i + 3], input.bytes[i + 4], input.bytes[i + 5]]));
        results[keyPrefix + "VoltageOnBus"] = BusVoltage;
        results.units.push("V");
        results.valueType.push("Tot");
        i = i + 6;
        break;
      case 109:
        var Current = decode32float(new Uint8Array([input.bytes[i + 2], input.bytes[i + 3], input.bytes[i + 4], input.bytes[i + 5]]));
        results[keyPrefix + "Current"] = Current;
        results.units.push("A");
        results.valueType.push("Tot");
        i = i + 6;
        break;
      case 110:
        var CapVoltage = decode32float(new Uint8Array([input.bytes[i + 2], input.bytes[i + 3], input.bytes[i + 4], input.bytes[i + 5]]));
        results[keyPrefix + "SuperCapVoltage"] = CapVoltage;
        results.units.push("V");
        results.valueType.push("Tot");
        i = i + 6;
        break;
      default: i = i+1;
    }
  }

  return {
    data: results,
    warnings: [],
    errors: []
  };
}

function decode32float(float32data) {
  const dataView = new DataView(float32data.buffer);
  return dataView.getFloat32(0, false);
}

function decode32Uint(uint32data) {
  const dataView = new DataView(uint32data.buffer);
  return dataView.getUint32(0, false);
}