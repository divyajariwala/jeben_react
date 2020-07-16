import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView
} from "react-native";
import { SafeAreaConsumer } from "react-native-safe-area-context";
import FastImage from "react-native-fast-image";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import remoteConfig from "@react-native-firebase/remote-config";
import { Toolbar } from "react-native-material-ui";
import firebase from "@react-native-firebase/app";
import ProgressBar from "react-native-progress/Bar";
import Share from "react-native-share";
import * as JebenaFunctions from "../utils/functions";
import * as JebenaColors from "../utils/colors";
import * as JebenaImages from "../utils/Images";
import { connect } from "react-redux";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

class InvitationScreen extends React.Component {
  static navigationOptions = () => ({
    header: null
  });
  state = {
    firstName: "",
    totalUsers: 0,
    targetCount: 0,
    userRegion: "",
    invitationMessage: "",
    invitationLink: "",
    invitationImageUrl: "",
    invitationTitle: ""
  };

  handleShare(url) {
    //Increment Firebase counter
    const { uid } = auth().currentUser;
    firestore()
      .collection("users")
      .doc(uid)
      .set(
        {
          invitationClickCount: firebase.firestore.FieldValue.increment(1)
        },
        { merge: true }
      )
      .then(() => {
        console.log("Incremented invitation click.");
      })
      .catch(error => {
        console.log("Error saving feedback info firestore: ", error.message);
      });

    console.log("Share: ", url);
    console.log(Share.Social.SMS);
    const shareOptions = {
      title: "Share via 😁",
      message: `Check out Jebena:\n${url}`
    };
    Share.open(shareOptions)
      .then(() => {
        console.log("Shared.");
      })
      .catch(e => {
        console.log("ERROR.", e.message);
      });
  }

