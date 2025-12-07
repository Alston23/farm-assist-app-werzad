
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingModalProps {
  visible: boolean;
  onSkip: () => void;
  onDontShowAgain: () => void;
}

const ONBOARDING_PAGES = [
  {
    emoji: '🌱',
    title: 'Welcome to SmallFarm Copilot',
    description: 'Your comprehensive farm management companion for small farms and homesteads up to 100 acres.',
  },
  {
    emoji: '🌾',
    title: 'Manage Your Crops',
    description: 'Access detailed growing information for vegetables, fruits, herbs, and flowers. Track planting schedules and harvest dates.',
  },
  {
    emoji: '📊',
    title: 'Track Revenue & Expenses',
    description: 'Monitor your farm\'s financial health with detailed income and expense tracking. Plan for profitability.',
  },
  {
    emoji: '🗺️',
    title: 'Organize Your Fields',
    description: 'Map out your fields and beds. Plan crop rotations and cover crops to maintain soil health.',
  },
  {
    emoji: '✅',
    title: 'Stay on Schedule',
    description: 'Never miss a planting or harvest window. Organize tasks and get reminders for important farm activities.',
  },
  {
    emoji: '🤖',
    title: 'AI-Powered Insights',
    description: 'Get personalized growing advice, problem diagnosis, and weather insights powered by artificial intelligence.',
  },
  {
    emoji: '🛒',
    title: 'Marketplace Access',
    description: 'Connect with local buyers and sellers. Find equipment, seeds, and customers for your produce.',
  },
];

export default function OnboardingModal({ visible, onSkip, onDontShowAgain }: OnboardingModalProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  const handleNext = () => {
    if (currentPage < ONBOARDING_PAGES.length - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({
        x: nextPage * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentPage(nextPage);
    } else {
      // On last page, "Next" acts like "Skip"
      onSkip();
    }
  };

  const handleDotPress = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
    setCurrentPage(index);
  };

  const isLastPage = currentPage === ONBOARDING_PAGES.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onSkip}
    >
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <View style={styles.container}>
          {/* Skip Button */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Pages */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.scrollView}
          >
            {ONBOARDING_PAGES.map((page, index) => (
              <View key={index} style={styles.page}>
                <View style={styles.iconContainer}>
                  <Text style={styles.emoji}>{page.emoji}</Text>
                </View>
                <Text style={styles.title}>{page.title}</Text>
                <Text style={styles.description}>{page.description}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Page Counter Text */}
          <View style={styles.pageCounterContainer}>
            <Text style={styles.pageCounterText}>
              Page {currentPage + 1} of {ONBOARDING_PAGES.length}
            </Text>
          </View>

          {/* Page Indicators (Dots) */}
          <View style={styles.indicatorContainer}>
            {ONBOARDING_PAGES.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleDotPress(index)}
                style={[
                  styles.indicator,
                  currentPage === index && styles.indicatorActive,
                ]}
              />
            ))}
          </View>

          {/* Bottom Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {isLastPage ? 'Get Started' : 'Next'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onDontShowAgain}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Don&apos;t Show Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 70,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  pageCounterContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  pageCounterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#2D5016',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
