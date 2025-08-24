// Screens/TripLogger.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";

import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as Location from "expo-location";
import { LineChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const TripLogger = ({ navigation }) => {
  const [isLogging, setIsLogging] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0); 
  const [distance, setDistance] = useState(0); 
  const [avgSpeed, setAvgSpeed] = useState(0); 
  const [speedData, setSpeedData] = useState([0]); 
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const watchSubRef = useRef(null);
  const lastCoordRef = useRef(null);
  const speedSumRef = useRef(0);
  const speedCountRef = useRef(0);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
        }
      } catch (e) {
        console.error('Error fetching user data:', e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  
  const getUserName = () => {
    if (!userData) return 'Driver';
    
    return userData.name || 
           userData.fullName || 
           userData.displayName ||
           `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 
           userData.email?.split('@')[0] || 
           'Driver';
  };

 
  const getProfileImage = () => {
    if (!userData) return null;
    
    return userData.profileImage || 
           userData.photoURL || 
           userData.avatar || 
           userData.imageUrl ||
           null;
  };

  const name = getUserName();
  const profileImage = getProfileImage();

 
  const toggleLogging = async () => {
    try {
      if (!isLogging) {
     
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission required",
            "Please enable location access to log trips."
          );
          return;
        }

       
        setTimeElapsed(0);
        setDistance(0);
        setAvgSpeed(0);
        setSpeedData([0]);
        startTimeRef.current = new Date();
        speedSumRef.current = 0;
        speedCountRef.current = 0;
        lastCoordRef.current = null;

    
        timerRef.current = setInterval(() => {
          if (startTimeRef.current) {
            const sec = Math.floor(
              (Date.now() - startTimeRef.current.getTime()) / 1000
            );
            setTimeElapsed(sec);
          }
        }, 1000);

       
        watchSubRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (loc) => {
            const { latitude, longitude, speed, accuracy } = loc.coords;

            if (accuracy && accuracy > 50) return; 

            const curr = { lat: latitude, lon: longitude };

           
            if (lastCoordRef.current) {
              const dKm = haversine(
                lastCoordRef.current.lat,
                lastCoordRef.current.lon,
                curr.lat,
                curr.lon
              );

           
              if (dKm >= 0.003) setDistance((prev) => prev + dKm);
            }
            lastCoordRef.current = curr;

          
            const spdKmh = Math.max(
              0,
              (Number.isFinite(speed) ? speed : 0) * 3.6
            );
            setSpeedData((prev) => {
              const next = [...prev, Number(spdKmh.toFixed(2))];
              return next.length > 20 ? next.slice(-20) : next;
            });
            speedSumRef.current += spdKmh;
            speedCountRef.current++;
            setAvgSpeed(speedSumRef.current / Math.max(1, speedCountRef.current));
          }
        );

        setIsLogging(true);
      } else {
       
        setIsLogging(false);
        if (timerRef.current) clearInterval(timerRef.current);
        if (watchSubRef.current) watchSubRef.current.remove();

       
        const trip = {
          id: Date.now().toString(),
          startTime: startTimeRef.current?.toISOString?.() || new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: timeElapsed,
          distance: Number(distance.toFixed(3)),
          avgSpeed: Number(avgSpeed.toFixed(2)),
          speedData,
        };

        try {
          const stored = await AsyncStorage.getItem("recentTrips");
          const trips = stored ? JSON.parse(stored) : [];
          trips.unshift(trip); 
          await AsyncStorage.setItem("recentTrips", JSON.stringify(trips));
          console.log("Trip saved:", trip);
        } catch (err) {
          console.error("Failed to save trip:", err);
        }

        startTimeRef.current = null;
        lastCoordRef.current = null;
      }
    } catch (err) {
      console.error("TripLogger error:", err);
      Alert.alert("Error", "Something went wrong while starting trip logging.");
    }
  };

  
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchSubRef.current) watchSubRef.current.remove();
    };
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <View style={styles.mainContainer}>
      
      <View style={styles.headerWrapper}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Drivemate</Text>
            <Text style={styles.subTitle}>Trip Logger</Text>
          </View>

       
          <View style={styles.profileWrapper}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.profileName} numberOfLines={1}>
                  {name}
                </Text>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="person" size={20} color="#1d807c" />
                  </View>
                )}
              </>
            )}
          </View>
        </View>
        <View style={styles.curve} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <TouchableOpacity
          style={[styles.fullBox, { backgroundColor: "#a9f5de" }]}
          onPress={toggleLogging}
        >
          <Ionicons
            name={isLogging ? "stop-circle" : "play-circle"}
            size={32}
            color="#1d807c"
            style={styles.iconLeft}
          />
          <Text style={styles.boxTitle}>
            {isLogging ? "Stop Logging" : "Start Logging"}
          </Text>
        </TouchableOpacity>

   
        {isLogging && (
          <View style={[styles.fullBox, { backgroundColor: "#a1dbff" }]}>
            <Ionicons name="time" size={28} color="#1d807c" style={styles.iconLeft} />
            <View>
              <Text style={styles.boxTitle}>Trip Duration</Text>
              <Text style={styles.boxValue}>{formatTime(timeElapsed)}</Text>
            </View>
          </View>
        )}

       
        <View style={[styles.fullBox, { backgroundColor: "#deb9fa" }]}>
          <Ionicons name="car-sport" size={28} color="#1d807c" style={styles.iconLeft} />
          <View>
            <Text style={styles.boxTitle}>Distance Travelled</Text>
            <Text style={styles.boxValue}>{distance.toFixed(3)} km</Text>
          </View>
        </View>

     
        <View style={[styles.fullBox, { backgroundColor: "#f7c8e5" }]}>
          <FontAwesome5
            name="tachometer-alt"
            size={26}
            color="#1d807c"
            style={styles.iconLeft}
          />
          <View>
            <Text style={styles.boxTitle}>Average Speed</Text>
            <Text style={styles.boxValue}>{avgSpeed.toFixed(2)} km/h</Text>
          </View>
        </View>

      
        <View style={styles.container}>
          <Text style={styles.label}>Speed Analysis</Text>
          <LineChart
            data={{
              labels: speedData.map((_, i) => i.toString()),
              datasets: [{ data: speedData }],
            }}
            width={Dimensions.get("window").width - 40}
            height={180}
            chartConfig={{
              backgroundColor: "#e0f7f5",
              backgroundGradientFrom: "#e0f7f5",
              backgroundGradientTo: "#e0f7f5",
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(29, 128, 124, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              propsForDots: { r: "3", strokeWidth: "2", stroke: "#1d807c" },
            }}
            bezier
            style={{ borderRadius: 16, alignSelf: "center", marginTop: 10 }}
          />
        </View>

 
        <View style={[styles.card, { backgroundColor: "#f4f3ff" }]}>
          <Text style={styles.sectionTitle}>Behavioral Insights</Text>
          <View style={styles.insightRow}>
            <View style={styles.insightBox}>
              <Ionicons name="speedometer" size={22} color="#1d807c" />
              <Text style={styles.insightValue}>{deriveAdherence(speedData)}%</Text>
              <Text style={styles.insightLabel}>Speed Adherence</Text>
            </View>
            <View style={styles.insightBox}>
              <Ionicons name="hand-left-outline" size={22} color="#1d807c" />
              <Text style={styles.insightValue}>{estimateHardBrakes(speedData)}</Text>
              <Text style={styles.insightLabel}>Hard Brakes</Text>
            </View>
            <View style={styles.insightBox}>
              <Ionicons name="flash-outline" size={22} color="#1d807c" />
              <Text style={styles.insightValue}>{estimateRapidAccel(speedData)}</Text>
              <Text style={styles.insightLabel}>Rapid Accel</Text>
            </View>
            <View style={styles.insightBox}>
              <Ionicons name="happy-outline" size={22} color="#1d807c" />
              <Text style={styles.insightValue}>{deriveSmoothScore(speedData)}%</Text>
              <Text style={styles.insightLabel}>Smooth Score</Text>
            </View>
          </View>
        </View>
      </ScrollView>

 
      <View style={styles.footerWrapper}>
        <View style={styles.footerNav}>
          <TouchableOpacity onPress={() => navigation.navigate("DriverDashboard")}>
            <Ionicons name="home" size={28} color="#000000ff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("AI")}>
            <Ionicons name="mic" size={28} color="#000000ff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("DriverSettings")}>
            <Ionicons name="settings" size={28} color="#000000ff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};


function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function estimateHardBrakes(speeds) {
  return speeds.filter((s, i) => i > 0 && speeds[i - 1] - s > 12).length;
}
function estimateRapidAccel(speeds) {
  return speeds.filter((s, i) => i > 0 && s - speeds[i - 1] > 3).length;
}
function deriveSmoothScore(speeds) {
  if (!speeds.length) return 100;
  let jerkiness = 0;
  for (let i = 1; i < speeds.length; i++)
    jerkiness += Math.abs(speeds[i] - speeds[i - 1]);
  return Math.round(Math.max(0, 100 - jerkiness));
}
function deriveAdherence(speeds) {
  if (!speeds.length) return 100;
  const ok = speeds.filter((s) => s <= 85).length;
  return Math.round((ok / speeds.length) * 100);
}


const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { paddingBottom: 120 },
  headerWrapper: { 
    position: 'relative', 
    backgroundColor: "#1d807c" 
  },
  headerContent: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  curve: {
    width,
    height: 30,
    backgroundColor: "#fff",
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    marginTop: -10,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subTitle: { fontSize: 14, color: "#fff", marginTop: 2 },
  profileWrapper: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center',
    maxWidth: '40%',
  },
  profileName: { 
    color: '#fff', 
    marginLeft: 8, 
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 100,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 20,
    marginHorizontal: 18,
    marginBottom: 12,
  },
  boxTitle: { fontSize: 15, color: "#555", fontWeight: "600" },
  boxValue: { fontSize: 15, fontWeight: "bold", color: "#1d807c", marginTop: 4 },
  iconLeft: { marginRight: 12 },
  card: {
    marginHorizontal: 18,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12, color: "#333" },
  insightRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  insightBox: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  insightValue: { fontSize: 15, fontWeight: "bold", color: "#1d807c", marginTop: 4 },
  insightLabel: { fontSize: 12, color: "#555", marginTop: 2 },
  footerWrapper: {
    position: 'absolute',
    bottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1d807c',
    width: width * 0.92,
    borderRadius: 35,
    paddingVertical: 14,
    elevation: 6,
    shadowColor: '#21eba7ff',
    shadowOpacity: 1,
    shadowRadius: 100,
    borderWidth: 5.0,
    borderColor: 'rgba(214,51,132,0.12)',
  },
});

export default TripLogger;