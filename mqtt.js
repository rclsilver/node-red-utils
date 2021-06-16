/**
 * Parse Topic and returns area, name and type
 *
 * @param {string} topic
 * @returns {object}
 */
module.exports.parseTopic = (topic) => {
    const match = topic.match(/^home\/([^/]+)\/([^/]+)\/([^/]+)(?:\/.*)?$/);

    if (match) {
        return {
            area: match[1],
            type: match[2],
            name: match[3],
        };
    }
};
