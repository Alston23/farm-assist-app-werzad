
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import { useTheme } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Href } from 'expo-router';
import { colors } from '@/styles/commonStyles';

const { width: screenWidth } = Dimensions.get('window');

export interface TabBarItem {
  name: string;
  route: Href;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = screenWidth - 40,
  borderRadius = 35,
  bottomMargin
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const animatedValue = useSharedValue(0);
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Improved active tab detection with better path matching
  const activeTabIndex = React.useMemo(() => {
    // Find the best matching tab based on the current pathname
    let bestMatch = -1;
    let bestMatchScore = 0;

    tabs.forEach((tab, index) => {
      let score = 0;

      // Exact route match gets highest score
      if (pathname === tab.route) {
        score = 100;
      }
      // Check if pathname starts with tab route (for nested routes)
      else if (pathname.startsWith(tab.route as string)) {
        score = 80;
      }
      // Check if pathname contains the tab name
      else if (pathname.includes(tab.name)) {
        score = 60;
      }
      // Check for partial matches in the route
      else if (tab.route.includes('/(tabs)/') && pathname.includes(tab.route.split('/(tabs)/')[1])) {
        score = 40;
      }

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = index;
      }
    });

    // Default to first tab if no match found
    return bestMatch >= 0 ? bestMatch : 0;
  }, [pathname, tabs]);

  React.useEffect(() => {
    if (activeTabIndex >= 0) {
      animatedValue.value = withSpring(activeTabIndex, {
        damping: 20,
        stiffness: 120,
        mass: 1,
      });
    }
  }, [activeTabIndex, animatedValue]);

  // Auto-scroll to active tab
  React.useEffect(() => {
    if (scrollViewRef.current && activeTabIndex >= 0) {
      // Calculate the position to scroll to
      const tabWidth = 80; // Fixed width per tab
      const scrollPosition = Math.max(0, (activeTabIndex * tabWidth) - (containerWidth / 2) + (tabWidth / 2));
      
      scrollViewRef.current.scrollTo({
        x: scrollPosition,
        animated: true,
      });
    }
  }, [activeTabIndex, containerWidth]);

  const handleTabPress = (route: Href) => {
    router.push(route);
  };

  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = 80; // Fixed width per tab
    return {
      transform: [
        {
          translateX: animatedValue.value * tabWidth,
        },
      ],
    };
  });

  // Dynamic styles based on theme
  const dynamicStyles = {
    blurContainer: {
      ...styles.blurContainer,
      borderWidth: 1.2,
      borderColor: 'rgba(255, 255, 255, 1)',
      ...Platform.select({
        ios: {
          backgroundColor: theme.dark
            ? 'rgba(28, 28, 30, 0.8)'
            : 'rgba(255, 255, 255, 0.6)',
        },
        android: {
          backgroundColor: theme.dark
            ? 'rgba(28, 28, 30, 0.95)'
            : 'rgba(255, 255, 255, 0.6)',
        },
        web: {
          backgroundColor: theme.dark
            ? 'rgba(28, 28, 30, 0.95)'
            : 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    background: {
      ...styles.background,
    },
    indicator: {
      ...styles.indicator,
      backgroundColor: theme.dark
        ? 'rgba(255, 255, 255, 0.08)' // Subtle white overlay in dark mode
        : 'rgba(0, 0, 0, 0.04)', // Subtle black overlay in light mode
    },
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={[
        styles.container,
        {
          width: containerWidth,
          marginBottom: bottomMargin ?? 20
        }
      ]}>
        <BlurView
          intensity={80}
          style={[dynamicStyles.blurContainer, { borderRadius }]}
        >
          <View style={dynamicStyles.background} />
          <View style={styles.scrollContainer}>
            <Animated.View style={[dynamicStyles.indicator, indicatorStyle]} />
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContainer}
              style={styles.scrollView}
              bounces={false}
              decelerationRate="fast"
            >
              {tabs.map((tab, index) => {
                const isActive = activeTabIndex === index;

                return (
                  <React.Fragment key={index}>
                    <TouchableOpacity
                      style={styles.tab}
                      onPress={() => handleTabPress(tab.route)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.tabContent}>
                        <IconSymbol
                          android_material_icon_name={tab.icon}
                          ios_icon_name={tab.icon}
                          size={24}
                          color={isActive ? colors.primary : colors.text}
                        />
                        <Text
                          style={[
                            styles.tabLabel,
                            { color: colors.text },
                            isActive && { color: colors.primary, fontWeight: '600' },
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </ScrollView>
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center', // Center the content
  },
  container: {
    marginHorizontal: 20,
    alignSelf: 'center',
    // width and marginBottom handled dynamically via props
  },
  blurContainer: {
    overflow: 'hidden',
    // borderRadius and other styling applied dynamically
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    // Dynamic styling applied in component
  },
  scrollContainer: {
    position: 'relative',
    height: 60,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 27,
    width: 72, // Fixed width for indicator
    zIndex: 0,
    // Dynamic styling applied in component
  },
  scrollView: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    minWidth: '100%',
  },
  tab: {
    width: 80, // Fixed width per tab
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    zIndex: 1,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
    // Dynamic styling applied in component
  },
});
