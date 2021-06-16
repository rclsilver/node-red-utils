var crypto = require("crypto");

class AvailabilityConfig {
    constructor(
        topic,
        payloadAvailable = undefined,
        payloadNotAvailable = undefined
    ) {
        this._topic = topic;
        this._payloadAvailable = payloadAvailable;
        this._payloadNotAvailable = payloadNotAvailable;
    }

    get topic() {
        return this._topic;
    }

    get payloadAvailable() {
        return this._payloadAvailable;
    }

    get payloadNotAvailable() {
        return this._payloadNotAvailable;
    }
}

class CommandConfig {
    constructor(topic, payloadOff = undefined, payloadOn = undefined) {
        this._topic = topic;
        this._payloadOff = payloadOff;
        this._payloadOn = payloadOn;
    }

    get topic() {
        return this._topic;
    }

    get payloadOff() {
        return this._payloadOff;
    }

    get payloadOn() {
        return this._payloadOn;
    }
}

class LightConfig {
    constructor(config) {
        this._brightness = config.brightness;
        this._brightnessScale = config.brightnessScale;
        this._colorModes = config.colorModes;
    }

    get brightness() {
        return this._brightness;
    }

    get brightnessScale() {
        return this._brightnessScale;
    }

    get colorModes() {
        return this._colorModes;
    }
}

class StateConfig {
    constructor(
        topic,
        valueTemplate = undefined,
        stateOff = undefined,
        stateOn = undefined
    ) {
        this._topic = topic;
        this._valueTemplate = valueTemplate;
        this._stateOff = stateOff;
        this._stateOn = stateOn;
    }

    get topic() {
        return this._topic;
    }

    get valueTemplate() {
        return this._valueTemplate;
    }

    get stateOff() {
        return this._stateOff;
    }

    get stateOn() {
        return this._stateOn;
    }
}

/**
 * Base MQTT discovery message
 */
class BaseDiscoveryMessage {
    /**
     * Build a base discovery message
     *
     * @param {object} device Device informations
     * @param {string} topicPrefix Prefix of the topic
     * @param {string} topicComponent One of the supported MQTT components, eg. binary_sensor.
     * @param {string} topicNodeId (Optional): ID of the node providing the topic, this is not used by Home Assistant but may be used to structure the MQTT topic. The ID of the node must only consist of characters from the character class [a-zA-Z0-9_-] (alphanumerics, underscore and hyphen).
     * @param {string} topicObjectId The ID of the device. This is only to allow for separate topics for each device and is not used for the entity_id. The ID of the device must only consist of characters from the character class [a-zA-Z0-9_-] (alphanumerics, underscore and hyphen).
     */
    constructor(
        device,
        topicPrefix,
        topicComponent,
        topicNodeId,
        topicObjectId
    ) {
        this._message = {
            qos: 2,
            retain: true,
            payload: {
                device: {
                    /*
                     * identifiers string | list (optional)
                     * A list of IDs that uniquely identify the device. For example a serial number.
                     */
                    identifiers: device.identifiers,

                    /*
                     * name string (optional)
                     * The name of the device.
                     */
                    name: device.name,

                    /*
                     * manufacturer string (optional)
                     * The manufacturer of the device.
                     */
                    manufacturer: device.manufacturer,

                    /*
                     * model string (optional)
                     * The model of the device.
                     */
                    model: device.model,

                    /*
                     * suggested_area string (optional)
                     * Suggest an area if the device isn’t in one yet.
                     */
                    //suggested_area: device.area,

                    /*
                     * sw_version string (optional)
                     * The firmware version of the device.
                     */
                    sw_version: device.sw_version,
                },
            },
        };

        if (device.via_device !== undefined) {
            /*
             * via_device string (optional)
             * Identifier of a device that routes messages between this device and Home Assistant. Examples of such devices are hubs, or parent devices of a sub-device. This is used to show device topology in Home Assistant.
             */
            this._message.payload.device.via_device = device.via_device;
        }

        if (topicNodeId) {
            topicNodeId = crypto
                .createHash("md5")
                .update(topicNodeId)
                .digest("hex");
            this._message.topic = `${topicPrefix}/${topicComponent}/${topicNodeId}/${topicObjectId}/config`;
        } else {
            this._message.topic = `${topicPrefix}/${topicComponent}/${topicObjectId}/config`;
        }
    }

