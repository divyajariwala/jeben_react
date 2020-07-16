import React from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { Button } from "react-native-paper";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const SCREEN_WIDTH = Dimensions.get("window").width;

class HideMatchingAccordion extends React.Component {
  state = {
    hideMeChecked: false,
    matchMeChecked: false
  };

  handleHideMePress = () => {
    const { uid } = auth().currentUser;
    const { hideMeChecked } = this.state;

    if (!hideMeChecked) {
      this.setState({
        hideMeChecked: true,
        matchMeChecked: false
      });
      firestore()
        .collection("users")
        .doc(uid)
        .set({ hideMeFromMatching: true }, { merge: true })
        .then(() => {
          console.log("Hide me saved ");
        })
        .catch(error => {
          console.log("Error saving hide me:", error.message);
        });
    }
  };

  handleMatchMePress = () => {
    const { uid } = auth().currentUser;
    const { matchMeChecked } = this.state;

    if (!matchMeChecked) {
      this.setState({
        matchMeChecked: true,
        hideMeChecked: false
      });
      firestore()
        .collection("users")
        .doc(uid)
        .set({ hideMeFromMatching: false }, { merge: true })
        .then(() => {
          console.log("Match me saved ");
        })
        .catch(error => {
          console.log("Error saving hide me:", error.message);
        });
    }
  };

  componentDidMount() {
    console.log("Hide Matching Accordion mounted.");
    const { uid } = auth().currentUser;

    firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(userSnap => {
        if (userSnap) {
          let userData = userSnap.data();
          if (userData) {
            if (userData.hideMeFromMatching) {
              let hideMe = userData.hideMeFromMatching;
              if (hideMe) {
                this.setState({ hideMeChecked: true });
              } else {
                this.setState({ matchMeChecked: true });
              }
            } else {
              this.setState({ matchMeChecked: true });
            }
          }
        }
      });
  }

  render() {
    const { hideMeChecked, matchMeChecked } = this.state;

    return (
      <View style={styles.container}>
        <Text style={styles.settingMessage}>
          {
            "You'll be hidden from the matching pool.\nYour account won't be deleted and you can still use other features."
          }
        </Text>
        <View style={styles.hideAndShowContainer}>
          <TouchableOpacity
            onPress={() => this.handleHideMePress()}
            style={hideMeChecked ? styles.btnSelected : styles.btnDeselected}
          >
            <Text
              style={
                hideMeChecked ? styles.textSelected : styles.textDeselected
              }
            >
              Hide Me
            </Text>
          </TouchableOpacity>
          <View style={styles.spaceView} />
          <TouchableOpacity
            onPress={() => this.handleMatchMePress()}
            style={matchMeChecked ? styles.btnSelected : styles.btnDeselected}
          >
            <Text
              style={
                matchMeChecked ? styles.textSelected : styles.textDeselected
              }
            >
              Match Me
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = {
  container: {
    alignItems: "center",
    marginTop: 15
  },
  btnSelected: {
    width: "40%",
    borderColor: "#C60000",
    backgroundColor: "#C60000",
    borderWidth: 1,
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15
  },
  btnDeselected: {
    width: "40%",
    borderColor: "#C60000",
    backgroundColor: "white",
    borderWidth: 1,
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15
  },
  textSelected: {
    color: "white",
    fontSize: 16,
    fontWeight: "600"
  },
  textDeselected: {
    color: "#C60000",
    fontSize: 16,
    fontWeight: "600"
  },
  settingMessage: {
    width: SCREEN_WIDTH - 60,
    fontSize: 16,
    textAlign: "center"
  },
  hideAndShowContainer: {
    flexDirection: "row",
    marginBottom: 15
  },
  spaceView: {
    width: 15
  }
};

export default HideMatchingAccordion;
