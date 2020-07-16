import React from "react";
import { View, Dimensions, Text } from "react-native";
import FastImage from "react-native-fast-image";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import remoteConfig from "@react-native-firebase/remote-config";
import * as JebenaColors from "../utils/colors";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

class LoadingScreen extends React.Component {
  state = {};

  componentDidMount() {
    console.log("Loading.js Mounted..");
    let showInviteScreen = remoteConfig().getValue("SHOW_INVITE_SCREEN").value;
    console.log("Default to invite __: ", showInviteScreen);
    //Check the status of the user
    auth().onAuthStateChanged(user => {
      if (user) {
        console.log("Logged in user: ", user.uid);
        firestore()
          .collection("users")
          .doc(user.uid)
          .get()
          .then(async userSnap => {
            if (userSnap && userSnap.data()) {
              let userData = userSnap.data();
              console.log("We got user data from firebase.");
              console.log("Profile Completed: ", userData.profileCompleted);
              console.log(
                "Preferences completed: ",
                userData.preferencesCompleted
              );
              if (
                userData.profileCompleted === true &&
                userData.preferencesCompleted === true
              ) {
                console.log(`Profile ${user.uid} is ready for matching`);
                if (showInviteScreen) {
                  this.props.navigation.navigate("InvitationStack");
                } else {
                  this.props.navigation.navigate("HomeStack");
                }
              } else {
                if (
                  !userData.profileCompleted ||
                  userData.profileCompleted === false
                ) {
                  console.log("Loading: User needs to complete profile");
                  this.props.navigation.navigate("Complete");
                } else if (
                  !userData.preferencesCompleted ||
                  userData.preferencesCompleted === false
                ) {
                  console.log("Loading: User needs to finish preferences");
                  this.props.navigation.navigate("Preferences");
                }
              }
            } else {
              auth().signOut();
            }
          });
      } else {
        this.props.navigation.navigate("Auth");
      }
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <FastImage
          style={styles.loadingImage}
          source={require("../screens/assets/jebena_logo_pouring.png")}
          resizeMode="cover"
        />
        <Text style={styles.loadingTitle}>Jebena</Text>
      </View>
    );
  }
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: JebenaColors.primaryColor(),
    paddingTop: SCREEN_HEIGHT / 3,
    alignItems: "center"
  },
  loadingImage: {
    width: SCREEN_WIDTH * 0.25,
    height: SCREEN_WIDTH * 0.25
  },
  loadingTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "700"
  }
};

export default LoadingScreen;
