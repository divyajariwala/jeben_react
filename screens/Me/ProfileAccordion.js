import React from "react";
import {
  View,
  TextInput,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  Keyboard
} from "react-native";
import { connect } from "react-redux";
import * as WalletActions from "../../actions/WalletActions";
import { Chip } from "react-native-paper";
import Share from "react-native-share";
import Ionic from "react-native-vector-icons/Ionicons";
import { Icon } from "react-native-eva-icons";
import auth from "@react-native-firebase/auth";
import firebase from "@react-native-firebase/app";
import firestore from "@react-native-firebase/firestore";
import SectionedMultiSelect from "react-native-sectioned-multi-select";
import Toast from "react-native-toast-message";
// import TagInput from "react-native-tags-input";
import TagInput from "react-native-tag-input";
import InAppPurchasePopup from "../InAppPurchasePopup";
import * as CustomUtils from "../../utils/functions";
import * as JebenaColors from "../../utils/colors";
import * as JebenaUtils from "../../utils/functions";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const musicInputProps = {
  placeholder: "Favorite Artists",
  maxLength: 25,
  style: {
    width: SCREEN_WIDTH - 40,
    fontSize: 16,
    marginVertical: Platform.OS === "ios" ? 10 : -2
  }
};

const showInputProps = {
  placeholder: "Favorite Movies/Shows",
  maxLength: 25,
  style: {
    width: SCREEN_WIDTH - 40,
    fontSize: 16,
    marginVertical: Platform.OS === "ios" ? 10 : -2
  }
};

