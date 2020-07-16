import React from "react";
import { Provider } from "react-redux";
import { setOneSignalPlayerId } from "./actions/OneSignalActions";
import Toast from "react-native-toast-message";
import store from "./store";
import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import { createBottomTabNavigator } from "react-navigation-tabs";
import { Icon } from "react-native-eva-icons";
import LoadingScreen from "./screens/LoadingScreen";
import LoginScreen from "./screens/LoginScreen";
import PreferencesScreen from "./screens/PreferencesScreen";
import CompleteRegistration from "./screens/CompleteRegistration";
import HomeScreen from "./screens/Home/HomeScreen";
import InvitationScreen from "./screens/InvitationScreen";
import MatchesScreen from "./screens/MatchesScreen";
import OpenedMatch from "./screens/OpenedMatch";
import MeScreen from "./screens/Me/MeScreen";
import ProfileSetting from "./screens/Setting/ProfileSetting";
import remoteConfig from "@react-native-firebase/remote-config";
import dynamicLinks from "@react-native-firebase/dynamic-links";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as JebenaColors from "./utils/colors";
import * as ApiKeys from "./utils/ApiKeys";
import OneSignal from "react-native-onesignal";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import VersionNumber from "react-native-version-number";
import _ from "lodash";
import * as JebenaFunctions from "./utils/functions";
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
import {
  refillWallet,
  updateWalletLoading,
  updateProductPrices,
  updateWallet2
} from "./actions/WalletActions";
import { updateAvailableRegions } from "./actions/UtilActions";

const HomeStack = createStackNavigator(
  { HomeScreen },
  {
    navigationOptions: {
      tabBarIcon: ({ tintColor }) => (
        <Icon name="home-outline" width={22} height={22} fill={tintColor} />
      ),
      title: "Home"
    }
  }
);

const InvitationStack = createStackNavigator(
  { InvitationScreen },
  {
    navigationOptions: {
      tabBarIcon: ({ tintColor }) => (
        <Icon name="link-outline" width={22} height={22} fill={tintColor} />
      ),
      title: "Invite"
    }
  }
);

const MatchesStack = createStackNavigator(
  {
    MatchesScreen,
    OpenedMatch
  },
  {
    navigationOptions: {
      tabBarIcon: ({ tintColor }) => (
        <Icon
          name="message-square-outline"
          width={22}
          height={22}
          fill={tintColor}
        />
      ),
      title: "Matches"
    }
  }
);

const MeStack = createStackNavigator(
  {
    MeScreen,
    ProfileSetting
  },
  {
    navigationOptions: {
      tabBarIcon: ({ tintColor }) => (
        <Icon name="person-outline" width={22} height={22} fill={tintColor} />
      ),
      title: "Profile"
    }
  }
);

const AuthStack = createStackNavigator(
  {
    Login: LoginScreen,
    Preferences: PreferencesScreen,
    Complete: CompleteRegistration
  },
  {
    defaultNavigationOptions: {
      gesturesEnabled: false
    }
  }
);

//Invitation App Nav
const InvitationAppNav = createBottomTabNavigator(
  {
    InvitationStack,
    MeStack
  },
  {
    tabBarOptions: {
      activeTintColor: JebenaColors.primaryColor(),
      inactiveTintColor: "lightgray",
      showLabel: true,
      style: {
        backgroundColor: "white",
        borderTopWidth: 0,
        height: 60,
        paddingTop: 10,
        paddingBottom: 10,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        position: "absolute",
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 4
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,

        elevation: 8
      }
    },
    swipeEnabled: true,
    initialRouteName: "InvitationStack"
  }
);

const InvitationAppContainer = createAppContainer(
  createStackNavigator(
    {
      Loading: LoadingScreen,
      App: InvitationAppNav,
      Auth: AuthStack
    },
    {
      headerMode: "none",
      defaultNavigationOptions: {
        gesturesEnabled: false
      }
    },
    {
      initialRouteName: "Loading"
    }
  )
);

