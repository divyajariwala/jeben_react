import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  SafeAreaView
} from "react-native";
import { SafeAreaConsumer } from "react-native-safe-area-context";
import Ionic from "react-native-vector-icons/Ionicons";
import { Icon } from "react-native-eva-icons";
import DatePicker from "react-native-date-picker";
import Toast from "react-native-toast-message";
import RBSheet from "react-native-raw-bottom-sheet";
import Moment from "react-moment";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import * as CustomUtils from "../utils/functions";
import * as JebenaColors from "../utils/colors";
import SectionedMultiSelect from "react-native-sectioned-multi-select";
import * as ApiKeys from "../utils/ApiKeys";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import Geolocation from "@react-native-community/geolocation";
import Geocoder from "react-native-geocoding";
import { connect } from "react-redux";
import firebase from "@react-native-firebase/app";
import * as UserActions from "../actions/UserActions";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

class CompleteRegistration extends React.Component {
  static navigationOptions = () => ({
    header: null
  });

  state = {
    firstName: "",
    lastName: "",
    errorMessage: "",
    birthDay: new Date(),
    birthDaySelected: false,
    validAge: false,
    maleChecked: false,
    femaleChecked: false,
    validInputs: false,
    selectedCountries: [],
    countries: CustomUtils.getCountriesList(),
    locationPermissionGranted: false,
    latitude: 0,
    longitude: 0
  };

  handleComplete = () => {
    const {
      firstName,
      lastName,
      maleChecked,
      femaleChecked,
      selectedCountries,
      birthDaySelected,
      latitude,
      longitude,
      locationPermissionGranted
    } = this.state;

    let nameIsValid,
      countryIsValid,
      genderIsValid = false;

    //Validate Gender
    if (!maleChecked && !femaleChecked) {
      Toast.show({
        text1: "Gender not selected!",
        text2: "Please select your gender",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 3000
      });
    } else {
      genderIsValid = true;
    }

    //Validate Country
    if (selectedCountries.length === 0) {
      Toast.show({
        text1: "Country not selected!",
        text2: "Please tell us which countries you're from",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 3000
      });
    } else {
      countryIsValid = true;
    }

    //Validate Birthday
    if (!birthDaySelected) {
      Toast.show({
        text1: "Birthday not selected!",
        text2: "Please enter your birthday (18+ only)",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 3000
      });
    }

    //Validate Name
    if (
      !CustomUtils.isNameValid(firstName) ||
      !CustomUtils.isNameValid(lastName)
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
    } else {
      nameIsValid = true;
    }

    //Validate First Name
    if (firstName.length === 0) {
      Toast.show({
        text1: "Please provide first name!",
        text2: "",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 3000
      });
    } else {
      nameIsValid = true;
    }

    //Validate Last Name
    if (lastName.length === 0) {
      Toast.show({
        text1: "Please provide last name!",
        text2: "",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 3000
      });
    } else {
      nameIsValid = true;
    }

    //Validate Location
    // if (!locationPermissionGranted) {
    //   Toast.show({
    //     text1: "Location Was Not Granted!",
    //     text2: "Location is needed for match-making.",
    //     type: "error",
    //     position: "top",
    //     autoHide: true,
    //     visibilityTime: 3000
    //   });
    // }

    if (genderIsValid && countryIsValid && birthDaySelected && nameIsValid) {
      console.log("Inputs are valid");

      let today = new Date();
      var chosenGender = "";

      if (maleChecked) {
        chosenGender = "MALE";
      }
      if (femaleChecked) {
        chosenGender = "FEMALE";
      }

      let newUserJson = {
        uid: auth().currentUser.uid,
        about: {},
        firstName: CustomUtils.cleanName(firstName),
        lastName: CustomUtils.cleanName(lastName),
        googleProfilePicture: this.props.googleProfilePicture,
        facebookProfilePicture: this.props.facebookProfilePicture,
        oneSignalPlayerId: this.props.oneSignalPlayerId,
        gender: chosenGender,
        likedByCount: 0,
        countries: selectedCountries,
        birthDay: this.state.birthDay,
        signedUpOn: today.toISOString(),
        profileCompleted: true,
        preferencesCompleted: false,
        hideMeFromMatching: false,
        wallet2: {
          heartsCount: 0,
          likesCount: 0,
          receipts: [],
          history: []
        },
        coords: new firebase.firestore.GeoPoint(latitude, longitude)
      };

      Geocoder.init(ApiKeys.getGoogleMapsKey());
      Geocoder.from(latitude, longitude)
        .then(json => {
          const addressComponents = json.results[0].address_components;
          newUserJson.location = CustomUtils.parseAddress(addressComponents);
          newUserJson.city = CustomUtils.parseCity(addressComponents);
        })
        .catch(error => console.error(error));

      //this.props.updateWizard(newUserJson);
      //this.props.navigation.navigate("Preferences");

      if (auth().currentUser) {
        firestore()
          .collection("users")
          .doc(auth().currentUser.uid)
          .set(newUserJson, { merge: true })
          .then(() => {
            this.props.navigation.navigate("Preferences");
            console.log("Completed user profile ", auth().currentUser.uid);
          })
          .catch(error => {
            if (error.message) {
              let index = error.message.indexOf("]");
              if (index > -1) {
                let message = error.message.slice(index + 1);
                this.setState({ errorMessage: message });
              }
            }
          });
      }
    } else {
      console.log("Invalid");
    }
  };

