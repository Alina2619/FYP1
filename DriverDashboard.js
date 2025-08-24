import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const DriverDashboardScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [recentTrip, setRecentTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  // Format time from seconds to readable format
  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  useEffect(() => {
    const auth = getAuth();
    let unsubscribeTrips = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserData(null);
        setRecentTrip(null);
        setLoading(false);
        if (unsubscribeTrips) unsubscribeTrips();
        return;
      }

      try {
        // ✅ Fetch user data
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }

        // ✅ Real-time listener for recent trip - FIXED QUERY
        const tripsRef = collection(db, 'Trips');
        const q = query(
          tripsRef,
          where("driverId", "==", user.uid),
          orderBy("timestamp", "desc"), // Order by timestamp to get the most recent
          limit(1)
        );

        if (unsubscribeTrips) unsubscribeTrips(); // cleanup previous
        unsubscribeTrips = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            setRecentTrip(snapshot.docs[0].data());
          } else {
            setRecentTrip(null);
          }
          setLoading(false);
        }, (error) => {
          console.error('Error fetching trips:', error);
          setLoading(false);
        });
      } catch (e) {
        console.error('Error fetching user/trip data:', e);
        setLoading(false);
      }
    });

    // ✅ cleanup both
    return () => {
      unsubAuth();
      if (unsubscribeTrips) unsubscribeTrips();
    };
  }, []);

  // ✅ Build name from all possible field names
  const getUserName = () => {
    if (!userData) return 'Driver';

    return (
      userData.name ||
      userData.fullName ||
      userData.displayName ||
      `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
      userData.email?.split('@')[0] ||
      'Driver'
    );
  };

  // ✅ Get profile image from all possible field names
  const getProfileImage = () => {
    if (!userData) return null;

    return (
      userData.profileImage ||
      userData.photoURL ||
      userData.avatar ||
      userData.imageUrl ||
      null
    );
  };

  const name = getUserName();
  const profileImage = getProfileImage();
  const kmDriven = userData?.kmDriven ?? '0';
  const safetyScore = userData?.safetyScore ?? '0';
  const ecoDrive = userData?.ecoDrive ?? '0';

  return (
    <View style={styles.mainContainer}>
      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Drivemate</Text>
            <Text style={styles.subTitle}>Driver Dashboard</Text>
          </View>

          {/* Profile Section */}
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

      {/* CONTENT */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Row 1 (Stats from DB only) */}
        <View style={styles.row}>
          <View style={[styles.box, { backgroundColor: '#f9f3f3' }]}>
            <View style={styles.textPart}>
              <Text style={styles.boxTitle}>KM Driven</Text>
              <Text style={styles.boxValue}>
                {kmDriven !== '' ? `${kmDriven} km` : '0 km'}
              </Text>
            </View>
            <Ionicons name="speedometer" size={24} color="#1d807c" />
          </View>

          <View style={[styles.box, { backgroundColor: '#f3f9f4' }]}>
            <View style={styles.textPart}>
              <Text style={styles.boxTitle}>Safety Score</Text>
              <Text style={styles.boxValue}>
                {safetyScore !== '' ? `${safetyScore}%` : '0%'}
              </Text>
            </View>
            <Ionicons name="shield-checkmark" size={24} color="#1d807c" />
          </View>

          <View style={[styles.box, { backgroundColor: '#f3f6f9' }]}>
            <View style={styles.textPart}>
              <Text style={styles.boxTitle}>Eco Drive</Text>
              <Text style={styles.boxValue}>
                {ecoDrive !== '' ? `${ecoDrive}%` : '0%'}
              </Text>
            </View>
            <Ionicons name="leaf" size={24} color="#1d807c" />
          </View>
        </View>

        {/* Full Boxes */}
        <TouchableOpacity
          style={[styles.fullBox, { backgroundColor: '#fff8f3' }]}
          onPress={() => navigation.navigate('TripLogger')}
        >
          <View style={styles.textPart}>
            <Text style={styles.boxTitle}>Trip Logger</Text>
            <Text style={styles.boxValue}>Start Logging</Text>
          </View>
          <Ionicons name="car" size={24} color="#1d807c" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fullBox, { backgroundColor: '#f3fff7' }]}
          onPress={() => navigation.navigate('Analytics')}
        >
          <View style={styles.textPart}>
            <Text style={styles.boxTitle}>Analytics</Text>
            <Text style={styles.boxValue}>View Stats</Text>
          </View>
          <Ionicons name="stats-chart" size={24} color="#1d807c" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fullBox, { backgroundColor: '#f3f6ff' }]}
          onPress={() => navigation.navigate('Emergency')}
        >
          <View style={styles.textPart}>
            <Text style={styles.boxTitle}>Emergency</Text>
            <Text style={styles.boxValue}>Call Now</Text>
          </View>
          <Ionicons name="alert-circle" size={24} color="#1d807c" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fullBox, { backgroundColor: '#fff3f8' }]}
          onPress={() => navigation.navigate('DriveMode')}
        >
          <View style={styles.textPart}>
            <Text style={styles.boxTitle}>Drive Mode</Text>
            <Text style={styles.boxValue}>Enabled</Text>
          </View>
          <Ionicons name="navigate-circle" size={24} color="#1d807c" />
        </TouchableOpacity>

        {/* Recent Trip */}
        <View style={[styles.fullBox, styles.recentTripBox]}>
          <View style={styles.textPart}>
            <Text style={styles.boxTitle}>Recent Trip</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#1d807c" />
            ) : recentTrip ? (
              <>
                <Text style={styles.recentTripText}>
                  Duration: {formatTime(recentTrip.duration)}
                </Text>
                <Text style={styles.recentTripText}>
                  Distance: {recentTrip.distance ? `${recentTrip.distance.toFixed(2)} km` : 'N/A'}
                </Text>
                <Text style={styles.recentTripText}>
                  Avg Speed: {recentTrip.avgSpeed ? `${recentTrip.avgSpeed.toFixed(1)} km/h` : 'N/A'}
                </Text>
                <Text style={[styles.recentTripText, { fontStyle: 'italic', fontSize: 12 }]}>
                  {recentTrip.timestamp ? new Date(recentTrip.timestamp.toDate()).toLocaleDateString() : ''}
                </Text>
              </>
            ) : (
              <Text style={styles.recentTripText}>No recent trip recorded</Text>
            )}
          </View>
          <Ionicons name="map" size={26} color="#1d807c" />
        </View>
      </ScrollView>

      {/* FOOTER NAVIGATION */}
      <View style={styles.footerWrapper}>
        <View style={styles.footerNav}>
          <TouchableOpacity onPress={() => navigation.navigate('DriverDashboard')}>
            <Ionicons name="home" size={28} color="#000000ff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AI')}>
            <Ionicons name="mic" size={28} color="#000000ff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('DriverSettings')}>
            <Ionicons name="settings" size={28} color="#000000ff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { paddingBottom: 120 },
  headerWrapper: { position: 'relative', backgroundColor: '#1d807c' },
  headerContent: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  curve: {
    width: width,
    height: 30,
    backgroundColor: '#fff',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    marginTop: -10,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subTitle: { fontSize: 14, color: '#fff', marginTop: 2 },
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  box: {
    flex: 1,
    marginHorizontal: 4,
    padding: 14,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 70,
  },
  fullBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    marginHorizontal: 18,
    marginBottom: 12,
    minHeight: 90,
  },
  textPart: { flex: 1, alignItems: 'flex-start' },
  boxTitle: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
    marginBottom: 2,
  },
  boxValue: { fontSize: 15, fontWeight: 'bold', color: '#1d807c' },
  recentTripBox: { backgroundColor: '#f4f3ff', paddingVertical: 16 },
  recentTripText: { fontSize: 13, color: '#333', marginTop: 3 },
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

export default DriverDashboardScreen;