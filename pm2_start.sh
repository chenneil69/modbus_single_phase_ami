#!/bin/bash

#pm2 start read_modbus.ts --cron-restart="0 */4 * * *" --restart-delay=3000
#pm2 start read_modbus.ts

pm2 start ecosystem.config.cjs

pm2 save
