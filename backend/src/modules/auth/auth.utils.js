const jwt = require("jsonwebtoken");
const env = require("../../config/env");

const signAccessToken = (user) => {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  });
};

const signRefreshToken = (user) => {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });
};

const toAuthUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  role: user.role,
  accountStatus: user.accountStatus,
  profile: user.profile,
});

module.exports = { signAccessToken, signRefreshToken, toAuthUser };