  componentDidMount() {
    console.log("InvitationScreen.js Mounted.");

    console.log("Available in 🌍: ", this.props.availableRegions);
    console.log("User Location 🌍: ", this.props.userLocation);

    const { uid } = auth().currentUser;

    const usersCollection = firestore().collection("users");
    const utilsCollection = firestore().collection("utils");

    utilsCollection.doc("userCount").onSnapshot(countSnap => {
      if (countSnap) {
        let countData = countSnap.data();
        if (countData && countData.totalUsers) {
          console.log("Total users:", countData.totalUsers);
          this.setState({ totalUsers: countData.totalUsers });
        }
        if (countData && countData.targetCount) {
          console.log("Target count:", countData.targetCount);
          this.setState({ targetCount: countData.targetCount });
        }
      }
    });
    utilsCollection.doc("settings").onSnapshot(settingsSnap => {
      if (settingsSnap) {
        let invitationData = settingsSnap.data();
        if (invitationData && invitationData.INVITATION_MSG) {
          console.log("Invitation Msg:", invitationData.INVITATION_MSG);
          this.setState({
            invitationMessage: invitationData.INVITATION_MSG
          });
        }
        if (invitationData && invitationData.INVITATION_LINK) {
          console.log("Invitation Link:", invitationData.INVITATION_LINK);
          this.setState({
            invitationLink: invitationData.INVITATION_LINK
          });
        }
        if (invitationData && invitationData.INVITATION_IMG_URL) {
          console.log("Invitation Img URL:", invitationData.INVITATION_IMG_URL);
          this.setState({
            invitationImageUrl: invitationData.INVITATION_IMG_URL
          });
        }
        if (invitationData && invitationData.INVITATION_TITLE) {
          console.log("Invitation Title:", invitationData.INVITATION_TITLE);
          this.setState({
            invitationTitle: invitationData.INVITATION_TITLE
          });
        }
      }
    });
    usersCollection.doc(uid).onSnapshot(userSnap => {
      if (userSnap) {
        let userData = userSnap.data();
        if (userData) {
          if (userData.firstName) {
            this.setState({ firstName: userData.firstName });
          }
        }
      }
    });
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
    const {
      firstName,
      totalUsers,
      targetCount,
      invitationMessage,
      invitationLink
    } = this.state;
    let usersProgress = 0;
    if (totalUsers && targetCount) {
      usersProgress = totalUsers / targetCount;
    }
    return (
      <View style={styles.container}>
        <SafeAreaConsumer>
          {insets => (
            <View
              style={[styles.statusBarContainer, { height: insets.top + 20 }]}
            >
              <StatusBar hidden={false} barStyle="light-content" />
            </View>
          )}
        </SafeAreaConsumer>
        <SafeAreaView>
          <View style={styles.appBar}>
            <Text style={styles.appBarTitle}>Invite</Text>
          </View>
        </SafeAreaView>
        <SafeAreaConsumer>
          {insets => (
            <View
              style={[styles.container, { paddingBottom: insets.bottom + 70 }]}
            >
              <View style={styles.container}>
                <View>
                  {this.state.invitationTitle ? (
                    <Text style={styles.welcomeMessage}>
                      {this.state.invitationTitle}
                    </Text>
                  ) : (
                    <Text
                      style={styles.welcomeMessage}
                    >{`${firstName}, you're in!`}</Text>
                  )}
                  <Text style={styles.welcomeFullMessage}>
                    {invitationMessage}
                  </Text>
                </View>
                <FastImage
                  style={styles.invitationImage}
                  source={{
                    uri: this.state.invitationImageUrl,
                    priority: FastImage.priority.high
                  }}
                  resizeMode="cover"
                />
                {/* <View>
                  <Text style={styles.welcomeFullMessage2}>
                    {`We cannot make this happen without you!`}
                  </Text>
                </View> */}
                <View style={styles.progressContainer}>
                  <ProgressBar
                    progress={usersProgress}
                    color="#C60000"
                    width={SCREEN_WIDTH - 80}
                    height={20}
                    style={styles.progressBar}
                  />
                  <View style={styles.progressTextContainer}>
                    <Text
                      style={styles.progressText}
                    >{`${JebenaFunctions.formatNumberWithCommas(
                      totalUsers
                    )} Users`}</Text>
                    <Text
                      style={styles.progressText}
                    >{`Target: ${JebenaFunctions.formatNumberWithCommas(
                      targetCount
                    )}`}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.couponInput}
                    onPress={() => this.handleShare(`${invitationLink}`)}
                  >
                    <Text style={styles.couponText2}>{`Invite Friends`}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </SafeAreaConsumer>
      </View>
    );
  }
}

const styles = {
  statusBarContainer: {
    height: 60,
    position: "absolute",
    width: SCREEN_WIDTH,
    backgroundColor: JebenaColors.primaryColor()
  },
  appBar: {
    backgroundColor: "#C60000",
    height: 60,
    width: SCREEN_WIDTH,
    borderBottomLeftRadius: SCREEN_WIDTH,
    borderBottomRightRadius: SCREEN_WIDTH,
    justifyContent: "center",
    top: 0,
    alignSelf: "center"
  },
  appBarTitle: {
    fontSize: 18,
    textAlign: "center",
    color: "white",
    fontWeight: "600"
  },
  container: {
    flex: 1,
    backgroundColor: JebenaColors.lightBackground(),
    alignItems: "center",
    justifyContent: "space-around"
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
  welcomeMessage: {
    marginVertical: 10,
    textAlign: "center",
    marginHorizontal: 20,
    fontSize: 24,
    fontWeight: "500",
    color: JebenaColors.primaryColor()
  },
  welcomeFullMessage: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: "500",
    marginHorizontal: 20
  },
  welcomeFullMessage2: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "500",
    marginHorizontal: 20
  },
  notAvailableMessage: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
    marginHorizontal: 20,
    marginTop: 20
  },
  invitationImage: {
    marginVertical: 10,
    width: SCREEN_HEIGHT * 0.35,
    height: SCREEN_HEIGHT * 0.35
  },
  progressContainer: {
    marginTop: 5,
    marginHorizontal: 20,
    alignItems: "center"
  },
  progressTextContainer: {
    width: SCREEN_WIDTH - 80,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  progressText: {
    marginTop: 2,
    textAlign: "center",
    fontSize: 12,
    color: JebenaColors.grayText()
  },
  progressBar: { borderRadius: 20 },
  couponInput: {
    backgroundColor: JebenaColors.primaryColor(),
    height: 50,
    width: SCREEN_WIDTH - 100,
    marginTop: 20,
    //borderWidth: 1,
    //borderStyle: "line",
    borderColor: JebenaColors.primaryColor(),
    borderRadius: 25,
    justifyContent: "center",
    padding: 10
  },
  couponText: {
    fontSize: 12,
    textAlign: "center"
  },
  couponText2: {
    fontSize: 20,
    fontWeight: "500",
    textAlign: "center",
    color: "white"
  }
};

function mapStateToProps(state) {
  return {
    availableRegions: state.utilReducer.availableRegions,
    userLocation: state.utilReducer.userLocation
  };
}

export default connect(mapStateToProps)(InvitationScreen);
