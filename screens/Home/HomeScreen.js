import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  Dimensions,
  Image,
  StatusBar,
  Linking,
  TouchableOpacity,
  AppState,
  ActivityIndicator
} from "react-native";
import { connect } from "react-redux";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import remoteConfig from "@react-native-firebase/remote-config";
import VersionNumber from "react-native-version-number";
import Toast from "react-native-toast-message";
import HomeFeed from "./HomeFeed";
import Geolocation from "@react-native-community/geolocation";
import Geocoder from "react-native-geocoding";
import * as NavActions from "../../actions/NavigationActions";
import FastImage from "react-native-fast-image";
import * as UtilActions from "../../actions/UtilActions";
import * as JebenaImages from "../../utils/Images";
import * as JebenaColors from "../../utils/colors";
import * as JebenaFunctions from "../../utils/functions";
import * as ApiKeys from "../../utils/ApiKeys";
import firebase from "@react-native-firebase/app";
import { check, PERMISSIONS, RESULTS } from "react-native-permissions";
import { SafeAreaConsumer } from "react-native-safe-area-context";
import { Icon } from "react-native-eva-icons";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

class HomeScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    header: null
  });

  state = {
    customAppBarUrl: null,
    locationPermissionGranted: false,
    currentLat: null,
    currentLong: null,
    loadingRegions: true,
    currentAppVersion: ""
  };

  checkLocationPermission = () => {
    check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE)
      .then(result => {
        if (result === RESULTS.GRANTED) {
          console.log("🌍 Location permission granted");
          this.setState({ locationPermissionGranted: true });
          this.getUserLocation();
        } else {
          console.log("🌍Location permission NOT granted");
          this.setState({ locationPermissionGranted: false });
        }
      })
      .catch(error => {
        Toast.show({
          text1: "Sorry 😩",
          text2: "Error requesting location.",
          type: "error",
          position: "top",
          autoHide: true,
          visibilityTime: 4000
        });
        console.log("Error requesting location: ", error.message);
      });
  };

  getUserLocation() {
    const { uid } = auth().currentUser;

    Geolocation.getCurrentPosition(location => {
      if (location && location.coords) {
        let latitude = location.coords.latitude;
        let longitude = location.coords.longitude;
        console.log("Fetched Long & Lat in Home: ", latitude, longitude);
        console.log(
          "DB Long & Lat in Home: ",
          this.state.currentLat,
          this.state.currentLong
        );
        //Compare user's current location with the one in DB.
        if (
          latitude &&
          longitude &&
          this.state.currentLat &&
          this.state.currentLong
        ) {
          //Parse address if distance between points is significant
          let distance = JebenaFunctions.getHaversineDistance(
            latitude,
            longitude,
            this.state.currentLat,
            this.state.currentLong
          );

          console.log("🌎 The distance in KM is: ", distance);
          if (distance && distance > 160) {
            console.log(`Update distance with ${latitude}, ${longitude}`);
            //Start Google Maps
            console.log("Location has changed");
            Geocoder.init(ApiKeys.getGoogleMapsKey());
            Geocoder.from(latitude, longitude)
              .then(json => {
                const addressComponents = json.results[0].address_components;
                //console.log("Address Component: ", addressComponents);
                let userRegion = JebenaFunctions.parseAddress(
                  addressComponents
                );
                let userCity = JebenaFunctions.parseCity(addressComponents);
                this.props.updateUserLocation(userRegion);
                console.log(`User location: ${userRegion}`);
                console.log(`User city: ${userCity}`);
                let userLocationJson = {
                  location: userRegion,
                  coords: new firebase.firestore.GeoPoint(latitude, longitude),
                  city: userCity
                };

                firestore()
                  .collection("users")
                  .doc(uid)
                  .set(userLocationJson, { merge: true })
                  .then(() => {
                    console.log("User location saved in HomeScreen.");
                  })
                  .catch(error => {
                    Toast.show({
                      text1: "Sorry 😩",
                      text2: "Error saving preferences.",
                      type: "error",
                      position: "top",
                      autoHide: true,
                      visibilityTime: 2000
                    });
                    console.log(
                      "Error Saving User Preference: ",
                      error.message
                    );
                  });
              })
              .catch(error => console.error(error));
            //End of Google Maps
          } else {
            console.log("Don't update distance");
          }
        }

        //If user's db location is null, it means they're new. Map them.
        if (
          !this.state.currentLat ||
          !this.state.currentLong ||
          !this.props.userLocation
        ) {
          console.log("Save new user's location");
          Geocoder.init(ApiKeys.getGoogleMapsKey());
          Geocoder.from(latitude, longitude)
            .then(json => {
              const addressComponents = json.results[0].address_components;
              //console.log("Address Component: ", addressComponents);
              let userRegion = JebenaFunctions.parseAddress(addressComponents);
              let userCity = JebenaFunctions.parseCity(addressComponents);
              this.props.updateUserLocation(userRegion);
              console.log(`User location: ${userRegion}`);
              console.log(`User city: ${userCity}`);
              let userLocationJson = {
                location: userRegion,
                coords: new firebase.firestore.GeoPoint(latitude, longitude),
                city: userCity
              };

              firestore()
                .collection("users")
                .doc(uid)
                .set(userLocationJson, { merge: true })
                .then(() => {
                  console.log("User location saved in HomeScreen.");
                })
                .catch(error => {
                  Toast.show({
                    text1: "Sorry 😩",
                    text2: "Error saving preferences.",
                    type: "error",
                    position: "top",
                    autoHide: true,
                    visibilityTime: 2000
                  });
                  console.log("Error Saving User Preference: ", error.message);
                });
            })
            .catch(error => console.error(error));
          //End of Google Maps
        }
      }
    }).catch(error => {
      const { code, message } = error;
      console.warn(code, message);
      Toast.show({
        text1: "Sorry 😩",
        text2: "Error getting location.",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 3000
      });
    });
  }

  componentDidMount() {
    console.log("HomeScreen Mounted");
    const { uid } = auth().currentUser;

    //Get user data for location and completion check
    firestore()
      .collection("users")
      .doc(uid)
      .get()
      .then(async userSnap => {
        if (userSnap) {
          let userData = userSnap.data();
          if (userData) {
            this.setState({ loadingRegions: false });

            if (userData.coords) {
              this.setState({
                currentLat: userData.coords._latitude,
                currentLong: userData.coords._longitude
              });
            }
            if (userData.location) {
              await this.props.updateUserLocation(userData.location);
            }
            if (
              !userData.about ||
              !userData.about.bio ||
              !userData.about.music ||
              !userData.firstName ||
              !userData.lastName
            ) {
              this.props.navigation.navigate("ProfileSetting", {
                PAGE_TITLE: "My Profile",
                SETTING_NAME: "SETTING_PROFILE",
                SHOW_COMPLETE_PROFILE_MSG: true
              });
            }
            if (
              !userData.preferences ||
              !userData.preferences.genderPreference ||
              !userData.preferences.locationPreference ||
              !userData.preferences.maxAgePreference ||
              !userData.preferences.minAgePreference
            ) {
              this.props.navigation.navigate("ProfileSetting", {
                PAGE_TITLE: "My Preferences",
                SETTING_NAME: "SETTING_PREFERENCES",
                SHOW_COMPLETE_PREFS_MSG: true
              });
            }
          }
        }
      });
    this.props.updateBlockedUsers(uid);
    this.props.updateNavigation(this.props.navigation);
    firestore()
      .collection("utils")
      .doc("customAppBar")
      .get()
      .then(async utilsSnap => {
        if (utilsSnap) {
          let utilsData = utilsSnap.data();
          if (utilsData && utilsData.showCustomAppBar) {
            if (utilsData.customAppBarUrl) {
              this.setState({ customAppBarUrl: utilsData.customAppBarUrl });
            }
          }
        }
      });
    firestore()
      .collection("utils")
      .doc("appupdate")
      .get()
      .then(async utilsSnap => {
        if (utilsSnap) {
          let utilsData = utilsSnap.data();
          if (utilsData && utilsData.showMessage) {
            if (utilsData.currentVersion) {
              if (utilsData.currentVersion !== VersionNumber.appVersion) {
                Toast.show({
                  text1: "Please Update Your App",
                  text2: "Important updates are available.",
                  type: "error",
                  position: "top",
                  autoHide: true,
                  visibilityTime: 5000
                });
              }
            }
          }
        }
      });
    this.checkLocationPermission();
    AppState.addEventListener("change", this._handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener("change", this._handleAppStateChange);
  }

  _handleAppStateChange = nextAppState => {
    console.log("___NEXT___STATE");
    console.log(nextAppState);
    this.getUserLocation();
  };

  renderNomalAppBar() {
    return (
      <View>
        <View style={styles.statusBarContainer}>
          <StatusBar hidden={false} barStyle="light-content" />
        </View>
        <SafeAreaView>
          <View style={styles.appBar}>
            <Text style={styles.logoTitle}>Jebena</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  renderCustomAppBar() {
    return (
      <View>
        <StatusBar hidden={false} barStyle="light-content" />
        <Image
          source={{ uri: this.state.customAppBarUrl }}
          resizeMode="cover"
          style={styles.appBarCustom}
        />
      </View>
    );
  }

  renderRegionMaps() {
    return this.props.availableRegions.map(region => {
      if (region.substring(0, 3) === "US_") {
        let regionImage = JebenaImages.getRegionImage(region);
        return (
          <FastImage
            key={regionImage}
            source={regionImage}
            resizeMode="cover"
            style={styles.regionMap}
          />
        );
      }
    });
  }

  render() {
    return (
      <View style={styles.container}>
        {this.state.customAppBarUrl
          ? this.renderCustomAppBar()
          : this.renderNomalAppBar()}
        <Toast ref={ref => Toast.setRef(ref)} />
        <View style={{ marginTop: -(SCREEN_WIDTH * 0.2) }}>
          {!this.state.locationPermissionGranted ? (
            <SafeAreaConsumer>
              {insets => (
                <View
                  style={[
                    styles.locationMessageContainer,
                    { height: SCREEN_HEIGHT - (insets.bottom + 150) }
                  ]}
                >
                  <Icon
                    name="pin-outline"
                    width={60}
                    height={60}
                    fill={JebenaColors.primaryColor()}
                  />
                  <Text style={styles.locationMessage}>Location Needed</Text>
                  <Text style={styles.notAvailableMessage}>
                    {`Matching feature requires your location.\nPlease enable it from Settings.`}
                  </Text>
                  <TouchableOpacity
                    style={styles.locationBtn}
                    onPress={() => {
                      Linking.openURL("app-settings:");
                    }}
                  >
                    <Text style={styles.locationBtnText}>Enable Location</Text>
                  </TouchableOpacity>
                </View>
              )}
            </SafeAreaConsumer>
          ) : (
            [
              (this.props.availableRegions.includes(this.props.userLocation) ||
                this.props.availableRegions.includes("WORLDWIDE")) &&
              !this.state.loadingRegions ? (
                <HomeFeed key="home_feed" />
              ) : (
                [
                  !this.state.loadingRegions ? (
                    <SafeAreaConsumer key="home_not_available">
                      {insets => (
                        <View
                          style={[
                            styles.locationMessageContainer,
                            { height: SCREEN_HEIGHT - (insets.bottom + 150) }
                          ]}
                        >
                          <Icon
                            name="pin-outline"
                            width={60}
                            height={60}
                            fill={JebenaColors.primaryColor()}
                          />
                          <Text style={styles.locationMessage}>
                            Not Available
                          </Text>
                          <Text style={styles.notAvailableMessage}>
                            {`Jebena will be available in your area shortly.\n\nIn the meantime, please complete your profile and invite your friends.`}
                          </Text>
                        </View>
                      )}
                    </SafeAreaConsumer>
                  ) : (
                    <View style={styles.noMoreSwipesContainer}>
                      <ActivityIndicator
                        size="large"
                        color={JebenaColors.primaryColor()}
                      />
                    </View>
                  )
                ]
              )
            ]
          )}
        </View>
      </View>
    );
  }
}

const styles = {
  statusBarContainer: {
    height: 50,
    position: "absolute",
    width: SCREEN_WIDTH,
    backgroundColor: JebenaColors.primaryColor()
  },
  statusBarCustomContainer: {
    height: 50,
    position: "absolute",
    width: SCREEN_WIDTH
  },
  appBar: {
    backgroundColor: JebenaColors.primaryColor(),
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.3,
    borderBottomLeftRadius: SCREEN_WIDTH / 4,
    borderBottomRightRadius: SCREEN_WIDTH / 4
  },
  appBarCustom: {
    backgroundColor: JebenaColors.primaryColor(),
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.4,
    borderBottomLeftRadius: SCREEN_WIDTH / 4,
    borderBottomRightRadius: SCREEN_WIDTH / 4
  },
  logoContainer: {
    alignSelf: "center",
    marginTop: 5,
    width: 20,
    height: 30
  },
  logoTitle: {
    textAlign: "center",
    fontFamily: "Cochin",
    fontStyle: "italic",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 10,
    color: "white"
  },
  main: {
    backgroundColor: "white",
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 0
  },
  toolBar: {
    container: {
      height: 40,
      width: SCREEN_WIDTH,
      flexDirection: "row",
      backgroundColor: "white",
      justifyContent: "center"
    },
    titleText: {
      color: "#C60000"
    },
    centerElement: {
      color: "#C60000"
    },
    centerElementContainer: {
      backgroundColor: "white",
      position: "absolute",
      alignItems: "center"
    }
  },
  container: {
    flex: 1,
    backgroundColor: JebenaColors.lightBlueBg()
  },
  mapBg: {
    position: "absolute",
    backgroundColor: "",
    width: SCREEN_WIDTH * 0.75,
    height: 200,
    marginTop: 10
  },
  regionMap: {
    position: "absolute",
    backgroundColor: "",
    width: SCREEN_WIDTH * 0.75,
    height: 200,
    marginTop: 10
  },
  mapContainer: {
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
    width: SCREEN_WIDTH * 0.75,
    height: 200
  },
  locationMessageContainer: {
    width: SCREEN_WIDTH,
    justifyContent: "center",
    alignItems: "center"
  },
  noMoreSwipesContainer: {
    alignItems: "center",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    marginTop: SCREEN_HEIGHT / 8
  },
  locationMessage: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "500",
    marginHorizontal: 20,
    marginTop: 20
  },
  locationBtn: {
    width: SCREEN_WIDTH - 80,
    height: 50,
    borderRadius: 25,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: JebenaColors.primaryColor()
  },
  locationBtnText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600"
  },
  notAvailableMessage: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "500",
    marginHorizontal: 20,
    marginTop: 20
  }
};

function mapStateToProps(state) {
  return {
    nav: state.walletReducer.nav,
    availableRegions: state.utilReducer.availableRegions,
    userLocation: state.utilReducer.userLocation
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateNavigation: nav => dispatch(NavActions.updateNavigation(nav)),
    updateUserLocation: location =>
      dispatch(UtilActions.updateUserLocation(location)),
    updateBlockedUsers: uid => dispatch(UtilActions.updateBlockedUsers(uid))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HomeScreen);
