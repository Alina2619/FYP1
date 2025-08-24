
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
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const FamilyDashboardScreen = ({ navigation }) => {
  const [familyData, setFamilyData] = useState(null);
  const [linkedProfiles, setLinkedProfiles] = useState(0);
  const [activeProfiles, setActiveProfiles] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFamilyData(null);
        setLinkedProfiles(0);
        setActiveProfiles(0);
        setLoading(false);
        return;
      }

      try {
        
        const familyRef = doc(db, 'families', user.uid);
        const familySnap = await getDoc(familyRef);

        if (familySnap.exists()) {
          const data = familySnap.data();
          setFamilyData(data);

          const profilesRef = collection(db, 'users');
          const q = query(profilesRef, where('familyId', '==', user.uid));
          const snap = await getDocs(q);

          setLinkedProfiles(snap.size);

       
          let active = 0;
          snap.forEach((doc) => {
            const profile = doc.data();
            if (profile.isDriveMode === true) active++;
          });
          setActiveProfiles(active);
        } else {
          console.log('No family document found for UID:', user.uid);
        }
      } catch (e) {
        console.error('Error fetching family dashboard data:', e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  
  const getFamilyName = () => {
    if (!familyData) return 'Family';
    return (
      familyData.name ||
      familyData.familyName ||
      familyData.displayName ||
      familyData.email?.split('@')[0] ||
      'Family'
    );
  };

  
  const getProfileImage = () => {
    if (!familyData) return null;
    return (
      familyData.profileImage ||
      familyData.photoURL ||
      familyData.avatar ||
      familyData.imageUrl ||
      null
    );
  };

  const familyName = getFamilyName();
  const profileImage = getProfileImage();

  return (
    <View style={styles.mainContainer}>
     
      <View style={styles.headerWrapper}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Drivemate</Text>
            <Text style={styles.subTitle}>Family Dashboard</Text>
          </View>

         
          <View style={styles.profileWrapper}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.profileName} numberOfLines={1}>
                  {familyName}
                </Text>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="people" size={20} color="#d63384" />
                  </View>
                )}
              </>
            )}
          </View>
        </View>
        <View style={styles.curve} />
      </View>
   
      <ScrollView contentContainerStyle={styles.scrollContainer}>
    
        <View style={styles.row}>
          <View style={[styles.box, { backgroundColor: '#f9f3f3' }]}>
            <View style={styles.textPart}>
              <Text style={styles.boxTitle}>Linked Profiles</Text>
              <Text style={styles.boxValue}>{linkedProfiles}</Text>
            </View>
            <Ionicons name="people" size={24} color="#d63384" />
          </View>

          <View style={[styles.box, { backgroundColor: '#f3f9f4' }]}>
            <View style={styles.textPart}>
              <Text style={styles.boxTitle}>Profiles In Drive Mode</Text>
              <Text style={styles.boxValue}>{activeProfiles}</Text>
            </View>
            <Ionicons name="car" size={24} color="#d63384" />
          </View>
        </View>

     
        <TouchableOpacity
          style={[styles.fullBox, { backgroundColor: '#fff8f3' }]}
          onPress={() => navigation.navigate('DriverTracking')}
        >
          <View style={styles.textPart}>
            <Text style={styles.boxTitle}>Driver Tracking</Text>
            <Text style={styles.boxValue}>Click To View</Text>
          </View>
          <Ionicons name="map" size={24} color="#d63384" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fullBox, { backgroundColor: '#f3fff7' }]}
          onPress={() => navigation.navigate('GeoFence')}
        >
          <View style={styles.textPart}>
            <Text style={styles.boxTitle}>Geo-Fence & Route</Text>
            <Text style={styles.boxValue}>Click To View</Text>
          </View>
          <Ionicons name="navigate" size={24} color="#d63384" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fullBox, { backgroundColor: '#f3f6ff' }]}
          onPress={() => navigation.navigate('FamilyAlerts')}
        >
          <View style={styles.textPart}>
            <Text style={styles.boxTitle}>Alerts & Settings</Text>
            <Text style={styles.boxValue}>Click For Alerts</Text>
          </View>
          <Ionicons name="alert-circle" size={24} color="#d63384" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fullBox, { backgroundColor: '#fff3f8' }]}
          onPress={() => navigation.navigate('ProfileLinkage')}
        >
          <View style={styles.textPart}>
            <Text style={styles.boxTitle}>Profile Linkage & Permissions</Text>
            <Text style={styles.boxValue}>Link / Manage Profiles</Text>
          </View>
          <Ionicons name="link" size={24} color="#d63384" />
        </TouchableOpacity>
      </ScrollView>

     
      <View style={styles.footerWrapper}>
        <View style={styles.footerNav}>
          <TouchableOpacity onPress={() => navigation.navigate('FamilyDashboard')}>
            <Ionicons name="home" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('DriverTracking')}>
            <Ionicons name="map" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('FamilySettings')}>
            <Ionicons name="settings" size={28} color="#fff" />
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
  headerWrapper: { position: 'relative', backgroundColor: '#d63384' }, 
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
  boxValue: { fontSize: 15, fontWeight: 'bold', color: '#d63384' },
  footerWrapper: {
    position: 'absolute',
    bottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#d63384',
    width: width * 0.92,
    borderRadius: 35,
    paddingVertical: 14,
    elevation: 6,
    shadowColor: '#ff96b6',
    shadowOpacity: 1,
    shadowRadius: 100,
    borderWidth: 5,
    borderColor: 'rgba(214,51,132,0.12)',
  },
});

export default FamilyDashboardScreen;