//App Nav
const AppNav = createBottomTabNavigator(
  {
    HomeStack,
    InvitationStack,
    MatchesStack,
    MeStack
  },
  {
    tabBarOptions: {
      activeTintColor: JebenaColors.primaryColor(),
      inactiveTintColor: "lightgray",
      showLabel: true,
      style: {
        backgroundColor: "white",
        borderTopWidth: 0,
        height: 60,
        paddingTop: 10,
        paddingBottom: 10,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        position: "absolute",
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 4
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,

        elevation: 8
      }
    },
    animationEnabled: true,
    initialRouteName: "HomeStack"
  }
);

const AppContainer = createAppContainer(
  createStackNavigator(
    {
      Loading: LoadingScreen,
      App: AppNav,
      Auth: AuthStack
    },
    {
      headerMode: "none",
      defaultNavigationOptions: {
        gesturesEnabled: false
      }
    },
    {
      initialRouteName: "Loading"
    }
  )
);

let purchaseUpdateSubscription;
let purchaseErrorSubscription;
class App extends React.Component {
  constructor(props) {
    super(props);
    OneSignal.init(ApiKeys.getOneSignalAppId(), {
      kOSSettingsKeyInFocusDisplayOption: 0
    });
    OneSignal.inFocusDisplaying(0);
    OneSignal.addEventListener("received", this.onReceived);
    OneSignal.addEventListener("opened", this.onOpened);
    OneSignal.addEventListener("ids", this.onIds);

    //Subscribe to purchase status
    purchaseUpdateSubscription = purchaseUpdatedListener(async purchase => {
      const { uid } = auth().currentUser;
      const receipt = purchase.transactionReceipt;
      if (receipt) {
        try {
          const ackResult = await finishTransaction(purchase);
          //Update Firebase
          let transactionData = {
            transactionId: purchase.transactionId,
            transactionDate: purchase.transactionDate,
            transactionProduct: purchase.productId,
            transactionReceipt: purchase.transactionReceipt
          };
          //Get Product price
          //           productAmount: 10
          // productDescription: ""Send Heart to 10 People""
          // productFeatureType: "HEARTS"
          // productId: "app.jebena.buy.10hearts"
          // purchasedProductJson.productAmount,
          // transactionData

          let productPrices = store.getState().walletReducer.productPrices;

          let purchasedProductJson = productPrices.find(
            x => x.productId === purchase.productId
          );
          console.log("💰 TRASACTION DATA", transactionData);

          //Update wallet
          console.log("💰UPDATE WALLET After Purchase💰");
          store.dispatch(
            updateWallet2(
              uid,
              purchasedProductJson.productFeatureType,
              purchasedProductJson.productAmount,
              transactionData
            )
          );
          store.dispatch(updateWalletLoading(false));
        } catch (ackErr) {
          console.error("ackErr", ackErr);
        }
      }
    });

    purchaseErrorSubscription = purchaseErrorListener(error => {
      store.dispatch(updateWalletLoading(false));
      //this.props.updateWalletLoading(false);
      console.log("💰purchaseErrorListener: ", error);
      Toast.show({
        text1: "Purchase Error!",
        text2: "We couldn't process your order. Try again.",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 3000
      });
    });
    //End of Purchase
  }

  state = {
    showInviteScreen: false,
    signedInUid: null,
    availableRegions: []
  };

  setRemoteConfigDefaults = async () => {
    console.log("Setting Default Configs");

    try {
      remoteConfig().setDefaults({
        SHOW_INVITE_SCREEN: false,
        SHOW_CUSTOM_APPBAR: false
      });
      await remoteConfig().fetch();
      const activated = remoteConfig().activate();
      if (activated) {
        console.log("Fetched and Activated");
      } else {
        console.log("Fetched values failed to activate");
      }
    } catch (err) {
      console.log(err);
    }
  };

