import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';

// กำหนดหน้าตาข้อมูลคร่าวๆ ให้ TypeScript ไม่บ่น
interface DatabaseData {
  [key: string]: any;
}

export default function HomeScreen() {
  const [data, setData] = useState<DatabaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ดึงข้อมูลจาก Backend (localhost:3000)
    fetch('http://localhost:3000/api/test-all')
      .then((response) => response.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((error) => {
        console.error("เชื่อมต่อ Backend ไม่ได้นะ:", error);
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 10 Collections Connect!</Text>
      <Text style={styles.status}>สถานะ: {data ? '✅ เชื่อมต่อสำเร็จ' : '⏳ กำลังรอข้อมูล...'}</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#00ff00" />
      ) : (
        <ScrollView style={styles.cardContainer}>
          {data && Object.keys(data).map((key) => (
            <View key={key} style={styles.card}>
              <Text style={styles.collectionName}>📂 {key}</Text>
              <Text style={styles.jsonBody}>
                {JSON.stringify(data[key], null, 2)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // พื้นหลังดำเท่ๆ
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  status: {
    color: '#00ff00',
    textAlign: 'center',
    marginVertical: 10,
  },
  cardContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff00',
  },
  collectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 8,
  },
  jsonBody: {
    fontSize: 11,
    color: '#aaa',
    fontFamily: 'monospace',
  },
});