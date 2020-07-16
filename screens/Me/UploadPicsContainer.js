import React from "react";
import { View, TouchableOpacity, Dimensions } from "react-native";
import Toast from "react-native-toast-message";
import auth from "@react-native-firebase/auth";
import Feather from "react-native-vector-icons/Feather";
import { Icon } from "react-native-eva-icons";
import ImagePicker from "react-native-image-picker";
import storage, { firebase } from "@react-native-firebase/storage";
import firestore from "@react-native-firebase/firestore";
import FastImage from "react-native-fast-image";
import ProgressBar from "react-native-progress/Bar";
import * as JebenaColors from "../../utils/colors";
import * as FaceDetector from "../../utils/face_detector.js";


const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const options = {
  noData: true
};

class UploadPicsContainer extends React.Component {
  state = {
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
    uploadPicProgress: 0
  };

  signOutUser = () => {
    auth()
      .signOut()
      .then(() => {
        this.props.navigation.navigate("Auth");
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

  handleDeleteImage(showingImageNumber) {
    const { uid } = auth().currentUser;

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
        console.log("Deleted from storage");
      })
      .catch(error => {
        console.log("Error Deleting Photo from Storage: ", error.message);
        this.setState({ showImageFullScreen: false });
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

        // const name = pic+imageNumber+Loc;
        // this.setState({ name:source});
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

  componentDidMount() {
    console.log("UploadPicsContainer Mounted.");
    const { uid } = auth().currentUser;

    firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(userSnap => {
        if (userSnap) {
          let userData = userSnap.data();
          if (userData) {
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
            if (userData.googleProfilePicture) {
              this.setState({ profilePicURL: userData.googleProfilePicture });
            }
            if (userData.profilePicURL) {
              this.setState({ profilePicURL: userData.profilePicURL });
            }
          }
        }
      });
  }


  render() {
    const {
      uploadPicProgress
    } = this.state;
    return (
      <View>
         <View style={styles.profilePicsContainer}> 
         {this.createTable()}
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
      </View>
    );
  }

 
createTable = () => {
  const {
    pic1URL,
    pic2URL,
    pic3URL,
    pic4URL,
  } = this.state;

let nameTable=[]
nameTable[0]=pic1URL;
nameTable[1]=pic2URL;
nameTable[2]=pic3URL;
nameTable[3]=pic4URL;


  let table = []

  for (let i = 1; i < 5; i++) {
    table.push(
      <TouchableOpacity
      style={styles.miniPicContainer}
      onPress={() => {
        if (nameTable[i-1]) {
          this.showImage(i);
        } else {
          this.handleAddImage(i);
        }
      }}
    >
      {nameTable[i-1] ? (
        <View style={styles.miniProfilePic}>
          <FastImage
            style={styles.miniProfilePic}
            source={{
              uri: nameTable[i-1],
              priority: FastImage.priority.normal
            }}
            resizeMode={FastImage.resizeMode.cover}
          />
          <Icon
            name="trash-2-outline"
            width={22}
            height={22}
            fill="#C60000"
            style={styles.deleteIcon}
            onPress={() => {
              this.handleDeleteImage(i);
            }}
          />
        </View>
      ) : (
        <View style={styles.uploadMiniProfilePic}>
          <Feather name="camera" color="gray" size={20} />
        </View>
      )}
    </TouchableOpacity>
    )
  }
  return table
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
    height: SCREEN_WIDTH * 0.3,
    width: SCREEN_WIDTH,
    borderBottomLeftRadius: SCREEN_WIDTH,
    borderBottomRightRadius: SCREEN_WIDTH
  },
  appBarTitle: {
    fontSize: 18,
    textAlign: "center",
    color: "white",
    fontWeight: "600"
  },
  safeView: {
    flex: 1,
    alignItems: "center",
    flexDirection: "column",
    marginTop: -SCREEN_WIDTH * 0.18
  },
  settingsContainer: {
    height: SCREEN_HEIGHT * 0.44,
    width: SCREEN_WIDTH,
    justifyContent: "center"
  },
  scrollViewStyle: {
    position: "absolute",
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.4,
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 20,
    backgroundColor: "white",
    flexDirection: "column"
  },
  accordionStyle: {
    height: 50,
    justifyContent: "center",
    alignItems: "center"
  },
  accordionDivider: {
    marginHorizontal: 10
  },
  accordionTitleStyle: {
    color: "black",
    height: 25,
    fontSize: 14,
    marginTop: 10
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
  profilePicsContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
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
  deleteIcon: {
    alignSelf: "center",
    position: "absolute"
  },
  accordionSectionContainer: {
    marginHorizontal: 10
  },
  signOutBtn: {
    marginHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20
  },
  signOutTitle: {
    textTransform: "capitalize",
    color: "gray",
    fontSize: 14
  },
  powerIcon: {
    marginTop: 4
  },
  signOutContainer: {
    marginLeft: 5,
    justifyContent: "center"
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
    marginTop: 20
  }
};

export default UploadPicsContainer;
