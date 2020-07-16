export const updateNavigation = nav => {
  return async dispatch => {
    dispatch({ type: "UPDATE_NAV", payload: nav });
  };
};

export const toggleBio = flag => {
  return async dispatch => {
    dispatch({ type: "TOGGLE_BIO", payload: flag });
  };
};