  handleMalePress = () => {
    const { maleChecked } = this.state;
    if (maleChecked) {
      this.setState({ maleChecked: false });
    } else {
      this.setState({ maleChecked: true, femaleChecked: false });
    }
  };

  handleFemalePress = () => {
    const { femaleChecked } = this.state;
    if (femaleChecked) {
      this.setState({ femaleChecked: false });
    } else {
      this.setState({ femaleChecked: true, maleChecked: false });
    }
  };

  requestIOSPermission = () => {
    request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE)
      .then(result => {
        if (result === RESULTS.GRANTED) {
          console.log("Location permission granted");
          console.log("RES");
          console.log(result);
          this.setState({ locationPermissionGranted: true });
          //Save GPS location
          Geolocation.getCurrentPosition(location => {
            if (location && location.coords) {
              this.setState({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              });
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
        } else {
          console.log("Location permission NOT granted");
          this.setState({ locationPermissionGranted: false });
          Toast.show({
            text1: "Location not granted!",
            text2:
              "Location is needed for matching. Go to your setting to enable it.",
            type: "error",
            position: "top",
            autoHide: true,
            visibilityTime: 4000
          });
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

  componentDidMount() {
    console.log("Completion Mounted.");
    if (this.props.wizardJson.birthDay) {
      this.setState({
        birthDay: this.props.wizardJson.birthDay,
        birthDaySelected: true
      });
    } else {
      const eitheenYearsAgo = new Date();
      eitheenYearsAgo.setFullYear(2000);
      this.setState({ birthDay: eitheenYearsAgo });
    }
    if (this.props.wizardJson.firstName) {
      this.setState({ firstName: this.props.wizardJson.firstName });
    }
    if (this.props.wizardJson.lastName) {
      this.setState({ lastName: this.props.wizardJson.lastName });
    }
    if (this.props.wizardJson.countries) {
      this.setState({ selectedCountries: this.props.wizardJson.countries });
    }
    if (this.props.wizardJson.gender === "MALE") {
      this.setState({ maleChecked: true });
    }
    if (this.props.wizardJson.gender === "FEMALE") {
      this.setState({ femaleChecked: true });
    }
    //const { uid } = auth().currentUser;
    // firestore()
    //   .collection("users")
    //   .doc(uid)
    //   .onSnapshot(userSnap => {
    //     if (userSnap) {
    //       let userData = userSnap.data();
    //       if (userData) {
    //         if (userData.firstName) {
    //           this.setState({ firstName: userData.firstName });
    //         }
    //         if (userData.lastName) {
    //           this.setState({ lastName: userData.lastName });
    //         }
    //       }
    //     }
    //   });
  }

  onSelectedCountriesChange = selectedItems => {
    this.setState({ selectedCountries: selectedItems });
  };

  render() {
    const {
      firstName,
      lastName,
      maleChecked,
      femaleChecked,
      birthDay,
      birthDaySelected,
      countries,
      selectedCountries,
      locationPermissionGranted
    } = this.state;
    let eitheenYearsAgo = new Date();
    eitheenYearsAgo.setFullYear(eitheenYearsAgo.getFullYear() - 18);
    let thirtyFiveYearsAgo = new Date();
    thirtyFiveYearsAgo.setFullYear(thirtyFiveYearsAgo.getFullYear() - 40);
    return (
      <View style={styles.container}>
        <StatusBar hidden={false} barStyle="light-content" />
        <Image
          source={require("./assets/jebena_login_couple.jpg")}
          resizeMode="cover"
          style={styles.backgroundImage}
        />
        <View style={styles.backgroundImageShadow} />
        <SafeAreaConsumer>
          {insets => (
            <TouchableOpacity
              style={[styles.backBtn, { top: insets.top + 10 }]}
              onPress={() => {
                console.log("Return to Login");
                auth().signOut();
                this.props.navigation.navigate("Login");
              }}
            >
              <Icon
                name="arrow-ios-back-outline"
                width={32}
                height={32}
                fill="white"
              />
            </TouchableOpacity>
          )}
        </SafeAreaConsumer>
        <KeyboardAvoidingView behavior="padding">
          <View style={styles.formContainer}>
            <View style={styles.form}>
              <Text style={styles.messageText}>Tell us about yourself</Text>
              <View style={styles.nameContainer}>
                <View style={styles.inputContainer}>
                  <Icon
                    name="person-outline"
                    width={22}
                    height={22}
                    fill="#C60000"
                  />
                  <TextInput
                    placeholder="First Name"
                    placeholderTextColor={JebenaColors.grayText()}
                    style={styles.input}
                    autoCapitalize="none"
                    onChangeText={name => this.setState({ firstName: name })}
                    value={firstName}
                  />
                </View>
                <View style={styles.chip2} />
                <View style={styles.inputContainer}>
                  <Icon
                    name="person-outline"
                    width={22}
                    height={22}
                    fill="#C60000"
                  />
                  <TextInput
                    placeholder="Last Name"
                    placeholderTextColor={JebenaColors.grayText()}
                    style={styles.input}
                    autoCapitalize="none"
                    onChangeText={name => this.setState({ lastName: name })}
                    value={lastName}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.dateContainer}
                onPress={() => this.RBSheet.open()}
              >
                <Ionic name="ios-calendar" size={20} color="#C60000" />
                {birthDaySelected ? (
                  <Moment
                    element={Text}
                    format="MMM DD, YYYY"
                    style={styles.dateComponent}
                  >
                    {birthDay}
                  </Moment>
                ) : (
                  <Text style={styles.dobText}>Date of Birth (18+)</Text>
                )}
              </TouchableOpacity>
              <View style={styles.dropDownContainer}>
                <SectionedMultiSelect
                  items={countries}
                  uniqueKey="id"
                  subKey="children"
                  selectText="Your countries: "
                  searchPlaceholderText="Search countries..."
                  confirmText="Submit"
                  showCancelButton={true}
                  selectedIconComponent={
                    <Ionic name="ios-checkmark" size={30} color="#C60000" />
                  }
                  showDropDowns={false}
                  readOnlyHeadings={true}
                  onSelectedItemsChange={this.onSelectedCountriesChange}
                  selectedItems={selectedCountries}
                  colors={styles.sectionedMultiSelectColors}
                  styles={styles.sectionedMultiSelectStyles}
                />
              </View>
              <RBSheet
                ref={ref => {
                  this.RBSheet = ref;
                }}
                height={300}
                duration={250}
                customStyles={{
                  container: {
                    borderTopLeftRadius: 25,
                    borderTopRightRadius: 25,
                    justifyContent: "center",
                    alignItems: "center"
                  }
                }}
              >
                <TouchableOpacity
                  onPress={() => this.RBSheet.close()}
                  style={styles.setChip}
                >
                  <Text style={styles.chipTextSelected}>Set</Text>
                </TouchableOpacity>
                <DatePicker
                  mode="date"
                  date={this.state.birthDay}
                  minimumDate={thirtyFiveYearsAgo}
                  maximumDate={eitheenYearsAgo}
                  onDateChange={date =>
                    this.setState({ birthDay: date, birthDaySelected: true })
                  }
                />
              </RBSheet>
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
                <View style={styles.chip2} />
                <TouchableOpacity
                  onPress={this.handleFemalePress}
                  style={
                    femaleChecked ? styles.chipSelected : styles.chipNormal
                  }
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
              <TouchableOpacity
                style={
                  locationPermissionGranted
                    ? styles.completeBtn
                    : styles.completeBtnNormal
                }
                onPress={this.requestIOSPermission}
              >
                <Text
                  style={
                    locationPermissionGranted
                      ? styles.chipTextSmallSelected
                      : styles.chipTextSmallNormal
                  }
                >
                  {locationPermissionGranted
                    ? "Location Access Granted 😊"
                    : "Allow Location Access (Required for Matching)"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.completeBtn}
                onPress={this.handleComplete}
              >
                <Text style={styles.completeText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
        <Toast ref={ref => Toast.setRef(ref)} />
      </View>
    );
  }
}

const styles = {
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "gray"
  },
  logoContainer: {
    alignSelf: "center",
    marginTop: 10,
    width: 20,
    height: 30
  },
  messageText: {
    width: SCREEN_WIDTH - 10,
    paddingHorizontal: 10,
    textAlign: "center",
    fontWeight: "400",
    fontSize: 24
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
    alignItems: "center",
    marginHorizontal: 40,
    marginTop: 10,
    marginBottom: 20
  },
  formContainer: {
    backgroundColor: "white",
    paddingBottom: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  input: {
    flex: 1,
    height: 40,
    marginLeft: 5,
    fontSize: 16
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 0.4,
    borderColor: JebenaColors.grayBorder(),
    height: 50,
    borderRadius: 25,
    paddingLeft: 10
  },
  nameContainer: {
    flexDirection: "row"
  },
  dateContainer: {
    width: SCREEN_WIDTH - 80,
    height: 50,
    borderWidth: 0.4,
    borderRadius: 25,
    paddingLeft: 15,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderColor: "lightgray"
  },
  completeBtn: {
    width: SCREEN_WIDTH - 80,
    borderColor: "#C60000",
    backgroundColor: "#C60000",
    borderWidth: 1,
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10
  },
  completeBtnNormal: {
    width: SCREEN_WIDTH - 80,
    borderColor: "#C60000",
    borderWidth: 0.3,
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10
  },
  completeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600"
  },
  backBtn: {
    position: "absolute",
    left: 15
  },
  setChip: {
    height: 40,
    borderRadius: 25,
    justifyContent: "center",
    width: 100,
    alignItems: "center",
    backgroundColor: "#C60000"
  },
  chipNormal: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: "#C60000"
  },
  chipSelected: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#C60000"
  },
  chipTextNormal: {
    color: "#C60000"
  },
  chipTextSelected: {
    color: "white"
  },
  chipTextSmallNormal: {
    color: "#C60000",
    fontSize: 13
  },
  chipTextSmallSelected: {
    color: "white",
    fontSize: 13
  },
  dateComponent: {
    paddingLeft: 5
  },
  dobText: {
    marginLeft: 5,
    color: "gray"
  },
  chip2: {
    flex: 0.05
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10
  },
  countryContainer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  datePicker: {
    height: 50
  },
  backgroundImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignSelf: "center",
    marginTop: 5,
    position: "absolute",
    opacity: 0.9,
    backgroundColor: "black"
  },
  backgroundImageShadow: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "black",
    opacity: 0.3
  },
  dropDownContainer: {
    width: SCREEN_WIDTH - 80,
    borderWidth: 0.4,
    paddingVertical: 5,
    borderColor: "lightgray",
    borderRadius: 25,
    marginTop: 10
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
      padding: 7,
      marginLeft: 5
    },
    chipContainer: {
      borderColor: "#C60000",
      borderWidth: 0.5
    },
    chipText: {
      color: "#C60000"
    }
  }
};

function mapStateToProps(state) {
  return {
    wizardJson: state.userReducer.wizardJson,
    firstName: state.userReducer.firstName,
    lastName: state.userReducer.lastName,
    googleProfilePicture: state.userReducer.googleProfilePicture,
    facebookProfilePicture: state.userReducer.facebookProfilePicture,
    oneSignalPlayerId: state.userReducer.oneSignalPlayerId
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateWizard: wizardJson => dispatch(UserActions.updateWizard(wizardJson))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CompleteRegistration);
