import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  StatusBar,
  Image,
  Dimensions
} from "react-native";
import Ionic from "react-native-vector-icons/Ionicons";
import MatIcons from "react-native-vector-icons/MaterialIcons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

class RegisterScreen extends React.Component {
  static navigationOptions = () => ({
    header: null
  });

  state = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    retypedPassword: "",
    errorMessage: "",
    validPassword: false,
    validName: false
  };

  signupUser = () => {
    const { firstName, lastName, email, password } = this.state;
    console.log("Signing up user...");
    auth()
      .createUserWithEmailAndPassword(email, password)
      .then(userCredentials => {
        return userCredentials.user.updateProfile({
          displayName: firstName + " " + lastName
        });
      })
      .then(() => {
        let newUser = {
          fullName: firstName + " " + lastName,
          firstName: firstName,
          profileCompleted: false,
          preferencesCompleted: false
        };
        console.log(newUser);
        firestore()
          .collection("users")
          .doc(auth().currentUser.uid)
          .set(newUser)
          .then(() => {
            this.props.navigation.navigate("Complete");
            console.log("Created user: ", auth().currentUser.uid);
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

  handleSignUp = () => {
    const { firstName, lastName, password, retypedPassword } = this.state;
    console.log("Validate inputs...");
    if (
      firstName === "" ||
      firstName.length < 2 ||
      lastName === "" ||
      lastName.length < 2
    ) {
      console.log("Name invalid");
      this.setState({
        errorMessage: "Enter valid full name",
        validName: false
      });
      return;
    } else {
      console.log("Name valid");
      this.setState({ errorMessage: "", validName: true });
    }
    console.log(password);
    console.log(retypedPassword);
    if (
      password === "" ||
      retypedPassword === "" ||
      password !== retypedPassword
    ) {
      console.log("Password invalid");
      this.setState({
        errorMessage: "Passwords do not match!",
        validPassword: false
      });
      return;
    } else {
      console.log("Password valid");
      this.setState({ errorMessage: "", validPassword: true }, () => {
        if (this.state.validName && this.state.validPassword) {
          console.log("ALL VALID");
          this.signupUser();
        }
      });
    }

    console.log("Name: ", this.state.validName);
    console.log("Pass: ", this.state.validPassword);
  };

  render() {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior="padding"
      >
        <View style={styles.container}>
          <StatusBar hidden={false} barStyle="light-content" />
          <Image
            source={require("./assets/jebena_login_couple.jpg")}
            resizeMode="cover"
            style={styles.backgroundImage}
          />
          <View style={styles.backgroundImageShadow} />
          <View style={styles.formContainer}>
            <Image
              source={require("./assets/jebena_logo.png")}
              resizeMode="cover"
              style={styles.logoContainer}
            />
            <Text style={styles.messageText}>Let's setup your profile</Text>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionic
                  name="ios-person"
                  size={20}
                  color="#C60000"
                  style={styles.formIcon}
                />
                <TextInput
                  placeholder="First Name"
                  style={styles.input}
                  autoCapitalize="none"
                  onChangeText={name => this.setState({ firstName: name })}
                  value={this.state.firstName}
                />
                <TextInput
                  placeholder="Last Name"
                  style={styles.input}
                  autoCapitalize="none"
                  onChangeText={name => this.setState({ lastName: name })}
                  value={this.state.lastName}
                />
              </View>
              <View style={styles.inputContainer}>
                <MatIcons
                  name="email"
                  size={20}
                  color="#C60000"
                  style={styles.formIcon}
                />
                <TextInput
                  placeholder="Email"
                  style={styles.input}
                  autoCapitalize="none"
                  onChangeText={email => this.setState({ email })}
                  value={this.state.email}
                />
              </View>
              <View style={styles.inputContainer}>
                <MatIcons
                  name="lock"
                  size={20}
                  color="#C60000"
                  style={styles.formIcon}
                />
                <TextInput
                  placeholder="Password"
                  style={styles.input}
                  secureTextEntry
                  autoCapitalize="none"
                  onChangeText={password => this.setState({ password })}
                  value={this.state.password}
                />
              </View>
              <View style={styles.inputContainer}>
                <MatIcons
                  name="lock"
                  size={20}
                  color="#C60000"
                  style={styles.formIcon}
                />
                <TextInput
                  placeholder="Confirm Password"
                  style={styles.input}
                  secureTextEntry
                  autoCapitalize="none"
                  onChangeText={password =>
                    this.setState({ retypedPassword: password })
                  }
                  value={this.state.retypedPassword}
                />
              </View>
              {this.state.errorMessage ? (
                <View style={styles.errorMessage}>
                  <Text style={styles.errorText}>
                    {this.state.errorMessage}
                  </Text>
                </View>
              ) : (
                <View />
              )}
              <TouchableOpacity
                style={styles.signupBtn}
                onPress={this.handleSignUp}
              >
                <Text style={styles.signupText}>Next</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>By signing up you agree to </Text>
              <TouchableOpacity>
                <Text style={styles.footerTextHighlighted}>these terms.</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }
}

const styles = {
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "gray"
  },
  keyboardAvoidingView: { flex: 1 },
  logoContainer: {
    alignSelf: "center",
    marginTop: 10,
    width: 20,
    height: 30
  },
  messageText: {
    textAlign: "center",
    fontWeight: "400",
    fontSize: 16
  },
  footerText: {
    textAlign: "center",
    fontWeight: "400",
    color: "gray",
    fontSize: 12
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 0,
    marginBottom: 15
  },
  footerTextHighlighted: {
    textAlign: "center",
    fontWeight: "400",
    color: "#C60000",
    fontSize: 12
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
    marginBottom: 10
  },
  formContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  formIcon: { marginLeft: 5 },
  input: {
    flex: 1,
    height: 40,
    marginLeft: 5,
    fontSize: 16
  },
  inputContainer: {
    borderColor: "lightgray",
    borderWidth: 1,
    borderRadius: 20,
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center"
  },
  signupBtn: {
    borderColor: "#C60000",
    backgroundColor: "#C60000",
    borderWidth: 1,
    borderRadius: 20,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5
  },
  signupText: {
    color: "white",
    fontSize: 18,
    fontWeight: "400"
  },
  backBtn: {
    left: 10
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
  }
};

export default RegisterScreen;
