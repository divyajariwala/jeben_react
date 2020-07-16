import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform
} from "react-native";
import { connect } from "react-redux";
import * as UtilActions from "../actions/UtilActions";
import * as UserActions from "../actions/UserActions";
import { Icon } from "react-native-eva-icons";
import MatIcon from "react-native-vector-icons/MaterialCommunityIcons";
import Feather from "react-native-vector-icons/Feather";
import FastImage from "react-native-fast-image";
import ProgressPie from "react-native-progress/Pie";
import Toast from "react-native-toast-message";
import storage, { firebase } from "@react-native-firebase/storage";
import firestore from "@react-native-firebase/firestore";
import remoteConfig from "@react-native-firebase/remote-config";
import auth from "@react-native-firebase/auth";
import ImagePicker from "react-native-image-picker";
import * as CustomUtils from "../utils/functions";
import * as JebenaImages from "../utils/Images";
import * as JebenaColors from "../utils/colors";
import * as FaceDetector from "../utils/face_detector";
import MultiSelect from "react-native-multiple-select";
import SectionedMultiSelect from "react-native-sectioned-multi-select";
import Ionic from "react-native-vector-icons/Ionicons";
import UploadPicsContainer from "./Me/UploadPicsContainer";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import RangeSlider from "rn-range-slider";
import _ from "lodash";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const options = {
  noData: true
};

class PreferencesRegistration extends React.Component {
  static navigationOptions = () => ({
    header: null
  });

  state = {
    firstName: "",
    lastName: "",
    photosPermissionGranted: false,
    maleChecked: false,
    femaleChecked: false,
    selectedGender: "",
    selectedAge: [20, 25],
    selectedLocation: [],
    hasUSLocation: false,
    locations: CustomUtils.getLocationsList2(this.props.availableRegions),
    userLocation: "",
    errorMessage: "",
    validInputs: false,
    profilePicURL: null,
    profilePicUploadProgress: 0,
    pic1URL: null,
    pic2URL: null,
    pic3URL: null,
    pic4URL: null
  };

  handleMalePress = () => {
    const { maleChecked } = this.state;

    if (maleChecked) {
      this.setState({
        selectedGender: "",
        maleChecked: false
      });
    } else {
      this.setState({
        selectedGender: "MALE",
        maleChecked: true,
        femaleChecked: false
      });
    }
  };

  handleFemalePress = () => {
    const { femaleChecked } = this.state;

    if (femaleChecked) {
      this.setState({
        selectedGender: "",
        femaleChecked: false
      });
    } else {
      this.setState({
        selectedGender: "FEMALE",
        femaleChecked: true,
        maleChecked: false
      });
    }
  };

  handleAddToAge = () => {
    console.log("Add to age");
    const { selectedAge } = this.state;
    let newMin = selectedAge[0];
    let newMax = selectedAge[1];
    if (newMin < 30) {
      newMin += 1;
      newMax = newMin + 5;
    }
    this.setState({ selectedAge: [newMin, newMax] });
  };

  handleSubtractFromAge = () => {
    console.log("Subtract from age");
    const { selectedAge } = this.state;
    let newMin = selectedAge[0];
    let newMax = selectedAge[1];
    if (newMin > 18) {
      newMin -= 1;
      newMax = newMin + 5;
    }
    this.setState({ selectedAge: [newMin, newMax] });
  };

  onSelectedLocationChange = selectedItems => {
    let searchUSLocation = "";
    if (selectedItems.length > 0) {
      searchUSLocation = selectedItems.find(x => x.substring(0, 3) === "US_");
    }
    if (searchUSLocation) {
      this.setState({ hasUSLocation: true });
    } else {
      this.setState({ hasUSLocation: false });
    }
    let searchANY = "";
    if (selectedItems.length > 0) {
      searchANY = selectedItems.find(x => x === "ANY");
    }
    if (searchANY) {
      Toast.show({
        text1: "Choose Any or a specific location",
        text2: "You cannot choose both.",
        type: "success",
        position: "top",
        autoHide: true,
        visibilityTime: 3000
      });
      this.setState({
        selectedLocation: [searchANY],
        hasUSLocation: false
      });
      return;
    }
    this.setState({ selectedLocation: selectedItems });
  };

