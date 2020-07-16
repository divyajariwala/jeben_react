import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
  Platform
} from "react-native";
import { WebView } from "react-native-webview";
import { Icon } from "react-native-eva-icons";
import { SafeAreaConsumer } from "react-native-safe-area-context";
import * as JebenaColors from "../utils/colors";
import * as ApiKeys from "../utils/ApiKeys";
import Awesome from "react-native-vector-icons/FontAwesome";
import Toast from "react-native-toast-message";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import remoteConfig from "@react-native-firebase/remote-config";
import { firebase } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-community/google-signin";
import {
  LoginManager,
  AccessToken,
  GraphRequest,
  GraphRequestManager
} from "react-native-fbsdk";
import appleAuth, {
  AppleButton,
  AppleAuthCredentialState,
  AppleAuthError,
  AppleAuthRealUserStatus,
  AppleAuthRequestScope,
  AppleAuthRequestOperation
} from "@invertase/react-native-apple-authentication";
import { connect } from "react-redux";
import * as UserActions from "../actions/UserActions";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

class LoginScreen extends React.Component {
  constructor() {
    super();
    this.user = null;
    this.state = {
      credentialStateForUser: -1
    };
  }

  static navigationOptions = {
    header: null,
    gesturesEnabled: false
  };

  state = {
    email: "user2@jebena.com",
    password: "jebenauser2",
    errorMessage: null,
    isGoogleSigninInProgress: false,
    showingResetForm: false,
    resetButtonTitle: "Reset Password",
    showWebView: false,
    webViewUrl: ""
  };

