import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Footer from '../Components/Footer';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const DriverSetup1 = ({ navigation }) => {
  const [step, setStep] = useState(1);

  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [dob, setDob] = useState(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [gender, setGender] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  const [vehicleType, setVehicleType] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  const [licenseNumber, setLicenseNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState(null);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [licenseImage, setLicenseImage] = useState(null);

  const [agreed, setAgreed] = useState(false);

  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const auth = getAuth();
  const db = getFirestore();

  const formatDate = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-GB').format(date);
  };

  const pickImage = async (setImage) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const validateStep1 = () => {
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!phone.match(/^\d{11}$/)) return Alert.alert('Invalid Phone Number');
    if (!cnicRegex.test(cnic)) return Alert.alert('CNIC must be like 12345-1234567-1');
    if (!dob) return Alert.alert('Please select Date of Birth');
    if (!gender) return Alert.alert('Please select Gender');
    if (!profileImage) return Alert.alert('Please upload a profile picture');
    return true;
  };

  const validateStep2 = () => {
    if (!vehicleType || !vehicleBrand) return Alert.alert('Please select vehicle type and brand');
    if (!vehicleNumber.match(/^[A-Za-z0-9\-]+$/)) return Alert.alert('Enter a valid vehicle number');
    return true;
  };

  const validateStep3 = () => {
    if (!licenseNumber.match(/^\d+$/)) return Alert.alert('License number must be numeric');
    if (!expiryDate) return Alert.alert('Select expiry date');
    if (!issuingAuthority) return Alert.alert('Select issuing authority');
    if (!licenseImage) return Alert.alert('Please upload your license picture');
    return true;
  };

  const validateStep4 = () => {
    if (!agreed) {
      Alert.alert('You must accept Privacy Policy & Terms to continue.');
      return false;
    }
    return true;
  };

  const saveToFirestore = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      await setDoc(
        doc(db, 'users', user.uid),
        {
          
          profileImage, 
          phone,
          gender,
          name: user.displayName || "", 
          
          driverProfile: {
            phone,
            cnic,
            dob: dob ? dob.toISOString() : null,
            gender,
            profileImage,

            vehicleType,
            vehicleBrand,
            vehicleNumber,

            licenseNumber,
            expiryDate: expiryDate ? expiryDate.toISOString() : null,
            issuingAuthority,
            licenseImage,
          },
          setupCompleted: true,
          acceptedTerms: true,
        },
        { merge: true }
      );

      navigation.replace('DriverDashboard');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
    else if (step === 4 && validateStep4()) {
      saveToFirestore();
    }
  };

  const handleBack = () => setStep(step - 1);

  return (
    <View style={styles.container}>
     
      <View style={styles.headerWrapper}>
        <Text style={styles.title}>Drivemate</Text>
        <Text style={styles.subTitle}>Driver Setup</Text>
        <Text style={styles.smallText}>Provide your details</Text>
      </View>

     
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.formContainer}
          keyboardShouldPersistTaps="handled"
        >
         
          {step === 1 && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.toptext}>Please provide your Personal details here:</Text>
                <Text style={styles.label}>Profile Picture</Text>
                <TouchableOpacity
                  style={styles.imageUploadBox}
                  onPress={() => pickImage(setProfileImage)}
                >
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.imagePreview} />
                  ) : (
                    <Text style={styles.uploadText}>Upload Profile Picture</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="e.g. 03001234567"
                  maxLength={11}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CNIC</Text>
                <TextInput
                  style={styles.input}
                  value={cnic}
                  onChangeText={(text) => setCnic(text)}
                  placeholder="e.g. 12345-1234567-1"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowDobPicker(true)}>
                  <Text>{dob ? formatDate(dob) : 'Select date'}</Text>
                </TouchableOpacity>
                {showDobPicker && (
                  <DateTimePicker
                    value={dob || new Date()}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDobPicker(false);
                      if (selectedDate) setDob(selectedDate);
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <RNPickerSelect
                  onValueChange={setGender}
                  value={gender}
                  placeholder={{ label: 'Select Gender', value: '' }}
                  items={[
                    { label: 'Male', value: 'Male' },
                    { label: 'Female', value: 'Female' },
                    { label: 'Custom', value: 'Custom' },
                  ]}
                  style={pickerStyle}
                />
              </View>
            </>
          )}

        
          {step === 2 && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.toptext}>Please provide your Vehicle details here:</Text>
                <Text style={styles.label}>Vehicle Type</Text>
                <RNPickerSelect
                  onValueChange={setVehicleType}
                  value={vehicleType}
                  placeholder={{ label: 'Select vehicle type', value: '' }}
                  items={[
                    { label: 'Car', value: 'Car' },
                    { label: 'Bike', value: 'Bike' },
                  ]}
                  style={pickerStyle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Vehicle Brand</Text>
                <RNPickerSelect
                  onValueChange={setVehicleBrand}
                  value={vehicleBrand}
                  placeholder={{ label: 'Select brand', value: '' }}
                  items={[
                    { label: 'Honda', value: 'Honda' },
                    { label: 'Suzuki', value: 'Suzuki' },
                    { label: 'Toyota', value: 'Toyota' },
                    { label: 'KIA', value: 'KIA' },
                  ]}
                  style={pickerStyle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Vehicle Registration Number</Text>
                <TextInput
                  style={styles.input}
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                  placeholder="e.g. LHR-1234"
                />
              </View>
            </>
          )}

        
          {step === 3 && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.toptext}>Please provide your License details here:</Text>
                <Text style={styles.label}>Upload License Picture</Text>
                <TouchableOpacity
                  style={styles.imageUploadBox}
                  onPress={() => pickImage(setLicenseImage)}
                >
                  {licenseImage ? (
                    <Image source={{ uri: licenseImage }} style={styles.imagePreview} />
                  ) : (
                    <Text style={styles.uploadText}>Upload License Picture</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.label}>License Number</Text>
                <TextInput
                  style={styles.input}
                  value={licenseNumber}
                  onChangeText={(text) => setLicenseNumber(text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="Enter license number"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>License Expiry Date</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowExpiryPicker(true)}>
                  <Text>{expiryDate ? formatDate(expiryDate) : 'Select date'}</Text>
                </TouchableOpacity>
                {showExpiryPicker && (
                  <DateTimePicker
                    value={expiryDate || new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowExpiryPicker(false);
                      if (selectedDate) setExpiryDate(selectedDate);
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Issuing Authority</Text>
                <RNPickerSelect
                  onValueChange={setIssuingAuthority}
                  value={issuingAuthority}
                  placeholder={{ label: 'Select authority', value: '' }}
                  items={[
                    { label: 'Lahore', value: 'Lahore' },
                    { label: 'Karachi', value: 'Karachi' },
                    { label: 'Islamabad', value: 'Islamabad' },
                    { label: 'Peshawar', value: 'Peshawar' },
                    { label: 'Quetta', value: 'Quetta' },
                  ]}
                  style={pickerStyle}
                />
              </View>
            </>
          )}

         
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Terms & Privacy Policy</Text>

              <Text style={styles.termsIntro}>
                Please review our Privacy Policy and Terms & Conditions carefully.{"\n"}
                By continuing, you confirm that you understand how your data will be handled,
                and the rules you agree to follow while using Drivemate.{"\n"}{"\n"}
              </Text>

              <TouchableOpacity 
                style={styles.termsRow} 
                onPress={() => setAgreed(!agreed)}
              >
                <View style={[styles.checkbox, agreed && styles.checkboxChecked]} />
                <Text style={styles.termsText}>
                  I agree to the 
                  <Text 
                    style={styles.linkText} 
                    onPress={() => setShowPrivacy(true)}
                  > Privacy Policy</Text> 
                  and 
                  <Text 
                    style={styles.linkText} 
                    onPress={() => setShowTerms(true)}
                  > Terms & Conditions</Text>.
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      
      {step > 1 && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.nextText}>← Back</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextText}>{step === 4 ? 'Finish' : 'Next ➜'}</Text>
      </TouchableOpacity>

    
      <View style={styles.footerContainer}>
        <Footer />
      </View>

     
<Modal visible={showPrivacy} animationType="slide">
  <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
    <ScrollView>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
        Privacy Policy
      </Text>
      <Text style={{ lineHeight: 20 }}>
        Our application ("DriveMate / FamilyTrack") respects your privacy. 
        By using this app, you agree to the collection and use of information 
        as described in this policy.{"\n\n"}
        
        1. **Information We Collect**{"\n"}
        - Personal details: name, email, phone number, and role (Driver, Parent, Admin).{"\n"}
        - GPS data: real-time location, routes, and trip history.{"\n"}
        - Driving data: speed, acceleration, safety alerts, and accident detection.{"\n\n"}
        
        2. **How We Use Your Data**{"\n"}
        - To provide real-time driver monitoring and trip analytics.{"\n"}
        - To notify parents about overspeeding, accidents, and geo-fence violations.{"\n"}
        - To allow admins to manage users and ensure safe usage.{"\n\n"}
        
        3. **Data Sharing**{"\n"}
        - Location and driving alerts are shared only with linked parents or admins.{"\n"}
        - We do not sell or rent your data to third parties.{"\n\n"}
        
        4. **Data Security**{"\n"}
        - All data is stored securely in our system.{"\n"}
        - We take reasonable steps to protect against unauthorized access.{"\n\n"}
        
        5. **Your Rights**{"\n"}
        - You can request deletion of your data at any time by contacting support.{"\n"}
        - Parents may unlink drivers from their profile with proper authorization.{"\n\n"}
        
        By continuing to use our app, you consent to this Privacy Policy.
      </Text>
    </ScrollView>
    <TouchableOpacity style={styles.nextButton} onPress={() => setShowPrivacy(false)}>
      <Text style={styles.nextText}>Close</Text>
    </TouchableOpacity>
  </View>
</Modal>


<Modal visible={showTerms} animationType="slide">
  <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
    <ScrollView>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
        Terms & Conditions
      </Text>
      <Text style={{ lineHeight: 20 }}>
        By creating an account and using this application, you agree to the following terms:{"\n\n"}

        1. **User Responsibilities**{"\n"}
        - Drivers must provide accurate trip data and use the app safely.{"\n"}
        - Parents may monitor driver activity only for safety purposes.{"\n"}
        - Admins must manage accounts fairly and responsibly.{"\n\n"}

        2. **Location Tracking**{"\n"}
        - Drivers consent to sharing their real-time location with linked parents and admins.{"\n"}
        - Tracking will remain active during trips for safety monitoring.{"\n\n"}

        3. **Prohibited Use**{"\n"}
        - Do not misuse the app for illegal activity.{"\n"}
        - Do not attempt to hack, alter, or resell the service.{"\n\n"}

        4. **Disclaimer of Liability**{"\n"}
        - The app assists with monitoring and alerts but cannot prevent accidents.{"\n"}
        - We are not liable for inaccurate GPS data or misuse of alerts.{"\n\n"}

        5. **Account Suspension**{"\n"}
        - We reserve the right to suspend accounts that violate these terms.{"\n\n"}

        By using this app, you agree to these Terms & Conditions.
      </Text>
    </ScrollView>
    <TouchableOpacity style={styles.nextButton} onPress={() => setShowTerms(false)}>
      <Text style={styles.nextText}>Close</Text>
    </TouchableOpacity>
  </View>
</Modal>

    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerWrapper: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#1d807c',
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
  },
  title: { fontSize: 34, fontWeight: 'bold', color: '#fff' },
  subTitle: { fontSize: 20, color: '#fff', marginTop: 8 },
  toptext: { fontSize: 18, color: '#1d807c', marginBottom: 10 },
  smallText: { fontSize: 16, color: '#fff', marginTop: 6, textDecorationLine: 'underline' },
  formContainer: { 
    paddingHorizontal: 20, 
    paddingVertical: 30, 
    paddingBottom: 200
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 8, color: '#333' },
  input: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  imageUploadBox: {
    height: 120,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
  },
  imagePreview: { width: '100%', height: '100%', borderRadius: 10 },
  uploadText: { color: '#888', fontSize: 14 },
  nextButton: {
    backgroundColor: '#1d807c',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    position: 'absolute',
    bottom: 120,
    right: 20,
    elevation: 5,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: '#35a7ab',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    position: 'absolute',
    bottom: 120,  
    left: 20,
    elevation: 5,
    zIndex: 10,
  },
  nextText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#1d807c",
    marginRight: 10,
    borderRadius: 4,
  },
  checkboxChecked: { backgroundColor: '#1d807c' },
  termsText: { flex: 1, fontSize: 14, color: '#444' },
  linkText: { color: '#1d807c', fontWeight: 'bold', textDecorationLine: 'underline' },
  termsIntro: {
    fontSize: 15,
    color: "#555",
    marginBottom: 15,
    lineHeight: 22,
    textAlign: "justify",
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  }
});

const pickerStyle = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 10,
    color: 'black',
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 10,
    color: 'black',
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
};

export default DriverSetup1;