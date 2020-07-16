import React from "react";
import { View, Text } from "react-native";
import Feather from "react-native-vector-icons/Feather";
import { Icon } from "react-native-eva-icons";
import * as JebenaColors from "../../utils/colors";

class SupportAccordion extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>
          {`Reach out to us with any questions or\nconcerns you may have.`}
        </Text>
        <View style={{ flexDirection: "row" }}>
          <Icon
            name="email-outline"
            fill={JebenaColors.primaryColor()}
            width={24}
            height={24}
            style={styles.space}
          />
          <Text style={styles.socialText}>team@jebena.app</Text>
        </View>
        <View style={styles.socials}>
          <Feather
            name="instagram"
            color={JebenaColors.instagramColor()}
            size={22}
            style={styles.space}
          />
          <Feather
            name="twitter"
            color={JebenaColors.twitterColor()}
            size={22}
            style={styles.space}
          />
          <Text style={styles.socialText}>@jebena_app</Text>
        </View>
      </View>
    );
  }
}

const styles = {
  container: {
    marginTop: 15,
    paddingHorizontal: 15,
    alignItems: "center"
  },
  socialText: {
    color: "gray",
    fontSize: 20
  },
  messageText: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: "center"
  },
  socials: {
    flexDirection: "row",
    marginTop: 10
  },
  space: {
    marginRight: 10
  }
};

export default SupportAccordion;