    get msg() {
        return this._message;
    }
}

/**
 * Home-Assistant battery discovery message
 */
class BatteryDiscoveryMessage extends BaseDiscoveryMessage {
    constructor(device, area, name, state, topicPrefix = "homeassistant") {
        super(
            device,
            topicPrefix,
            "sensor",
            device.identifiers,
            `${area}_${name}_battery`
        );

        /*
         * name string (optional, default: MQTT Sensor)
         * The name of the MQTT sensor
         */
        this._message.payload.name = `${area} - ${name} - battery`;

        /*
         * unique_id string (optional)
         * An ID that uniquely identifies this sensor. If two sensors have the same unique ID, Home Assistant will raise an exception.
         */
        this._message.payload.unique_id = `${area}_${name}_battery`;

        /*
         * device_class device_class (optional, default: None)
         * The type/class of the sensor to set the icon in the frontend.
         */
        this._message.payload.device_class = "battery";

        /*
         * state_topic string REQUIRED
         * The MQTT topic subscribed to receive sensor values.
         */
        this._message.payload.state_topic = state.topic;

        /*
         * value_template template (optional)
         * Defines a template to extract the value. Available variables: entity_id. The entity_id can be used to reference the entity’s attributes.
         */
        this._message.payload.value_template = state.valueTemplate;

        /*
         * unit_of_measurement string (optional)
         * Defines the units of measurement of the sensor, if any.
         */
        this._message.payload.unit_of_measurement = "%";
    }
}

/**
 * Home-Assistant brightness discovery message
 */
class BrightnessDiscoveryMessage extends BaseDiscoveryMessage {
    constructor(device, area, state, topicPrefix = "homeassistant") {
        super(
            device,
            topicPrefix,
            "sensor",
            device.identifiers,
            `${area}_brightness`
        );

        /*
         * name string (optional, default: MQTT Sensor)
         * The name of the MQTT sensor
         */
        this._message.payload.name = `${area} - brightness`;

        /*
         * unique_id string (optional)
         * An ID that uniquely identifies this sensor. If two sensors have the same unique ID, Home Assistant will raise an exception.
         */
        this._message.payload.unique_id = `${area}_brightness`;

        /*
         * device_class device_class (optional, default: None)
         * The type/class of the sensor to set the icon in the frontend.
         */
        this._message.payload.device_class = "illuminance";

        /*
         * state_topic string REQUIRED
         * The MQTT topic subscribed to receive sensor values.
         */
        this._message.payload.state_topic = state.topic;

        /*
         * value_template template (optional)
         * Defines a template to extract the value. Available variables: entity_id. The entity_id can be used to reference the entity’s attributes.
         */
        this._message.payload.value_template = state.valueTemplate;

        /*
         * unit_of_measurement string (optional)
         * Defines the units of measurement of the sensor, if any.
         */
        this._message.payload.unit_of_measurement = "lx";
    }
}

/**
 * Home-Assistant CO² discovery message
 */
class Co2DiscoveryMessage extends BaseDiscoveryMessage {
    constructor(device, area, state, topicPrefix = "homeassistant") {
        super(device, topicPrefix, "sensor", device.identifiers, `${area}_co2`);

        /*
         * name string (optional, default: MQTT Sensor)
         * The name of the MQTT sensor
         */
        this._message.payload.name = `${area} - CO²`;

        /*
         * unique_id string (optional)
         * An ID that uniquely identifies this sensor. If two sensors have the same unique ID, Home Assistant will raise an exception.
         */
        this._message.payload.unique_id = `${area}_co2`;

        /*
         * device_class device_class (optional, default: None)
         * The type/class of the sensor to set the icon in the frontend.
         */
        //this._message.payload.device_class = "carbon_dioxide";

        /*
         * state_topic string REQUIRED
         * The MQTT topic subscribed to receive sensor values.
         */
        this._message.payload.state_topic = state.topic;

        /*
         * value_template template (optional)
         * Defines a template to extract the value. Available variables: entity_id. The entity_id can be used to reference the entity’s attributes.
         */
        this._message.payload.value_template = state.valueTemplate;

        /*
         * unit_of_measurement string (optional)
         * Defines the units of measurement of the sensor, if any.
         */
        this._message.payload.unit_of_measurement = "ppm";
    }
}

