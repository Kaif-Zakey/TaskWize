module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@/components': './components',
            '@/context': './context',
            '@/service': './service',
            '@/types': './types',
            '@/firebase': './firebase.ts',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
