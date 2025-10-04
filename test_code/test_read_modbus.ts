import ModbusRTU from 'modbus-serial';
// import mqtt from "mqtt";
// import { PrismaClient } from '@prisma/client';
// import config from './config';
import { insertAmi } from '../db_utility/insertAmi';

// 定義 ami 資料型別
// interface AMI {
//     Date: string;
//     Time: string;
//     Model: string;
//     WireTheme: string;
// }

// 定義資料型別
// interface ModbusData {
//     timestamp: string;
//     power: number;
//     powerFactor: number;
//     energy: number;
// }

// Modbus TCP 設定
// const modbusClient = new ModbusRTU();
// modbusClient.setID(1);
const client = new ModbusRTU();

// const { modbusHost, modbusPort, mqttBroker, mqttTopic } = config;
await client.connectTCP('192.168.0.101', { port: 1030 });

// set timeout, if slave did not reply back
client.setTimeout(300);

const metersIdList = [1];

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

function wait(ms: number): Promise<void> {
	return new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
}

// 另一個做法，到時再試試
// function getFloat(buf: Buffer): number {
//     var view = new DataView(buf);
//     return view.getFloat32(0);
// }

async function getAMIInfo(modbusClient) {
	const model = (await modbusClient.readHoldingRegisters(0x0006, 1)).data; // 7 -> DPM-C530
	//const wireTheme = (await modbusClient.readHoldingRegisters(0x000d, 1)).data; // 1 -> 3P3W
	//const baudRate = (await modbusClient.readHoldingRegisters(0x0016, 1)).data; // 7 -> 115200
	//const parity = (await modbusClient.readHoldingRegisters(0x0019, 1)).data; // 2 -> N.8.[2]
	//const stationNo = (await modbusClient.readHoldingRegisters(0x001b, 1)).data; // 1
	//const energyUnit = (await modbusClient.readHoldingRegisters(0x00eb, 1)).data; // 3 -> 0.1kWh
	//const ctI1st = (await modbusClient.readHoldingRegisters(0x000e, 1)).data; // 300 -> 1~9999 A
	//const ctI2nd = (await modbusClient.readHoldingRegisters(0x000f, 1)).data; // 0: 5A, 1: 1A
	//const lang = (await modbusCient.readHoldingRegisters(0x0013, 1)).data; // 1 -> zh-TC
	//const lcmBacklight = (await modbusClient.readHoldingRegisters(0x0015, 1)).data; // 0 -> 100%
	//const commMode = (await modbusClient.readHoldingRegisters(0x0017,1)).data; // 3 -> Modbus TCP
	return {
		model: model[0],
		//wireTheme: wireTheme[0],
		//baudRate: baudRate[0],
		//parity: parity[0],
		//stationNo: stationNo[0],
		//energyUnit: energyUnit[0],
		//ctI1st: ctI1st[0],
		//ctI2nd: ctI2nd[0],
		//lang: lang[0],
		//lcmBacklight: lcmBacklight[0],
		//commMode: commMode[0],
	};
}

async function readModbusData(): Promise<void> {
	try {
		// get timestamp from ami
		// const amiDate = (await modbusClient.readHoldingRegisters(0x0001, 2)).buffer;
		// const amiTime = (await modbusClient.readHoldingRegisters(0x0003, 2)).buffer;

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

		// 2025-06-25: the following registers seem to be the same as DPM-DA530
		//const ami = {
		//	// timeStamp: amiDateTime,
		//	Va: getFloat((await client.readHoldingRegisters(0x0108, 2)).buffer), // 4 byte float: 0.0 ~ 1200000.0 V
		//	Vb: getFloat((await client.readHoldingRegisters(0x010a, 2)).buffer), // 4 byte float: 0.0 ~ 1200000.0 V
		//	Vc: getFloat((await client.readHoldingRegisters(0x010c, 2)).buffer), // 4 byte float: 0.0 ~ 1200000.0 V
		//	Ia: getFloat((await client.readHoldingRegisters(0x0120, 2)).buffer), // 4 byte float: 0.000~9999.000 A
		//	Ib: getFloat((await client.readHoldingRegisters(0x0122, 2)).buffer), // 4 byte float: 0.000~9999.000 A
		//	Ic: getFloat((await client.readHoldingRegisters(0x0124, 2)).buffer), // 4 byte float: 0.000~9999.000 A
		//	powerFactor: getFloat((await client.readHoldingRegisters(0x0132, 2)).buffer), // 4 byte float: -1.000~1.000
		//	frequency: getFloat((await client.readHoldingRegisters(0x0142, 2)).buffer), // 4 byte float: 45.00~65.00 Hz
		//	realPower: getFloat((await client.readHoldingRegisters(0x0144, 2)).buffer), // 4 byte float: 瞬時總實功率值 -9個9~9個9 W
		//	energy: getFloat((await client.readHoldingRegisters(0x015c, 2)).buffer), // 4 byte float: 正向實功電能: 0.0~9999999.9 kWh
		//	// energySum: getFloat((await client.readHoldingRegisters(0x0168, 2)).buffer), // 4 byte float: 正向實功電能 + 反向實功電能: 0.0~9999999.9 kWh
		//};

		//console.log('AMI Readings:', ami);

		// 如果要查 DPM C530 的 modbus 設定
		console.log('AMIInfo:', await getAMIInfo(client));

		// client.close();

		// await prisma.main_ami.upsert({
		// 	where: {
		// 		timestamp: ami.timeStamp || new Date(),
		// 	},
		// 	update: {
		// 		Va: ami.Va,
		// 		Vb: ami.Vb,
		// 		Vc: ami.Vc,
		// 		Ia: ami.Ia,
		// 		Ib: ami.Ib,
		// 		Ic: ami.Ic,
		// 		frequency: ami.frquency,
		// 		realPower: ami.realPower,
		// 		powerFactor: ami.powerFactor,
		// 		energy: ami.energy,
		// 	},
		// 	create: {
		// 		timestamp: ami.timeStamp || new Date(),
		// 		Va: ami.Va,
		// 		Vb: ami.Vb,
		// 		Vc: ami.Vc,
		// 		Ia: ami.Ia,
		// 		Ib: ami.Ib,
		// 		Ic: ami.Ic,
		// 		frequency: ami.frquency,
		// 		realPower: ami.realPower,
		// 		powerFactor: ami.powerFactor,
		// 		energy: ami.energy,
		// 	},
		// });

		//await insertAmi(0, ami);
	} catch (error) {
		console.error('Error reading Modbus data:', error);
		// client.close();
		//process.exitCode = 1;
		// wait(2000);
		//process.exit();
	}
}

// 每秒執行一次
setInterval(readModbusData, 1000);
// readModbusData();
