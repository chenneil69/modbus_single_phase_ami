const config = {
    modbusHost: "10.0.4.214", // 修改為電表的 IP
    modbusPort: 1030, //502,
    mqttBroker: "mqtt://127.0.0.1", // 修改為 MQTT Broker 的 IP
    mqttTopic: "sensor/dpm-da530",
    prisma: {
        databaseUrl: "postgresql://timescaledb:timescaledb01@127.0.0.1:5433/timescaledb",
    },
};

export default config;
