import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
} from "react-native";
function ConservisionItem(props) {
  const [isSingle, setIsSingle] = useState(true);

  let { users_info, conversation, lastMessage } = props.user;
  let isSearchResult = props.isSearchResult;
  let setIsSearchResult = props.setIsSearchResult;
  let setSearchResult = props.setSearchResult;
  const { onPress } = props;

  useEffect(() => {
    if (conversation.members.length > 2) {
      setIsSingle(false);
    }
  }, [props]);
  console.log("lagmessage Info: ",lastMessage.message.message);
  return (
    <View style={styles.container}>
      {isSearchResult && (
        <TouchableOpacity
          style={styles.conservation}
          onPress={() => {
            setIsSearchResult(!isSearchResult);
            setSearchResult([]);
          }}
        >
          <Text>Out</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.conservation} onPress={onPress}>
        {isSingle ? (
          <View
            style={{
              flex: 1,
              flexDirection: "row",
            }}
          >
            <TouchableOpacity style={styles.imageContainer}>
              {users_info.avatarImage && users_info.avatarImage !== "" ? (
                <Image
                  style={styles.image}
                  source={{ uri: users_info.avatarImage }}
                />
              ) : (
                <Image
                  style={styles.image}
                  source={{
                    uri: "https://img.freepik.com/premium-vector/man-avatar-profile-round-icon_24640-14044.jpg?w=2000",
                  }}
                />
              )}
            </TouchableOpacity>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text numberOfLines={1} style={styles.username}>
                  {users_info[0].username}
                </Text>
                {/* <Text style={styles.time}>1234</Text> */}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {lastMessage &&
                lastMessage.message &&
                lastMessage.message.message &&
                lastMessage.message.message.files &&
                lastMessage.message.message.files.length > 0 ? (
                  <Text style={styles.last_msg}>[files]</Text>
                ) : (
                  lastMessage && (
                    <Text style={styles.last_msg}>
                    {lastMessage.message.message.text}
                    </Text>
                  )
                  
                 
                )}
                
               
              </View>
            </View>
          </View>
        ) : (
          <View>
            <TouchableOpacity style={styles.imageContainer}>
              <Image
                style={styles.image}
                source={{
                  uri: "https://img.freepik.com/premium-vector/man-avatar-profile-round-icon_24640-14044.jpg?w=2000",
                }}
              />
            </TouchableOpacity>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text numberOfLines={1} style={styles.username}>
                  {conversation.name}
                </Text>
                {/* <Text  style={styles.time}>{time}</Text> */}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {lastMessage &&
                lastMessage.message &&
                lastMessage.message.message &&
                lastMessage.message.message.files &&
                lastMessage.message.message.files.length > 0 ? (
                  <Text style={styles.last_msg}>[files]</Text>
                ) : (
                  lastMessage && (
                    <Text style={styles.last_msg}>
                      {lastMessage.message.message.text}
                    </Text>
                  )
                )}
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,

    borderRadius: 20,
  },
  username: {
    fontSize: 20,
    color: "#000",
    width: 210,
    fontWeight: "bold",
  },
  last_msg: {
    fontSize: 13,
    width: 240,
    color: "#000",
  },
  conservation: {
    flexDirection: "row",
    paddingBottom: 25,
    paddingRight: 20,
    paddingLeft: 10,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  imageContainer: {
    marginRight: 15,
    borderRadius: 25,
    height: 50,
    width: 55,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  time: {
    fontSize: 15,
    fontWeight: "300",
  },
});

export default ConservisionItem;
