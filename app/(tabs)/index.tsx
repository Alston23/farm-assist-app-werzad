
import { Redirect } from "expo-router";

export default function TabsIndex() {
  console.log("Tabs index - redirecting to home");
  return <Redirect href="/(tabs)/home" />;
}
