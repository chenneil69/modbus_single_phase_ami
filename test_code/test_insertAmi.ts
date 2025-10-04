import { insertAmi } from '../db_utility/insertAmi';

const readings = {
	Va: 208.11,
	Vb: 208.22,
	Vc: 208.33,
	Ia: 1.11,
	Ib: 2.22,
	Ic: 3.33,
	frequency: 60.0,
	realPower: 211.11,
	powerFactor: 1.0,
	energy: 2.22,
};

try {
	for (let i = 0; i < 100 * 100; i++) {
		console.info();

		await insertAmi(0, readings);
		await insertAmi(2, readings);
		await insertAmi(3, readings);
		await insertAmi(4, readings);
		await insertAmi(5, readings);
	}
} catch (e) {
	console.log(e.message);
}
