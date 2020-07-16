import React from "react";
import {
  Text,
  Dimensions,
  View,
  Platform,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import RBSheet from "react-native-raw-bottom-sheet";
import RNIap, {
  InAppPurchase,
  PurchaseError,
  SubscriptionPurchase,
  acknowledgePurchaseAndroid,
  consumePurchaseAndroid,
  finishTransaction,
  finishTransactionIOS,
  purchaseErrorListener,
  purchaseUpdatedListener
} from "react-native-iap";
import { connect } from "react-redux";
import * as WalletActions from "../actions/WalletActions";
import { Divider } from "react-native-paper";
import Toast from "react-native-toast-message";
import auth from "@react-native-firebase/auth";
import FastImage from "react-native-fast-image";
import firestore from "@react-native-firebase/firestore";
import * as JebenaColors from "../utils/colors";
import * as JebenaFunctions from "../utils/functions";
import Carousel from "react-native-snap-carousel";
import _ from "lodash";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

//Register in App purchase products
// const productIds = Platform.select({
//   ios: [
//     "app.jebena.buy.3hearts1likes",
//     "app.jebena.buy.10hearts3likes",
//     "app.jebena.buy.25hearts6likes"
//   ],
//   android: [
//     "app.jebena.buy.3hearts1likes",
//     "app.jebena.buy.10hearts3likes",
//     "app.jebena.buy.25hearts6likes"
//   ]
// });

class InAppPurchasePopUp extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    jebenaProducts: [],
    productIds: [],
    gettingProducts: true,
    receipt: ""
  };

  async componentDidMount() {
    console.log("InAppPurchase Mounted");
    const { uid } = auth().currentUser;
    //Get wallet info
    this.props.getWalletInfo(uid);
    try {
      const result = await RNIap.initConnection();
      console.log("💰Connection Results:", result);
    } catch (err) {
      console.warn(err.code, err.message);
    }

    //console.log("ARRAY: ", productIdsArray);
    console.log("YENE PRODUCS: ", this.props.productPrices);

    //this.setState({ productIds: productIdsArray });

    //Get products available
    this.getJebenaProducts();

    //Openpopup
    this.Popup.open();
  }

  getJebenaProducts = async () => {
    //const { productIds } = this.state;

    //Get products IDS
    let productIdsArray = [];
    this.props.productPrices.forEach(prod => {
      productIdsArray.push(prod.productId);
      console.log(prod.productId);
    });

    let productIds = Platform.select({
      ios: productIdsArray,
      android: productIdsArray
    });

    console.log("💰Get Jebena Products...");
    this.setState({ gettingProducts: true });
    try {
      const products = await RNIap.getProducts(productIds);
      console.log(products);
      this.setState({
        jebenaProducts: products,
        gettingProducts: false
      });
      console.log(`💰${products.length} products found`);
    } catch (err) {
      console.log("Error getting products", err.message);
    }
  };

  requestPurchase = async sku => {
    try {
      this.props.updateWalletLoading(true);
      RNIap.requestPurchase(sku, false);
    } catch (err) {
      console.warn(err.code, err.message);
    }
  };

  showWallet = () => {
    return (
      <View>
        <Text style={styles.sectionTitle}>Your Wallet</Text>
        {this.props.wallet && (
          <View style={{ flexDirection: "row" }}>
            <View style={styles.walletChip}>
              <Text style={styles.walletChipAmount}>
                {this.props.wallet.heartsCount}
              </Text>
              <Text style={styles.walletChipName}>Hearts</Text>
            </View>
            <View style={styles.walletChip}>
              <Text style={styles.walletChipAmount}>
                {this.props.wallet.likesCount}
              </Text>
              <Text style={styles.walletChipName}>Likes</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  purchaseProduct = product => {
    console.log("Buy ", product.productId);
    this.requestPurchase(product.productId);
  };

  _renderItem = ({ item, index }) => {
    let itemStyle = styles.popularItemStyle;
    if (item.productId.indexOf("likes") > -1) {
      itemStyle = styles.cheapestItemStyle;
    } else {
      itemStyle = styles.popularItemStyle;
    }
    return (
      <View>
        <TouchableOpacity
          style={itemStyle}
          onPress={() => this.purchaseProduct(item)}
        >
          <FastImage
            source={require("./assets/premium_icons.png")}
            resizeMode="cover"
            style={styles.itemIcon}
          />
          <View style={styles.itemDescription}>
            <Text style={styles.itemDescriptionText}>
              <Text style={styles.itemDescriptionTextBold}>
                {item.description}
              </Text>
            </Text>
          </View>
          <View style={styles.itemFooterContainer}>
            <Text style={styles.itemPrice}>{item.localizedPrice}</Text>
            {item.productId === "app.jebena.buy.10likes" && (
              <View style={styles.popularItemTag}>
                <Text style={styles.popularItemTagText}>Popular</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  render() {
    return (
      <RBSheet
        ref={ref => {
          this.Popup = ref;
        }}
        onClose={() => {
          this.props.updateWalletMessage(``);
          this.props.toggleWallet(false);
        }}
        closeOnDragDown={true}
        height={SCREEN_HEIGHT * 0.67}
        duration={300}
        customStyles={{
          container: {
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25
          }
        }}
      >
        <View style={styles.main}>
          <View style={{ marginTop: 15 }}>
            <Text style={styles.messageText}>{this.props.walletMessage}</Text>
          </View>
          {this.showWallet()}
          <View>
            <Divider style={styles.divider} />
            <Text style={styles.sectionTitle}>Refill Your Wallet</Text>
          </View>
          {this.state.gettingProducts ? (
            <View style={styles.productsListStyle}>
              <ActivityIndicator
                size="large"
                color={JebenaColors.primaryColor()}
              />
            </View>
          ) : (
            <Carousel
              ref={c => (this._slider1Ref = c)}
              data={this.state.jebenaProducts}
              renderItem={this._renderItem.bind(this)}
              sliderWidth={SCREEN_WIDTH}
              itemWidth={SCREEN_WIDTH * 0.7}
              loop={true}
            />
          )}
        </View>
        {this.props.walletLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Refilling</Text>
          </View>
        )}
        <Toast ref={ref => Toast.setRef(ref)} />
      </RBSheet>
    );
  }
}

const styles = {
  main: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    alignItems: "center"
  },
  productsList: {
    width: SCREEN_WIDTH,
    backgroundColor: "green"
  },
  productsListLoader: {
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: "center"
  },
  messageText: {
    fontSize: 20,
    fontWeight: "600",
    color: JebenaColors.primaryColor(),
    textAlign: "center"
  },
  slide: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_HEIGHT * 0.3
  },
  popularItemStyle: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_HEIGHT * 0.3,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#EB3748",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65
  },
  cheapestItemStyle: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_HEIGHT * 0.3,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#458EDB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65
  },
  mostExpensiveItemStyle: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_HEIGHT * 0.3,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#38B76E",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65
  },
  itemPrice: {
    textAlign: "left",
    color: "white",
    fontSize: 16,
    fontWeight: "700"
  },
  itemIcon: {
    width: SCREEN_WIDTH * 0.35,
    height: SCREEN_WIDTH * 0.25,
    marginTop: 5
  },
  popularItemTag: {
    backgroundColor: "white",
    height: SCREEN_WIDTH * 0.075,
    width: SCREEN_WIDTH * 0.2,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center"
  },
  popularItemTagText: {
    color: "#EB3748"
  },
  itemDescription: {
    marginTop: 0,
    width: SCREEN_WIDTH * 0.7,
    paddingHorizontal: 15
  },
  itemDescriptionText: {
    marginTop: 10,
    color: "white",
    fontWeight: "600",
    fontSize: 16
  },
  itemDescriptionTextBold: {
    marginTop: 10,
    color: "white",
    fontWeight: "900",
    fontSize: 16
  },
  itemFooterContainer: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    width: SCREEN_WIDTH * 0.6
  },
  walletChip: {
    backgroundColor: JebenaColors.lightBlueBg(),
    width: SCREEN_WIDTH / 3,
    height: 60,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65
  },
  walletChipAmount: {
    color: JebenaColors.primaryColor(),
    fontSize: 24
  },
  walletChipName: {
    color: "#8395a7"
  },
  divider: {
    marginTop: 15,
    width: SCREEN_WIDTH * 0.8
  },
  loadingContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.67,
    backgroundColor: "rgba(0,0,0,0.7)",
    position: "absolute",
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 10
  }
};

function mapStateToProps(state) {
  return {
    wallet: state.walletReducer.wallet,
    walletLoading: state.walletReducer.walletLoading,
    openWallet: state.walletReducer.openWallet,
    walletMessage: state.walletReducer.walletMessage,
    productPrices: state.walletReducer.productPrices
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateWalletMessage: message =>
      dispatch(WalletActions.updateWalletMessage(message)),
    updateWalletLoading: loading =>
      dispatch(WalletActions.updateWalletLoading(loading)),
    getWalletInfo: uid => dispatch(WalletActions.getWalletInfo(uid)),
    toggleWallet: openWallet =>
      dispatch(WalletActions.toggleWallet(openWallet)),
    updateWallet: (uid, updateType, featureType, amount, transactionData) =>
      dispatch(
        WalletActions.updateWallet(
          uid,
          updateType,
          featureType,
          amount,
          transactionData
        )
      ),
    refillWallet: (uid, updateType, amount, transactionData) =>
      dispatch(
        WalletActions.refillWallet(uid, updateType, amount, transactionData)
      )
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(InAppPurchasePopUp);
