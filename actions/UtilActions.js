import firebase from "@react-native-firebase/app";
import firestore from "@react-native-firebase/firestore";

export const updateAvailableRegions = regions => {
  return async dispatch => {
    dispatch({ type: "UPDATE_AVAILABLE_REGIONS", payload: regions });
  };
};

export const updateUserLocation = location => {
  return async dispatch => {
    dispatch({ type: "UPDATE_USER_LOCATION", payload: location });
  };
};

export const updateMatchesArray = matches => {
  return async dispatch => {
    dispatch({ type: "UPDATE_MATCHES_ARRAY", payload: matches });
  };
};

export const updateMatch = match => {
  return async dispatch => {
    dispatch({ type: "UPDATE_MATCH", payload: match });
  };
};

export const toggleBlock = block => {
  return async dispatch => {
    dispatch({ type: "TOGGLE_BLOCK", payload: block });
  };
};

export const updateBlockedUsers = uid => {
  return async dispatch => {
    firestore()
      .collection("interactions")
      .doc(uid)
      .get()
      .then(async userSnap => {
        if (userSnap) {
          let userData = userSnap.data();
          if (userData && userData.blockedPool) {
            dispatch({
              type: "UPDATE_BLOCKED_USERS",
              payload: userData.blockedPool
            });
          }
        }
      });
  };
};