  handleSignIn = () => {
    const { email, password } = this.state;

    auth()
      .signInWithEmailAndPassword(email, password)
      .then(async userInfo => {
        let isNewUser = userInfo.additionalUserInfo.isNewUser;
        if (auth().currentUser) {
          //If User is new go to the next screen in the wizard
          if (isNewUser) {
            console.log("User in login is new");
            let wizardJson = {
              firstName: "currentUser.user.givenName",
              lastName: "",
              oneSignalPlayerId: this.props.oneSignalPlayerId
            };
            this.props.updateWizard(wizardJson);
            this.props.navigation.navigate("Complete");
          } else {
            console.log("User in login is NOT new");
            this.props.navigation.navigate("App");
          }
        }
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
  };

  showWebView() {
    const { webViewUrl } = this.state;
    return (
      <View style={styles.webviewContainer}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => this.setState({ showWebView: false })}
        >
          <Icon
            name="close-outline"
            fill={JebenaColors.primaryColor()}
            width={22}
            height={22}
          />
          <Text>Close</Text>
        </TouchableOpacity>
        <WebView useWebKit={true} source={{ uri: webViewUrl }} />
      </View>
    );
  }

  componentDidMount() {
    console.log("Login Mounted.");
    console.log("🍎 iOS Version: ", parseInt(Platform.Version, 10));
  }

  handleGoogleSigin = async () => {
    console.log("Signin with Google");
    this.setState({ errorMessage: "" });
    await GoogleSignin.configure({
      scopes: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
      ],
      webClientId: ApiKeys.getGoogleWebClientId()
    });
    try {
      await GoogleSignin.hasPlayServices();
      const { accessToken, idToken } = await GoogleSignin.signIn();
      const credential = firebase.auth.GoogleAuthProvider.credential(
        idToken,
        accessToken
      );
      auth()
        .signInWithCredential(credential)
        .then(async userInfo => {
          let currentUser = await GoogleSignin.getCurrentUser();
          let isNewUser = userInfo.additionalUserInfo.isNewUser;
          let uid = auth().currentUser.uid;
          if (currentUser.user && auth().currentUser) {
            //If User is new go to the next screen in the wizard
            if (isNewUser) {
              console.log("User in login is new");
              let nameArray = currentUser.user.name.split(" ");
              this.props.updateUID(uid);
              this.props.updateFirstName(currentUser.user.givenName);
              this.props.updateLastName(nameArray[1] ? nameArray[1] : "");
              this.props.updateGooglePic(currentUser.user.photo);
              this.props.updateOneSignalId(this.props.oneSignalPlayerId);
              this.props.navigation.navigate("Complete");
              // let wizardJson = {
              //   firstName: currentUser.user.givenName,
              //   lastName: nameArray[1] ? nameArray[1] : "",
              //   googleProfilePicture: currentUser.user.photo,
              //   oneSignalPlayerId: this.props.oneSignalPlayerId
              // };
              // this.props.updateWizard(wizardJson);
              //this.props.navigation.navigate("Complete");
            } else {
              console.log("User in login is NOT new");
              this.props.navigation.navigate("App");
            }
          }
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
    } catch (error) {
      console.log(error);
      this.setState({ errorMessage: "Error signing in with Google." });
    }
  };

  handleFacebookSigin = async () => {
    console.log("Signin with Facebook");
    this.setState({ errorMessage: "" });
    const result = await LoginManager.logInWithPermissions([
      "public_profile",
      "email"
    ]);
    if (result && !result.isCancelled) {
      const data = await AccessToken.getCurrentAccessToken();
      if (!data) {
        this.setState({ errorMessage: "🥺Error signing in with Facebook." });
      } else {
        const credential = firebase.auth.FacebookAuthProvider.credential(
          data.accessToken
        );
        auth()
          .signInWithCredential(credential)
          .then(async userInfo => {
            let currentUser = auth().currentUser;
            let isNewUser = userInfo.additionalUserInfo.isNewUser;
            if (currentUser && currentUser.uid) {
              const facebookGraphCallBack = (graphError, graphResult) => {
                if (graphError) {
                  console.log(graphError);
                  this.setState({
                    errorMessage: "Error signing in with Facebook."
                  });
                } else {
                  if (isNewUser) {
                    this.props.updateUID(currentUser.uid);
                    this.props.updateFirstName(graphResult.first_name);
                    this.props.updateLastName(graphResult.last_name);
                    this.props.updateFacebookPic(graphResult.picture.data.url);
                    this.props.updateOneSignalId(this.props.oneSignalPlayerId);
                    this.props.navigation.navigate("Complete");
                  } else {
                    this.props.navigation.navigate("App");
                  }
                }
              };

              const infoRequest = new GraphRequest(
                "/me",
                {
                  accessToken: data.accessToken,
                  parameters: {
                    fields: {
                      string: "first_name, last_name, picture.height(500)"
                    }
                  }
                },
                facebookGraphCallBack
              );

              // Start the graph request.
              new GraphRequestManager().addRequest(infoRequest).start();
            }
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
      this.setState({ errorMessage: "Error signing in with Facebook." });
    }
  };

  handleAppleSigin = async () => {
    console.log("Signin with Apple");
    this.setState({ errorMessage: "" });
    try {
      // Start the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: AppleAuthRequestOperation.LOGIN,
        requestedScopes: [
          AppleAuthRequestScope.EMAIL,
          AppleAuthRequestScope.FULL_NAME
        ]
      });

      // Ensure Apple returned a user identityToken
      if (!appleAuthRequestResponse.identityToken) {
        this.setState({ errorMessage: "Error signing in with Apple." });
      }
      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = firebase.auth.AppleAuthProvider.credential(
        identityToken,
        nonce
      );

      if (appleCredential) {
        auth()
          .signInWithCredential(appleCredential)
          .then(async userInfo => {
            console.log("USER INFO:");
            console.log(userInfo);
            let currentUser = auth().currentUser;
            let isNewUser = userInfo.additionalUserInfo.isNewUser;
            if (currentUser && currentUser.uid) {
              if (isNewUser) {
                this.props.updateUID(currentUser.uid);
                this.props.updateOneSignalId(this.props.oneSignalPlayerId);
                this.props.navigation.navigate("Complete");
              } else {
                this.props.navigation.navigate("App");
              }
            }
          })
          .catch(error => {
            if (error) {
              console.log(error.message);
              let index = error.message.indexOf("]");
              if (index > -1) {
                let message = error.message.slice(index + 1);
                this.setState({ errorMessage: message });
              }
            }
          });
      } else {
        this.setState({ errorMessage: "Error signing in with Apple." });
      }
    } catch (e) {
      this.setState({
        errorMessage: "Error signing in with Apple."
      });
      console.log(e.message);
    }
  };

  fetchAndUpdateCredentialState = async () => {
    if (this.user === null) {
      this.setState({ credentialStateForUser: "N/A" });
    } else {
      const credentialState = await appleAuth.getCredentialStateForUser(
        this.user
      );
      if (credentialState === AppleAuthCredentialState.AUTHORIZED) {
        this.setState({ credentialStateForUser: "AUTHORIZED" });
      } else {
        this.setState({ credentialStateForUser: credentialState });
      }
    }
  };

  handResetPassword = () => {
    const { email } = this.state;
    console.log("Reset with: ", email);
    auth()
      .sendPasswordResetEmail(email)
      .then(() => {
        this.setState({ resetButtonTitle: "Email Sent 😁" });
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
  };

  handleReturn = () => {
    this.setState({
      showingResetForm: false,
      resetButtonTitle: "Reset Password",
      email: ""
    });
  };

  render() {
    const { showWebView } = this.state;
    return (
      <View style={styles.main}>
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
              <View
                style={[
                  styles.formContainer,
                  { paddingBottom: insets.bottom + 20 }
                ]}
              >
                <View style={styles.form}>
                  <Text style={styles.messageText}>{`Welcome to Jebena`}</Text>
                  {this.state.errorMessage ? (
                    Toast.show({
                      text1: "Oops",
                      text2: this.state.errorMessage,
                      type: "error",
                      position: "top",
                      autoHide: true,
                      visibilityTime: 4000
                    })
                  ) : (
                    <View />
                  )}
                  <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                      style={styles.googleSigninBtn}
                      onPress={this.handleGoogleSigin}
                      disabled={this.state.isGoogleSigninInProgress}
                    >
                      <Awesome
                        name="google"
                        size={20}
                        color={JebenaColors.googleColor()}
                        style={styles.formIcon}
                      />
                      <Text style={styles.googleText}>Sign in with Google</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.facebookSigninBtn}
                      onPress={this.handleFacebookSigin}
                    >
                      <Awesome
                        name="facebook"
                        size={20}
                        color={JebenaColors.facebookColor()}
                        style={styles.formIcon}
                      />
                      <Text style={styles.googleText}>
                        Sign in with Facebook
                      </Text>
                    </TouchableOpacity>
                    {Platform.OS === "ios" &&
                      parseInt(Platform.Version, 10) && (
                        <AppleButton
                          buttonStyle={AppleButton.Style.BLACK}
                          buttonType={AppleButton.Type.SIGN_IN}
                          style={styles.appleSigninBtn}
                          onPress={this.handleAppleSigin}
                        />
                      )}
                  </View>
                  <Text style={styles.footerText}>
                    {`This is only used for authentication.\nWe won't post to your feed.`}
                  </Text>
                  <View style={styles.tosContainer}>
                    <Text style={styles.tosText}>
                      By signing up you agree to{" "}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        this.setState({
                          showWebView: true,
                          webViewUrl: "https://jebena.app/terms",
                          errorMessage: ""
                        });
                      }}
                    >
                      <Text style={styles.tosTextHighlighted}>
                        these terms.
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </SafeAreaConsumer>
        </View>
        {showWebView && this.showWebView()}
        <Toast ref={ref => Toast.setRef(ref)} />
      </View>
    );
  }
}

const styles = {
  main: { flex: 1 },
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
  formContainer: {
    paddingTop: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  form: {
    paddingBottom: 10,
    alignItems: "center",
    marginHorizontal: 40
  },
  formIcon: { marginHorizontal: 5 },
  spaceView: { width: 10 },
  messageText: {
    width: SCREEN_WIDTH - 20,
    paddingHorizontal: 10,
    textAlign: "left",
    fontWeight: "500",
    fontSize: 28
  },
  messageSubtext: {
    width: SCREEN_WIDTH - 20,
    paddingHorizontal: 10,
    color: JebenaColors.grayText(),
    marginTop: 5,
    marginBottom: 10,
    textAlign: "left",
    fontWeight: "400",
    fontSize: 20
  },
  tosContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  tosText: {
    textAlign: "center",
    fontWeight: "400",
    fontSize: 14
  },
  tosTextHighlighted: {
    textAlign: "center",
    fontWeight: "400",
    fontSize: 14,
    marginLeft: 4,
    textDecorationLine: "underline"
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
  errorMessage: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5
  },
  errorText: {
    fontSize: 11,
    color: "red",
    textAlign: "center"
  },
  googleText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 5
  },
  footerText: {
    marginVertical: 8,
    textAlign: "center",
    color: JebenaColors.grayText(),
    width: SCREEN_WIDTH - 40
  },
  googleSigninBtn: {
    borderWidth: 1,
    borderColor: JebenaColors.googleColor(),
    borderRadius: 7,
    height: 38,
    width: SCREEN_WIDTH / 1.25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  facebookSigninBtn: {
    borderWidth: 1,
    borderColor: JebenaColors.facebookColor(),
    borderRadius: 7,
    height: 38,
    width: SCREEN_WIDTH / 1.25,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  appleSigninBtn: {
    height: 40,
    width: SCREEN_WIDTH / 1.25,
    marginTop: 10
  },
  buttonsContainer: {
    marginTop: 15,
    width: SCREEN_WIDTH - 20,
    alignItems: "center",
    //flexDirection: "row",
    justifyContent: "space-around"
  },
  webviewContainer: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: JebenaColors.lightBlueBg(),
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingTop: 60
  },
  closeBtn: {
    alignItems: "center",
    marginVertical: 5
  }
};

function mapStateToProps(state) {
  return {
    oneSignalPlayerId: state.oneSignalReducer.oneSignalPlayerId
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateWizard: wizardJson => dispatch(UserActions.updateWizard(wizardJson)),
    updateFirstName: name => dispatch(UserActions.updateFirstName(name)),
    updateLastName: name => dispatch(UserActions.updateLastName(name)),
    updateGooglePic: url => dispatch(UserActions.updateGooglePic(url)),
    updateFacebookPic: url => dispatch(UserActions.updateFacebookPic(url)),
    updateOneSignalId: id => dispatch(UserActions.updateOneSignalId(id))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LoginScreen);
