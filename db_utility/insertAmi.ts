import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma';

import dayjs from 'dayjs';

const PRE = 'stand';

export async function insertAmi(station: number, readings: any) {
	let modelName = '';
	if (station === 9) {
		modelName = `${PRE}_pv_ami_${dayjs().format('YYYY_MM')}`;
	} else {
		modelName = station === 0 ? `${PRE}_main_ami_${dayjs().format('YYYY_MM')}` : `${PRE}_branch_${station}_ami_${dayjs().format('YYYY_MM')}`;
	}
	const timestamp = dayjs(dayjs().format('YYYY-MM-DD HH:mm:ss'));
	// REF: https://github.com/prisma/prisma/issues/1983#issuecomment-869036852
	// const prisma = new PrismaClient();
	try {
		if (!(modelName in prisma)) {
			throw new Error(`Model ${modelName} not found`);
		}

		const model = prisma[modelName as keyof PrismaClient];

		if (typeof (model as any).upsert !== 'function') {
			throw new Error(`Model ${modelName} does not support upsert`);
		}

		await (model as any).upsert({
			where: {
				timestamp: timestamp,
			},
			update: readings,
			create: {
				timestamp: timestamp,
				...readings,
			},
		});
		console.log(`${timestamp} : stationNo: ${station} readings recorded.`);
	} catch (e) {
		console.log(e.message);
	}
}
