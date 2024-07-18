const storeInSession = (key, value) => {
    console.log(key, value);
  return sessionStorage.setItem(key, value);
};

const lookInSession = (key) => {
  return sessionStorage.getItem(key);
};

const removeFormSession = (key) => {
  return sessionStorage.removeItem(key);
};

const logOutUser = () => {
  sessionStorage.clear();
};

export { storeInSession, lookInSession, removeFormSession, logOutUser};