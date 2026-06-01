module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@features': './src/features',
            '@components': './src/components',
            '@navigation': './src/navigation',
            '@store': './src/store',
            '@hooks': './src/hooks',
            '@services': './src/services',
            '@constants': './src/constants',
            '@utils': './src/utils',
            '@types': './src/types',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
