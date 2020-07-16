const INITIAL_STATE = {
  availableRegions: [],
  userLocation: "",
  matchesArray: [],
  alreadyBlocked: false,
  blockedUsers: [],
  match: null
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "UPDATE_AVAILABLE_REGIONS":
      console.log("UPDATE_AVAILABLE_REGIONS: ", action.payload);
      return { ...state, availableRegions: action.payload };
    case "UPDATE_USER_LOCATION":
      console.log("UPDATE_USER_LOCATION: ", action.payload);
      return { ...state, userLocation: action.payload };
    case "UPDATE_MATCHES_ARRAY":
      console.log("UPDATE_MATCHES_ARRAY: ", action.payload);
      return { ...state, matchesArray: action.payload };
    case "TOGGLE_BLOCK":
      console.log("TOGGLE_BLOCK: ", action.payload);
      return { ...state, alreadyBlocked: action.payload };
    case "UPDATE_BLOCKED_USERS":
      console.log("UPDATE_BLOCKED_USERS: ", action.payload);
      return { ...state, blockedUsers: action.payload };
    case "UPDATE_MATCH":
      console.log("UPDATE_MATCH: ", action.payload);
      return { ...state, match: action.payload };
    default:
      return state;
  }
};