const musicScrollViewProps = {
  horizontal: false,
  showsHorizontalScrollIndicator: false,
  style: {
    color: JebenaColors.grayText()
  }
};
class ProfileAccordion extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    firstName: "",
    lastName: "",
    bio: "",
    typedText: "",
    selectedPersonalities: [],
    personalities: CustomUtils.getPersonalitiesList(),
    musicTags: [],
    musicText: "",
    showTags: [],
    showText: ""
  };

  componentDidMount() {
    console.log("Profile Accordion mounted.");
    const { uid } = auth().currentUser;

    firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(userSnap => {
        if (userSnap) {
          let userData = userSnap.data();
          if (userData) {
            //First Name
            if (userData.about && userData.firstName) {
              this.setState({ firstName: userData.firstName });
            }
            //Last Name
            if (userData.about && userData.lastName) {
              this.setState({ lastName: userData.lastName });
            }
            //Bio
            if (userData.about && userData.about.bio) {
              this.setState({ bio: userData.about.bio });
            }
            //Personalities
            if (userData.about && userData.about.personalities) {
              let personalities = userData.about.personalities;
              this.setState({ selectedPersonalities: personalities });
            }
            //Favorite Artists
            if (userData.about && userData.about.music) {
              this.setState({
                musicTags: userData.about.music
              });
            }
            //Favorite Artists
            if (userData.about && userData.about.shows) {
              this.setState({
                showTags: userData.about.shows
              });
            }
          }
        }
      });
  }

  onSelectedPersonalitiesChange = selectedItems => {
    if (selectedItems.length > 4) {
      return;
    }
    this.setState({ selectedPersonalities: selectedItems });
  };

  saveProfile() {
    const { uid } = auth().currentUser;
    const {
      firstName,
      lastName,
      bio,
      selectedPersonalities,
      musicTags,
      showTags
    } = this.state;

    console.log("Save profile: ", uid);

    if (!firstName || !lastName || !bio || !musicTags.length === 0) {
      Toast.show({
        text1: "Oops",
        text2: "Name, Bio and music are required.",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 3000
      });
      return;
    } else {
      if (
        !JebenaUtils.isNameValid(firstName) ||
        !JebenaUtils.isNameValid(lastName)
      ) {
        Toast.show({
          text1: "Invalid Name!",
          text2:
            "Make sure it's between 2-15 characters and doesn't contain special characters or numbers",
          type: "error",
          position: "top",
          autoHide: true,
          visibilityTime: 3000
        });
        return;
      }

      //Save about on Firebase
      let userInfo = {
        firstName: firstName,
        lastName: lastName,
        about: {
          bio: bio,
          personalities: selectedPersonalities,
          music: musicTags,
          shows: showTags
        }
      };

      firestore()
        .collection("users")
        .doc(uid)
        .set(userInfo, { merge: true })
        .then(() => {
          Toast.show({
            text1: "😊",
            text2: "Profile saved.",
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
            text2: "Error saving profile.",
            type: "error",
            position: "top",
            autoHide: true,
            visibilityTime: 2000
          });
          console.log("Error saving profile info firestore: ", error.message);
        });
      Keyboard.dismiss();
    }
  }

  labelExtractor = tag => tag;

  onChangeMusicTags = musicTags => {
    this.setState({
      musicTags
    });
  };

  onChangeMusicText = musicText => {
    if (this.state.musicTags.length < 4) {
      this.setState({ musicText });
      const lastTyped = musicText.charAt(musicText.length - 1);
      const parseWhen = [",", ";", "\n"];

      if (parseWhen.indexOf(lastTyped) > -1) {
        this.setState({
          musicTags: [...this.state.musicTags, this.state.musicText],
          musicText: ""
        });
        this._musicTagInput.scrollToEnd();
      }
    }
  };

  onChangeShowTags = showTags => {
    this.setState({
      showTags
    });
  };

  onChangeShowText = showText => {
    if (this.state.showTags.length < 4) {
      this.setState({ showText });
      const lastTyped = showText.charAt(showText.length - 1);
      const parseWhen = [",", ";", "\n"];

      if (parseWhen.indexOf(lastTyped) > -1) {
        this.setState({
          showTags: [...this.state.showTags, this.state.showText],
          showText: ""
        });
        this._showTagInput.scrollToEnd();
      }
    }
  };

  render() {
    const {
      firstName,
      lastName,
      bio,
      musicTags,
      showTags,
      personalities,
      selectedPersonalities
    } = this.state;
    return (
      <ScrollView keyboardShouldPersistTaps={"handled"}>
        <View style={styles.myProfileContainer}>
          <View style={styles.nameContainer}>
            <TextInput
              autoCorrect={false}
              maxLength={140}
              height={40}
              style={styles.name}
              placeholder="First Name"
              value={firstName}
              onChangeText={text => this.setState({ firstName: text })}
            />
            <TextInput
              autoCorrect={false}
              maxLength={140}
              height={40}
              style={styles.name}
              placeholder="Last Name"
              value={lastName}
              onChangeText={text => this.setState({ lastName: text })}
            />
          </View>
          <TextInput
            autoCorrect={false}
            maxLength={140}
            height={40}
            style={styles.input}
            placeholder="Bio"
            value={bio}
            onChangeText={text => this.setState({ bio: text })}
          />
          <View style={styles.tagsInput}>
            <Text>{`Separate them by comma. (${musicTags.length} of 4)`}</Text>
            <TagInput
              ref={horizontalTagInput => {
                this._musicTagInput = horizontalTagInput;
              }}
              value={this.state.musicTags}
              onChange={this.onChangeMusicTags}
              labelExtractor={this.labelExtractor}
              text={this.state.musicText}
              onChangeText={this.onChangeMusicText}
              tagTextColor="black"
              inputProps={musicInputProps}
              scrollViewProps={musicScrollViewProps}
              tagContainerStyle={styles.bioChip}
            />
          </View>
          <View style={styles.tagsInput}>
            <Text>{`Separate them by comma. (${showTags.length} of 4)`}</Text>
            <TagInput
              ref={horizontalTagInput => {
                this._showTagInput = horizontalTagInput;
              }}
              value={this.state.showTags}
              onChange={this.onChangeShowTags}
              labelExtractor={this.labelExtractor}
              text={this.state.showText}
              onChangeText={this.onChangeShowText}
              tagTextColor="black"
              inputProps={showInputProps}
              scrollViewProps={musicScrollViewProps}
              tagContainerStyle={styles.bioChip}
            />
          </View>
          <View style={styles.dropDownContainer}>
            <SectionedMultiSelect
              items={personalities}
              uniqueKey="id"
              subKey="children"
              selectText="Personalities: "
              searchPlaceholderText="Search personalities..."
              confirmText="Submit"
              showCancelButton={true}
              selectedIconComponent={
                <Ionic name="ios-checkmark" size={30} color="#C60000" />
              }
              chipRemoveIconComponent={
                <Ionic
                  name="ios-close"
                  size={18}
                  color="black"
                  style={styles.dropdownChip}
                />
              }
              showDropDowns={false}
              readOnlyHeadings={true}
              onSelectedItemsChange={this.onSelectedPersonalitiesChange}
              selectedItems={selectedPersonalities}
              colors={styles.sectionedMultiSelectColors}
              styles={styles.sectionedMultiSelectStyles}
            />
          </View>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => this.saveProfile()}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
        {this.props.openWallet && <InAppPurchasePopup key="inApp" />}
      </ScrollView>
    );
  }
}

