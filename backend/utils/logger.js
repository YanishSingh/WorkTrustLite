const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../logs', 'activity.log');

exports.logActivity = (userId, action, details) => {
  const logEntry = `[${new Date().toISOString()}] User:${userId} Action:${action} Details:${JSON.stringify(details)}\n`;
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) console.error('Activity logging error:', err);
  });
};
