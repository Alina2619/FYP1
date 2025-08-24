import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import Footer from '../Components/Footer';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Enter a valid email address');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
     
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      if (!userCred.user.emailVerified) {
        Alert.alert('Email Not Verified', 'Please verify your email before logging in.');
        return;
      }

      
      const uid = userCred.user.uid;
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const role = userData.role;

      
        if (!role || role === 'pending') {
          navigation.replace('Setup');
        } else if (role === 'Driver') {
          navigation.replace('DriverDashboard');
        } else if (role === 'Family') {
          navigation.replace('FamilyDashboard');
        } else if (role === 'Both') {
          navigation.replace('CombinedDashboard');
        } else {
          Alert.alert('Login Error', 'Invalid role found in your account.');
        }
      } else {
        Alert.alert('Login Error', 'User data not found in database.');
      }

    } catch (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.headerWrapper}>
        <View style={styles.pinkHeader}>
          <Text style={styles.headerTitle}>Drivemate</Text>
          <Text style={styles.subTitle}>WELCOME BACK</Text>
          <Text style={styles.underline}>Login Here</Text>
        </View>
        <View style={styles.curve} />
      </View>

      <View style={styles.formContainer}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <View style={styles.buttonContainer}>
          <Button title="Login" color="#1d807c" onPress={handleLogin} />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace('SignUp')}>
          <Text style={styles.loginLink}>
            Don’t have an account? <Text style={styles.loginText}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Footer />
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  scrollContainer: {
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  headerWrapper: {
    position: 'relative',
    backgroundColor: '#1d807c',
  },
  pinkHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    backgroundColor: '#1d807c',
  },
  curve: {
    width: width,
    height: 40,
    backgroundColor: '#fff',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    marginTop: -10,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
  },
  subTitle: {
    fontSize: 20,
    color: '#fff',
    marginTop: 8,
  },
  underline: {
    fontSize: 16,
    color: '#fff',
    textDecorationLine: 'underline',
    marginTop: 6,
  },
  formContainer: {
    padding: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    marginBottom: 18,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  forgotText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  loginLink: {
    textAlign: 'center',
    color: '#444',
    fontSize: 16,
  },
  loginText: {
    fontWeight: 'bold',
    color: '#e91e63',
  },
});

export default LoginScreen;
