const INITIAL_STATE = {
  wizardJson: {},
  firstName: null,
  lastName: null,
  googleProfilePicture: null,
  facebookProfilePicture: null,
  oneSignalPlayerId: null
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "UPDATE_WIZARD":
      console.log("UPDATE_WIZARD: ", action.payload);
      return { ...state, wizardJson: action.payload };
    case "UPDATE_FIRST_NAME":
      console.log("UPDATE_FIRST_NAME: ", action.payload);
      return { ...state, firstName: action.payload };
    case "UPDATE_LAST_NAME":
      console.log("UPDATE_LAST_NAME: ", action.payload);
      return { ...state, lastName: action.payload };
    case "UPDATE_GOOGLE_PIC":
      console.log("UPDATE_GOOGLE_PIC: ", action.payload);
      return { ...state, googleProfilePicture: action.payload };
    case "UPDATE_FB_PIC":
      console.log("UPDATE_FB_PIC: ", action.payload);
      return { ...state, facebookProfilePicture: action.payload };
    case "UPDATE_ONESIGNAL_ID":
      console.log("UPDATE_ONESIGNAL_ID: ", action.payload);
      return { ...state, oneSignalPlayerId: action.payload };
    default:
      return state;
  }
};
