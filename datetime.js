const moment = require("moment");

/**
 * Convert a date to a timestamp
 *
 * @param {string} date
 */
module.exports.toTimestamp = (date, milliseconds = false) => {
    return moment(date).format(milliseconds ? "x" : "X");
};
