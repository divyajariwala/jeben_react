const INITIAL_STATE = {
  oneSignalPlayerId: ""
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "SET_PLAYER_ID":
      console.log("SET_PLAYER_ID", action.payload);
      const newState = { oneSignalPlayerId: action.payload };
      return newState;
    default:
      return state;
  }
};
