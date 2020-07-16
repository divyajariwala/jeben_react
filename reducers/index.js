import { combineReducers } from "redux";
import oneSignalReducer from "./OneSignalReducer";
import walletReducer from "./WalletReducer";
import navigationReducer from "./NavigationReducer";
import userReducer from "./UserReducer";
import utilReducer from "./UtilReducer";

export default combineReducers({
  oneSignalReducer,
  walletReducer,
  navigationReducer,
  userReducer,
  utilReducer
});
