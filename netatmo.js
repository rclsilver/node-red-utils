const {
    StateConfig,
    BatteryDiscoveryMessage,
    Co2DiscoveryMessage,
    HumidityDiscoveryMessage,
    NoiseDiscoveryMessage,
    PressureDiscoveryMessage,
    TemperatureDiscoveryMessage,
} = require("./home-assistant");

/**
 * Get station device informations from the netatmo station
 *
 * @param {object} station The netatmo station
 * @returns Device informations
 */
function getStationDeviceInfos(station) {
    return {
        identifiers: station._id.replace(/:/g, "-"),
        name: `${station.type} ${station.station_name}`,
        manufacturer: "Netatmo",
        model: station.type,
        area: station.module_name.toLowerCase(),
        sw_version: station.firmware,
    };
}

/**
 * Get station device informations from the netatmo station
 *
 * @param {object} station The netatmo station
 * @param {object} module The netatmo station module
 * @returns Device informations
 */
function getModuleDeviceInfos(station, module) {
    return {
        identifiers: module._id.replace(/:/g, "-"),
        via_device: station._id.replace(/:/g, "-"),
        name: `${module.type} ${module.module_name}`,
        manufacturer: "Netatmo",
        model: module.type,
        area: module.module_name.toLowerCase(),
        sw_version: module.firmware,
    };
}

/**
 * Build home-assistant disovery messages from Netatmo stations
 *
 * @param {object} msg Message received from station
 * @param {string} topicPrefix MQTT topic prefix
 * @returns Discovery messages
 */
function weatherStationToHomeassistant(msg, topicPrefix = "homeassistant") {
    var messages = [];

    if (msg.payload !== undefined && msg.payload.devices !== undefined) {
        msg.payload.devices.forEach((station) => {
            station.data_type.forEach((type) => {
                if (type.toLowerCase() === "temperature") {
                    messages.push(
                        new TemperatureDiscoveryMessage(
                            getStationDeviceInfos(station),
                            station.module_name.toLowerCase(),
                            new StateConfig(
                                `home/${station.module_name.toLowerCase()}/sensor/temperature`,
                                "{{ value_json.value }}"
                            ),
                            topicPrefix
                        ).msg
                    );
                } else if (type.toLowerCase() === "humidity") {
                    messages.push(
                        new HumidityDiscoveryMessage(
                            getStationDeviceInfos(station),
                            station.module_name.toLowerCase(),
                            new StateConfig(
                                `home/${station.module_name.toLowerCase()}/sensor/humidity`,
                                "{{ value_json.value }}"
                            ),
                            topicPrefix
                        ).msg
                    );
                } else if (type.toLowerCase() === "co2") {
                    messages.push(
                        new Co2DiscoveryMessage(
                            getStationDeviceInfos(station),
                            station.module_name.toLowerCase(),
                            new StateConfig(
                                `home/${station.module_name.toLowerCase()}/sensor/co2`,
                                "{{ value_json.value }}"
                            ),
                            topicPrefix
                        ).msg
                    );
                } else if (type.toLowerCase() === "noise") {
                    messages.push(
                        new NoiseDiscoveryMessage(
                            getStationDeviceInfos(station),
                            station.module_name.toLowerCase(),
                            new StateConfig(
                                `home/${station.module_name.toLowerCase()}/sensor/noise`,
                                "{{ value_json.value }}"
                            ),
                            topicPrefix
                        ).msg
                    );
                } else if (type.toLowerCase() === "pressure") {
                    messages.push(
                        new PressureDiscoveryMessage(
                            getStationDeviceInfos(station),
                            station.module_name.toLowerCase(),
                            new StateConfig(
                                `home/${station.module_name.toLowerCase()}/sensor/pressure`,
                                "{{ value_json.value }}"
                            ),
                            topicPrefix
                        ).msg
                    );
                }
            });

            station.modules.forEach((module) => {
                module.data_type.forEach((type) => {
                    if (type.toLowerCase() === "temperature") {
                        messages.push(
                            new TemperatureDiscoveryMessage(
                                getModuleDeviceInfos(station, module),
                                module.module_name.toLowerCase(),
                                new StateConfig(
                                    `home/${module.module_name.toLowerCase()}/sensor/temperature`,
                                    "{{ value_json.value }}"
                                ),
                                topicPrefix
                            ).msg
                        );
                    } else if (type.toLowerCase() === "humidity") {
                        messages.push(
                            new HumidityDiscoveryMessage(
                                getModuleDeviceInfos(station, module),
                                module.module_name.toLowerCase(),
                                new StateConfig(
                                    `home/${module.module_name.toLowerCase()}/sensor/humidity`,
                                    "{{ value_json.value }}"
                                ),
                                topicPrefix
                            ).msg
                        );
                    } else if (type.toLowerCase() === "co2") {
                        messages.push(
                            new Co2DiscoveryMessage(
                                getModuleDeviceInfos(station, module),
                                module.module_name.toLowerCase(),
                                new StateConfig(
                                    `home/${module.module_name.toLowerCase()}/sensor/co2`,
                                    "{{ value_json.value }}"
                                ),
                                topicPrefix
                            ).msg
                        );
                    }
                });

                if (module.battery_percent !== undefined) {
                    messages.push(
                        new BatteryDiscoveryMessage(
                            getModuleDeviceInfos(station, module),
                            module.module_name.toLowerCase(),
                            "netatmo",
                            new StateConfig(
                                `netatmo/weather/${station._id}/${module._id}`,
                                "{{ value_json.battery }}"
                            ),
                            topicPrefix
                        ).msg
                    );
                }
            });
        });
    }

    return messages;
}

module.exports.weatherStationToHomeassistant = weatherStationToHomeassistant;
