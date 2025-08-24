import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import Footer from '../Components/Footer';

const SignUpScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const db = getFirestore();

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Enter a valid email address');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPass) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName,
        lastName,
        email,
        role: "pending",
        createdAt: new Date().toISOString(),
      });

      await sendEmailVerification(user);
      Alert.alert('Verify Email', 'A verification email has been sent. Please verify within 5 minutes.');

      navigation.navigate('EmailVerification', { uid: user.uid, email: user.email });

      setTimeout(async () => {
        await user.reload();
        if (!user.emailVerified) {
          await user.delete();
          Alert.alert('Timeout', 'You did not verify in time. Please register again.');
        }
      }, 5 * 60 * 1000);
    } catch (error) {
      Alert.alert('Signup Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
      
          <View style={styles.headerWrapper}>
            <View style={styles.pinkHeader}>
              <Text style={styles.headerTitle}>Drivemate</Text>
              <Text style={styles.subTitle}>CREATE ACCOUNT</Text>
              <Text style={styles.underline}>Sign Up Here</Text>
            </View>
            <View style={styles.curve} />
          </View>

          <View style={styles.formContainer}>
            <TextInput
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
              returnKeyType="next"
            />
            <TextInput
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
              returnKeyType="next"
            />
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              returnKeyType="next"
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              returnKeyType="next"
            />
            <TextInput
              placeholder="Confirm Password"
              value={confirmPass}
              onChangeText={setConfirmPass}
              secureTextEntry
              style={styles.input}
              returnKeyType="done"
            />

            <View style={styles.buttonContainer}>
              <Button title="Sign Up" color="#1d807c" onPress={handleSignup} />
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>
                Already have an account? <Text style={styles.loginText}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

   
      <View style={styles.footerFixed}>
        <Footer />
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  scrollContent: { 
    flexGrow: 1,
    paddingBottom: 70 
  },
  headerWrapper: { 
    position: 'relative', 
    backgroundColor: '#1d807c' 
  },
  pinkHeader: { 
    paddingTop: 60, 
    paddingBottom: 30, 
    alignItems: 'center', 
    backgroundColor: '#1d807c' 
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
    color: '#fff' 
  },
  subTitle: { 
    fontSize: 20, 
    color: '#fff', 
    marginTop: 8 
  },
  underline: { 
    fontSize: 16, 
    color: '#fff', 
    textDecorationLine: 'underline', 
    marginTop: 6 
  },
  formContainer: { 
    padding: 24 
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
    overflow: 'hidden' 
  },
  loginLink: { 
    textAlign: 'center', 
    color: '#444', 
    fontSize: 16 
  },
  loginText: { 
    fontWeight: 'bold', 
    color: '#e91e63' 
  },
  footerFixed: {
    position: 'absolute',
    left: 0, 
    right: 0, 
    bottom: 0,
    backgroundColor: '#fff',
  },
});

export default SignUpScreen;