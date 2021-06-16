const {
    AvailabilityConfig,
    CommandConfig,
    LightConfig,
    StateConfig,
    BatteryDiscoveryMessage,
    BrightnessDiscoveryMessage,
    EnabledDiscoveryMessage,
    LightDiscoveryMessage,
    MotionDiscoveryMessage,
    TemperatureDiscoveryMessage,
} = require("./home-assistant");

/**
 * Convert a Hue message to a Home-Assistant discovery message
 *
 * @param {object} msg The hue message received
 * @param {string} topicPrefix MQTT topic prefix
 * @returns The message to send to MQTT
 */
function brightnessToHomeassistant(msg, topicPrefix = "homeassistant") {
    const { area } = parseName(msg.info.name);

    // Brightness comes from the Hue motion sensor device
    msg.info.uniqueId = msg.info.uniqueId.replace(/^(.+)-02-040.$/, "$1");
    msg.info.model.name = "Hue motion sensor";

    const device = getDeviceInfos(msg, area);

    return new BrightnessDiscoveryMessage(
        device,
        area,
        new StateConfig(
            `home/${area}/sensor/brightness`,
            "{{ value_json.value }}"
        ),
        topicPrefix
    ).msg;
}

/**
 * Get device informations from the hue message
 *
 * @param {object} msg The hue message received
 * @returns Device informations
 */
function getDeviceInfos(msg, area) {
    return {
        identifiers: msg.info.uniqueId,
        name: `${msg.info.model.name} ${area}`,
        manufacturer: msg.info.model.manufacturer,
        model: msg.info.model.id,
        area: area,
        sw_version: msg.info.softwareVersion,
    };
}

/**
 * Convert a Hue message to a Home-Assistant discovery message
 *
 * @param {object} msg The hue message received
 * @param {string} topicPrefix MQTT topic prefix
 * @returns The message to send to MQTT
 */
function motionToHomeassistant(msg, topicPrefix = "homeassistant") {
    const { area, name } = parseName(msg.info.name);

    // Brightness comes from the Hue motion sensor device
    msg.info.uniqueId = msg.info.uniqueId.replace(/^(.+)-02-040.$/, "$1");
    msg.info.model.name = "Hue motion sensor";

    const device = getDeviceInfos(msg, area);

    return new MotionDiscoveryMessage(
        device,
        area,
        name,
        new StateConfig(
            `home/${area}/sensor/${name}`,
            "{{ value_json.value }}",
            false,
            true
        ),
        topicPrefix
    ).msg;
}

/**
 * Convert a Hue message to a Home-Assistant discovery message
 *
 * @param {object} msg The hue message received
 * @param {string} topicPrefix MQTT topic prefix
 * @returns The message to send to MQTT
 */
function motionBatteryToHomeassistant(msg, topicPrefix = "homeassistant") {
    const { area, name } = parseName(msg.info.name);

    // Brightness comes from the Hue motion sensor device
    msg.info.uniqueId = msg.info.uniqueId.replace(/^(.+)-02-040.$/, "$1");
    msg.info.model.name = "Hue motion sensor";

    const device = getDeviceInfos(msg, area);

    return new BatteryDiscoveryMessage(
        device,
        area,
        name,
        new StateConfig(
            `home/${area}/sensor/brightness`,
            "{{ value_json.battery }}"
        ),
        topicPrefix
    ).msg;
}

/**
 * Convert a Hue message to a Home-Assistant discovery message
 *
 * @param {object} msg The hue message received
 * @param {string} topicPrefix MQTT topic prefix
 * @returns The message to send to MQTT
 */
function lightToHomeassistant(msg, topicPrefix = "homeassistant") {
    const { area, name } = parseName(msg.info.name);
    const device = getDeviceInfos(msg, area);
    const config = {
        brightness: true,
        brightnessScale: 100,
        colorModes: ["brightness"],
    };

    if (msg.payload.colorTemp !== undefined) {
        config.colorModes.push("color_temp");
    }

    if (msg.payload.xy !== undefined) {
        config.colorModes.push("xy");
    }

    return new LightDiscoveryMessage(
        device,
        area,
        name,
        new LightConfig(config),
        new StateConfig(`home/${area}/light/${name}/state`),
        new CommandConfig(`home/${area}/light/${name}/set`),
        new AvailabilityConfig(`home/${area}/light/${name}/availability`),
        topicPrefix
    ).msg;
}

/**
 * Convert a Hue message to a Home-Assistant discovery message
 *
 * @param {object} msg The hue message received
 * @param {string} topicPrefix MQTT topic prefix
 * @returns The message to send to MQTT
 */
function motionEnabledToHomeassistant(msg, topicPrefix = "homeassistant") {
    const { area, name } = parseName(msg.info.name);

    // Brightness comes from the Hue motion sensor device
    msg.info.uniqueId = msg.info.uniqueId.replace(/^(.+)-02-040.$/, "$1");
    msg.info.model.name = "Hue motion sensor";

    const device = getDeviceInfos(msg, area);

    return new EnabledDiscoveryMessage(
        device,
        area,
        name,
        new StateConfig(
            `home/${area}/sensor/${name}`,
            "{{ value_json.enabled }}",
            false,
            true
        ),
        new CommandConfig(`home/${area}/sensor/${name}/set`, "false", "true"),
        topicPrefix
    ).msg;
}

/**
 * Parse Hue name and returns area and device name
 *
 * @param {string} name Hue device name
 */
function parseName(name) {
    // Hue devices are named <area>_<name>
    const match = name.match(/^([^_]+)(?:_(.+))?$/);

    if (match) {
        return {
            area: match[1],
            name: match[2],
        };
    }
}

/**
 * Convert a Hue message to a Home-Assistant discovery message
 *
 * @param {object} msg The hue message received
 * @param {string} topicPrefix MQTT topic prefix
 * @returns The message to send to MQTT
 */
function temperatureToHomeassistant(msg, topicPrefix = "homeassistant") {
    const { area } = parseName(msg.info.name);

    // Temperature comes from the Hue motion sensor device
    msg.info.uniqueId = msg.info.uniqueId.replace(/^(.+)-02-040.$/, "$1");
    msg.info.model.name = "Hue motion sensor";

    const device = getDeviceInfos(msg, area);

    return new TemperatureDiscoveryMessage(
        device,
        area,
        new StateConfig(
            `home/${area}/sensor/temperature`,
            "{{ value_json.value }}"
        ),
        topicPrefix
    ).msg;
}

module.exports.parseName = parseName;
module.exports.brightnessToHomeassistant = brightnessToHomeassistant;
module.exports.lightToHomeassistant = lightToHomeassistant;
module.exports.motionToHomeassistant = motionToHomeassistant;
module.exports.motionBatteryToHomeassistant = motionBatteryToHomeassistant;
module.exports.motionEnabledToHomeassistant = motionEnabledToHomeassistant;
module.exports.temperatureToHomeassistant = temperatureToHomeassistant;
