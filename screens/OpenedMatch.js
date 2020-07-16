import React from "react";
import {
  View,
  Text,
  Dimensions,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  TouchableOpacity,
  ScrollView
} from "react-native";
import { SafeAreaConsumer } from "react-native-safe-area-context";
import { Button } from "react-native-paper";
import auth from "@react-native-firebase/auth";
import {
  GiftedChat,
  Bubble,
  Send,
  InputToolbar,
  Time
} from "react-native-gifted-chat";
import FastImage from "react-native-fast-image";
import { Icon } from "react-native-eva-icons";
import firebase from "@react-native-firebase/app";
import firestore from "@react-native-firebase/firestore";
import database from "@react-native-firebase/database";
import * as JebenaColors from "../utils/colors";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

class OpenedMatch extends React.Component {
  state = {
    messages: [],
    matchJson: {},
    firstName: "",
    loadingMessages: true,
    isKeyboardOpen: false
  };

  constructor(props) {
    super(props);
  }

  static navigationOptions = ({ navigation }) => ({
    header: null
  });

  get user() {
    const { uid } = auth().currentUser;
    return {
      _id: uid
    };
  }

  componentDidUpdate() {}

  //TODO: Comeback
  // _keyboardDidShow() {
  //   console.log("Keyboard Shown");
  //   this.setState({ isKeyboardOpen: true });
  // }

  // _keyboardDidHide() {
  //   console.log("Keyboard Hidden");
  //   this.setState({ isKeyboardOpen: false });
  // }

  componentDidMount() {
    console.log("OpenedMatch Mounted");
    // this.keyboardDidShowListener = Keyboard.addListener(
    //   "keyboardDidShow",
    //   this._keyboardDidShow()
    // );
    // this.keyboardDidHideListener = Keyboard.addListener(
    //   "keyboardDidHide",
    //   this._keyboardDidHide()
    // );
    const { uid } = auth().currentUser;
    const passedMatchJson = this.props.navigation.getParam("item");
    this.setState({ matchJson: passedMatchJson });
    const messagesRef = database().ref(`/messages/${passedMatchJson.matchId}/`);
    //When new message is added
    messagesRef.on("child_added", snapshot => {
      let messageData = snapshot.val();
      let msgJson = {
        _id: snapshot.key,
        text: messageData.text,
        createdAt: messageData.createdAt,
        user: {
          _id: messageData.user
        }
      };
      this.setState(previous => ({
        messages: GiftedChat.append(previous.messages, [msgJson]),
        loadingMessages: false
      }));
    });
    //Check if there's message
    messagesRef.on("value", snapshot => {
      if (!snapshot.val()) {
        this.setState({ loadingMessages: false });
      }
    });
    firestore()
      .collection("users")
      .doc(uid)
      .onSnapshot(userSnap => {
        if (userSnap) {
          let userData = userSnap.data();
          if (userData && userData.firstName) {
            this.setState({ firstName: userData.firstName });
          }
        }
      });
  }

