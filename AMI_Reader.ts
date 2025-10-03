import ModbusRTU from 'modbus-serial';
// import mqtt from "mqtt";
// import { PrismaClient } from "mqtt";
// import config from './config';
// import { insertAmi } from './db_utility/insertAmi';

function getInt(buf: Buffer): number {
	return buf.readInt16BE();
}

function getPadZero(num: number): string {
	return num.toString().padStart(2, '0');
}

function getTimeStamp(amiYear, amiDate): Date {
	return new Date(
		`${getInt(amiYear)}-${getPadZero(amiDate[1])}-${getPadZero(amiDate[3])} ${getPadZero(amiDate[5])}:${getPadZero(amiDate[7])}:${getPadZero(
			amiDate[9]
		)}`
	);
}

function getFloat(buf: Buffer): number {
	// console.log("Buffer:", buf);
	return buf.readFloatBE(0);
}

// create an empty modbus client
const client = new ModbusRTU();

// open connection to a serial port
client.connectRTUBuffered('/dev/ttyUSB0', { baudRate: 115200, stopBits: 2 });
//await client.connectTCP('192.168.0.250', { port: 1030 });

// set timeout, if slave did not reply back
client.setTimeout(400);

// list of meter's id
const metersIdList = [1];

const getMetersValue = async (meters) => {
	try {
		// get value of all meters
		for (let meter of meters) {
			// output value to console
			const readings = await getMeterValue(meter);
			console.log('station: ', meter);
			console.log(readings);
			// await insertAmi(meter, readings);
			// wait 100ms before get another device
			// await sleep(1000);
		}
	} catch (e) {
		// if error, handle them here (it should not)
		console.log('Error: ', e);
		// process.exitCode = 1;
		// process.exit();
	} finally {
		// after get all data from slave, repeat it again
		setImmediate(() => {
			getMetersValue(metersIdList);
		});
	}
};

const getMeterValue = async (id) => {
	try {
		// set ID of slave
		await client.setID(id);

		// const amiYear = (await client.readHoldingRegisters(0x0028, 1)).buffer;
		// const amiDate = (await client.readHoldingRegisters(0x0029, 5)).buffer;

		// const amiDateTime = getTimeStamp(amiYear, amiDate);

		const ami = {
			// stationNo: id,
			// timeStamp: amiDateTime, // 改走有線的試試
			// Va: getFloat((await client.readHoldingRegisters(0x0139, 2)).buffer), // 4 byte float: 0.0 ~ 1200000.0 V
			// Vb: getFloat((await client.readHoldingRegisters(0x013b, 2)).buffer), // 4 byte float: 0.0 ~ 1200000.0 V
			// Vc: getFloat((await client.readHoldingRegisters(0x013d, 2)).buffer), // 4 byte float: 0.0 ~ 1200000.0 V
			// Ia: getFloat((await client.readHoldingRegisters(0x0141, 2)).buffer), // 4 byte float: 0.000~9999.000 A
			// Ib: getFloat((await client.readHoldingRegisters(0x0143, 2)).buffer), // 4 byte float: 0.000~9999.000 A
			// Ic: getFloat((await client.readHoldingRegisters(0x0145, 2)).buffer), // 4 byte float: 0.000~9999.000 A
			V: Number((await client.readHoldingRegisters(0x000e, 1)).data) / 10, // 4 byte float
			I: Number((await client.readHoldingRegisters(0x000f, 1)).data) / 1000, // 4 byte float
			W: Number((await client.readHoldingRegisters(0x0011, 1)).data) / 10, // 4 byte float
			VA: Number((await client.readHoldingRegisters(0x0015, 1)).data) / 10, // 4 byte float
			// VAR: Number((await client.readHoldingRegisters(0x0013, 1)).data) / 10, // 4 byte float :: // TODO: somehow this value read seems not correct; marked off for now
			powerFactor: Number((await client.readHoldingRegisters(0x001d, 1)).data) / 100, // 
			temperature: Number((await client.readHoldingRegisters(0x001a, 1)).data), // 
			frequency: Number((await client.readHoldingRegisters(0x001e, 1)).data) / 10, // 2 byte float
			kWH: Number((await client.readHoldingRegisters(0x0017, 1)).data) / 1000, // 4 byte float			
		};

		return ami;
	} catch (e) {
		console.log('Error: ', e);
		// process.exitCode = 1;
		// process.exit();
	}
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// start get value
getMetersValue(metersIdList);

