import React from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TouchableHighlight,
  Dimensions,
  ScrollView,
  Alert,
  FlatList,
  ActivityIndicator
} from "react-native";
import { connect } from "react-redux";
import * as WalletActions from "../../actions/WalletActions";
import * as UtilActions from "../../actions/UtilActions";
import RBSheet from "react-native-raw-bottom-sheet";
import Feather from "react-native-vector-icons/Feather";
import Awesome from "react-native-vector-icons/FontAwesome";
import FastImage from "react-native-fast-image";
import { createImageProgress } from "react-native-image-progress";
import ProgressPie from "react-native-progress/Pie";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import CardStack, { Card } from "react-native-card-stack-swiper";
import Swiper from "react-native-swiper";
import { Chip } from "react-native-paper";
import firebase from "@react-native-firebase/app";
import moment from "moment";
import Toast from "react-native-toast-message";
import { Icon } from "react-native-eva-icons";
import * as JebenaColors from "../../utils/colors";
import * as JebenaFunctions from "../../utils/functions";
import "@react-native-firebase/functions";
import InAppPurchasePopup from "../InAppPurchasePopup";
import { countries, continents } from "countries-list";
import { SafeAreaConsumer } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

const Image = createImageProgress(FastImage);

class UserCard extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    moreOptionsUserId: "",
    heartUser: false,
    currentMatch: null,
    showReportPrompt: false
  };

  componentDidMount() {
    //Get Users
    console.log("User Card Mounted");
    this.props.getWalletInfo(auth().currentUser.uid);
  }

  openMoreOptions(user) {
    console.log("More user options");
    this.setState({ moreOptionsUserId: user.uid });
    const { uid } = auth().currentUser;
    firestore()
      .collection("interactions")
      .doc(uid)
      .onSnapshot(userSnap => {
        if (userSnap) {
          let userData = userSnap.data();
          if (userData && userData.blockedPool) {
            if (userData.blockedPool.includes(user.uid)) {
              console.log("🚫 Aleady blocked: ", user.uid);
              this.props.toggleBlock(true);
            } else {
              console.log("🚫 Has not been blocked: ", user.uid);
              this.setState({ alreadyBlocked: false });
              this.props.toggleBlock(false);
            }
          }
        }
      });
    this.RBSheet.open();
  }

  openBio(user) {
    console.log("Open Bio");
    this.BioSheet.open();
  }

  blockUserOption() {
    const { moreOptionsUserId } = this.state;
    console.log("Block: ", moreOptionsUserId);
    firebase.functions().httpsCallable("performTask")({
      taskType: "blockUser",
      taskParams: {
        uid: auth().currentUser.uid,
        otherUid: moreOptionsUserId
      }
    });
    this.props.updateBlockedUsers(auth().currentUser.uid);
    this.RBSheet.close();
    this.swiper.swipeLeft();
    this.props.doneReading();
  }

  unblockUserOption() {
    const { moreOptionsUserId } = this.state;
    const { uid } = auth().currentUser;
    console.log("Unblock: ", moreOptionsUserId);
    firestore()
      .collection("interactions")
      .doc(uid)
      .set(
        {
          blockedPool: firebase.firestore.FieldValue.arrayRemove(
            moreOptionsUserId
          )
        },
        { merge: true }
      )
      .then(() => {
        this.props.updateBlockedUsers(uid);
        this.RBSheet.close();
        this.props.doneReading();
      })
      .catch(error => {
        Toast.show({
          text1: "Sorry 😩",
          text2: "Error saving your report.",
          type: "error",
          position: "top",
          autoHide: true,
          visibilityTime: 2000
        });
        console.log("Error saving report info firestore: ", error.message);
      });
  }

  reportUserOption() {
    const { moreOptionsUserId } = this.state;
    console.log("Report: ", moreOptionsUserId);
    //As for details
    Alert.prompt("Tell us more", "", [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Report",
        style: "destructive",
        onPress: reportComment => {
          console.log("Report Text: " + reportComment);
          //Add to reportedPool and send Slack Alert
          firebase.functions().httpsCallable("performTask")({
            taskType: "reportUser",
            taskParams: {
              uid: auth().currentUser.uid,
              otherUid: moreOptionsUserId,
              comment: reportComment
            }
          });
          //Save to reports collection
          let reportJson = {
            reporter: auth().currentUser.uid,
            createdAt: new Date(),
            comment: reportComment
          };
          firestore()
            .collection("reports")
            .doc(moreOptionsUserId)
            .set(
              {
                reporters: firebase.firestore.FieldValue.arrayUnion(reportJson)
              },
              { merge: true }
            )
            .then(() => {
              this.RBSheet.close();
              Toast.show({
                text1: "Reported",
                text2: "Thanks for your help!",
                type: "success",
                position: "top",
                autoHide: true,
                visibilityTime: 2000
              });
            })
            .catch(error => {
              Toast.show({
                text1: "Sorry 😩",
                text2: "Error saving your report.",
                type: "error",
                position: "top",
                autoHide: true,
                visibilityTime: 2000
              });
              console.log(
                "Error saving report info firestore: ",
                error.message
              );
            });
        }
      }
    ]);
  }

  renderUserPhotos(picURLs) {
    return picURLs.map((picURL, index) => {
      return (
        <Image
          key={index}
          source={{
            uri: picURL,
            priority: FastImage.priority.high
          }}
          resizeMode={FastImage.resizeMode.cover}
          indicator={ProgressPie}
          indicatorProps={{
            size: 50,
            borderWidth: 0,
            color: "rgba(255, 255, 255, 0.2)",
            unfilledColor: "rgba(255, 255, 255, 0.1)"
          }}
          imageStyle={styles.card}
          style={styles.card}
        />
      );
    });
  }

  showMoreOptionsMenu() {
    return (
      <View>
        {this.props.alreadyBlocked === true ? (
          <TouchableOpacity
            onPress={() => this.unblockUserOption()}
            style={styles.reportChip}
          >
            <Text style={styles.reportChipTitle}>Unblock</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => this.blockUserOption()}
            style={styles.reportChip}
          >
            <Text style={styles.reportChipTitle}>Block</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => this.reportUserOption()}
          style={styles.reportChip}
        >
          <Text style={styles.reportChipTitle}>Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => this.RBSheet.close()}
          style={styles.closeChip}
        >
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  swipableRender() {
    return this.props.feedUsers.map(item => {
      let picURLs = [];
      if (item.pic1URL) {
        picURLs.push(item.pic1URL);
        FastImage.preload([{ uri: item.pic1URL }]);
      }
      if (item.pic2URL) {
        picURLs.push(item.pic2URL);
        FastImage.preload([{ uri: item.pic2URL }]);
      }
      if (item.pic3URL) {
        picURLs.push(item.pic3URL);
        FastImage.preload([{ uri: item.pic3URL }]);
      }
      if (item.pic4URL) {
        picURLs.push(item.pic4URL);
        FastImage.preload([{ uri: item.pic4URL }]);
      }
      let searchLocation = "";
      if (item.location && item.city) {
        let locationID = item.location.slice(0, 2);
        searchLocation = `${countries[locationID].emoji} ${item.city}`;
      }

      return (
        <View key={item.uid} style={{ alignItems: "center" }}>
          <Card style={styles.card}>
            <Swiper
              horizontal={true}
              activeDotColor="white"
              dotColor={JebenaColors.grayText()}
            >
              {this.renderUserPhotos(picURLs)}
            </Swiper>
            <RBSheet
              ref={ref => {
                this.BioSheet = ref;
              }}
              height={300}
              duration={300}
              customStyles={{
                container: {
                  borderRadius: 20,
                  width: SCREEN_WIDTH * 0.8,
                  marginBottom: SCREEN_HEIGHT / 4.2,
                  alignSelf: "center"
                }
              }}
            >
              <View>
                <TouchableOpacity
                  style={styles.bioContainerOpened}
                  onPress={() => this.BioSheet.close()}
                >
                  <View>
                    <Text style={styles.nameAndAgeText}>
                      {item.firstName ? item.firstName : ""},{" "}
                      {item.birthDay
                        ? moment().diff(item.birthDay, "years", false)
                        : ""}
                    </Text>
                    <View style={styles.locationContainer}>
                      <Icon
                        name="pin-outline"
                        width={14}
                        height={14}
                        fill={JebenaColors.grayText()}
                      />
                      <Text style={styles.locationText}>{searchLocation}</Text>
                    </View>
                  </View>
                  <View style={styles.bioBtnsContainerOpened}>
                    <Icon
                      name="arrow-ios-downward-outline"
                      width={25}
                      height={25}
                      fill={JebenaColors.primaryColor()}
                      styles={styles.moreOptionsBtn}
                      onPress={() => this.BioSheet.close()}
                    />
                  </View>
                </TouchableOpacity>
                <ScrollView
                  style={styles.bioTextContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Bio */}
                  {item && item.bio && (
                    <View style={styles.sectionContainer}>
                      <View style={styles.iconTextContainer}>
                        <Icon
                          name="edit-outline"
                          width={16}
                          height={16}
                          fill={JebenaColors.grayText()}
                        />
                        <Text style={styles.bioTextLabel}>Bio</Text>
                      </View>
                      <Text style={styles.bioText}>{item.bio}</Text>
                    </View>
                  )}
                  {/* Music */}
                  {item.music && item.music.length > 0 && (
                    <View style={styles.sectionContainer}>
                      <View style={styles.iconTextContainer}>
                        <Icon
                          name="music-outline"
                          width={16}
                          height={16}
                          fill={JebenaColors.grayText()}
                        />
                        <Text style={styles.bioTextLabel}>Music</Text>
                      </View>
                      <FlatList
                        keyExtractor={i => i.index}
                        showsHorizontalScrollIndicator={false}
                        style={styles.bioFlatList}
                        data={item.music}
                        numColumns={2}
                        renderItem={({ musicItem, index }) => {
                          return (
                            <Chip style={styles.bioChip}>
                              <Text style={styles.bioChipText}>
                                {item.music && item.music[index]
                                  ? item.music[index]
                                  : ""}
                              </Text>
                            </Chip>
                          );
                        }}
                      />
                    </View>
                  )}
                  {/* Movies/Shows */}
                  {item.shows && item.shows.length > 0 && (
                    <View style={styles.sectionContainer}>
                      <View style={styles.iconTextContainer}>
                        <Icon
                          name="tv-outline"
                          width={16}
                          height={16}
                          fill={JebenaColors.grayText()}
                        />
                        <Text style={styles.bioTextLabel}>
                          Movies and Shows
                        </Text>
                      </View>
                      <FlatList
                        keyExtractor={i => i.index}
                        showsHorizontalScrollIndicator={false}
                        style={styles.bioFlatList}
                        data={item.shows}
                        numColumns={2}
                        renderItem={({ showItem, index }) => {
                          return (
                            <Chip style={styles.bioChip}>
                              <Text style={styles.bioChipText}>
                                {item.shows && item.shows[index]
                                  ? item.shows[index]
                                  : ""}
                              </Text>
                            </Chip>
                          );
                        }}
                      />
                    </View>
                  )}
                  {/* Personalities */}
                  {item.personalities && item.personalities.length > 0 && (
                    <View style={styles.sectionContainer}>
                      <View style={styles.iconTextContainer}>
                        <Icon
                          name="person-outline"
                          width={16}
                          height={16}
                          fill={JebenaColors.grayText()}
                        />
                        <Text style={styles.bioTextLabel}>Personality</Text>
                      </View>
                      <FlatList
                        keyExtractor={i => i.index}
                        style={styles.bioFlatList}
                        data={item.personalities}
                        numColumns={2}
                        renderItem={({ personalityItem, index }) => {
                          let searchPersonality = "";
                          if (item.personalities) {
                            searchPersonality = JebenaFunctions.getPersonalitiesList()[0].children.find(
                              x => x.id === item.personalities[index]
                            );
                          }
                          return (
                            <Chip style={styles.bioChip}>
                              <Text>
                                {searchPersonality && searchPersonality.name
                                  ? searchPersonality.name
                                  : ""}
                              </Text>
                            </Chip>
                          );
                        }}
                      />
                    </View>
                  )}
                </ScrollView>
              </View>
            </RBSheet>
          </Card>
          <TouchableOpacity
            style={styles.bioContainer}
            onPress={() => this.openBio(item)}
          >
            <View>
              <Text style={styles.nameAndAgeText}>
                {item.firstName ? item.firstName : ""},{" "}
                {item.birthDay
                  ? moment().diff(item.birthDay, "years", false)
                  : ""}
              </Text>
              <View style={styles.locationContainer}>
                <Icon
                  name="pin-outline"
                  width={14}
                  height={14}
                  fill={JebenaColors.grayText()}
                />
                <Text style={styles.locationText}>{searchLocation}</Text>
              </View>
            </View>
            <View style={styles.bioBtnsContainer}>
              <Icon
                name="arrow-ios-upward-outline"
                width={25}
                height={25}
                fill={JebenaColors.primaryColor()}
                styles={styles.moreOptionsBtn}
              />
              <Icon
                name="more-vertical-outline"
                width={25}
                height={25}
                fill={JebenaColors.grayBorder()}
                styles={styles.moreOptionsBtn}
                onPress={() => this.openMoreOptions(item)}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.buttonsContainer}>
            {this.props.showDislikeButton && (
              <TouchableHighlight
                style={styles.buttonContainer}
                underlayColor={JebenaColors.lightBlueBg()}
                onPress={() => this.swiper.swipeLeft()}
              >
                <Icon
                  name="close-outline"
                  width={30}
                  height={30}
                  fill={JebenaColors.grayText()}
                />
              </TouchableHighlight>
            )}
            {this.props.showHeartButton && (
              <TouchableHighlight
                style={styles.buttonContainerHeart}
                underlayColor={JebenaColors.lightBlueBg()}
                onPress={() => {
                  this.setState({ heartUser: true });
                  this.handleHeartSwipe(item);
                }}
              >
                {/* <Awesome name="lemon-o" size={45} color="#4cd137" /> */}
                <Icon
                  name="heart-outline"
                  width={40}
                  height={40}
                  fill={JebenaColors.primaryColor()}
                />
              </TouchableHighlight>
            )}
            {this.props.showReturnButton && (
              <TouchableOpacity
                style={styles.returnBtn}
                underlayColor={JebenaColors.lightBlueBg()}
                onPress={() => {
                  this.props.doneReading();
                }}
              >
                <Icon
                  name="close-outline"
                  width={40}
                  height={40}
                  fill="white"
                />
                <Text style={styles.returnText}>Return</Text>
              </TouchableOpacity>
            )}
            {this.props.showLikeButton && (
              <TouchableHighlight
                style={styles.buttonContainer}
                underlayColor={JebenaColors.lightBlueBg()}
                onPress={() => this.swiper.swipeRight()}
              >
                <Feather
                  name="thumbs-up"
                  size={25}
                  color={JebenaColors.skyBlue()}
                />
              </TouchableHighlight>
            )}
          </View>
          <SafeAreaConsumer>
            {insets => (
              <RBSheet
                ref={ref => {
                  this.RBSheet = ref;
                }}
                height={230 + insets.bottom}
                duration={250}
                closeOnDragDown={true}
                customStyles={{
                  container: {
                    borderTopLeftRadius: 25,
                    borderTopRightRadius: 25
                  }
                }}
              >
                <View style={styles.optionBtnsContainer}>
                  {this.showMoreOptionsMenu()}
                </View>
              </RBSheet>
            )}
          </SafeAreaConsumer>
        </View>
      );
    });
  }

  handleLeftSwipe(user) {
    console.log("Swiped Left");
    console.log(user);

    firebase.functions().httpsCallable("performTask")({
      taskType: "dislikeUser",
      taskParams: {
        uid: auth().currentUser.uid,
        otherUid: user.uid
      }
    });

    if (this.props.feedUsers && this.props.feedUsers.length === 1) {
      this.props.doneReading();
    }
  }

  async handleHeartSwipe(user) {
    console.log("Hearted? ", user);
    const { uid } = auth().currentUser;
    if (
      this.props.wallet &&
      this.props.wallet.heartsCount &&
      this.props.wallet.heartsCount > 0
    ) {
      console.log("💰 User has enough money");
      Alert.alert(
        "Heart this user?",
        `You have ${this.props.wallet.heartsCount} Hearts left in your wallet.`,
        [
          {
            text: "Yes Heart 😍",
            onPress: async () => {
              console.log("Heart User");
              //Heart
              console.log("Update wallet...");
              //this.props.updateWallet(uid, "DECREMENT", "HEARTS", 1);
              this.props.updateWallet2(uid, "HEARTS", -1, []);
              this.swiper.swipeTop();
              let cloudFunction = firebase
                .functions()
                .httpsCallable("performTask");

              cloudFunction({
                taskType: "heartUser",
                taskParams: {
                  uid: uid,
                  otherUid: user.uid
                }
              }).then(res => {
                if (res.data.message && res.data.message === "MATCH") {
                  //Pass match data
                  let matchJson = {
                    matchId: res.data.matchId,
                    profilePicURL: user.profilePicURL,
                    matchData: null,
                    matchedUserId: user.uid,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    birthDay: null,
                    location: user.location,
                    bio: user.about ? user.about.bio : "",
                    music: user.about ? user.about.music : [],
                    shows: user.about ? user.about.shows : [],
                    personalities: user.about ? user.about.personalities : []
                  };
                  //Push to redux
                  console.log(`Found match with_ ${user.uid}`);
                  this.props.updateMatch(matchJson);
                }
              });
              if (this.props.feedUsers && this.props.feedUsers.length === 1) {
                this.props.doneReading();
              }
            },
            style: "default"
          },
          {
            text: "Cancel",
            onPress: () => {
              console.log("Cancel Heart");
            },
            style: "cancel"
          }
        ]
      );
    } else {
      console.log("💰 User doesn't have enough money");
      this.props.updateWalletMessage(`Get matched faster with premium`);
      this.props.toggleWallet(true);
    }
    this.setState({ heartUser: false });
  }

  async handleRightSwipe(user) {
    console.log("Swiped Right", user);
    if (!this.state.heartUser) {
      console.log("___Like Type");
      if (this.props.feedUsers && this.props.feedUsers.length === 1) {
        this.props.doneReading();
      }
      let cloudFunction = firebase.functions().httpsCallable("performTask");
      cloudFunction({
        taskType: "likeUser",
        taskParams: {
          uid: auth().currentUser.uid,
          otherUid: user.uid
        }
      }).then(res => {
        if (res.data.message && res.data.message === "MATCH") {
          //Pass match data
          let matchJson = {
            matchId: res.data.matchId,
            profilePicURL: user.profilePicURL,
            matchData: null,
            matchedUserId: user.uid,
            firstName: user.firstName,
            lastName: user.lastName,
            birthDay: null,
            location: user.location,
            bio: user.about ? user.about.bio : "",
            music: user.about ? user.about.music : [],
            shows: user.about ? user.about.shows : [],
            personalities: user.about ? user.about.personalities : []
          };
          //Push to redux
          console.log(`Found match with_ ${user.uid}`);
          this.props.updateMatch(matchJson);
        }
      });
    }
  }

  noMoreSwipes = () => {
    return (
      <View style={styles.noMoreSwipesContainer}>
        <Text style={styles.noMoreSwipesMessage}>
          {this.props.feedUsers.length > 1
            ? `Done for today.\nCheck back tomorrow.\n😁`
            : ""}
        </Text>
      </View>
    );
  };

  render() {
    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.main}>
          <CardStack
            key={this.props.feedUsers.length}
            style={styles.cardStack}
            renderNoMoreCards={() => this.noMoreSwipes()}
            ref={swiper => {
              this.swiper = swiper;
            }}
            duration={300}
            secondCardZoom={1}
            verticalSwipe={true}
            horizontalSwipe={true}
            onSwipedLeft={item =>
              this.handleLeftSwipe(this.props.feedUsers[item])
            }
            onSwipedRight={item =>
              this.handleRightSwipe(this.props.feedUsers[item])
            }
          >
            {this.swipableRender()}
          </CardStack>
        </View>
        {this.props.openWallet && <InAppPurchasePopup key="inApp" />}
      </ScrollView>
    );
  }
}

