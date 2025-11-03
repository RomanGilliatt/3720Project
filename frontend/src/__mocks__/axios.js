// Manual mock for axios so Jest doesn't try to parse the ESM package in node_modules
const mockAxios = {
  post: jest.fn(),
  get: jest.fn(),
  create: function () { return this; },
};

module.exports = mockAxios;
