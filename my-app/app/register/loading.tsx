import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

export default function RegisterLoadingScreen() {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    rotateLoop.start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      router.replace('/register/summary');
    }, 1900);

    return () => {
      rotateLoop.stop();
      clearTimeout(timer);
    };
  }, [progressAnim, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '68%'],
  });

  return (
    <View style={styles.screen}>
      <View style={styles.topArea}>
        <View style={styles.circle}>
          <Animated.Text
            style={[styles.icon, { transform: [{ rotate }] }]}
          >
            ↻
          </Animated.Text>
        </View>

        <Text style={styles.title}>สร้างสรุปผล...</Text>
        <Text style={styles.subtitle}>
          จัดเตรียมข้อมูลเพื่อแสดงให้คุณเห็น
        </Text>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      <View style={styles.bottomArea}>
        <View style={styles.tipBox}>
          <View style={styles.tipIconWrap}>
            <Text style={styles.tipIcon}>💡</Text>
          </View>

          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>สาระน่ารู้</Text>
            <Text style={styles.tipText}>
              โปรตีนช่วยให้อิ่มนานกว่าไขมันและคาร์โบไฮเดรตนะ
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F3F3',
  },
  topArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingTop: 24,
  },
  circle: {
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1.5,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    backgroundColor: '#F3F3F3',
  },
  icon: {
    fontSize: 130,
    color: '#16EF2C',
    fontFamily: 'NotoSansThaiBold',
    lineHeight: 140,
  },
  title: {
    fontSize: 30,
    color: '#000',
    fontFamily: 'NotoSansThaiBold',
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    fontFamily: 'NotoSansThaiBold',
    textAlign: 'center',
    marginBottom: 18,
  },
  progressTrack: {
    width: '86%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#DADADA',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#16EF2C',
  },
  bottomArea: {
    borderTopWidth: 1,
    borderTopColor: '#111',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 28,
    backgroundColor: '#F3F3F3',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1.2,
    borderColor: '#A7F1B0',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1E1B0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'NotoSansThaiBold',
    marginBottom: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'NotoSansThaiBold',
    lineHeight: 20,
  },
});