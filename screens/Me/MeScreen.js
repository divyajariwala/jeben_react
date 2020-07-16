import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  StatusBar,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback
} from "react-native";
import { connect } from "react-redux";
import * as WalletActions from "../../actions/WalletActions";
import VersionNumber from "react-native-version-number";
import InAppPurchasePopup from "../InAppPurchasePopup";
import Toast from "react-native-toast-message";
import auth from "@react-native-firebase/auth";
import SimpleLine from "react-native-vector-icons/SimpleLineIcons";
import Feather from "react-native-vector-icons/Feather";
import MaterialComm from "react-native-vector-icons/MaterialCommunityIcons";
import { Icon } from "react-native-eva-icons";
import { List, Button, Divider } from "react-native-paper";
import ImagePicker from "react-native-image-picker";
import storage, { firebase } from "@react-native-firebase/storage";
import firestore from "@react-native-firebase/firestore";
import FastImage from "react-native-fast-image";
import ProgressBar from "react-native-progress/Bar";
import ProgressPie from "react-native-progress/Pie";
import UserCard from "../Home/UserCard";
import * as JebenaColors from "../../utils/colors";
import * as JebenaFunctions from "../../utils/functions";
import * as FaceDetector from "../../utils/face_detector.js";
import { countries, continents } from "countries-list";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const options = {
  noData: true
};

class MeScreen extends React.Component {
  static navigationOptions = () => ({
    header: null
  });

  state = {
    firstName: "",
    lastName: "",
    location: null,
    zodiacSign: null,
    picturesArray: [],
    profilePicURL: null,
    profilePicUploadProgress: 0,
    pic1URL: null,
    pic2URL: null,
    pic3URL: null,
    pic4URL: null,
    showImageFullScreen: false,
    showingImageUrl: null,
    showingImageNumber: 1,
    uploadPicProgress: 0,
    birthDay: null,
    bio: null,
    music: [],
    shows: [],
    personalities: [],
    locationCode: "",
    profileUserCardData: []
  };

  componentDidUpdate(prevProps, prevState) {}

