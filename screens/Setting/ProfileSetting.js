import React from "react";
import {
  View,
  Text,
  Dimensions,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView
} from "react-native";
import { Icon } from "react-native-eva-icons";
import Toast from "react-native-toast-message";
import ProfileAccordion from "../Me/ProfileAccordion";
import PreferencesAccordion from "../Me/PreferencesAccordion";
import HideMatchingAccordion from "../Me/HideMatchingAccordion";
import FeedbackAccordion from "../Me/FeedbackAccordion";
import PrivacyAccordion from "../Me/PrivacyAccordion";
import SupportAccordion from "../Me/SupportAccordion";
import * as JebenaColors from "../../utils/colors";
import { SafeAreaConsumer } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

class ProfileSetting extends React.Component {
  state = {};
  static navigationOptions = () => ({
    header: null
  });

  componentDidMount() {
    console.log("Profile Setting Mounted");
    if (
      this.props.navigation.getParam("SHOW_COMPLETE_PROFILE_MSG") &&
      this.props.navigation.getParam("SHOW_COMPLETE_PROFILE_MSG") === true
    ) {
      Toast.show({
        text1: "Please complete your profile",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 3000
      });
    }
    if (
      this.props.navigation.getParam("SHOW_COMPLETE_PREFS_MSG") &&
      this.props.navigation.getParam("SHOW_COMPLETE_PREFS_MSG") === true
    ) {
      Toast.show({
        text1: "Please complete your preferences",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 3000
      });
    }
  }

  renderSettingScreen() {
    let settingName = this.props.navigation.getParam("SETTING_NAME");
    console.log("SETTING NAME: ", settingName);
    switch (settingName) {
      case "SETTING_PROFILE":
        return <ProfileAccordion />;
      case "SETTING_PREFERENCES":
        return <PreferencesAccordion />;
      case "SETTING_HIDE_MATCHING":
        return <HideMatchingAccordion />;
      case "SETTING_FEEDBACK":
        return <FeedbackAccordion />;
      case "SETTING_PRIVACY":
        return <PrivacyAccordion navigation={this.props.navigation} />;
      case "SETTING_SUPPORT":
        return <SupportAccordion />;
    }
  }

  render() {
    return (
      <View style={styles.mainContainer}>
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
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                this.props.navigation.pop();
              }}
            >
              <Icon
                name="arrow-ios-back-outline"
                width={32}
                height={32}
                fill="white"
              />
            </TouchableOpacity>
            <Text style={styles.appBarTitle}>
              {this.props.navigation.getParam("PAGE_TITLE")}
            </Text>
            <View style={styles.backBtn} />
          </View>
        </SafeAreaView>
        <TouchableWithoutFeedback
          style={styles.container}
          onPress={() => {
            Keyboard.dismiss();
          }}
          navigation={this.props.navigation}
        >
          <KeyboardAvoidingView style={styles.container} behavior="padding">
            <ScrollView keyboardShouldPersistTaps={"handled"}>
              {this.renderSettingScreen()}
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
        <Toast ref={ref => Toast.setRef(ref)} />
      </View>
    );
  }
}

const styles = {
  statusBarContainer: {
    position: "absolute",
    width: SCREEN_WIDTH,
    backgroundColor: JebenaColors.primaryColor()
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "white"
  },
  appBar: {
    backgroundColor: JebenaColors.primaryColor(),
    height: 60,
    width: SCREEN_WIDTH,
    borderBottomLeftRadius: SCREEN_WIDTH,
    borderBottomRightRadius: SCREEN_WIDTH,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20
  },
  appBarTitle: {
    fontSize: 18,
    paddingBottom: 10,
    textAlign: "center",
    color: "white",
    fontWeight: "600"
  },
  main: {
    //backgroundColor: "white",
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
      justifyContent: "center"
    },
    titleText: {
      color: "#C60000"
    },
    centerElement: {
      color: "white"
    },
    centerElementContainer: {
      alignItems: "center"
    }
  },
  container: {
    flex: 1
  },
  backBtn: {
    width: 25,
    height: 60,
    justifyContent: "center",
    paddingBottom: 8
  }
};

export default ProfileSetting;
