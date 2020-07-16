import React from "react";
import {
  Dimensions,
  TextInput,
  Text,
  TouchableOpacity,
  ScrollView,
  Keyboard
} from "react-native";
import { Button } from "react-native-paper";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import firebase from "@react-native-firebase/app";
import Toast from "react-native-toast-message";

const SCREEN_WIDTH = Dimensions.get("window").width;
class FeedbackAccordion extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    feedback: ""
  };

  componentDidMount() {
    console.log("Feedback Accordion mounted.");
  }

  sendFeedback = () => {
    const { uid } = auth().currentUser;
    const { feedback } = this.state;

    console.log("Save feedback: ", feedback);

    if (!feedback) {
      Toast.show({
        text1: "Oops",
        text2: "You dintn't type anything",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 2000
      });
    } else {
      let feedbackJson = {
        feedback: feedback,
        createdAt: new Date()
      };
      firestore()
        .collection("feedback")
        .doc(uid)
        .set(
          {
            feedbackArray: firebase.firestore.FieldValue.arrayUnion(
              feedbackJson
            )
          },
          { merge: true }
        )
        .then(() => {
          this.setState({ feedback: "" });
          Toast.show({
            text1: "Sent 😊",
            text2: "Thank you so much for your feedback!",
            type: "success",
            position: "top",
            autoHide: true,
            visibilityTime: 2000
          });
          Keyboard.dismiss();
        })
        .catch(error => {
          Toast.show({
            text1: "Sorry 😩",
            text2: "Error saving your feedback.",
            type: "error",
            position: "top",
            autoHide: true,
            visibilityTime: 2000
          });
          console.log("Error saving feedback info firestore: ", error.message);
        });
      Keyboard.dismiss();
    }
  };

  render() {
    const { feedback } = this.state;
    return (
      <ScrollView
        contentContainerStyle={styles.myFeedbackContainer}
        keyboardShouldPersistTaps={"handled"}
      >
        <Text style={styles.settingMessage}>
          {
            "Give us your constructive feedback here and please rate the app in the app store 😁"
          }
        </Text>
        <TextInput
          autoCorrect={false}
          maxLength={200}
          height={40}
          style={styles.input}
          placeholder="Feedback"
          value={feedback}
          onChangeText={text => this.setState({ feedback: text })}
        />
        <TouchableOpacity
          onPress={() => this.sendFeedback()}
          style={styles.sendBtn}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
}

const styles = {
  myFeedbackContainer: {
    alignItems: "center",
    marginHorizontal: 10
  },
  settingMessage: {
    fontSize: 16,
    width: SCREEN_WIDTH - 60,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 10
  },
  input: {
    //backgroundColor: 'lightgray',
    color: "gray",
    width: "90%",
    height: 50,
    marginTop: 5,
    borderWidth: 0.5,
    borderColor: "lightgray",
    borderRadius: 25,
    padding: 15
  },
  sendBtn: {
    width: "45%",
    borderColor: "#C60000",
    backgroundColor: "#C60000",
    borderWidth: 1,
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    marginBottom: 15
  },
  sendBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600"
  }
};

export default FeedbackAccordion;