  componentDidMount() {
    console.log("MeScreen Mounted.");
    const { uid } = auth().currentUser;

    this.checkIfAllPhotosDeleted(uid);

    firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(userSnap => {
        if (userSnap) {
          let userData = userSnap.data();
          if (userData.firstName) {
            this.setState({ firstName: userData.firstName });
          }
          if (userData.lastName) {
            this.setState({ lastName: userData.lastName });
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
          if (userData.birthDay) {
            this.setState({
              birthDay: userData.birthDay.toDate()
            });
          }
          if (userData.about.bio) {
            this.setState({ bio: userData.about.bio });
          }
          if (userData.about.music) {
            this.setState({ music: userData.about.music });
          }
          if (userData.about.shows) {
            this.setState({ shows: userData.about.shows });
          }
          if (userData.about.personalities) {
            this.setState({ personalities: userData.about.personalities });
          }
          if (userData.location) {
            this.setState({ locationCode: userData.location });
          }
          if (userData.profilePicURL) {
            this.setState({ profilePicURL: userData.profilePicURL });
          } else if (userData.googleProfilePicture) {
            this.setState({ profilePicURL: userData.googleProfilePicture });
          } else if (userData.facebookProfilePicture) {
            this.setState({ profilePicURL: userData.facebookProfilePicture });
          }
          // if (userData.birthDay) {
          //   let day = userData.birthDay.toDate().getDate();
          //   let month = userData.birthDay.toDate().getMonth() + 1;
          //   let zodiac = JebenaFunctions.getZodiacSign(day, month);
          //   console.log("Day Month: ", day, month);
          //   console.log("zodiac: ", zodiac);
          //   this.setState({ zodiacSign: zodiac });
          // }

          /**
           * Country emoji and city
           */
          let searchLocation = "";
          if (userData.location && userData.city) {
            let locationID = userData.location.slice(0, 2);
            searchLocation = `${countries[locationID].emoji} ${userData.city}`;
            this.setState({ location: searchLocation });
          }
          //end of location logic
        }
      });
  }

  signOutUser = () => {
    firestore()
      .collection("users")
      .doc(auth().currentUser.uid)
      .set({ signedIn: false }, { merge: true })
      .then(() => {
        auth()
          .signOut()
          .then(() => {
            this.props.navigation.navigate("Loading");
          });
      })
      .catch(error => {
        console.error(error.message);
      });
  };

  showImage(imageNumber) {
    const { pic1URL, pic2URL, pic3URL, pic4URL } = this.state;

    console.log("Show Img #", imageNumber);
    this.setState({ showImageFullScreen: true });
    if (imageNumber === 1) {
      this.setState({ showingImageUrl: pic1URL, showingImageNumber: 1 });
    } else if (imageNumber === 2) {
      this.setState({ showingImageUrl: pic2URL, showingImageNumber: 2 });
    } else if (imageNumber === 3) {
      this.setState({ showingImageUrl: pic3URL, showingImageNumber: 3 });
    } else {
      this.setState({ showingImageUrl: pic4URL, showingImageNumber: 4 });
    }
  }

  checkIfAllPhotosDeleted(uid) {
    firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(userSnap => {
        if (userSnap) {
          let userData = userSnap.data();
          if (
            !userData.pic1URL &&
            !userData.pic2URL &&
            !userData.pic3URL &&
            !userData.pic4URL
          ) {
            console.log("All photos deleted");
            firestore()
              .collection("users")
              .doc(uid)
              .set({ preferencesCompleted: false }, { merge: true })
              .then(() => {
                this.props.navigation.navigate("Preferences");
              })
              .catch(error => {
                console.error(error.message);
              });
          }
        }
      });
  }

  handleDeleteImage() {
    const { uid } = auth().currentUser;
    const { showingImageNumber } = this.state;

    console.log("Delete Image #", showingImageNumber);

    let picName = `pic${showingImageNumber}URL`;
    const ref = storage().ref(`${uid}/${picName}.jpg`);

    //Delete URL to Firestore
    let userRef = firestore()
      .collection("users")
      .doc(uid);
    const deleteField = firebase.firestore.FieldValue.delete();

    if (showingImageNumber === 1) {
      userRef
        .update({ pic1URL: deleteField })
        .then(() => {
          console.log("Deleted URL 1 from firestore");
          this.setState({ pic1URL: null });
        })
        .catch(error => {
          console.log("Error deleting URL 1 from firestore: ", error.message);
        });
    } else if (showingImageNumber === 2) {
      userRef
        .update({ pic2URL: deleteField })
        .then(() => {
          this.setState({ pic2URL: null });
          console.log("Deleted URL 2 from firestore");
        })
        .catch(error => {
          console.log("Error deleting URL 2 from firestore: ", error.message);
        });
    } else if (showingImageNumber === 3) {
      userRef
        .update({ pic3URL: deleteField })
        .then(() => {
          this.setState({ pic3URL: null });
          console.log("Deleted URL 3 from firestore");
        })
        .catch(error => {
          console.log("Error deleting URL from firestore: ", error.message);
        });
    } else {
      userRef
        .update({ pic4URL: deleteField })
        .then(() => {
          this.setState({ pic4URL: null });
          console.log("Deleted URL 4 from firestore");
        })
        .catch(error => {
          console.log("Error deleting URL 4 from firestore: ", error.message);
        });
    }
    this.setState({ showImageFullScreen: false });
    //Delete from storage
    ref
      .delete()
      .then(() => {
        console.log(`Deleted ${picName} from storage`);
      })
      .catch(error => {
        console.log("Error Deleting Photo from Storage: ", error.message);
        this.setState({ showImageFullScreen: false });
      });
    this.checkIfAllPhotosDeleted(uid);
  }

  previewProfile() {
    const {
      firstName,
      locationCode,
      birthDay,
      bio,
      music,
      shows,
      personalities,
      pic1URL,
      pic2URL,
      pic3URL,
      pic4URL
    } = this.state;
    let userJson = {
      uid: auth().currentUser,
      firstName: firstName,
      location: locationCode,
      birthDay: birthDay,
      bio: bio,
      music: music,
      shows: shows,
      personalities: personalities,
      pic1URL: pic1URL,
      pic2URL: pic2URL,
      pic3URL: pic3URL,
      pic4URL: pic4URL
    };
    this.setState({ profileUserCardData: [userJson] });
  }

  doneReadingCard = () => {
    console.log("Done reading card in profile feed");
    this.setState({
      profileUserCardData: []
    });
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

  handleAddImage(imageNumber) {
    console.log("Add image #", imageNumber);
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
          let picName = `pic${imageNumber}URL`;
          const ref = storage().ref(`${uid}/${picName}.jpg`);
          ref
            .putFile(source, {
              cacheControl: "no-store" // disable caching
            })
            .on(
              firebase.storage.TaskEvent.STATE_CHANGED,
              snapshot => {
                let progress = snapshot.bytesTransferred / snapshot.totalBytes;
                console.log("Uploading: ", progress);
                this.setState({ uploadPicProgress: progress });
                if (snapshot.state === firebase.storage.TaskState.SUCCESS) {
                  console.log("Success");
                  this.setState({ uploadPicProgress: 0 });
                  //Save URL to Firestore
                  const picRef = storage().ref(
                    `${uid}/pic${imageNumber}URL.jpg`
                  );
                  picRef
                    .getDownloadURL()
                    .then(url => {
                      console.log(url);
                      if (url) {
                        let userPic = {};
                        if (imageNumber === 1) {
                          userPic = { pic1URL: url };
                        } else if (imageNumber === 2) {
                          userPic = { pic2URL: url };
                        } else if (imageNumber === 3) {
                          userPic = { pic3URL: url };
                        } else {
                          userPic = { pic4URL: url };
                        }
                        firestore()
                          .collection("users")
                          .doc(uid)
                          .set(userPic, { merge: true })
                          .then(() => {
                            console.log("Saved URL: ", url);
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

  render() {
    const {
      firstName,
      lastName,
      zodiacSign,
      location,
      profilePicURL,
      profilePicUploadProgress,
      pic1URL,
      pic2URL,
      pic3URL,
      pic4URL,
      showingImageUrl,
      showImageFullScreen,
      uploadPicProgress
    } = this.state;

    return (
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
          <View style={styles.statusBarContainer}>
            <StatusBar hidden={false} barStyle="light-content" />
          </View>
          <SafeAreaView>
            <View style={styles.appBar}>
              <Text style={styles.appBarTitle}>Profile</Text>
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
                    this.previewProfile();
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
              <TouchableOpacity
                style={styles.editProfilePicStyle}
                onPress={() => {
                  this.handleUploadProfilePic();
                }}
              >
                <Feather name="camera" color="gray" size={18} />
              </TouchableOpacity>
            </View>
            <View style={styles.userBioContainer}>
              <Text style={styles.userName}>
                {firstName} {lastName}
              </Text>
              {/* <View style={styles.userZodiac}>
                <MaterialComm
                  name={zodiacSign}
                  size={20}
                  color={JebenaColors.primaryColor()}
                />
              </View> */}
              <Text style={styles.userLocation}>{location}</Text>
            </View>
            <KeyboardAvoidingView
              style={styles.keyboardView}
              behavior="padding"
              enabled
            >
              <View style={styles.settingsContainer}>
                <ScrollView style={styles.scrollViewStyle}>
                  <View style={styles.profilePicsContainer}>
                    <TouchableOpacity
                      style={styles.miniPicContainer}
                      onPress={() => {
                        //Upload or show uploaded image
                        if (pic1URL) {
                          this.showImage(1);
                        } else {
                          this.handleAddImage(1);
                        }
                      }}
                    >
                      {pic1URL ? (
                        <FastImage
                          style={styles.miniProfilePic}
                          source={{
                            uri: pic1URL,
                            priority: FastImage.priority.normal
                          }}
                          resizeMode={FastImage.resizeMode.cover}
                        />
                      ) : (
                        <View style={styles.uploadMiniProfilePic}>
                          <Feather name="camera" color="gray" size={20} />
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.miniPicContainer}
                      onPress={() => {
                        //Upload or show uploaded image
                        if (pic2URL) {
                          this.showImage(2);
                        } else {
                          this.handleAddImage(2);
                        }
                      }}
                    >
                      {pic2URL ? (
                        <FastImage
                          style={styles.miniProfilePic}
                          source={{
                            uri: pic2URL,
                            priority: FastImage.priority.normal
                          }}
                          resizeMode={FastImage.resizeMode.cover}
                        />
                      ) : (
                        <View style={styles.uploadMiniProfilePic}>
                          <Feather name="camera" color="gray" size={20} />
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.miniPicContainer}
                      onPress={() => {
                        //Upload or show uploaded image
                        if (pic3URL) {
                          this.showImage(3);
                        } else {
                          this.handleAddImage(3);
                        }
                      }}
                    >
                      {pic3URL ? (
                        <FastImage
                          style={styles.miniProfilePic}
                          source={{
                            uri: pic3URL,
                            priority: FastImage.priority.normal
                          }}
                          resizeMode={FastImage.resizeMode.cover}
                        />
                      ) : (
                        <View style={styles.uploadMiniProfilePic}>
                          <Feather name="camera" color="gray" size={20} />
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.miniPicContainer}
                      onPress={() => {
                        //Upload or show uploaded image
                        if (pic4URL) {
                          this.showImage(4);
                        } else {
                          this.handleAddImage(4);
                        }
                      }}
                    >
                      {pic4URL ? (
                        <FastImage
                          style={styles.miniProfilePic}
                          source={{
                            uri: pic4URL,
                            priority: FastImage.priority.normal
                          }}
                          resizeMode={FastImage.resizeMode.cover}
                        />
                      ) : (
                        <View style={styles.uploadMiniProfilePic}>
                          <Feather name="camera" color="gray" size={20} />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                  {uploadPicProgress > 0 ? (
                    <ProgressBar
                      progress={uploadPicProgress}
                      width={SCREEN_WIDTH - 60}
                      color="#C60000"
                      unfilledColor="lightgray"
                      borderWidth={0}
                      style={styles.progressBarStyle}
                    />
                  ) : (
                    <View />
                  )}
                  <List.Section style={styles.accordionSectionContainer}>
                    {/* My Profile */}
                    <TouchableOpacity
                      style={styles.accordionStyle}
                      onPress={() =>
                        this.props.navigation.navigate("ProfileSetting", {
                          PAGE_TITLE: "My Profile",
                          SETTING_NAME: "SETTING_PROFILE"
                        })
                      }
                    >
                      <View style={styles.accordionNameContainerStyle}>
                        <Icon
                          name="person-outline"
                          width={22}
                          height={22}
                          fill="#C60000"
                        />
                        <Text style={styles.accordionTitleStyle}>
                          My Profile
                        </Text>
                      </View>
                      <Icon
                        name="arrow-ios-forward-outline"
                        fill={JebenaColors.grayBorder()}
                        width={22}
                        height={22}
                      />
                    </TouchableOpacity>
                    <Divider style={styles.accordionDivider} />
                    {/* My Preferences */}
                    <TouchableOpacity
                      style={styles.accordionStyle}
                      onPress={() =>
                        this.props.navigation.navigate("ProfileSetting", {
                          PAGE_TITLE: "My Preferences",
                          SETTING_NAME: "SETTING_PREFERENCES"
                        })
                      }
                    >
                      <View style={styles.accordionNameContainerStyle}>
                        <Icon
                          name="options-2-outline"
                          width={22}
                          height={22}
                          fill="#C60000"
                        />
                        <Text style={styles.accordionTitleStyle}>
                          My Preferences
                        </Text>
                      </View>
                      <Icon
                        name="arrow-ios-forward-outline"
                        fill={JebenaColors.grayBorder()}
                        width={22}
                        height={22}
                      />
                    </TouchableOpacity>
                    <Divider style={styles.accordionDivider} />
                    {/* My Wallet */}
                    <TouchableOpacity
                      style={styles.accordionStyle}
                      onPress={() => {
                        this.props.updateWalletMessage(
                          `Get matched faster with premium`
                        );
                        this.props.toggleWallet(true);
                      }}
                    >
                      <View style={styles.accordionNameContainerStyle}>
                        <SimpleLine name="wallet" size={20} color="#C60000" />
                        <Text style={styles.accordionTitleStyle}>
                          My Wallet
                        </Text>
                      </View>
                      <Icon
                        name="arrow-ios-forward-outline"
                        fill={JebenaColors.grayBorder()}
                        width={22}
                        height={22}
                      />
                    </TouchableOpacity>
                    <Divider style={styles.accordionDivider} />
                    {/* Hide Matching */}
                    <TouchableOpacity
                      style={styles.accordionStyle}
                      onPress={() =>
                        this.props.navigation.navigate("ProfileSetting", {
                          PAGE_TITLE: "Hide Matching",
                          SETTING_NAME: "SETTING_HIDE_MATCHING"
                        })
                      }
                    >
                      <View style={styles.accordionNameContainerStyle}>
                        <Icon
                          name="eye-off-outline"
                          width={22}
                          height={22}
                          fill="#C60000"
                        />
                        <Text style={styles.accordionTitleStyle}>
                          Hide Matching
                        </Text>
                      </View>
                      <Icon
                        name="arrow-ios-forward-outline"
                        fill={JebenaColors.grayBorder()}
                        width={22}
                        height={22}
                      />
                    </TouchableOpacity>
                    <Divider style={styles.accordionDivider} />
                    {/* Feedback */}
                    <TouchableOpacity
                      style={styles.accordionStyle}
                      onPress={() =>
                        this.props.navigation.navigate("ProfileSetting", {
                          PAGE_TITLE: "Feedback",
                          SETTING_NAME: "SETTING_FEEDBACK"
                        })
                      }
                    >
                      <View style={styles.accordionNameContainerStyle}>
                        <Icon
                          name="message-circle-outline"
                          width={22}
                          height={22}
                          fill="#C60000"
                        />
                        <Text style={styles.accordionTitleStyle}>Feedback</Text>
                      </View>
                      <Icon
                        name="arrow-ios-forward-outline"
                        fill={JebenaColors.grayBorder()}
                        width={22}
                        height={22}
                      />
                    </TouchableOpacity>
                    <Divider style={styles.accordionDivider} />
                    {/* Privacy */}
                    <TouchableOpacity
                      style={styles.accordionStyle}
                      onPress={() =>
                        this.props.navigation.navigate("ProfileSetting", {
                          PAGE_TITLE: "Privacy",
                          SETTING_NAME: "SETTING_PRIVACY"
                        })
                      }
                    >
                      <View style={styles.accordionNameContainerStyle}>
                        <Icon
                          name="shield-outline"
                          width={22}
                          height={22}
                          fill="#C60000"
                        />
                        <Text style={styles.accordionTitleStyle}>Privacy</Text>
                      </View>
                      <Icon
                        name="arrow-ios-forward-outline"
                        fill={JebenaColors.grayBorder()}
                        width={22}
                        height={22}
                      />
                    </TouchableOpacity>
                    <Divider style={styles.accordionDivider} />
                    {/* Sign Out */}
                    <List.Item
                      left={() => (
                        <View style={styles.signOutRow}>
                          <TouchableOpacity
                            style={styles.signOutBtn}
                            onPress={() => this.signOutUser()}
                          >
                            <Icon
                              name="power-outline"
                              width={20}
                              height={20}
                              fill={JebenaColors.primaryColor()}
                              style={styles.powerIcon}
                            />
                            <Text style={styles.signOutTitle}>Sign Out</Text>
                          </TouchableOpacity>
                          <View
                            style={{ marginTop: 5, alignItems: "flex-end" }}
                          >
                            <View style={{ flexDirection: "row" }}>
                              <Feather
                                name="instagram"
                                color="gray"
                                size={14}
                                style={{ marginRight: 5 }}
                              />
                              <Feather
                                name="twitter"
                                color="gray"
                                size={14}
                                style={{ marginRight: 5 }}
                              />
                              <Text style={styles.socialText}>@jebena_app</Text>
                            </View>
                            <View>
                              <Text
                                style={styles.footerText}
                              >{`Made by the culture\n${
                                VersionNumber.appVersion
                              }.${VersionNumber.buildVersion}
                            \u00A9 Team Jebena`}</Text>
                            </View>
                          </View>
                        </View>
                      )}
                      style={styles.signOutContainer}
                    />
                  </List.Section>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
          {showImageFullScreen ? (
            <View style={styles.imagePopupContainer}>
              <View style={styles.imagePopupModal}>
                <FastImage
                  style={styles.imagePopupModal}
                  source={{
                    uri: showingImageUrl,
                    priority: FastImage.priority.normal
                  }}
                  resizeMode={FastImage.resizeMode.cover}
                />
                <View style={styles.imagePopupMenu}>
                  <Button
                    icon="delete"
                    color="#C60000"
                    mode="text"
                    onPress={() => {
                      this.handleDeleteImage();
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    color="gray"
                    mode="text"
                    onPress={() => {
                      this.setState({ showImageFullScreen: false });
                    }}
                  >
                    Close
                  </Button>
                </View>
              </View>
            </View>
          ) : (
            <View />
          )}
          {this.props.openWallet && <InAppPurchasePopup key="inApp" />}
          {this.state.profileUserCardData &&
            this.state.profileUserCardData.length > 0 && (
              <SafeAreaView style={styles.userCardPopupBg}>
                <View style={styles.userCardPopup}>
                  <UserCard
                    feedUsers={this.state.profileUserCardData}
                    doneReading={this.doneReadingCard.bind(this)}
                    showDislikeButton={false}
                    showHeartButton={false}
                    showLikeButton={false}
                    showReturnButton={true}
                  />
                </View>
                <Toast ref={ref => Toast.setRef(ref)} />
              </SafeAreaView>
            )}
          <Toast ref={ref => Toast.setRef(ref)} />
        </View>
      </TouchableWithoutFeedback>
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
    height: SCREEN_HEIGHT * 0.18,
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
    paddingTop: SCREEN_HEIGHT * 0.03,
    borderBottomLeftRadius: SCREEN_HEIGHT,
    borderBottomRightRadius: SCREEN_HEIGHT
  },
  appBarTitle: {
    fontSize: 18,
    textAlign: "center",
    color: "white",
    fontWeight: "600"
  },
  safeView: {
    flex: 1,
    //backgroundColor: "teal",
    alignItems: "center",
    flexDirection: "column",
    marginTop: -SCREEN_WIDTH * 0.18
  },
  userBioContainer: {
    marginVertical: 10,
    width: SCREEN_WIDTH,
    paddingHorizontal: 40
  },
  userCardPopup: {
    marginTop: SCREEN_WIDTH * 0.085
  },
  userCardPopupBg: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center"
  },
  userZodiac: {
    alignItems: "center"
  },
  userLocation: {
    fontSize: 14,
    color: JebenaColors.grayText(),
    textAlign: "center"
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
    marginTop: 100
  },
  settingsContainer: {
    marginTop: 0,
    //backgroundColor: "pink",
    height: SCREEN_HEIGHT * 0.72,
    width: SCREEN_WIDTH,
    alignItems: "center"
  },
  scrollViewStyle: {
    marginTop: 15,
    paddingTop: 2,
    width: SCREEN_WIDTH - 20,
    height: SCREEN_HEIGHT * 0.6,
    marginHorizontal: 20,
    //marginBottom: SCREEN_HEIGHT  * 0.1,
    borderRadius: 20,
    backgroundColor: "white",
    flexDirection: "column"
  },
  accordionStyle: {
    height: 55,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 10
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
  },
  toolBar: {
    container: {
      height: 40,
      width: SCREEN_WIDTH,
      flexDirection: "row",
      backgroundColor: "#C60000",
      justifyContent: "center"
    },
    titleText: {
      color: "white"
    },
    centerElement: {
      color: "white"
    },
    centerElementContainer: {
      backgroundColor: "#C60000",
      alignItems: "center"
    }
  },
  container: {
    flex: 1,
    backgroundColor: JebenaColors.lightBlueBg(),
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
  editProfilePicStyle: {
    width: 32,
    height: 32,
    position: "absolute",
    marginTop: SCREEN_WIDTH / 4.5,
    right: SCREEN_WIDTH / 2.8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "white",
    backgroundColor: JebenaColors.grayBorder(),
    alignItems: "center",
    justifyContent: "center"
  },
  profileUserStyle: {
    width: SCREEN_WIDTH - 40,
    marginTop: 10,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center"
  },
  profileBioStyle: {
    width: SCREEN_WIDTH - 40,
    marginTop: 10,
    marginHorizontal: 10,
    fontSize: 12
  },
  picsAndProgressContainer: {
    alignItems: "center"
  },
  profilePicsContainer: {
    marginTop: 5,
    //width: SCREEN_WIDTH - 40,
    flexDirection: "row",
    justifyContent: "space-around"
  },
  miniProfilePic: {
    width: SCREEN_WIDTH / 5,
    height: SCREEN_WIDTH / 5,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center"
  },
  uploadMiniProfilePic: {
    width: SCREEN_WIDTH / 5,
    height: SCREEN_WIDTH / 5,
    borderWidth: 1,
    borderColor: JebenaColors.grayBorder(),
    borderRadius: 15,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: JebenaColors.lightBlueBg2()
  },
  miniPicContainer: {
    justifyContent: "center",
    alignItems: "center"
  },
  accordionSectionContainer: {
    marginHorizontal: 10
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center"
  },
  signOutTitle: {
    marginTop: 4,
    marginLeft: 10
  },
  footerText: {
    fontSize: 10,
    color: JebenaColors.grayBorder(),
    textAlign: "right",
    marginTop: 4,
    marginRight: 5
  },
  socialText: {
    marginRight: 5,
    fontSize: 12,
    color: JebenaColors.grayText(),
    textAlign: "right"
  },
  powerIcon: {
    marginTop: 4
  },
  signOutContainer: {
    //backgroundColor: "pink",
    marginLeft: 2,
    paddingBottom: 200,
    justifyContent: "center"
  },
  signOutRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between"
  },
  backBtn: {
    left: 10
  },
  imagePopupContainer: {
    backgroundColor: "rgba(0,0,0,0.6)",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute"
  },
  imagePopupModal: {
    backgroundColor: "white",
    width: SCREEN_WIDTH - SCREEN_WIDTH / 6,
    height: SCREEN_WIDTH * 1.35,
    alignSelf: "center",
    position: "absolute",
    borderRadius: 10
  },
  imagePopupMenu: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(1,1,1,0.75)",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10
  },
  progressBarStyle: {
    height: 2,
    marginTop: 5,
    alignSelf: "center",
    marginHorizontal: 20
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
)(MeScreen);