/**
 * Home-Assistant battery discovery message
 */
class EnabledDiscoveryMessage extends BaseDiscoveryMessage {
    constructor(
        device,
        area,
        name,
        state,
        command,
        topicPrefix = "homeassistant"
    ) {
        super(
            device,
            topicPrefix,
            "switch",
            device.identifiers,
            `${area}_${name}_enabled`
        );

        /*
         * name string (optional, default: MQTT Sensor)
         * The name of the MQTT sensor
         */
        this._message.payload.name = `${area} - ${name} - enabled`;

        /*
         * unique_id string (optional)
         * An ID that uniquely identifies this sensor. If two sensors have the same unique ID, Home Assistant will raise an exception.
         */
        this._message.payload.unique_id = `${area}_${name}_enabled`;

        /*
         * state_topic string REQUIRED
         * The MQTT topic subscribed to receive sensor values.
         */
        this._message.payload.state_topic = state.topic;

        /*
         * value_template template (optional)
         * Defines a template to extract the value. Available variables: entity_id. The entity_id can be used to reference the entity’s attributes.
         */
        this._message.payload.value_template = state.valueTemplate;

        /*
         * state_off string (optional)
         * The payload that represents the off state. Used when value that represents off state in the state_topic is different from value that should be sent to the command_topic to turn the device off.
         *
         * Default: payload_off if defined, else OFF
         */
        this._message.payload.state_off = state.stateOff;

        /*
         * state_on string (optional)
         * The payload that represents the on state. Used when value that represents on state in the state_topic is different from value that should be sent to the command_topic to turn the device on.
         *
         * Default: payload_on if defined, else ON
         */
        this._message.payload.state_on = state.stateOn;

        /*
         * command_topic string (optional)
         * The MQTT topic to publish commands to change the switch state.
         */
        this._message.payload.command_topic = command.topic;

        /*
         * payload_off string (optional, default: OFF)
         * The payload that represents off state. If specified, will be used for both comparing to the value in the state_topic (see value_template and state_off for details) and sending as off command to the command_topic.
         */
        this._message.payload.payload_off = command.payloadOff;

        /*
         * payload_on string (optional, default: ON)
         * The payload that represents on state. If specified, will be used for both comparing to the value in the state_topic (see value_template and state_on for details) and sending as on command to the command_topic.
         */
        this._message.payload.payload_on = command.payloadOn;
    }
}

/**
 * Home-Assistant humidity discovery message
 */
class HumidityDiscoveryMessage extends BaseDiscoveryMessage {
    constructor(device, area, state, topicPrefix = "homeassistant") {
        super(
            device,
            topicPrefix,
            "sensor",
            device.identifiers,
            `${area}_humidity`
        );

        /*
         * name string (optional, default: MQTT Sensor)
         * The name of the MQTT sensor
         */
        this._message.payload.name = `${area} - humidity`;

        /*
         * unique_id string (optional)
         * An ID that uniquely identifies this sensor. If two sensors have the same unique ID, Home Assistant will raise an exception.
         */
        this._message.payload.unique_id = `${area}_humidity`;

        /*
         * device_class device_class (optional, default: None)
         * The type/class of the sensor to set the icon in the frontend.
         */
        this._message.payload.device_class = "humidity";

        /*
         * state_topic string REQUIRED
         * The MQTT topic subscribed to receive sensor values.
         */
        this._message.payload.state_topic = state.topic;

        /*
         * value_template template (optional)
         * Defines a template to extract the value. Available variables: entity_id. The entity_id can be used to reference the entity’s attributes.
         */
        this._message.payload.value_template = state.valueTemplate;

        /*
         * unit_of_measurement string (optional)
         * Defines the units of measurement of the sensor, if any.
         */
        this._message.payload.unit_of_measurement = "%";
    }
}

