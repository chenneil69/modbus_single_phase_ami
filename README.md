## for construction site w. single phase power monitoring only

## [2025-10-05]

[Note] 這一份 code 採 Rpi4 --> /dev/ttyUSB0 --> DPM-DA530 [stationNo: 1, 115200, N, 8, 2]

```
$ ./pm2_start.sh
```

use `pm2 status` to check process

use `pm2 logs` to check logs

use `pgcli` to check data in db

### Technical Stack

1. db: (版本號僅供參考)
    - timescaledb 2.18.1
    - postgresql 16.6
2. nodejs: 22.14.0 (版本號僅供參考)
    - prisma 6.3.1 (版本號僅供參考)
    - typescript 5.1 (版本號僅供參考)
    - modbus-serial: 8.0.18 (版本號僅供參考)

### DPM DA530 [查閱 5.2](./Documentation/DELTA_IA-OMS_DPM-DA530-510_UM_TC_20201023.pdf)

電錶 modbus registers 以 [查閱 5.2](./Documentation/DELTA_IA-OMS_DPM-DA530-510_UM_TC_20201023.pdf) 為準
