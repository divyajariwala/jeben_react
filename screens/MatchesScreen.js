import React from "react";
import {
  View,
  Text,
  Dimensions,
  FlatList,
  Alert,
  StatusBar,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { connect } from "react-redux";
import * as WalletActions from "../actions/WalletActions";
import * as UtilActions from "../actions/UtilActions";
import { List, Divider } from "react-native-paper";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { SafeAreaConsumer } from "react-native-safe-area-context";
import SimpleIcons from "react-native-vector-icons/SimpleLineIcons";
import { Icon } from "react-native-eva-icons";
import FastImage from "react-native-fast-image";
import Toast from "react-native-toast-message";
import RBSheet from "react-native-raw-bottom-sheet";
import UserCard from "./Home/UserCard";
import InAppPurchasePopup from "../screens/InAppPurchasePopup";
import MatchPopup from "./Home/MatchPopup";
import moment from "moment";
import * as JebenaFunctions from "../utils/functions";
import * as JebenaColors from "../utils/colors";
import _ from "lodash";
import { countries, continents } from "countries-list";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

class MatchesScreen extends React.Component {
  state = {
    matches: [],
    optionsOpenedMatch: {},
    userCardData: [],
    matchedUserCardData: [],
    shownPool: [],
    dislikedPool: [],
    heartedOnlyLikedOnly: [],
    loadingMatches: true,
    isFetching: false,
    preferences: {
      locationPreference: [],
      genderPreference: "",
      minAgePreference: 0,
      maxAgePreference: 0
    }
  };

  static navigationOptions = () => ({
    header: null
  });

  onRefresh() {
    const { uid } = auth().currentUser;
    this.setState({
      isFetching: true
    });
    this.queryMatches(uid);
  }

  componentDidMount() {
    const { uid } = auth().currentUser;
    console.log("MatchesScreen Mounted");
    firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(userSnap => {
        let userData = userSnap.data();
        if (userData && userData.preferencesCompleted) {
          this.setState({ preferences: userData.preferences });
        }
      });

    this.props.getWalletInfo(uid);
    this.props.updateBlockedUsers(uid);
    this.queryMatches(uid);
    this.getInteractions(uid);
  }

  queryMatches(uid) {
    console.log("Searching matches for: ", uid);
    firestore()
      .collection("matches")
      .where("participants", "array-contains", uid)
      .orderBy("updatedAt")
      .get()
      .then(querySnapshot => {
        if (querySnapshot && !querySnapshot.empty) {
          console.log(`${querySnapshot.size} matches found.`);
          this.setState({ isFetching: false });
          querySnapshot.forEach(doc => {
            let docData = doc.data();
            if (docData.participants) {
              console.log("Participants: ", docData.participants);
              for (const usr of docData.participants) {
                if (this.props.blockedUsers.includes(usr)) {
                  this.setState({ loadingMatches: false });
                  return;
                }
                if (usr !== uid) {
                  //Get match's info
                  console.log("Get info for: ", usr);
                  firestore()
                    .collection("users")
                    .doc(usr)
                    .get()
                    .then(userSnap => {
                      if (userSnap) {
                        let userData = userSnap.data();
                        if (userData && userData.preferencesCompleted) {
                          let userPic = "";
                          if (userData.profilePicURL) {
                            userPic = userData.profilePicURL;
                          } else if (userData.googleProfilePicture) {
                            userPic = userData.googleProfilePicture;
                          } else if (userData.facebookProfilePicture) {
                            userPic = userData.facebookProfilePicture;
                          }
                          let matchJson = {
                            matchId: doc.id,
                            profilePicURL: userPic,
                            matchedUserId: usr,
                            firstName: userData.firstName,
                            lastName: userData.lastName,
                            location: userData.location
                              ? userData.location
                              : "",
                            gender: userData.gender,
                            city: userData.city ? userData.city : "",
                            birthDay: userData.birthDay
                              ? userData.birthDay.toDate()
                              : "",
                            bio: userData.about ? userData.about.bio : "",
                            music: userData.about ? userData.about.music : [],
                            shows: userData.about ? userData.about.shows : [],
                            personalities: userData.about
                              ? userData.about.personalities
                              : [],
                            pic1URL: userData.pic1URL,
                            pic2URL: userData.pic2URL,
                            pic3URL: userData.pic3URL,
                            pic4URL: userData.pic4URL
                          };
                          this.setState(prevState => ({
                            matches: _.uniqBy(
                              [...prevState.matches, matchJson],
                              "matchedUserId"
                            ),
                            loadingMatches: false
                          }));

                          // auto-refresh UI
                          this.setState(prevState => ({
                            heartedOnlyLikedOnly: _.remove(
                              prevState.heartedOnlyLikedOnly,
                              o => o.matchedUserId !== matchJson.matchedUserId
                            ),
                            loadingMatches: false
                          }));
                        }
                      } else {
                        this.setState({ loadingMatches: false });
                      }
                    });
                }
              }
            }
          });
        } else {
          console.log(`No matches found.`);
          this.setState({ loadingMatches: false });
        }
      });
  }

  getInteractions(uid) {
    firestore()
      .collection("interactions")
      .doc(uid)
      .onSnapshot(docSnapshot => {
        if (docSnapshot) {
          let userData = docSnapshot.data();
          this.setState({
            shownPool: userData && userData.shownPool ? userData.shownPool : [],
            dislikedPool:
              userData && userData.dislikedPool ? userData.dislikedPool : []
          });
          // auto-refresh UI.
          this.setState(prevState => ({
            heartedOnlyLikedOnly: _.remove(
              prevState.heartedOnlyLikedOnly,
              o => !this.state.shownPool.includes(o.matchedUserId)
            )
          }));
          this.getLikedBy(uid);
          this.getHeartedBy(uid);
        }
      });
  }

  getHeartedBy = uid => {
    firestore()
      .collection("interactions")
      .where("heartedPool", "array-contains", uid)
      .get()
      .then(querySnapshot => {
        if (!querySnapshot || querySnapshot.empty) {
          console.log("No one hearted us.");
          return;
        }
        querySnapshot.forEach(doc => {
          const heartedBy = doc.id;
          if (
            !this.state.shownPool.includes(heartedBy) &&
            !this.state.dislikedPool.includes(heartedBy)
          ) {
            //Get hearter's info
            firestore()
              .collection("users")
              .doc(heartedBy)
              .onSnapshot(userSnap => {
                if (userSnap) {
                  let userData = userSnap.data();
                  if (userData && userData.preferencesCompleted) {
                    let userPic = "";
                    if (userData.profilePicURL) {
                      userPic = userData.profilePicURL;
                    } else if (userData.googleProfilePicture) {
                      userPic = userData.googleProfilePicture;
                    } else if (userData.facebookProfilePicture) {
                      userPic = userData.facebookProfilePicture;
                    }
                    let matchJson = {
                      matchId: doc.id,
                      profilePicURL: userPic,
                      matchedUserId: heartedBy,
                      firstName: userData.firstName,
                      lastName: userData.lastName,
                      birthDay: userData.birthDay
                        ? userData.birthDay.toDate()
                        : "",
                      location: userData.location ? userData.location : "",
                      gender: userData.gender,
                      city: userData.city ? userData.city : "",
                      bio: userData.about ? userData.about.bio : "",
                      music: userData.about ? userData.about.music : [],
                      shows: userData.about ? userData.about.shows : [],
                      personalities: userData.about
                        ? userData.about.personalities
                        : [],
                      pic1URL: userData.pic1URL,
                      pic2URL: userData.pic2URL,
                      pic3URL: userData.pic3URL,
                      pic4URL: userData.pic4URL,
                      heartedOnly: true,
                      sortOrder: 1
                    };
                    this.setState(prevState => ({
                      heartedOnlyLikedOnly: _.orderBy(
                        _.filter(
                          _.uniqBy(
                            [...prevState.heartedOnlyLikedOnly, matchJson],
                            "matchedUserId"
                          ),
                          o => !_.includes(this.state.matches, o.matchedUserId)
                        ),
                        "sortOrder",
                        "asc"
                      )
                    }));
                  }
                }
              });
          }
        });
      })
      .catch(error => {
        console.log("Error getting heartedBy interactions: ", error);
      });
  };

  getLikedBy = uid => {
    firestore()
      .collection("interactions")
      .where("likedPool", "array-contains", uid)
      .get()
      .then(querySnapshot => {
        if (!querySnapshot || querySnapshot.empty) {
          console.log("No one liked with us.");
          return;
        }
        querySnapshot.forEach(doc => {
          const likedBy = doc.id;
          if (
            !this.state.shownPool.includes(likedBy) &&
            !this.state.dislikedPool.includes(likedBy)
          ) {
            //Get liker's info
            firestore()
              .collection("users")
              .doc(likedBy)
              .onSnapshot(userSnap => {
                if (userSnap) {
                  let userData = userSnap.data();
                  if (userData && userData.preferencesCompleted) {
                    let userPic = "";
                    if (userData.profilePicURL) {
                      userPic = userData.profilePicURL;
                    } else if (userData.googleProfilePicture) {
                      userPic = userData.googleProfilePicture;
                    } else if (userData.facebookProfilePicture) {
                      userPic = userData.facebookProfilePicture;
                    }
                    let matchJson = {
                      matchId: doc.id,
                      profilePicURL: userPic,
                      matchData: doc.data(),
                      matchedUserId: likedBy,
                      firstName: userData.firstName,
                      lastName: userData.lastName,
                      birthDay: userData.birthDay
                        ? userData.birthDay.toDate()
                        : "",
                      location: userData.location ? userData.location : "",
                      gender: userData.gender,
                      city: userData.city ? userData.city : "",
                      bio: userData.about ? userData.about.bio : "",
                      music: userData.about ? userData.about.music : [],
                      shows: userData.about ? userData.about.shows : [],
                      personalities: userData.about
                        ? userData.about.personalities
                        : [],
                      pic1URL: userData.pic1URL,
                      pic2URL: userData.pic2URL,
                      pic3URL: userData.pic3URL,
                      pic4URL: userData.pic4URL,
                      likedOnly: true,
                      sortOrder: 2
                    };
                    this.setState(prevState => ({
                      heartedOnlyLikedOnly: _.orderBy(
                        _.filter(
                          _.uniqBy(
                            [...prevState.heartedOnlyLikedOnly, matchJson],
                            "matchedUserId"
                          ),
                          o => !_.includes(this.state.matches, o.matchedUserId)
                        ),
                        "sortOrder",
                        "asc"
                      )
                    }));
                  }
                }
              });
          }
        });
      })
      .catch(error => {
        console.log("Error getting likedBy interactions: ", error);
      });
  };

  openMatch = item => {
    console.log("Open Match");
    this.props.navigation.navigate("OpenedMatch", { item: item });
  };

  openMatchOptions = item => {
    console.log("Match options");
    this.RBSheet.open();
    this.setState({ optionsOpenedMatch: item });
  };

  deleteMatchOption = () => {
    const { optionsOpenedMatch } = this.state;
    Alert.alert(
      "Are you sure you want to delete this match?",
      "It will be deleted from BOTH parties and it cannot be undone.",
      [
        {
          text: "Yes Delete",
          onPress: () => {
            console.log("Delete Match: ", optionsOpenedMatch.matchId);
            //Delete from Firestore
            this.RBSheet.close();
            firestore()
              .collection("matches")
              .doc(optionsOpenedMatch.matchId)
              .delete()
              .then(() => {
                console.log(
                  "Successfully Deleted Match: ",
                  optionsOpenedMatch.matchId
                );
                // auto-refresh matches UI on deletion
                this.setState(prevState => ({
                  matches: _.remove(
                    prevState.matches,
                    o => o.matchedUserId !== optionsOpenedMatch.matchedUserId
                  )
                }));
                Toast.show({
                  text1: "Deleted",
                  text2: "This match along its messages have been deleted!",
                  type: "success",
                  position: "top",
                  autoHide: true,
                  visibilityTime: 2000
                });
              })
              .catch(error => {
                console.log("Error Deleting Match: ", error.message);
                this.RBSheet.close();
                Toast.show({
                  text1: "Oops",
                  text2: "Error deleting match.",
                  type: "error",
                  position: "top",
                  autoHide: true,
                  visibilityTime: 2000
                });
              });
          },
          style: "destructive"
        },
        {
          text: "Cancel",
          onPress: () => {
            console.log("Cancel Deletion");
            this.RBSheet.close();
          },
          style: "cancel"
        }
      ]
    );
  };

  openUserCard = item => {
    console.log("Open UserCard for: ", item.firstName);
    //this.props.updateWallet(auth().currentUser.uid, "DECREMENT", "LIKES", 1);
    this.props.updateWallet2(auth().currentUser.uid, "LIKES", -1, []);
    let userJson = {
      uid: item.matchedUserId,
      firstName: item.firstName,
      location: item.location,
      city: item.city,
      gender: item.gender,
      birthDay: item.birthDay,
      bio: item.bio,
      music: item.music,
      shows: item.shows,
      personalities: item.personalities,
      pic1URL: item.pic1URL,
      pic2URL: item.pic2URL,
      pic3URL: item.pic3URL,
      pic4URL: item.pic4URL
    };
    this.setState({ userCardData: [userJson] });
  };

  openMatchedUserCard = item => {
    console.log("Open UserCard for: ", item.firstName);
    let userJson = {
      uid: item.matchedUserId,
      firstName: item.firstName,
      location: item.location,
      gender: item.gender,
      city: item.city,
      birthDay: item.birthDay,
      bio: item.bio,
      music: item.music,
      shows: item.shows,
      personalities: item.personalities,
      pic1URL: item.pic1URL,
      pic2URL: item.pic2URL,
      pic3URL: item.pic3URL,
      pic4URL: item.pic4URL
    };
    this.setState({ matchedUserCardData: [userJson] });
  };

  doneReadingCard = () => {
    console.log("Done reading card in matches feed");
    this.setState({
      userCardData: [],
      matchedUserCardData: []
    });
  };

  renderHeartAvatar = item => {
    return (
      <TouchableOpacity
        style={styles.heartedContainer}
        onPress={() => {
          this.openUserCard(item);
        }}
      >
        {item.profilePicURL && (
          <View style={styles.heartAvatarBorder}>
            <Image
              style={styles.heartAvatar}
              blurRadius={0}
              source={{
                uri: item.profilePicURL,
                priority: FastImage.priority.high
              }}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>
        )}
        <Text style={styles.heartUsername} numberOfLines={1}>
          {item.firstName ? item.firstName : "_"}
        </Text>
      </TouchableOpacity>
    );
  };

  checkIfPreferenceMatch(myPreferences, otherUser) {
    console.log(myPreferences);
    console.log(otherUser);
    let otherUserAge = moment().diff(otherUser.birthDay, "years", false);
    if (
      otherUserAge >= myPreferences.minAgePreference &&
      otherUserAge <= myPreferences.maxAgePreference &&
      (myPreferences.locationPreference.includes("ANY") ||
        myPreferences.locationPreference.includes(otherUser.location)) &&
      myPreferences.genderPreference === otherUser.gender
    ) {
      return true;
    }
    return false;
  }

  checkUnlock(item) {
    let doesPreferenceMatch = this.checkIfPreferenceMatch(
      this.state.preferences,
      item
    );

    if (this.props.wallet.likesCount > 0) {
      console.log("💰 User has enough money");
      let unlockMessage = "User matches your preferences. Ready to unlock? 😁";
      let unlockButton = "Yes Unlock";
      if (!doesPreferenceMatch) {
        unlockMessage = "User does NOT match your preferences. Unlock?";
        unlockButton = "Yes Unlock";
      }

      Alert.alert(
        unlockMessage,
        `You have ${this.props.wallet.likesCount} Likes left in your wallet.`,
        [
          {
            text: unlockButton,
            onPress: () => {
              console.log("Unlock Avatar");
              //Unlock
              this.openUserCard(item);
            },
            style: "default"
          },
          {
            text: "Cancel",
            onPress: () => {
              console.log("Cancel Unlock");
            },
            style: "cancel"
          }
        ]
      );
    } else {
      console.log("💰 User does not have enough money");
      this.props.updateWalletMessage(`Refill your wallet to see who liked you`);
      this.props.toggleWallet(true);
    }
  }

  renderBlurredLikeAvatar = item => {
    return (
      <TouchableOpacity
        style={styles.heartedContainer}
        onPress={() => this.checkUnlock(item)}
      >
        {item.profilePicURL && (
          <View style={styles.likeAvatarBorder}>
            <Image
              style={styles.likeAvatar}
              blurRadius={10}
              source={{
                uri: item.profilePicURL,
                priority: FastImage.priority.high
              }}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  render() {
    const {
      matches,
      loadingMatches,
      userCardData,
      matchedUserCardData,
      heartedOnlyLikedOnly
    } = this.state;
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
            <Text style={styles.appBarTitle}>Matches</Text>
          </View>
        </SafeAreaView>
        {this.props.match && (
          <MatchPopup
            matchData={this.state.currentMatch}
            onReturnPress={() => this.setState({ currentMatch: null })}
          />
        )}
        <View style={styles.container} navigation={this.props.navigation}>
          <RBSheet
            ref={ref => {
              this.RBSheet = ref;
            }}
            closeOnDragDown={true}
            height={200}
            duration={250}
            customStyles={{
              container: {
                borderTopLeftRadius: 25,
                borderTopRightRadius: 25
              }
            }}
          >
            <View style={styles.optionBtnsContainer}>
              <TouchableOpacity
                onPress={() => this.deleteMatchOption()}
                style={styles.deleteChip}
              >
                <Text style={styles.deleteChipTitle}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => this.RBSheet.close()}
                style={styles.closeChip}
              >
                <Text>Close</Text>
              </TouchableOpacity>
            </View>
          </RBSheet>
          {this.props.openWallet && <InAppPurchasePopup key="inApp" />}
          {heartedOnlyLikedOnly && heartedOnlyLikedOnly.length > 0 ? (
            <View style={styles.heartedByContainer}>
              <Text style={styles.heartsTitleText}>
                You were Hearted and Liked by
              </Text>
              <View style={styles.heartedFlatListContainer}>
                <FlatList
                  showsHorizontalScrollIndicator={false}
                  horizontal={true}
                  keyExtractor={item => item.matchId}
                  style={styles.heartedFlatList}
                  data={_.filter(heartedOnlyLikedOnly)}
                  renderItem={({ item, index }) => {
                    if (item.heartedOnly) {
                      return this.renderHeartAvatar(item);
                    } else {
                      return this.renderBlurredLikeAvatar(item);
                    }
                  }}
                />
              </View>
              <Divider />
            </View>
          ) : (
            <View />
          )}
          {matches && matches.length > 0 ? (
            <View style={styles.yourMatchesContainer}>
              <Text style={styles.matchesTitleText}>Your Matches</Text>
              <SafeAreaConsumer>
                {insets => (
                  <FlatList
                    keyExtractor={item => item.matchId}
                    showsVerticalScrollIndicator={false}
                    style={[
                      styles.flatList,
                      { marginBottom: insets.bottom + 65 }
                    ]}
                    data={matches}
                    onRefresh={() => this.onRefresh()}
                    refreshing={this.state.isFetching}
                    renderItem={({ item }) => {
                      let searchLocation = "";
                      if (item.location && item.city) {
                        let locationID = item.location.slice(0, 2);
                        searchLocation = `${countries[locationID].emoji} ${
                          item.city
                        }`;
                      }
                      let matchFullName = item.firstName + " " + item.lastName;
                      return (
                        <List.Item
                          title={matchFullName}
                          titleStyle={styles.matchTitle}
                          description={() => (
                            <View style={styles.locationContainer}>
                              <Icon
                                name="pin-outline"
                                width={14}
                                height={14}
                                fill={JebenaColors.grayText()}
                                style={styles.matchPin}
                              />
                              <Text style={styles.matchDescription}>
                                {searchLocation}
                              </Text>
                            </View>
                          )}
                          style={styles.matchContainer}
                          left={() => (
                            <TouchableOpacity
                              onPress={() => {
                                this.openMatchedUserCard(item);
                              }}
                            >
                              <FastImage
                                style={styles.matchAvatar}
                                source={{
                                  uri: item.profilePicURL,
                                  priority: FastImage.priority.normal
                                }}
                                resizeMode={FastImage.resizeMode.cover}
                              />
                            </TouchableOpacity>
                          )}
                          right={() => (
                            <SimpleIcons
                              name="options-vertical"
                              size={20}
                              style={styles.matchOptions}
                              onPress={() => this.openMatchOptions(item)}
                            />
                          )}
                          onPress={() => this.openMatch(item)}
                        />
                      );
                    }}
                  />
                )}
              </SafeAreaConsumer>
            </View>
          ) : (
            [
              loadingMatches ? (
                <View style={styles.loaderStyle} key="loaderKey">
                  <ActivityIndicator
                    size="large"
                    color={JebenaColors.primaryColor()}
                  />
                </View>
              ) : (
                <View style={styles.noMatchesContainer} key="noMatches">
                  <FastImage
                    style={styles.noMatchesImage}
                    source={require("../screens/assets/no_messages_rounded.png")}
                    resizeMode="cover"
                  />
                  <Text style={styles.noMatchesMessage}>
                    {`Keep Liking!\nYour matches will show here`}
                  </Text>
                </View>
              )
            ]
          )}
        </View>
        {userCardData && userCardData.length > 0 && (
          <SafeAreaView style={styles.userCardPopupBg}>
            <View style={styles.userCardPopup}>
              <UserCard
                feedUsers={this.state.userCardData}
                doneReading={this.doneReadingCard.bind(this)}
                showDislikeButton={true}
                showHeartButton={false}
                showLikeButton={true}
                showReturnButton={false}
              />
            </View>
            <Toast ref={ref => Toast.setRef(ref)} />
          </SafeAreaView>
        )}
        {matchedUserCardData && matchedUserCardData.length > 0 && (
          <SafeAreaView style={styles.userCardPopupBg}>
            <View style={styles.userCardPopup}>
              <UserCard
                feedUsers={this.state.matchedUserCardData}
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
    backgroundColor: JebenaColors.lightBlueBg()
  },
  appBar: {
    backgroundColor: "#C60000",
    height: 60,
    width: SCREEN_WIDTH,
    borderBottomLeftRadius: SCREEN_WIDTH,
    borderBottomRightRadius: SCREEN_WIDTH,
    justifyContent: "center",
    top: 0,
    alignSelf: "center"
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
    flex: 1,
    alignItems: "center"
  },
  yourMatchesContainer: {
    //backgroundColor: "pink",
    flex: 1,
    width: SCREEN_WIDTH,
    paddingHorizontal: 20
  },
  loaderStyle: {
    marginTop: 100
  },
  matchContainer: {
    marginTop: 10,
    backgroundColor: "white",
    borderRadius: 35
  },
  matchOptions: {
    position: "relative",
    color: "lightgray",
    alignSelf: "center"
  },
  matchTitle: {
    left: 5,
    fontSize: 18
  },
  locationContainer: {
    flexDirection: "row",
    marginTop: 2,
    alignItems: "center"
  },
  matchPin: {
    left: 5
  },
  matchDescription: {
    left: 10,
    color: JebenaColors.grayText()
  },
  matchAvatar: {
    backgroundColor: "gray",
    left: 0,
    width: 60,
    height: 60,
    borderRadius: 30
  },
  matchesTitleText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700"
  },
  heartsTitleText: {
    marginTop: 10,
    marginLeft: 20,
    fontSize: 14,
    fontWeight: "700"
  },
  optionBtnsContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: "center"
  },
  deleteChip: {
    width: SCREEN_WIDTH * 0.7,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: JebenaColors.primaryColor()
  },
  deleteChipTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white"
  },
  closeChip: {
    width: SCREEN_WIDTH * 0.7,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: JebenaColors.lightBlueBg2()
  },
  flatList: {
    //backgroundColor: "orange"
  },
  heartedFlatList: {
    marginTop: 5,
    flexDirection: "row",
    width: SCREEN_WIDTH
  },
  heartedByContainer: {
    width: SCREEN_WIDTH
  },
  heartedFlatListContainer: {
    marginTop: 5,
    paddingBottom: 10
  },
  heartAvatarBorder: {
    width: SCREEN_WIDTH / 6,
    height: SCREEN_WIDTH / 6,
    borderRadius: SCREEN_WIDTH / 12,
    borderWidth: 2,
    borderColor: JebenaColors.primaryColor(),
    justifyContent: "center",
    alignItems: "center"
  },
  heartAvatar: {
    width: SCREEN_WIDTH / 6.75,
    height: SCREEN_WIDTH / 6.75,
    borderRadius: SCREEN_WIDTH / 13
  },
  likeAvatarBorder: {
    width: SCREEN_WIDTH / 6,
    height: SCREEN_WIDTH / 6,
    borderRadius: SCREEN_WIDTH / 12,
    borderWidth: 2,
    borderColor: JebenaColors.skyBlue(),
    justifyContent: "center",
    alignItems: "center"
  },
  likeAvatar: {
    width: SCREEN_WIDTH / 6.75,
    height: SCREEN_WIDTH / 6.75,
    borderRadius: SCREEN_WIDTH / 13
  },
  heartUsername: {
    marginTop: 5,
    fontSize: 14,
    textAlign: "center"
  },
  heartedContainer: {
    alignItems: "center",
    //backgroundColor: "gray",
    justifyContent: "flex-start",
    width: SCREEN_WIDTH / 4
  },
  noMatchesContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: SCREEN_WIDTH / 4
  },
  noMatchesImage: {
    width: SCREEN_WIDTH - 100,
    height: SCREEN_WIDTH - 100
  },
  noMatchesMessage: {
    marginTop: 15,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 18,
    color: "gray"
  },
  userCardPopup: {
    marginTop: SCREEN_WIDTH * 0.085
  },
  userCardPopupBg: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.4)"
  }
};

function mapStateToProps(state) {
  return {
    wallet: state.walletReducer.wallet,
    openWallet: state.walletReducer.openWallet,
    matchesArray: state.utilReducer.matchesArray,
    match: state.utilReducer.match,
    blockedUsers: state.utilReducer.blockedUsers
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateWalletMessage: message =>
      dispatch(WalletActions.updateWalletMessage(message)),
    toggleWallet: openWallet =>
      dispatch(WalletActions.toggleWallet(openWallet)),
    getWalletInfo: uid => dispatch(WalletActions.getWalletInfo(uid)),
    updateWallet: (uid, updateType, featureType, amount, transactionData) =>
      dispatch(
        WalletActions.updateWallet(
          uid,
          updateType,
          featureType,
          amount,
          transactionData
        )
      ),
    updateWallet2: (uid, featureType, amount, transactionData) =>
      dispatch(
        WalletActions.updateWallet2(uid, featureType, amount, transactionData)
      ),
    updateMatchesArray: matches =>
      dispatch(UtilActions.updateMatchesArray(matches)),
    updateBlockedUsers: uid => dispatch(UtilActions.updateBlockedUsers(uid))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MatchesScreen);
