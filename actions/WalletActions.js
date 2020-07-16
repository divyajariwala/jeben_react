import firebase from "@react-native-firebase/app";
import firestore from "@react-native-firebase/firestore";

export const refillWallet = (uid, updateType, amount, transactionData) => {
  return async dispatch => {
    try {
      firebase.functions().httpsCallable("refillWallet")({
        uid: uid,
        updateParams: {
          updateType: updateType,
          amount: amount,
          transactionData: transactionData
        }
      });
    } catch (error) {
      dispatch({ type: "WALLET_LOADING", payload: false });
      console.log("Error updating wallet: ", error.message);
    }
  };
};

export const updateWallet = (
  uid,
  updateType,
  featureType,
  amount,
  transactionData
) => {
  return async dispatch => {
    try {
      firebase.functions().httpsCallable("updateWallet")({
        uid: uid,
        updateParams: {
          updateType: updateType,
          featureType: featureType,
          amount: amount
        }
      });
    } catch (error) {
      dispatch({ type: "WALLET_LOADING", payload: false });
      dispatch({ type: "ERROR_UPDATING_WALLET" });
      console.log("Error updating wallet: ", error.message);
    }
  };
};

export const getWalletInfo = uid => {
  return async dispatch => {
    try {
      dispatch({ type: "WALLET_LOADING", payload: true });
      firestore()
        .collection("users")
        .doc(uid)
        .onSnapshot(userSnap => {
          if (userSnap) {
            let userData = userSnap.data();
            let wallet = {
              heartsCount: 0,
              likesCount: 0
            };
            if (userData && userData.wallet2) {
              if (userData.wallet2.heartsCount) {
                wallet.heartsCount = userData.wallet2.heartsCount;
              }
              if (userData.wallet2.likesCount) {
                wallet.likesCount = userData.wallet2.likesCount;
              }
            }
            dispatch({ type: "WALLET_LOADING", payload: false });
            dispatch({ type: "GET_WALLET_INFO", payload: wallet });
          }
        });
    } catch (error) {
      dispatch({ type: "WALLET_LOADING", payload: false });
      dispatch({ type: "ERROR_GETTING_WALLET" });
      console.log("Error getting wallet: ", error.message);
    }
  };
};

export const updateProductPrices = prices => {
  console.log("PRICES_CALLED");
  return async dispatch => {
    dispatch({ type: "UPDATE_PRODUCT_PRICES", payload: prices });
  };
};

export const updateWallet2 = (uid, featureType, amount, receiptData) => {
  return async dispatch => {
    try {
      console.log("💰 INSIDE TRY WALLET 2");
      firebase
        .functions()
        .httpsCallable("updateWallet2")({
          uid: uid,
          updateParams: {
            featureType: featureType,
            amount: amount,
            receiptData: receiptData
          }
        })
        .then(res => {
          console.log("HTTPS RES: ", res);
        })
        .catch(err => {
          console.log("HTTPS Error: ", err);
        });
    } catch (error) {
      dispatch({ type: "WALLET_LOADING", payload: false });
      dispatch({ type: "ERROR_UPDATING_WALLET" });
      console.log("Error updating wallet: ", error.message);
    }
  };
};

export const toggleWallet = openWallet => {
  return async dispatch => {
    dispatch({ type: "TOGGLE_WALLET", payload: openWallet });
  };
};

export const updateWalletMessage = message => {
  return async dispatch => {
    dispatch({ type: "UPDATE_WALLET_MESSAGE", payload: message });
  };
};

export const updateWalletLoading = loading => {
  return async dispatch => {
    dispatch({ type: "WALLET_LOADING", payload: loading });
  };
};
