const assert = require('chai').assert;
const inLogs = async (log, eventName) => {
    const event = log.find(e => e.event === eventName) // If e.event === eventName, return the corresponding log value. If not, return undefined.
    console.log(event)
    assert.exists(event)
}

module.exports = {
    inLogs
}