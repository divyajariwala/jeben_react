import React from "react";
import { Text, View, Dimensions, ActivityIndicator } from "react-native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import UserCard from "./UserCard";
import * as JebenaColors from "../../utils/colors";
import moment from "moment";
import "moment-timezone";
import CountDown from "react-native-countdown-component";
import remoteConfig from "@react-native-firebase/remote-config";
import FastImage from "react-native-fast-image";
import { connect } from "react-redux";
import MatchPopup from "./MatchPopup";
import _ from "lodash";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

class HomeFeed extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    feedUsers: [],
    collapseBio: true,
    shownPool: [],
    loadingFeed: true,
    homeScreenImageUrl: ""
  };

  componentDidMount() {
    //Get Users
    console.log("HomeFeed Mounted");
    console.log("LOADING FEED", this.state.loadingFeed);
    let userCollection = firestore().collection("users");
    const utilsCollection = firestore().collection("utils");

    utilsCollection.doc("settings").onSnapshot(settingsSnap => {
      if (settingsSnap) {
        let settingsData = settingsSnap.data();
        if (settingsData && settingsData.HOME_SCREEN_IMG_URL) {
          console.log("Invitation Img URL:", settingsData.HOME_SCREEN_IMG_URL);
          this.setState({
            homeScreenImageUrl: settingsData.HOME_SCREEN_IMG_URL
          });
        }
      }
    });

    firestore()
      .collection("dailyPool")
      .doc(auth().currentUser.uid)
      .onSnapshot(
        poolSnapshot => {
          if (
            !poolSnapshot.exists ||
            (poolSnapshot.data() &&
              poolSnapshot.data().possibleMatches &&
              poolSnapshot.data().possibleMatches.length === 0)
          ) {
            console.log("No users.");
            this.setState({ loadingFeed: false });
            return;
          }
          let possibleMatches = poolSnapshot.data().possibleMatches;
          console.log(`${possibleMatches.length} users in feed.`);
          if (possibleMatches.length <= this.state.feedUsers.length) {
            return;
          }
          for (const otherUid of possibleMatches) {
            userCollection
              .doc(otherUid)
              .get()
              .then(doc => {
                const userData = doc.data();
                if (userData && userData.preferencesCompleted) {
                  let userJson = {
                    uid: doc.id,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    birthDay: userData.birthDay
                      ? userData.birthDay.toDate()
                      : "",
                    location: userData.location,
                    city: userData.city,
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
                    profilePicURL: userData.profilePicURL
                  };
                  this.setState(prevState => ({
                    feedUsers: [...prevState.feedUsers, userJson]
                  }));
                }
              });
          }
        },
        error => {
          console.log("Error getting matches: ", error);
        }
      );

    this.getInteractions();
  }

  getInteractions() {
    const { uid } = auth().currentUser;
    firestore()
      .collection("interactions")
      .doc(uid)
      .onSnapshot(docSnapshot => {
        if (docSnapshot) {
          let userData = docSnapshot.data();
          this.setState({
            shownPool: userData && userData.shownPool ? userData.shownPool : []
          });
          // auto-refresh UI. This removes users from feed who have been disliked from matches screen
          this.setState(prevState => ({
            feedUsers: _.remove(
              prevState.feedUsers,
              o => !this.state.shownPool.includes(o.uid)
            )
          }));
        }
      });
  }

  doneReadingCard = () => {
    console.log("Done reading card in home feed.");
  };

  noMoreSwipes = () => {
    if (this.state.loadingFeed) {
      return (
        <View style={styles.noMoreSwipesContainer}>
          <ActivityIndicator size="large" color={JebenaColors.primaryColor()} />
        </View>
      );
    }
    const currentTime = moment()
      .tz("America/New_York")
      .format("HH:mm:ss");
    let scheduledTime = remoteConfig().getValue("FEED_COMPILER_SCHEDULE_EST")
      .value;
    console.log(`Scheduled Time to update feed in EST: ${scheduledTime}`);
    scheduledTime = moment(scheduledTime, "HH:mm:ss").format("HH:mm:ss");

    const secondsToSchedule =
      24 * 60 * 60 -
      moment.duration(currentTime).asSeconds() +
      moment.duration(scheduledTime).asSeconds();

    return (
      <View style={styles.noMoreSwipesContainer}>
        <Text
          style={styles.noMoreSwipesMessage}
        >{`You'll see up to 10 new people\nhere tomorrow`}</Text>
        <FastImage
          style={styles.homeFeedImage}
          source={{
            uri: this.state.homeScreenImageUrl,
            priority: FastImage.priority.high
          }}
          resizeMode="cover"
        />
        <CountDown
          until={secondsToSchedule}
          size={SCREEN_WIDTH / 15}
          timeToShow={["H", "M", "S"]}
          showSeparator
          digitStyle={styles.countdownDigit}
          digitTxtStyle={styles.countdownDigitText}
        />
      </View>
    );
  };

  render() {
    const { feedUsers } = this.state;
    console.log(feedUsers.length);
    return (
      <View>
        {this.props.match && (
          <MatchPopup
            matchData={this.state.currentMatch}
            onReturnPress={() => this.setState({ currentMatch: null })}
          />
        )}
        {feedUsers.length > 0 ? (
          <UserCard
            feedUsers={feedUsers}
            doneReading={this.doneReadingCard.bind(this)}
            showDislikeButton={true}
            showHeartButton={true}
            showLikeButton={true}
            showReturnButton={false}
          />
        ) : (
          <View>{this.noMoreSwipes()}</View>
        )}
      </View>
    );
  }
}

const styles = {
  homeFeedImage: {
    marginTop: 30,
    marginVertical: 10,
    width: SCREEN_HEIGHT * 0.35,
    height: SCREEN_HEIGHT * 0.35
  },
  noMoreSwipesContainer: {
    alignItems: "center",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    marginTop: SCREEN_HEIGHT / 8
  },
  noMoreSwipesMessage: {
    marginTop: 20,
    textAlign: "center",
    fontWeight: "500",
    fontSize: 18
  },
  countdownDigit: {
    marginTop: 20,
    backgroundColor: JebenaColors.primaryColor()
  },
  countdownDigitText: { color: "white" }
};

function mapStateToProps(state) {
  return {
    match: state.utilReducer.match
  };
}

export default connect(mapStateToProps)(HomeFeed);
