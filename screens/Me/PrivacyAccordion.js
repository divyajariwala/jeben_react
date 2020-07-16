import React from "react";
import {
  Text,
  View,
  Alert,
  KeyboardAvoidingView,
  TouchableOpacity,
  Dimensions
} from "react-native";
import { WebView } from "react-native-webview";
import { Button, Divider } from "react-native-paper";
import auth from "@react-native-firebase/auth";
import { Icon } from "react-native-eva-icons";
import firebase from "@react-native-firebase/app";
import * as JebenaColors from "../../utils/colors";


const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

class PrivacyAccordion extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    showWebView: false,
    webViewUrl: ""
  };

  componentDidMount() {
    console.log("Privacy Accordion mounted.");
  }

  handleDeactivateAccount = async () => {
    const { uid } = auth().currentUser;
    console.log("Deactivate account?");
    Alert.alert(
      "Are you sure?",
      "This will delete your account and cannot be undone. Consider hiding.",
      [
        {
          text: "Yes Delete",
          onPress: async () => {
            console.log("Delete User: ", uid);
            firebase.functions().httpsCallable("deactivateAccount")({ uid });
            auth().signOut();
          },
          style: "destructive"
        },
        {
          text: "Cancel",
          onPress: () => {
            console.log("Cancel Deletion");
          },
          style: "cancel"
        }
      ]
    );
  };

  showWebView() {
    const { webViewUrl } = this.state;
    return (
      <View style={styles.webviewContainer}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => this.setState({ showWebView: false })}
        >
          <Icon
            name="close-outline"
            fill={JebenaColors.primaryColor()}
            width={22}
            height={22}
          />
          <Text>Close</Text>
        </TouchableOpacity>
        <WebView useWebKit={true} source={{ uri: webViewUrl }} />
      </View>
    );
  }

  render() {
    const { showWebView } = this.state;
    return (
      <KeyboardAvoidingView style={styles.keyboardViewStyle} behavior="padding">
        <View style={styles.privacyContainer}>
          <TouchableOpacity
            style={styles.accordionStyle}
            onPress={() => {
              this.props.navigation.navigate("ProfileSetting", {
                PAGE_TITLE: "Support",
                SETTING_NAME: "SETTING_SUPPORT"
              });
            }}
          >
            <Text style={styles.accordionTitleStyle}>Support</Text>
            <Icon
              name="arrow-ios-forward-outline"
              fill={JebenaColors.grayBorder()}
              width={22}
              height={22}
            />
          </TouchableOpacity>
          <Divider style={styles.accordionDivider} />
          <TouchableOpacity
            style={styles.accordionStyle}
            onPress={() => {
              this.setState({
                showWebView: true,
                webViewUrl: "https://jebena.app/privacy"
              });
            }}
          >
            <Text style={styles.accordionTitleStyle}>Privacy Policy</Text>
            <Icon
              name="arrow-ios-forward-outline"
              fill={JebenaColors.grayBorder()}
              width={22}
              height={22}
            />
          </TouchableOpacity>
          <Divider style={styles.accordionDivider} />
          <TouchableOpacity
            style={styles.accordionStyle}
            onPress={() => {
              this.setState({
                showWebView: true,
                webViewUrl: "https://jebena.app/terms"
              });
            }}
          >
            <Text style={styles.accordionTitleStyle}>Terms and Conditions</Text>
            <Icon
              name="arrow-ios-forward-outline"
              fill={JebenaColors.grayBorder()}
              width={22}
              height={22}
            />
          </TouchableOpacity>
          <Divider style={styles.accordionDivider} />
          <TouchableOpacity
            style={styles.accordionStyle}
            onPress={() => this.handleDeactivateAccount()}
          >
            <Text style={styles.accordionTitleStyle}>Deactivate Account</Text>
            <Icon
              name="arrow-ios-forward-outline"
              fill={JebenaColors.grayBorder()}
              width={22}
              height={22}
            />
          </TouchableOpacity>
        </View>
        {showWebView && this.showWebView()}
      </KeyboardAvoidingView>
    );
  }
}

const styles = {
  privacyContainer: {
    width: SCREEN_WIDTH - 20,   
    //
    height: SCREEN_HEIGHT-220,
  },
  keyboardViewStyle: {
    flex: 1,
    alignItems: "center",

  },
  webviewContainer: {
    position: "absolute",
    width: SCREEN_WIDTH,
    //height: SCREEN_HEIGHT,
    height:'100%',
    backgroundColor: JebenaColors.lightBlueBg(),
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
   
  },
  closeBtn: {
    alignItems: "center",
    marginVertical: 5
  },
  accordionStyle: {
    width: SCREEN_WIDTH - 20,
    height: 55,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  
      
      
  },
  accordionNameContainerStyle: {
    flexDirection: "row",
    alignItems: "center"
  },
  accordionDivider: {
    marginHorizontal: 10
  },
  accordionTitleStyle: {
    color: "black",
    fontSize: 15,
    marginLeft: 10
  }
};

export default PrivacyAccordion;