  onSend(messages = []) {
    console.log("HEY: ", messages);
    let message = messages[0];
    const { matchJson, firstName } = this.state;
    console.log("ID", matchJson.matchId);
    let messageJson = {
      createdAt: new Date().toUTCString(),
      text: message.text,
      user: message.user._id
    };
    console.log(`Save ${messageJson.text} in chat ${matchJson.matchId}`);
    const messagesRef = database().ref(`/messages/${matchJson.matchId}/`);
    const newMessageRef = messagesRef.push(messageJson);
  }
  render() {
    const { messages, loadingMessages, matchJson } = this.state;
    let chatScreen = (
      <SafeAreaConsumer>
        {insets => (
          <GiftedChat
            key="giftChat"
            ref={ref => (this.giftedChatRef = ref)}
            bottomOffset={insets.bottom + 55}
            alignTop={true}
            listViewProps={{
              contentContainerStyle: {
                //height: this.state.isKeyboardOpen ? null : SCREEN_HEIGHT
              }
            }}
            style={styles.chatList}
            messages={messages}
            onSend={msgs => {
              this.giftedChatRef.focusTextInput();
              this.onSend(msgs);
            }}
            alwaysShowSend={true}
            //keyboardShouldPersistTaps={"handled"}
            user={this.user}
            renderAvatar={props => {
              return (
                <FastImage
                  style={styles.messageAvatar}
                  source={{
                    uri: matchJson.profilePicURL,
                    priority: FastImage.priority.normal
                  }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              );
            }}
            textInputProps={{
              autoCorrect: false,
              maxLength: 200,
              autoFocus: true
            }}
            renderBubble={props => {
              return (
                <Bubble
                  {...props}
                  wrapperStyle={styles.messageBubble}
                  textStyle={styles.messageText}
                />
              );
            }}
            renderTime={props => {
              return <Time {...props} timeTextStyle={styles.messageTime} />;
            }}
            renderInputToolbar={props => {
              return (
                <InputToolbar {...props} containerStyle={styles.messageInput} />
              );
            }}
            renderSend={props => {
              return (
                <Send {...props} containerStyle={styles.sendBtnContainer}>
                  <Button
                    color={JebenaColors.primaryColor()}
                    mode="text"
                    uppercase={false}
                  >
                    <Text style={styles.sendBtnText}>Send</Text>
                  </Button>
                </Send>
              );
            }}
            renderChatFooter={props => {
              return (
                <View style={styles.messageFooter}>
                  {messages.length === 0 && !loadingMessages && noMessages}
                </View>
              );
            }}
          />
        )}
      </SafeAreaConsumer>
    );

    let noMessages = [
      <SafeAreaView key="noMessages" style={styles.noMessagesContainer}>
        <Text style={styles.noMessagesText}>
          {`Introduce yourself, don't be shy.\n😁`}
        </Text>
      </SafeAreaView>
    ];
    return (
      <View style={styles.main}>
        <SafeAreaConsumer>
          {insets => (
            <View
              style={[
                styles.chatSafeAreaContainer,
                { height: SCREEN_HEIGHT - (insets.bottom + 65) }
              ]}
              onStartShouldSetResponder={() => Keyboard.dismiss()}
            >
              <View style={[styles.statusBarContainer, { height: insets.top }]}>
                <StatusBar barStyle="light-content" />
              </View>
              <View style={[styles.appBar, { marginTop: insets.top }]}>
                <View style={styles.appBarConainer}>
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => {
                      console.log("Return to Matches");
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
                  <View style={styles.nameAndAvatar}>
                    <View style={styles.avatarContainer}>
                      <FastImage
                        style={styles.matchAvatar}
                        source={{
                          uri: matchJson.profilePicURL,
                          priority: FastImage.priority.normal
                        }}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                    </View>
                    <Text style={styles.nameText} numberOfLines={2}>
                      {`${matchJson.firstName} ${matchJson.lastName}`}
                    </Text>
                  </View>
                </View>
              </View>
              {chatScreen}
              {Platform.OS === "android" && (
                <KeyboardAvoidingView behavior="padding" />
              )}
            </View>
          )}
        </SafeAreaConsumer>
      </View>
      // <TouchableWithoutFeedback
      //   onPress={() => {
      //     Keyboard.dismiss();
      //   }}
      // >
      // </TouchableWithoutFeedback>
    );
  }
}

const styles = {
  main: {
    backgroundColor: JebenaColors.lightBlueBg(),
    height: SCREEN_HEIGHT
  },
  statusBarContainer: {
    position: "absolute",
    width: SCREEN_WIDTH,
    backgroundColor: JebenaColors.primaryColor()
  },
  appBar: {
    backgroundColor: JebenaColors.primaryColor(),
    height: 60,
    width: SCREEN_WIDTH,
    borderBottomLeftRadius: SCREEN_WIDTH,
    borderBottomRightRadius: SCREEN_WIDTH,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center"
  },
  appBarConainer: {
    //backgroundColor: "teal",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SCREEN_WIDTH / 5,
    width: SCREEN_WIDTH
  },
  backBtn: {
    position: "absolute",
    left: SCREEN_WIDTH / 15
  },
  nameAndAvatar: {
    //backgroundColor: "orange",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  nameText: {
    //backgroundColor: "pink",
    fontSize: 18,
    textAlign: "left",
    color: "white",
    fontWeight: "600",
    flex: 2,
    flexWrap: "wrap"
  },
  chatList: {},
  chatSafeAreaContainer: {
    display: "flex",
    width: SCREEN_WIDTH
  },
  noMessagesContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  noMessagesText: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 18,
    color: "gray"
  },
  avatarContainer: {
    flex: 1,
    //backgroundColor: "blue",
    paddingRight: 5,
    alignItems: "flex-end"
  },
  matchAvatar: {
    backgroundColor: "gray",
    width: 40,
    height: 40,
    borderColor: "white",
    borderWidth: 1,
    borderRadius: 20
  },
  seenAvatar: {
    backgroundColor: "gray",
    width: 15,
    height: 15,
    borderRadius: 8
  },
  messageAvatar: {
    backgroundColor: "gray",
    width: 30,
    height: 30,
    borderRadius: 18
  },
  sendBtnContainer: {
    borderWidth: 0,
    //backgroundColor: JebenaColors.primaryColor(),
    borderRadius: 20,
    justifyContent: "center"
  },
  sendBtnText: {
    fontSize: 16
  },
  messageInput: {
    marginHorizontal: 5,
    borderWidth: 0.5,
    borderColor: JebenaColors.grayBorder(),
    borderRadius: 20
  },
  messageBubble: {
    left: {
      backgroundColor: "white"
    },
    right: {
      backgroundColor: "#ff4757"
    }
  },
  messageText: {
    left: {
      color: "black"
    },
    right: {
      color: "white"
    }
  },
  messageTime: {
    left: {
      color: "lightgray"
    },
    right: {
      color: "lightgray"
    }
  },
  messageFooter: {
    height: SCREEN_HEIGHT / 2,
    width: SCREEN_WIDTH,
    paddingHorizontal: 10
  }
};

export default OpenedMatch;