class LightDiscoveryMessage extends BaseDiscoveryMessage {
    constructor(
        device,
        area,
        name,
        config,
        state,
        command,
        availability = undefined,
        topicPrefix = "homeassistant"
    ) {
        super(
            device,
            topicPrefix,
            "light",
            device.identifiers,
            `${area}_${name}`
        );

        this._message.payload.schema = "json";

        /*
         * name string (optional, default: MQTT Light)
         * The name of the light.
         */
        this._message.payload.name = `${area} - ${name}`;

        /*
         * unique_id string (optional)
         * An ID that uniquely identifies this light. If two lights have the same unique ID, Home Assistant will raise an exception.
         */
        this._message.payload.unique_id = `${area}_${name}`;

        /*
         * state_topic string (optional)
         * The MQTT topic subscribed to receive state updates.
         */
        this._message.payload.state_topic = state.topic;

        if (availability) {
            this._message.payload.availability = {
                /*
                 * availability_topic string (optional)
                 * The MQTT topic subscribed to receive availability (online/offline) updates. Must not be used together with availability.
                 */
                topic: availability.topic,

                /*
                 * payload_available string (optional, default: online)
                 * The payload that represents the available state.
                 */
                payload_available: availability.payloadAvailable
                    ? availability.payloadAvailable
                    : "online",

                /*
                 * payload_not_available string (optional, default: offline)
                 * The payload that represents the unavailable state.
                 */
                payload_not_available: availability.payloadNotAvailable
                    ? availability.payloadNotAvailable
                    : "offline",
            };
        }

        if (command) {
            /*
             * command_topic string REQUIRED
             * The MQTT topic to publish commands to change the light’s state.
             */
            this._message.payload.command_topic = command.topic;
        }

        if (config.brightness !== undefined) {
            if (config.brightness) {
                this._message.payload.brightness = config.brightness;

                /*
                 * brightness_scale integer (optional, default: 255)
                 * Defines the maximum brightness value (i.e., 100%) of the MQTT device.
                 */
                if (config.brightnessScale !== undefined) {
                    this._message.payload.brightness_scale =
                        config.brightnessScale;
                }
            }
        }

        if (
            config.colorModes !== undefined &&
            config.colorModes instanceof Array
        ) {
            config.colorModes.forEach((mode) => {
                this._message.payload[mode] = true;
            });
        }
    }
}

/**
 * Home-Assistant temperature discovery message
 */
class MotionDiscoveryMessage extends BaseDiscoveryMessage {
    constructor(device, area, name, state, topicPrefix = "homeassistant") {
        super(
            device,
            topicPrefix,
            "binary_sensor",
            device.identifiers,
            `${area}_${name}`
        );

        /*
         * name string (optional, default: MQTT Sensor)
         * The name of the MQTT sensor
         */
        this._message.payload.name = `${area} - ${name}`;

        /*
         * unique_id string (optional)
         * An ID that uniquely identifies this sensor. If two sensors have the same unique ID, Home Assistant will raise an exception.
         */
        this._message.payload.unique_id = `${area}_${name}`;

        /*
         * device_class device_class (optional, default: None)
         * The type/class of the sensor to set the icon in the frontend.
         */
        this._message.payload.device_class = "motion";

        /*
         * state_topic string REQUIRED
         * The MQTT topic subscribed to receive sensor values.
         */
        this._message.payload.state_topic = state.topic;

        /*
         * value_template template (optional)
         * Defines a template to extract the value. Available variables: entity_id. The entity_id can be used to reference the entity’s attributes.
         */
        this._message.payload.value_template = state.valueTemplate;

        /*
         * payload_off string (optional, default: OFF)
         * The string that represents the off state. It will be compared to the message in the state_topic (see value_template for details)
         */
        this._message.payload.payload_off = state.stateOff;

        /*
         * payload_on string (optional, default: ON)
         * The string that represents the on state. It will be compared to the message in the state_topic (see value_template for details)
         */
        this._message.payload.payload_on = state.stateOn;
    }
}

/**
 * Home-Assistant noise discovery message
 */
class NoiseDiscoveryMessage extends BaseDiscoveryMessage {
    constructor(device, area, state, topicPrefix = "homeassistant") {
        super(
            device,
            topicPrefix,
            "sensor",
            device.identifiers,
            `${area}_noise`
        );

        /*
         * name string (optional, default: MQTT Sensor)
         * The name of the MQTT sensor
         */
        this._message.payload.name = `${area} - Noise`;

        /*
         * unique_id string (optional)
         * An ID that uniquely identifies this sensor. If two sensors have the same unique ID, Home Assistant will raise an exception.
         */
        this._message.payload.unique_id = `${area}_noise`;

        /*
         * state_topic string REQUIRED
         * The MQTT topic subscribed to receive sensor values.
         */
        this._message.payload.state_topic = state.topic;

        /*
         * value_template template (optional)
         * Defines a template to extract the value. Available variables: entity_id. The entity_id can be used to reference the entity’s attributes.
         */
        this._message.payload.value_template = state.valueTemplate;

        /*
         * unit_of_measurement string (optional)
         * Defines the units of measurement of the sensor, if any.
         */
        this._message.payload.unit_of_measurement = "dBm";
    }
}

