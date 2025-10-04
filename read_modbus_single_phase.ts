import ModbusRTU from 'modbus-serial';
import { insertAmi } from './db_utility/insertAmi';

// Modbus TCP 設定
const client = new ModbusRTU();

// open connection to a serial port
client.connectRTUBuffered('/dev/ttyUSB0', { baudRate: 115200, stopBits: 2 });
// await client.connectTCP('192.168.102.104', { port: 8899 });

// set timeout, if slave did not reply back
client.setTimeout(400);

const metersIdList = [1];

await client.setID(metersIdList[0]);

function getPadZero(num: number): string {
	return num.toString().padStart(2, '0');
}

function getTimeStamp(amiDate, amiTime): Date {
	return new Date(
		`20${amiDate[0]}-${getPadZero(amiDate[1])}-${getPadZero(amiDate[2])} ${getPadZero(amiTime[0])}:${getPadZero(amiTime[1])}:${getPadZero(
			amiTime[3]
		)}`
	);
}

function getFloat(buf: Buffer): number {
	// console.log("Buffer:", buf);
	return buf.readFloatBE();
}

function convertModbusFloat32(dataWord) {
	// 創建 4 字節的 ArrayBuffer
	const buffer = new ArrayBuffer(4);
	const view = new DataView(buffer);

	// 設置兩個 16-bit 值 (注意字節序)
	view.setUint16(0, dataWord[0], true); // little-endian
	view.setUint16(2, dataWord[1], true); // little-endian

	// 讀取為 32-bit 浮點數
	return view.getFloat32(0, true); // little-endian
}

async function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

// 另一個做法，到時再試試
// function getFloat(buf: Buffer): number {
//     var view = new DataView(buf);
//     return view.getFloat32(0);
// }

async function getAMIInfo(modbusClient) {
	const model = (await modbusClient.readHoldingRegisters(0x0006, 1)).data; // 13 -> DPM-DA530
	const wireTheme = (await modbusClient.readHoldingRegisters(0x000d, 1)).data; // 4 -> 3P3W3CT
	const baudRate = (await modbusClient.readHoldingRegisters(0x0016, 1)).data; // 7 -> 115200
	const parity = (await modbusClient.readHoldingRegisters(0x0019, 1)).data; // 1 -> N.8.2
	const stationNo = (await modbusClient.readHoldingRegisters(0x001b, 1)).data; // 1
	const energyUnit = (await modbusClient.readHoldingRegisters(0x00eb, 1)).data; // 3 -> 0.1kWh
	const ctI1st = (await modbusClient.readHoldingRegisters(0x000e, 1)).data; // 100A: 1~9999 A
	const ctI2nd = (await modbusClient.readHoldingRegisters(0x000f, 1)).data; // 0: 5A, 1: 1A
	const lcmBacklight = (await modbusClient.readHoldingRegisters(0x0014, 1)).data; // 0~15 分, 0: 恆亮
	return {
		model: model[0],
		wireTheme: wireTheme[0],
		baudRate: baudRate[0],
		parity: parity[0],
		stationNo: stationNo[0],
		energyUnit: energyUnit[0],
		ctI1st: ctI1st[0],
		ctI2nd: ctI2nd[0],
		lcmBacklight: lcmBacklight[0],
	};
}

async function readModbusData(): Promise<void> {
	try {
		// get timestamp from ami
		// const amiDate = (await client.readHoldingRegisters(0x0001, 2)).buffer;
		// const amiTime = (await client.readHoldingRegisters(0x0003, 2)).buffer;

		// const amiDateTime = getTimeStamp(amiDate, amiTime);

		// get VLN (Voltage Line to Neutral)
		// Va: ((await modbusClient.readHoldingRegisters(0x0100, 2)).data, // expect:
		// Vb: (await modbusClient.readHoldingRegisters(0x0102, 2)).data, // expect:
		// Vc: (await modbusClient.readHoldingRegisters(0x0104, 2)).data, // expect:
		// const vLN = (await modbusClient.readHoldingRegisters(0x0100, 6)).data;
		// const amiVoltages = {
		//     vA: vLN[0],
		//     vB: vLN[2],
		//     vC: vLN[4],
		// };

		const ami = {
			// timeStamp: amiDateTime,
			Va: getFloat((await client.readHoldingRegisters(0x0108, 2)).buffer), // 4 byte float: 0.0 ~ 1200000.0 V
			Vb: getFloat((await client.readHoldingRegisters(0x010a, 2)).buffer), // 4 byte float: 0.0 ~ 1200000.0 V
			Vc: getFloat((await client.readHoldingRegisters(0x010c, 2)).buffer), // 4 byte float: 0.0 ~ 1200000.0 V
			Ia: getFloat((await client.readHoldingRegisters(0x0120, 2)).buffer), // 4 byte float: 0.000~9999.000 A
			Ib: getFloat((await client.readHoldingRegisters(0x0122, 2)).buffer), // 4 byte float: 0.000~9999.000 A
			Ic: getFloat((await client.readHoldingRegisters(0x0124, 2)).buffer), // 4 byte float: 0.000~9999.000 A
			powerFactor: getFloat((await client.readHoldingRegisters(0x0132, 2)).buffer), // 4 byte float: -1.000~1.000
			frequency: getFloat((await client.readHoldingRegisters(0x0142, 2)).buffer), // 4 byte float: 45.00~65.00 Hz
			realPower: getFloat((await client.readHoldingRegisters(0x0144, 2)).buffer), // 4 byte float: 瞬時總實功率值 -9個9~9個9 W
			energy: getFloat((await client.readHoldingRegisters(0x015c, 2)).buffer), // 4 byte float: 正向實功電能: 0.0~9999999.9 kWh
		};

		console.log('/dev/ttyUSB0 AMI Readings:', ami);

		// 如果要查 DPM DA530 的 modbus 設定
		console.log('AMIInfo:', await getAMIInfo(client));

		// [TODO] 暫時不寫入資料庫
		// await insertAmi(0, ami);
	} catch (error) {
		console.error('/dev/ttyUSB0 Error reading Modbus data:', error);
		// client.close();
		process.exitCode = 1;
		// wait(2000);
		process.exit();
	}
}

// 每秒執行一次
setInterval(readModbusData, 1000);
