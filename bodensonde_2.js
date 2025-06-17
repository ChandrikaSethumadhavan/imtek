function decodeUplink(input) {
    let bytes;
    if (typeof input === 'string') {
        bytes = [];
        for (let i = 0; i < input.length; i += 2) {
            bytes.push(parseInt(input.substring(i, i + 2), 16));
        }
    } else if (input.bytes) {
        bytes = input.bytes;
    } else {
        bytes = input;
    }
    
    // Data is in BIG ENDIAN format for some values
    function decodeInt16BigEndian(bytes, index) {
        // Big endian with proper signed handling (MSB first, then LSB)
        let value = (bytes[index] << 8) | bytes[index + 1];
        // Handle signed values (two's complement)
        if (value > 0x7FFF) {
            value = value - 0x10000;
        }
        return value;
    }
    
    // LITTLE ENDIAN format for some values
    function decodeInt16LittleEndian(bytes, index) {
        // Little endian with proper signed handling (LSB first, then MSB)
        let value = (bytes[index]) | (bytes[index + 1] << 8);
        // Handle signed values (two's complement)
        if (value > 0x7FFF) {
            value = value - 0x10000;
        }
        return value;
    }
    
    function decodeTimestamp(bytes, index) {
        // Big endian for timestamp
        return (bytes[index] << 24) | 
               (bytes[index + 1] << 16) | 
               (bytes[index + 2] << 8) | 
               bytes[index + 3];
    }
    
    function formatDateTime(unixTime) {
        var date = new Date(unixTime * 1000);
        var month = date.getMonth() + 1;
        var day = date.getDate();
        
        var lastSundayMarch = new Date(date.getFullYear(), 2, 31);
        while (lastSundayMarch.getDay() !== 0) {
            lastSundayMarch.setDate(lastSundayMarch.getDate() - 1);
        }
        
        var lastSundayOctober = new Date(date.getFullYear(), 9, 31);
        while (lastSundayOctober.getDay() !== 0) {
            lastSundayOctober.setDate(lastSundayOctober.getDate() - 1);
        }
        
        var isDST = false;
        if ((month > 3 && month < 10) || 
            (month === 3 && day >= lastSundayMarch.getDate()) ||
            (month === 10 && day < lastSundayOctober.getDate())) {
            isDST = true;
        }
        
        var offset = isDST ? 2 : 1;
        var utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
        var localDate = new Date(utcDate.getTime() + (offset * 3600 * 1000));
        
        return localDate.toLocaleString('en-GB', { timeZone: 'UTC' });
    }

    function decodeErrorCodes(errorCodes) {
        const errorMap = {
            0: "RTC Status",
            1: "FRAM Status",
            2: "SHTC3 Status",
            3: "AS7341 Status",
            4: "INA232 Status",
            5: "TEMP1 Status",
            6: "TEMP2 Status",
            7: "TEMP3 Status",
            8: "HUM1 Status",
            9: "HUM2 Status",
            10: "HUM3 Status",
            11: "DENDRO Status",
            12: "Global I2C Init",
            13: "Global SPI Init",
            14: "Is Time Set",
            15: "Super Cap Status"
        };

        const errors = [];
        for (let bit = 0; bit < 16; bit++) {
            if (errorCodes & (1 << bit)) {
                errors.push(errorMap[bit]);
            }
        }
        return errors;
    }
    
    function decodeMeasurement(bytes, startIndex) {
        const measurement = {};
        let currentIndex = startIndex;
        
        // Check if this is the first measurement
        const isFirstMeasurement = startIndex === 0;
        
        // For both measurements, get the bodensonde_id
        if (isFirstMeasurement) {
            measurement.bodensonde_id = bytes[currentIndex++];
        } else {
            // For second measurement, copy bodensonde_id from first measurement
            measurement.bodensonde_id = bytes[0];
        }
        
        // Decode measurement number (always present in both measurements)
        measurement.measurement_number = bytes[currentIndex++];
        
        // Decode error codes (2 bytes in big endian)
        const errorCodesRaw = (bytes[currentIndex] << 8) | bytes[currentIndex + 1];
        measurement.error_codes = decodeErrorCodes(errorCodesRaw);
        currentIndex += 2;
        
        // Decode Unix timestamp (4 bytes)
        const unixTime = decodeTimestamp(bytes, currentIndex);
        measurement.unix_time = formatDateTime(unixTime);
        currentIndex += 4;
        
        // Decode environmental measurements with proper scaling
        // Air temperature (2 decimal places) - Big Endian
        const rawAirTemp = decodeInt16BigEndian(bytes, currentIndex);
        measurement.air_temp = Number((rawAirTemp / 100.0).toFixed(2));
        currentIndex += 2;
        
        // Air humidity (2 decimal places) - Big Endian
        const rawAirHum = decodeInt16BigEndian(bytes, currentIndex);
        measurement.air_hum = Number((rawAirHum / 100.0).toFixed(2));
        currentIndex += 2;
        
        // Soil temperatures at different depths (2 decimal places)
        // Using Big Endian based on firmware analysis
        const rawSoil20cmTemp = decodeInt16BigEndian(bytes, currentIndex);
        measurement.soil_20cm_temp = Number((rawSoil20cmTemp / 100.0).toFixed(2));
        currentIndex += 2;
        
        const rawSoil40cmTemp = decodeInt16BigEndian(bytes, currentIndex);
        measurement.soil_40cm_temp = Number((rawSoil40cmTemp / 100.0).toFixed(2));
        currentIndex += 2;
        
        const rawSoil60cmTemp = decodeInt16BigEndian(bytes, currentIndex);
        measurement.soil_60cm_temp = Number((rawSoil60cmTemp / 100.0).toFixed(2));
        currentIndex += 2;
        
        // Soil humidity at different depths (2 decimal places)
        const rawSoil20cmHum = decodeInt16BigEndian(bytes, currentIndex);
        measurement.soil_20cm_hum = Number((rawSoil20cmHum / 100.0).toFixed(2));
        currentIndex += 2;
        
        const rawSoil40cmHum = decodeInt16BigEndian(bytes, currentIndex);
        measurement.soil_40cm_hum = Number((rawSoil40cmHum / 100.0).toFixed(2));
        currentIndex += 2;
        
        const rawSoil60cmHum = decodeInt16BigEndian(bytes, currentIndex);
        measurement.soil_60cm_hum = Number((rawSoil60cmHum / 100.0).toFixed(2));
        currentIndex += 2;
        
        // Decode power measurements
        // Bus voltage (3 decimal places)
        const rawBusVoltage = decodeInt16BigEndian(bytes, currentIndex);
        measurement.bus_voltage = Number((rawBusVoltage / 100.0).toFixed(3));
        currentIndex += 2;
        
        // Current (5 decimal places)
        const rawCurrent = decodeInt16BigEndian(bytes, currentIndex);
        measurement.current = Number((rawCurrent / 100000.0).toFixed(5));
        currentIndex += 2;
        
        // Supercap voltage (2 decimal places)
        const rawSupercapVoltage = decodeInt16BigEndian(bytes, currentIndex);
        measurement.supercap_voltage = Number((rawSupercapVoltage / 100.0).toFixed(2));
        currentIndex += 2;
        
        // Decode spectral data (12 values, each 2 bytes)
        measurement.spectral_data = [];
        for (let i = 0; i < 12; i++) {
            // Big endian for spectral data
            let spectralValue = (bytes[currentIndex] << 8) | bytes[currentIndex + 1];
            measurement.spectral_data.push(spectralValue);
            currentIndex += 2;
        }
        
        // Decode spectral gain (1 byte)
        measurement.spectral_gain = bytes[currentIndex++];
        
        // Decode stem diameter (2 decimal places)
        const rawStemDiameter = decodeInt16BigEndian(bytes, currentIndex);
        measurement.stem_diameter = Number((rawStemDiameter / 100.0).toFixed(2));
        
        return measurement;
    }

    try {
        // First measurement starts at index 0
        const measurement1 = decodeMeasurement(bytes, 0);
        
        // Second measurement starts at index 58
        const measurement2 = decodeMeasurement(bytes, 58);
        
        const decoded = {};
        decoded[measurement${measurement1.measurement_number}] = measurement1;
        decoded[measurement${measurement2.measurement_number}] = measurement2;
        
        return {
            data: decoded,
            warnings: [],
            errors: []
        };
    } catch (error) {
        return {
            data: {},
            warnings: [],
            errors: [Decoding error: ${error.message}]
        };
    }
}