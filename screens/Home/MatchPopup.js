import React from "react";
import { connect } from "react-redux";
import { Text, View, TouchableOpacity, Dimensions } from "react-native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import FastImage from "react-native-fast-image";
import RBSheet from "react-native-raw-bottom-sheet";
import * as JebenaColors from "../../utils/colors";
import * as UtilActions from "../../actions/UtilActions";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

class MatchPopup extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    profilePicURL: ""
  };

  componentDidMount() {
    console.log("Match Popup Mounted");
    const { uid } = auth().currentUser;
    firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(userSnap => {
        if (userSnap) {
          let userData = userSnap.data();
          if (userData) {
            if (userData.profilePicURL) {
              this.setState({ profilePicURL: userData.profilePicURL });
            } else if (userData.googleProfilePicture) {
              this.setState({ profilePicURL: userData.googleProfilePicture });
            } else if (userData.facebookProfilePicture) {
              this.setState({ profilePicURL: userData.facebookProfilePicture });
            }
          }
        }
      });
    this.RBSheet.open();
  }

  render() {
    return (
      <View style={styles.container}>
        <RBSheet
          ref={ref => {
            this.RBSheet = ref;
          }}
          height={SCREEN_HEIGHT}
          duration={200}
          customStyles={{
            container: {
              backgroundColor: JebenaColors.primaryColor(),
              paddingTop: SCREEN_HEIGHT / 4
            }
          }}
        >
          <View style={styles.popupContent}>
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>
                {`You and ${this.props.match.firstName}\n have matched!`}
              </Text>
            </View>
            <View style={styles.avatarsContainer}>
              <FastImage
                style={styles.matchAvatar}
                source={{
                  uri: this.state.profilePicURL,
                  priority: FastImage.priority.normal
                }}
                resizeMode={FastImage.resizeMode.cover}
              />
              <FastImage
                style={styles.matchAvatar}
                source={{
                  uri: this.props.match.profilePicURL,
                  priority: FastImage.priority.normal
                }}
                resizeMode={FastImage.resizeMode.cover}
              />
            </View>
            <TouchableOpacity
              style={styles.messageBtn}
              onPress={() => {
                //Reset match data
                this.props.updateMatch(null);
                this.props.nav.navigate("OpenedMatch", {
                  item: this.props.match
                });
                this.RBSheet.close();
              }}
            >
              <Text style={styles.messageTitle}>
                Message {this.props.match.firstName}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                if (this.props.onReturnPress) {
                  this.props.onReturnPress();
                }
                this.RBSheet.close();
              }}
            >
              <Text style={styles.closeTitle}>Return</Text>
            </TouchableOpacity>
          </View>
        </RBSheet>
      </View>
    );
  }
}

const styles = {
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
  },
  popup: {
    width: SCREEN_WIDTH - 20,
    height: SCREEN_HEIGHT / 2,
    marginTop: SCREEN_HEIGHT / 10,
    borderRadius: 15,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white"
  },
  popupContent: {
    alignItems: "center"
  },
  popupTitle: {
    fontSize: 28,
    fontWeight: "600",
    marginVertical: 10,
    color: "white"
  },
  popupBtnsContainer: {
    width: SCREEN_WIDTH - 20,
    backgroundColor: "pink",
    height: 100,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15
  },
  messageBtn: {
    backgroundColor: "white",
    width: SCREEN_WIDTH - 80,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    marginTop: 10
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: "400",
    marginVertical: 10,
    color: JebenaColors.primaryColor()
  },
  closeBtn: {
    backgroundColor: JebenaColors.primaryColorDarker(),
    width: SCREEN_WIDTH - 80,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    marginTop: 10
  },
  closeTitle: {
    fontSize: 18,
    fontWeight: "400",
    marginVertical: 10,
    color: "white"
  },
  matchAvatar: {
    backgroundColor: "gray",
    left: 0,
    borderWidth: 2,
    borderColor: "white",
    marginLeft: -10,
    width: SCREEN_WIDTH / 3,
    height: SCREEN_WIDTH / 3,
    borderRadius: SCREEN_WIDTH / 6
  },
  avatarsContainer: {
    width: SCREEN_WIDTH - 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
    //backgroundColor: "pink",
    flexDirection: "row",
    justifyContent: "center"
  },
  messageText: {
    fontSize: 30,
    fontWeight: "500",
    marginVertical: 10,
    textAlign: "center",
    color: "white"
  },
  messageContainer: {
    marginTop: 10
  }
};

function mapDispatchToProps(dispatch) {
  return {
    updateMatch: match => dispatch(UtilActions.updateMatch(match))
  };
}

function mapStateToProps(state) {
  return {
    nav: state.navigationReducer.nav,
    match: state.utilReducer.match
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MatchPopup);
