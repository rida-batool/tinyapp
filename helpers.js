
const findUserByEmail = (email, users) => {
  for (let userid in users) {
    if (users[userid].email === email) {
      return users[userid];
    }
  }
  return false;
};

module.exports = { findUserByEmail };