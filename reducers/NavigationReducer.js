const INITIAL_STATE = {
  nav: null,
  openBio: false
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "UPDATE_NAV":
      console.log("UPDATE_NAV: ", action.payload);
      return { ...state, nav: action.payload };
    case "TOGGLE_BIO":
      console.log("TOGGLE_BIO: ", action.payload);
      return { ...state, openBio: action.payload };
    default:
      return state;
  }
};
