
import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function Index() {
  console.log("Index screen loaded");
  const { loading, user } = useAuth();

  if (loading) {
    console.log("Auth loading...");
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2D5016" />
      </View>
    );
  }

  if (user) {
    console.log("User authenticated, redirecting to home");
    return <Redirect href="/(tabs)/home" />;
  }

  console.log("No user, redirecting to auth");
  return <Redirect href="/auth" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
});
