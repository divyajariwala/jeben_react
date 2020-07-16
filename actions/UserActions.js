export const updateWizard = wizardJson => {
  return async dispatch => {
    dispatch({ type: "UPDATE_WIZARD", payload: wizardJson });
  };
};

export const updateFirstName = name => {
  return async dispatch => {
    dispatch({ type: "UPDATE_FIRST_NAME", payload: name });
  };
};

export const updateLastName = name => {
  return async dispatch => {
    dispatch({ type: "UPDATE_LAST_NAME", payload: name });
  };
};

export const updateGooglePic = url => {
  return async dispatch => {
    dispatch({ type: "UPDATE_GOOGLE_PIC", payload: url });
  };
};

export const updateFacebookPic = url => {
  return async dispatch => {
    dispatch({ type: "UPDATE_FB_PIC", payload: url });
  };
};

export const updateOneSignalId = id => {
  return async dispatch => {
    dispatch({ type: "UPDATE_ONESIGNAL_ID", payload: id });
  };
};
