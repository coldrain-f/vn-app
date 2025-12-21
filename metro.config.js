const fs = require('graceful-fs');
fs.gracefulify(require('fs'));

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;