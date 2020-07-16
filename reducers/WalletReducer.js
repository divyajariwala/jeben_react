const INITIAL_STATE = {
  wallet: {
    heartsCount: 0,
    likesCount: 0
  },
  productPrices: [],
  walletMessage: "Get matched faster with premium",
  walletLoading: false,
  openWallet: false
};

//ERROR_GETTING_WALLET

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "WALLET_LOADING":
      console.log("WALLET_LOADING: ", action.payload);
      return { ...state, walletLoading: action.payload };
    case "GET_WALLET_INFO":
      console.log("GET_WALLET_INFO: ", action.payload);
      return { ...state, wallet: action.payload };
    case "TOGGLE_WALLET":
      console.log("TOGGLE_WALLET: ", action.payload);
      return { ...state, openWallet: action.payload };
    case "UPDATE_WALLET_MESSAGE":
      console.log("UPDATE_WALLET_MESSAGE: ", action.payload);
      return { ...state, walletMessage: action.payload };
    case "UPDATE_PRODUCT_PRICES":
      console.log("UPDATE_PRODUCT_PRICES: ", action.payload);
      return { ...state, productPrices: action.payload };
    default:
      return state;
  }
};
