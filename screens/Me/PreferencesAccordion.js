import React from "react";
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  ScrollView
} from "react-native";
import Ionic from "react-native-vector-icons/Ionicons";
import MatIcon from "react-native-vector-icons/MaterialCommunityIcons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import MultiSelect from "react-native-multiple-select";
import SectionedMultiSelect from "react-native-sectioned-multi-select";
import Toast from "react-native-toast-message";
import FastImage from "react-native-fast-image";
import RangeSlider from "rn-range-slider";
import * as CustomUtils from "../../utils/functions";
import * as JebenaColors from "../../utils/colors";
import * as JebenaImages from "../../utils/Images";
import { connect } from "react-redux";
import _ from "lodash";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

class PreferencesAccordion extends React.Component {
  state = {
    maleChecked: false,
    femaleChecked: false,
    selectedGender: "",
    selectedCountries: [],
    countries: CustomUtils.getCountriesList(),
    selectedAge: [20, 25],
    selectedLocation: [],
    hasUSLocation: false,
    locations: CustomUtils.getLocationsList2(this.props.availableRegions),
    errorMessage: "",
    validInputs: false
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
    const { uid } = auth().currentUser;
    console.log("Preferences Accordion mounted.");
    firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(userSnap => {
        if (userSnap) {
          let userData = userSnap.data();
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
            if (userData.preferences.countriesPreference) {
              let chosenCountries = userData.preferences.countriesPreference;
              this.setState({ selectedCountries: chosenCountries });
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
              let searchUSLocation = "";
              let selectedItems = userData.preferences.locationPreference;
              if (selectedItems.length > 0) {
                searchUSLocation = selectedItems.find(
                  x => x.substring(0, 3) === "US_"
                );
              }
              if (searchUSLocation) {
                this.setState({ hasUSLocation: true });
              } else {
                this.setState({ hasUSLocation: false });
              }
            }
          }
        }
      });
  }

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

  onSelectedCountriesChange = selectedItems => {
    this.setState({ selectedCountries: selectedItems });
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
    console.log("selected: ", selectedItems);
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
      this.setState({
        selectedLocation: [searchANY],
        hasUSLocation: false
      });
      return;
    }
    this.setState({ selectedLocation: selectedItems });
  };

  handleSavePreferences = () => {
    console.log("Save preferences...");
    const {
      selectedGender,
      selectedCountries,
      selectedAge,
      selectedLocation
    } = this.state;
    const { uid } = auth().currentUser;

    if (!selectedGender || selectedLocation.length === 0) {
      Toast.show({
        text1: "Oops",
        text2: "Gender and location preferences are required.",
        type: "error",
        position: "top",
        autoHide: true,
        visibilityTime: 2000
      });
    } else {
      let userPreferences = {
        preferences: {
          genderPreference: selectedGender,
          countriesPreference: selectedCountries,
          minAgePreference: selectedAge[0],
          maxAgePreference: selectedAge[1],
          locationPreference: selectedLocation
        }
      };
      firestore()
        .collection("users")
        .doc(uid)
        .set(userPreferences, { merge: true })
        .then(() => {
          Toast.show({
            text1: "😊",
            text2: "Preferences saved.",
            type: "success",
            position: "top",
            autoHide: true,
            visibilityTime: 2000
          });
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

  multiSliderValuesChange = values => {
    console.log("VLAUES:");
    console.log(values);
  };

  render() {
    const {
      maleChecked,
      femaleChecked,
      selectedAge,
      locations,
      selectedLocation,
      hasUSLocation
    } = this.state;

    return (
      <View>
        <View style={styles.preferencesContainer}>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              onPress={this.handleMalePress}
              style={maleChecked ? styles.chipSelected : styles.chipNormal}
            >
              <Text
                style={
                  maleChecked ? styles.chipTextSelected : styles.chipTextNormal
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
                source={require("../../assets/US_MAP/US_BG.png")}
                resizeMode="cover"
                style={styles.mapBg}
              />
              {this.renderRegionMaps()}
            </View>
          )}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => this.handleSavePreferences()}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = {
  preferencesContainer: {
    marginHorizontal: 20,
    alignItems: "center"
    //backgroundColor: 'lightgray'
  },
  input: {
    //backgroundColor: 'lightgray',
    color: "gray",
    width: "100%",
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
    marginTop: 10
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
  saveBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600"
  },
  dropDownContainer: {
    width: "100%",
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
    userLocation: state.utilReducer.userLocation
  };
}

export default connect(mapStateToProps)(PreferencesAccordion);