  handleUploadProfilePic() {
    console.log("Upload Profile Pic");
    const { uid } = auth().currentUser;
    // Open Image Library:

    ImagePicker.launchImageLibrary(options, async response => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.error) {
        console.log("ImagePicker Error: ", response.error);
      } else if (response.customButton) {
        console.log("User tapped custom button: ", response.customButton);
      } else {
        const source = response.uri;
        if (source && auth().currentUser) {
          const picHasFaces = await FaceDetector.hasValidFaces(source);
          if (!picHasFaces) {
            console.log("No Faces Detected in the chosen picture.");
            Toast.show({
              text1: "Face not detected!",
              text2: "Make sure to pick a photo with your face in it.",
              type: "error",
              position: "top",
              autoHide: true,
              visibilityTime: 3000
            });
            return;
          }
          //Upload picture
          const ref = storage().ref(`${uid}/profilePic.jpg`);
          ref
            .putFile(source, {
              cacheControl: "no-store" // disable caching
            })
            .on(
              firebase.storage.TaskEvent.STATE_CHANGED,
              snapshot => {
                let progress = snapshot.bytesTransferred / snapshot.totalBytes;
                console.log("Uploading: ", progress);
                this.setState({ profilePicUploadProgress: progress });
                if (snapshot.state === firebase.storage.TaskState.SUCCESS) {
                  console.log("Success");
                  this.setState({ profilePicUploadProgress: 0 });
                  //Save URL to Firestore
                  const picRef = storage().ref(`${uid}/profilePic.jpg`);
                  picRef
                    .getDownloadURL()
                    .then(url => {
                      console.log(url);
                      if (url) {
                        let userPic = { profilePicURL: url };
                        firestore()
                          .collection("users")
                          .doc(uid)
                          .set(userPic, { merge: true })
                          .then(() => {
                            console.log("Saved Profile URL: ", url);
                          })
                          .catch(error => {
                            console.log("Error Saving Image: ", error.message);
                          });
                      }
                    })
                    .catch(error => {
                      console.log("Error getting image 1: ", error.message);
                    });
                }
              },
              err => {
                console.log(err);
              }
            );
          //End up upload
        }
      }
    });
  }

  handleComplete = () => {
    console.log("Save preferences...");
    const { uid } = auth().currentUser;
    const {
      selectedGender,
      selectedAge,
      selectedLocation,
      profilePicURL,
      pic1URL,
      pic2URL,
      pic3URL,
      pic4URL
    } = this.state;

    if (!selectedGender) {
      Toast.show({
        text1: "Choose Gender",
        text2: "",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 4000
      });
    }

    if (selectedLocation.length === 0) {
      Toast.show({
        text1: "Choose Location",
        text2: "",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 4000
      });
    }

    if (!profilePicURL) {
      Toast.show({
        text1: "Upload an avatar",
        text2: "",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 4000
      });
    }

    if (!pic1URL && !pic2URL && !pic3URL && !pic4URL) {
      Toast.show({
        text1: "Upload at least 1 profile picture ",
        text2: "",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 4000
      });
    }

    if (
      selectedGender &&
      selectedLocation.length > 0 &&
      (pic1URL || pic2URL || pic3URL || pic4URL) &&
      profilePicURL
    ) {
      //Update available regions
      this.props.updateUserLocation(this.state.userLocation);

      //let currentWizard = this.props.wizardJson;
      //currentWizard.preferencesCompleted = true;

      //Create gender array
      // let selectedGenders = [];
      // if (maleChecked) {
      //   selectedGenders.push("MALE");
      // }
      // if (femaleChecked) {
      //   selectedGenders.push("FEMALE");
      // }

      let userPreferences = {
        preferencesCompleted: true,
        preferences: {
          genderPreference: selectedGender,
          minAgePreference: selectedAge[0],
          maxAgePreference: selectedAge[1],
          locationPreference: selectedLocation
        }
      };

      //Save user data and go to app
      firestore()
        .collection("users")
        .doc(uid)
        .set(userPreferences, { merge: true })
        .then(() => {
          this.props.navigation.navigate("App");
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
    }
  };

  requestIOSLibraryPermission = () => {
    request(PERMISSIONS.IOS.PHOTO_LIBRARY)
      .then(result => {
        this.setState({ photosPermissionGranted: result === RESULTS.GRANTED });
      })
      .catch(error => {
        Toast.show({
          text1: "Sorry 😩",
          text2: "Error requesting library.",
          type: "error",
          position: "top",
          autoHide: true,
          visibilityTime: 4000
        });
        console.log("Error requesting library: ", error.message);
      });
  };

  renderRegionMaps() {
    return this.state.selectedLocation.map(region => {
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

  componentDidMount() {
    console.log("Prefernces Mounted.");
    const { photosPermissionGranted } = this.state;
    if (!photosPermissionGranted) {
      console.log("Needs photos permission");
      if (Platform.OS === "ios") {
        this.requestIOSLibraryPermission();
      }
      if (Platform.OS === "android") {
        this.requestAndroidPermission();
      }
    }
    this._rangeSlider.setLowValue(this.state.selectedAge[0]);
    this._rangeSlider.setHighValue(this.state.selectedAge[1]);
    //Get saved user values
    const { uid } = auth().currentUser;
    firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(userSnap => {
        if (userSnap) {
          let userData = userSnap.data();
          if (userData) {
            if (userData.firstName) {
              this.setState({ firstName: userData.firstName });
            }
            if (userData.lastName) {
              this.setState({ lastName: userData.lastName });
            }
            if (userData.location) {
              this.setState({ userLocation: userData.location });
            }
            if (userData.pic1URL) {
              this.setState({ pic1URL: userData.pic1URL });
            }
            if (userData.pic2URL) {
              this.setState({ pic2URL: userData.pic2URL });
            }
            if (userData.pic3URL) {
              this.setState({ pic3URL: userData.pic3URL });
            }
            if (userData.pic4URL) {
              this.setState({ pic4URL: userData.pic4URL });
            }
            if (userData.profilePicURL) {
              this.setState({ profilePicURL: userData.profilePicURL });
            } else if (userData.googleProfilePicture) {
              this.setState({ profilePicURL: userData.googleProfilePicture });
            } else if (userData.facebookProfilePicture) {
              this.setState({ profilePicURL: userData.facebookProfilePicture });
            }
          }
          if (userData && userData.preferences) {
            if (userData.preferences.genderPreference) {
              let genderPref = userData.preferences.genderPreference;
              this.setState({ selectedGender: genderPref });
              if (genderPref === "MALE") {
                this.setState({ maleChecked: true });
              }
              if (genderPref === "FEMALE") {
                this.setState({ femaleChecked: true });
              }
            }
            if (
              userData.preferences.minAgePreference &&
              userData.preferences.maxAgePreference
            ) {
              let min = userData.preferences.minAgePreference;
              let max = userData.preferences.maxAgePreference;
              this.setState({ selectedAge: [min, max] });
              if (this && this._rangeSlider) {
                this._rangeSlider.setLowValue(min);
                this._rangeSlider.setHighValue(max);
              }
            }
            if (userData.preferences.locationPreference) {
              this.setState({
                selectedLocation: userData.preferences.locationPreference
              });
            }
          }
        }
      });
    //Initialize interactions collection
    let interactionsJson = {
      blockedPool: [],
      dislikedPool: [],
      heartedPool: [],
      likedPool: [],
      reportedPool: [],
      shownPool: []
    };
    firestore()
      .collection("interactions")
      .doc(uid)
      .set(interactionsJson, { merge: true })
      .then(() => {
        console.log("Created interactions collection for,", uid);
      })
      .catch(error => {
        console.error(error.message);
      });
  }

  render() {
    const {
      firstName,
      lastName,
      maleChecked,
      femaleChecked,
      selectedAge,
      locations,
      selectedLocation,
      hasUSLocation,
      profilePicURL,
      profilePicUploadProgress
    } = this.state;

    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <View style={styles.statusBarContainer}>
          <StatusBar hidden={false} barStyle="light-content" />
        </View>
        <SafeAreaView>
          <View style={styles.appBar}>
            <TouchableOpacity
              style={[styles.backBtn, { top: 10 }]}
              onPress={() => {
                console.log("Return to Complete");
                this.props.navigation.navigate("Complete");
              }}
            >
              <Icon
                name="arrow-ios-back-outline"
                width={32}
                height={32}
                fill="white"
              />
            </TouchableOpacity>
            <Text
              style={styles.appBarTitle}
              numberOfLines={2}
            >{`${firstName} ${lastName}`}</Text>
          </View>
        </SafeAreaView>
        <SafeAreaView style={styles.safeView}>
          <View style={styles.profilePicContainer}>
            {profilePicUploadProgress > 0 ? (
              <ProgressPie
                key="progressPie"
                progress={profilePicUploadProgress}
                color="gray"
                size={SCREEN_WIDTH / 4}
                style={styles.profilePicStyle}
              />
            ) : (
              <TouchableOpacity
                key="uploadBtn"
                style={styles.profilePicStyle}
                onPress={() => {
                  this.handleUploadProfilePic();
                }}
              >
                {profilePicURL ? (
                  <FastImage
                    style={styles.profilePicStyle}
                    source={{
                      uri: profilePicURL,
                      priority: FastImage.priority.normal
                    }}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                ) : (
                  <Feather name="camera" color="gray" size={30} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
        <ScrollView style={styles.scrollView}>
          <UploadPicsContainer />
          <View style={styles.preferencesContainer}>
            <Text style={styles.messageText}>What are your preferences?</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                onPress={this.handleMalePress}
                style={maleChecked ? styles.chipSelected : styles.chipNormal}
              >
                <Text
                  style={
                    maleChecked
                      ? styles.chipTextSelected
                      : styles.chipTextNormal
                  }
                >
                  Male
                </Text>
              </TouchableOpacity>
              <View style={styles.spaceView} />
              <TouchableOpacity
                onPress={this.handleFemalePress}
                style={femaleChecked ? styles.chipSelected : styles.chipNormal}
              >
                <Text
                  style={
                    femaleChecked
                      ? styles.chipTextSelected
                      : styles.chipTextNormal
                  }
                >
                  Female
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sliderContainer}>
              <View style={styles.rangeContainer}>
                <Text>{selectedAge[0]}</Text>
                <RangeSlider
                  style={styles.rangeSlider}
                  ref={component => (this._rangeSlider = component)}
                  gravity={"center"}
                  min={18}
                  max={40}
                  step={1}
                  selectionColor={JebenaColors.primaryColor()}
                  blankColor={JebenaColors.lightBlueBg2()}
                  thumbColor={JebenaColors.primaryColor()}
                  thumbBorderColor={JebenaColors.primaryColor()}
                  labelBackgroundColor="#ffffff"
                  labelBorderColor="#ffffff"
                  labelTextColor="#ffffff"
                  onValueChanged={(low, high) => {
                    if (high - low < 3) {
                      if (low !== selectedAge[0]) {
                        console.log("Low Moved");
                        high = high + 1;
                      }
                      if (high !== selectedAge[1]) {
                        console.log("High Moved");
                        if (low - 1 >= 18) {
                          low = low - 1;
                        } else {
                          high = high + 1;
                        }
                      }
                      this._rangeSlider.setLowValue(low);
                      this._rangeSlider.setHighValue(high);
                    }
                    this.setState({ selectedAge: [low, high] });
                  }}
                />
                <Text>{selectedAge[1]}</Text>
              </View>
            </View>

            <View style={styles.dropDownContainer}>
              <SectionedMultiSelect
                items={locations}
                uniqueKey="id"
                selectText="Choose Location: "
                searchPlaceholderText="Search locations..."
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
                onSelectedItemsChange={this.onSelectedLocationChange}
                selectedItems={selectedLocation}
                colors={styles.sectionedMultiSelectColors}
                styles={styles.sectionedMultiSelectStyles}
              />
              {/* <MultiSelect
                hideTags
                items={locations}
                uniqueKey="id"
                ref={component => {
                  this.multiSelect = component;
                }}
                onSelectedItemsChange={this.onSelectedLocationChange}
                selectedItems={selectedLocation}
                selectText="Location Preference: "
                searchInputPlaceholderText="Search..."
                selectedItemTextColor={JebenaColors.primaryColor()}
                selectedItemIconColor={JebenaColors.primaryColor()}
                itemTextColor="#000"
                displayKey="name"
                submitButtonColor={JebenaColors.primaryColor()}
                submitButtonText="Submit"
              /> */}
            </View>
            {hasUSLocation && (
              <View style={styles.mapContainer}>
                <FastImage
                  source={require("../assets/US_MAP/US_BG.png")}
                  resizeMode="cover"
                  style={styles.mapBg}
                />
                {this.renderRegionMaps()}
              </View>
            )}
            <TouchableOpacity
              onPress={() => this.handleComplete()}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>Complete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <Toast ref={ref => Toast.setRef(ref)} />
      </KeyboardAvoidingView>
    );
  }
}

const styles = {
  statusBarContainer: {
    height: 50,
    width: SCREEN_WIDTH,
    backgroundColor: JebenaColors.primaryColor()
  },
  appBar: {
    backgroundColor: "#C60000",
    height: SCREEN_HEIGHT * 0.2,
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
    paddingTop: SCREEN_HEIGHT * 0.05,
    borderBottomLeftRadius: SCREEN_WIDTH,
    borderBottomRightRadius: SCREEN_WIDTH
  },
  appBarTitle: {
    fontSize: 18,
    textAlign: "center",
    color: "white",
    fontWeight: "600"
  },
  backBtn: {
    position: "absolute",
    left: 15
  },
  safeView: {
    alignItems: "center",
    flexDirection: "column",
    marginTop: -SCREEN_WIDTH * 0.18
  },
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center"
  },
  profilePicContainer: {
    //backgroundColor: 'blue',
    width: SCREEN_WIDTH,
    alignItems: "center"
  },
  profilePicStyle: {
    backgroundColor: JebenaColors.lightBlueBg(),
    borderRadius: SCREEN_WIDTH / 3.25 / 2,
    borderWidth: 3,
    borderColor: "white",
    width: SCREEN_WIDTH / 3.25,
    height: SCREEN_WIDTH / 3.25,
    justifyContent: "center",
    alignItems: "center"
  },
  logoContainer: {
    alignSelf: "center",
    marginTop: 10,
    width: 20,
    height: 30
  },
  messageText: {
    textAlign: "center",
    fontWeight: "500",
    fontSize: 16,
    marginHorizontal: 20,
    marginBottom: 15
  },
  errorMessage: {
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5
  },
  errorText: {
    fontSize: 11,
    color: "red",
    textAlign: "center"
  },
  form: {
    marginHorizontal: 40,
    marginTop: 10,
    marginBottom: 20,
    alignItems: "center"
  },
  formContainer: {
    backgroundColor: "white",
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  preferencesContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 30,
    paddingTop: 10
    //backgroundColor: "lightgray"
  },
  scrollView: {
    marginTop: 25,
    paddingTop: 10,
    marginBottom: 40
  },
  input: {
    //backgroundColor: 'lightgray',
    color: "gray",
    width: SCREEN_WIDTH - 80,
    height: 50,
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: "lightgray",
    borderRadius: 25,
    paddingLeft: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  chip: {
    width: SCREEN_WIDTH / 3,
    justifyContent: "center",
    alignItems: "center"
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: SCREEN_WIDTH - 80
  },
  sliderContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 40,
    marginBottom: 15,
    alignItems: "center"
    //backgroundColor: "lightgray"
  },
  rangeContainer: {
    width: SCREEN_WIDTH - 80,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline"
  },
  rangeSlider: {
    width: SCREEN_WIDTH * 0.65,
    height: 70
  },
  saveBtn: {
    width: SCREEN_WIDTH - 80,
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
  saveBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600"
  },
  dropDownContainer: {
    width: SCREEN_WIDTH - 80,
    borderColor: "lightgray",
    borderRadius: 25,
    marginTop: 10,
    justifyContent: "center",
    paddingLeft: 10
  },
  sectionedMultiSelectColors: {
    primary: "#C60000",
    success: "#C60000",
    text: "gray",
    subText: "black",
    selectToggleTextColor: "gray"
  },
  sectionedMultiSelectStyles: {
    container: {
      position: "absolute",
      width: SCREEN_WIDTH - 40,
      height: SCREEN_HEIGHT / 3,
      top: SCREEN_HEIGHT / 4
    },
    subItemText: { fontSize: 20 },
    backdrop: { backgroundColor: "rgba(0,0,0,0.5)" },
    selectToggle: {
      padding: 14,
      marginLeft: 5
    },
    chipContainer: {
      borderColor: "#C60000",
      borderWidth: 0.5
    },
    chipText: {
      color: "#C60000"
    }
  },
  dropdownChip: {
    marginLeft: 5,
    marginRight: 10
  },
  countryContainer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  ageContainer: {
    marginTop: 10,
    width: SCREEN_WIDTH - 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  ageListTitle: {
    fontSize: 20,
    textAlign: "center"
  },
  ageListItem: {
    justifyContent: "center",
    height: 40
  },
  ageText: {
    flex: 1,
    color: "gray"
  },
  ageButtonsContainer: {
    flex: 0.5,
    flexDirection: "row",
    justifyContent: "space-around"
  },
  ageButtons: {
    alignItems: "center",
    justifyContent: "center"
  },
  chipNormal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: "#C60000",
    height: 50,
    borderRadius: 25
  },
  chipSelected: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#C60000",
    height: 50,
    borderRadius: 25
  },
  chipTextNormal: {
    color: "#C60000"
  },
  chipTextSelected: {
    color: "white"
  },
  spaceView: {
    width: 10
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
  }
};

function mapStateToProps(state) {
  return {
    availableRegions: state.utilReducer.availableRegions,
    wizardJson: state.userReducer.wizardJson
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateUserLocation: location =>
      dispatch(UtilActions.updateUserLocation(location)),
    updateWizard: wizardJson => dispatch(UserActions.updateWizard(wizardJson))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PreferencesRegistration);
