/* the format is assumed to be [channel] [type] [data byte 1] [data byte 2] ..., 

1. write an else can when this 
is not the case for a certain function in the Jalapenos.c file in keil

2. */


function decodeUplink(input) { //raw byte input
  let data = {}; // Initialize an empty object to hold the decoded data
  let bytes = input.bytes; //bytes is just a shortcut to avoid repeating input.bytes.
  let i = 0;


// Optional debug: log raw hex payload
  data.raw_hex = bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');




  while (i < bytes.length) { //Keep going until we've read all the payload bytes.
    let channel = bytes[i++];  //Each record starts with a channel and type.
    let type = bytes[i++]; //i++  moves the index forward after reading.
    //Every sensor value starts with 1 byte for channel, then 1 byte for type.

    switch (type) {
      case 103: // LPP_TEMPERATURE
        data[`temperature_${channel}`] = {
          value: bytesToFloat(bytes.slice(i, i + 4)),
          unit: "°C"
        };
        i += 4;
        break;

      case 104: // LPP_RELATIVE_HUMIDITY
        data[`humidity_${channel}`] = {
          value: bytesToFloat(bytes.slice(i, i + 4)),
          unit: "%"
        };
        i += 4;
        break;

      // case 114: // LPP_DEVICE (used in JalapenosLppAddDeviceID)
      //   // channel is actually the first byte of ID in this case
      //   data.device_id = (channel | (bytes[i++] << 8) | (bytes[i++] << 16));
      //   break;

      case 106: // LPP_TIMESTAMP
        data[`timestamp_${channel}`] = {
          value: (bytes[i++] << 24) | (bytes[i++] << 16) | (bytes[i++] << 8) | bytes[i++],
          unit: "unix"
        };
        break;

      case 107: // LPP_SHUNTVOLTAGE
         data[`shunt_voltage_${channel}`] = {
          value: bytesToFloat(bytes.slice(i, i + 4)),
          unit: "V"
        };
        i += 4;
        break;

      case 108: // LPP_BUSVOLTAGE
        data[`bus_voltage_${channel}`] = {
          value: bytesToFloat(bytes.slice(i, i + 4)),
          unit: "V"
        };
        i += 4;
        break;

      case 109: // LPP_CURRENT
        data[`current_${channel}`] = {
          value: bytesToFloat(bytes.slice(i, i + 4)),
          unit: "A"
        };
        i += 4;
        break;

      case 110: // LPP_CAPVOLTAGE
         data[`cap_voltage_${channel}`] = {
          value: bytesToFloat(bytes.slice(i, i + 4)),
          unit: "V"
        };
        i += 4;
        break;

      default:
        return {
          errors: [`Unknown data type ${type} at position ${i - 1}`],
          raw_bytes: input.bytes
        };
    }
  }

  return { data };
}

// Converts 4 bytes [b0, b1, b2, b3] → float
function bytesToFloat(bytes) {
  let buffer = new ArrayBuffer(4); //This creates a raw binary space of 4 bytes in memory.
  let view = new DataView(buffer); // DataView lets us write or read different types (like uint8, int16, float32, etc.) from the buffer.
  bytes.forEach((b, i) => view.setUint8(i, b)); //bytes is the input array, e.g., [0x42, 0x48, 0x00, 0x00]. For each byte b, at index i, write it into the buffer using:
  return view.getFloat32(0, false); // This reads 4 bytes starting at byte offset 0 as a float32.
}

//bytes is the full byte array (e.g., [0x01, 0x65, 0x42, 0x48, 0x00, 0x00]).
// slice(i, i + 4) takes 4 bytes starting at position i.
// if i=2, it takes [0x42, 0x48, 0x00, 0x00]. (i.e in python (2,6) but only 5 (6-1))
