const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ajouter un alias pour react-native-maps sur web
config.resolver.resolverMainFields = ['sbmodern', 'react-native', 'browser', 'main'];
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