const styles = {
  keyboardAvoidingView: {
    flex: 1
  },
  myProfileContainer: {
    //backgroundColor: 'gray',
    marginHorizontal: 10,
    alignItems: "center"
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%"
  },
  name: {
    //backgroundColor: "lightgray",
    color: JebenaColors.grayText(),
    height: 50,
    width: "45%",
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: JebenaColors.grayBorder(),
    borderRadius: 25,
    paddingLeft: 20
  },
  input: {
    //backgroundColor: "lightgray",
    color: JebenaColors.grayText(),
    height: 50,
    width: "100%",
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: JebenaColors.grayBorder(),
    borderRadius: 25,
    paddingLeft: 20
  },
  tagsInput: {
    //backgroundColor: "lightgray",
    justifyContent: "center",
    width: "100%",
    marginTop: 10,
    paddingTop: 5,
    paddingBottom: 10,
    borderWidth: 0.5,
    borderColor: JebenaColors.grayBorder(),
    borderRadius: 25,
    paddingLeft: 20
  },
  couponInput: {
    backgroundColor: JebenaColors.lightPink(),
    height: 50,
    width: "100%",
    marginTop: 10,
    borderWidth: 1,
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
    fontSize: 18,
    color: JebenaColors.primaryColor(),
    textAlign: "center"
  },
  saveBtn: {
    width: "45%",
    borderColor: JebenaColors.primaryColor(),
    backgroundColor: JebenaColors.primaryColor(),
    borderWidth: 1,
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    marginBottom: 15
  },
  saveBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600"
  },
  dropDownContainer: {
    width: "100%",
    borderWidth: 0.4,
    borderColor: "lightgray",
    borderRadius: 25,
    marginTop: 10,
    justifyContent: "center",
    paddingLeft: 10
  },
  sectionedMultiSelectColors: {
    primary: JebenaColors.primaryColor(),
    success: JebenaColors.primaryColor(),
    text: "gray",
    subText: "black",
    selectToggleTextColor: "gray"
  },
  sectionedMultiSelectStyles: {
    container: {
      position: "absolute",
      width: SCREEN_WIDTH - 40,
      height: SCREEN_HEIGHT / 2,
      top: SCREEN_HEIGHT / 5
    },
    subItemText: { fontSize: 20 },
    backdrop: { backgroundColor: "rgba(0,0,0,0.5)" },
    selectToggle: {
      paddingVertical: 12,
      marginHorizontal: 5
    },
    chipContainer: {
      backgroundColor: JebenaColors.lightBlueBg(),
      borderWidth: 0,
      height: 35,
      borderRadius: 15
    },
    chipText: {
      color: "black"
    }
  },
  dropdownChip: {
    marginLeft: 5,
    marginRight: 10
  },
  bioChip: {
    backgroundColor: JebenaColors.lightBlueBg(),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    height: 35,
    marginTop: 8,
    marginRight: 8
  },
  bioChipText: {
    width: SCREEN_WIDTH / 2.5,
    color: "black",
    fontSize: 14
  },
  bioFlatList: {
    marginBottom: 10
  },
  artistChip: {
    height: 34,
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: "white"
  },
  artistChipText: {
    color: JebenaColors.grayText()
  }
};

function mapStateToProps(state) {
  return {
    openWallet: state.walletReducer.openWallet
  };
}
function mapDispatchToProps(dispatch) {
  return {
    toggleWallet: openWallet =>
      dispatch(WalletActions.toggleWallet(openWallet)),
    updateWalletMessage: message =>
      dispatch(WalletActions.updateWalletMessage(message))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProfileAccordion);
