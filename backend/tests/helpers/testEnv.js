export const applyTestEnv = (overrides = {}) => {
  process.env.NODE_ENV = "test";

  if (!process.env.MONGO_URL) {
    process.env.MONGO_URL = "mongodb://127.0.0.1:27017/fastfoodonline_test";
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test_secret";
  }
  if (!process.env.SALT) {
    process.env.SALT = "10";
  }

  if (!process.env.GEOCODER_BASE_URL) {
    process.env.GEOCODER_BASE_URL = "http://localhost:0";
  }

  Object.assign(process.env, overrides);
  return process.env;
};

export default { applyTestEnv };