  async componentDidMount() {
    console.log("App.js Mounted.");
    //Set signedIn flag
    this.authSubscription = auth().onAuthStateChanged(user => {
      console.log("🔑 Sign In: ", user);
      if (user && user.uid) {
        this.setState({ signedInUid: user.uid });
        firestore()
          .collection("users")
          .doc(user.uid)
          .set(
            {
              signedIn: true,
              appVersion: VersionNumber.appVersion
            },
            { merge: true }
          )
          .catch(error => {
            console.error(error.message);
          });
      }
    });
    this.setRemoteConfigDefaults();
    let showInviteScreen = remoteConfig().getValue("SHOW_INVITE_SCREEN").value;
    this.setState({ showInviteScreen });
    firestore()
      .collection("utils")
      .doc("settings")
      .onSnapshot(settingsSnap => {
        if (settingsSnap) {
          let settingsData = settingsSnap.data();
          if (settingsData && settingsData.AVAILABLE_REGIONS) {
            store.dispatch(
              updateAvailableRegions(settingsData.AVAILABLE_REGIONS)
            );
          }
        }
      });
    firestore()
      .collection("prices")
      .onSnapshot(querySnapshot => {
        console.log(querySnapshot);
        if (!querySnapshot || querySnapshot.size === 0) {
          return;
        }
        let productsArray = [];
        querySnapshot.forEach(productSnap => {
          let productData = productSnap.data();
          productsArray.push({
            productId: productSnap.id,
            productAmount: productData.amount,
            productFeatureType: productData.featureType,
            productDescription: productData.productDescription
          });
        });
        store.dispatch(updateProductPrices(productsArray));
      });
  }

  componentWillUnmount() {
    OneSignal.removeEventListener("received", this.onReceived);
    OneSignal.removeEventListener("opened", this.onOpened);
    OneSignal.removeEventListener("ids", this.onIds);
    if (purchaseUpdateSubscription) {
      purchaseUpdateSubscription.remove();
      purchaseUpdateSubscription = null;
    }
    if (purchaseErrorSubscription) {
      purchaseErrorSubscription.remove();
      purchaseErrorSubscription = null;
    }
    this.authSubscription();
  }

  onReceived(notification) {
    /*

     * {"displayType": 1,

     "isAppInFocus": true,

     "payload": {"actionButtons": [],"body": "Broooo", "notificationID": "9e6753ae-82b4-4137-b91e-74e8715cd10d", "rawPayload": [Object], "custom": [Object]}, "sound": "default", "title": "Ayyy"}, "shown": true} */
    console.log("Notification received: ", notification);
  }

  onOpened(openResult) {
    // console.log("Message: ", openResult.notification.payload.body);
    // console.log("Data: ", openResult.notification.payload.additionalData);
    // console.log("isActive: ", openResult.notification.isAppInFocus);
    console.log("openResult: ", openResult);
  }

  onIds(device) {
    store.dispatch(setOneSignalPlayerId(device.userId));
    if (auth().currentUser && auth().currentUser.uid) {
      console.log("Device info: ", device);
      console.log("UID in App.js: ", auth().currentUser.uid);
      let userJson = {
        oneSignalPlayerId: device.userId
      };
      firestore()
        .collection("users")
        .doc(auth().currentUser.uid)
        .set(userJson, { merge: true })
        .then(() => {
          console.log("User device id in App.js");
        })
        .catch(error => {
          console.log("Error Saving User device id in App.js: ", error.message);
        });
    }
  }

  render() {
    const { showInviteScreen } = this.state;
    console.disableYellowBox = true;
    return (
      <Provider store={store}>
        <SafeAreaProvider>
          {showInviteScreen ? <InvitationAppContainer /> : <AppContainer />}
          <Toast ref={ref => Toast.setRef(ref)} />
        </SafeAreaProvider>
      </Provider>
    );
  }
}

export default App;