const styles = {
  scrollView: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH
  },
  main: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    alignItems: "center"
    //backgroundColor: "pink"
  },
  cardStack: {
    height: SCREEN_HEIGHT * 0.62,
    width: SCREEN_WIDTH * 0.9,
    alignItems: "center",
    //backgroundColor: "green",
    marginTop: 10
  },
  card: {
    backgroundColor: JebenaColors.primaryColor(),
    height: SCREEN_HEIGHT * 0.62,
    width: SCREEN_WIDTH * 0.9,
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: 25
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    //backgroundColor: "teal",
    marginTop: SCREEN_HEIGHT * 0.015,
    width: SCREEN_WIDTH * 0.7
  },
  buttonContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white"
  },
  buttonContainerHeart: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    height: 70,
    borderRadius: 38,
    backgroundColor: "white"
  },
  returnBtn: { alignItems: "center" },
  returnText: { color: "white", fontSize: 20 },
  moreOptionsBtn: {
    position: "absolute",
    marginTop: 10,
    marginLeft: 40,
    backgroundColor: "green"
  },
  optionBtnsContainer: {
    marginTop: 15,
    marginBottom: 20,
    alignItems: "center"
  },
  reportChip: {
    width: SCREEN_WIDTH * 0.7,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: JebenaColors.primaryColor()
  },
  reportChipTitle: {
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
    marginBottom: 10,
    backgroundColor: JebenaColors.lightBlueBg2()
  },
  bioContainer: {
    //position: "absolute",
    backgroundColor: "white",
    width: SCREEN_WIDTH * 0.8,
    marginTop: -25,
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 15,
    paddingRight: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  bioContainerOpened: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingLeft: 15,
    paddingRight: 20
  },
  bioBtnsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: SCREEN_WIDTH / 5
  },
  bioBtnsContainerOpened: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: SCREEN_WIDTH / 5
  },
  bioAccordion: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    bottom: -15,
    //backgroundColor: "green",
    width: SCREEN_WIDTH * 0.8,
    borderRadius: 35
  },
  bioTextContainer: {
    paddingHorizontal: 15,
    marginBottom: 60
  },
  bioText: {
    marginTop: 2,
    marginBottom: 5,
    paddingHorizontal: 5
  },
  bioChip: {
    backgroundColor: JebenaColors.lightBlueBg(),
    justifyContent: "center",
    height: 30,
    marginTop: 8,
    marginRight: 8
  },
  bioChipText: {
    fontSize: 14
  },
  bioFlatList: {
    marginBottom: 10
  },
  bioTextLabel: {
    marginTop: 2,
    marginLeft: 4,
    color: JebenaColors.grayText()
  },
  locationText: {
    fontSize: 14,
    color: JebenaColors.grayText(),
    marginLeft: 4
  },
  sectionContainer: {
    marginTop: 5,
    flexDirection: "column",
    alignItems: "flex-start"
  },
  iconTextContainer: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 5
  },
  locationContainer: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 4
  },
  nameAndAgeText: {
    fontSize: 18,
    fontWeight: "600"
  },
  noMoreSwipesContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
  },
  noMoreSwipesMessage: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 18,
    color: "gray"
  }
};

function mapStateToProps(state) {
  return {
    wallet: state.walletReducer.wallet,
    walletLoading: state.walletReducer.walletLoading,
    openWallet: state.walletReducer.openWallet,
    walletMessage: state.walletReducer.walletMessage,
    alreadyBlocked: state.utilReducer.alreadyBlocked
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
    updateMatch: match => dispatch(UtilActions.updateMatch(match)),
    toggleBlock: block => dispatch(UtilActions.toggleBlock(block)),
    updateBlockedUsers: uid => dispatch(UtilActions.updateBlockedUsers(uid))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserCard);