/**
 * Home-Assistant pressure discovery message
 */
class PressureDiscoveryMessage extends BaseDiscoveryMessage {
    constructor(device, area, state, topicPrefix = "homeassistant") {
        super(
            device,
            topicPrefix,
            "sensor",
            device.identifiers,
            `${area}_pressure`
        );

        /*
         * name string (optional, default: MQTT Sensor)
         * The name of the MQTT sensor
         */
        this._message.payload.name = `${area} - Presure`;

        /*
         * unique_id string (optional)
         * An ID that uniquely identifies this sensor. If two sensors have the same unique ID, Home Assistant will raise an exception.
         */
        this._message.payload.unique_id = `${area}_pressure`;

        /*
         * device_class device_class (optional, default: None)
         * The type/class of the sensor to set the icon in the frontend.
         */
        this._message.payload.device_class = "pressure";

        /*
         * state_topic string REQUIRED
         * The MQTT topic subscribed to receive sensor values.
         */
        this._message.payload.state_topic = state.topic;

        /*
         * value_template template (optional)
         * Defines a template to extract the value. Available variables: entity_id. The entity_id can be used to reference the entity’s attributes.
         */
        this._message.payload.value_template = state.valueTemplate;

        /*
         * unit_of_measurement string (optional)
         * Defines the units of measurement of the sensor, if any.
         */
        this._message.payload.unit_of_measurement = "hPa";
    }
}

/**
 * Home-Assistant temperature discovery message
 */
class TemperatureDiscoveryMessage extends BaseDiscoveryMessage {
    constructor(device, area, state, topicPrefix = "homeassistant") {
        super(
            device,
            topicPrefix,
            "sensor",
            device.identifiers,
            `${area}_temperature`
        );

        /*
         * name string (optional, default: MQTT Sensor)
         * The name of the MQTT sensor
         */
        this._message.payload.name = `${area} - temperature`;

        /*
         * unique_id string (optional)
         * An ID that uniquely identifies this sensor. If two sensors have the same unique ID, Home Assistant will raise an exception.
         */
        this._message.payload.unique_id = `${area}_temperature`;

        /*
         * device_class device_class (optional, default: None)
         * The type/class of the sensor to set the icon in the frontend.
         */
        this._message.payload.device_class = "temperature";

        /*
         * state_topic string REQUIRED
         * The MQTT topic subscribed to receive sensor values.
         */
        this._message.payload.state_topic = state.topic;

        /*
         * value_template template (optional)
         * Defines a template to extract the value. Available variables: entity_id. The entity_id can be used to reference the entity’s attributes.
         */
        this._message.payload.value_template = state.valueTemplate;

        /*
         * unit_of_measurement string (optional)
         * Defines the units of measurement of the sensor, if any.
         */
        this._message.payload.unit_of_measurement = "°C";
    }
}

module.exports.AvailabilityConfig = AvailabilityConfig;
module.exports.CommandConfig = CommandConfig;
module.exports.LightConfig = LightConfig;
module.exports.StateConfig = StateConfig;
module.exports.BaseDiscoveryMessage = BaseDiscoveryMessage;
module.exports.BatteryDiscoveryMessage = BatteryDiscoveryMessage;
module.exports.BrightnessDiscoveryMessage = BrightnessDiscoveryMessage;
module.exports.Co2DiscoveryMessage = Co2DiscoveryMessage;
module.exports.HumidityDiscoveryMessage = HumidityDiscoveryMessage;
module.exports.LightDiscoveryMessage = LightDiscoveryMessage;
module.exports.MotionDiscoveryMessage = MotionDiscoveryMessage;
module.exports.NoiseDiscoveryMessage = NoiseDiscoveryMessage;
module.exports.PressureDiscoveryMessage = PressureDiscoveryMessage;
module.exports.EnabledDiscoveryMessage = EnabledDiscoveryMessage;
module.exports.TemperatureDiscoveryMessage = TemperatureDiscoveryMessage;
