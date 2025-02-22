export default {
    testEnvironment: 'node',
    transform: {
        '^.+\\.jsx?$': 'babel-jest', // Transformiert JavaScript-Dateien mit Babel
    },
    testMatch: [
      "**/*.test.js"
    ],       
  };
