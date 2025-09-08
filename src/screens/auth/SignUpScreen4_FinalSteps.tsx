import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface SignUpScreen4_FinalStepsProps {
  userRole: 'Pet Owner' | 'Pet Sitter';
  selectedPetTypes: ('dogs' | 'cats')[];
  selectedBreeds: string[];
  onComplete: (user: any) => void;
  onBack?: () => void;
}

const SignUpScreen4_FinalSteps: React.FC<SignUpScreen4_FinalStepsProps> = ({ 
  userRole, 
  selectedPetTypes, 
  selectedBreeds, 
  onComplete, 
  onBack 
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');
  const [address, setAddress] = useState('');
  const [experience, setExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [showPassword, setShowPassword] = useState(true);
  const [showConfirmPassword, setShowConfirmPassword] = useState(true);

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return 'weak';
    if (score <= 3) return 'medium';
    return 'strong';
  };

  const getPasswordStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return '#FF6B6B';
      case 'medium': return '#FFA726';
      case 'strong': return '#4CAF50';
      default: return '#FF6B6B';
    }
  };

  const getPasswordStrengthText = (strength: string) => {
    switch (strength) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      default: return 'Weak';
    }
  };

  const isFormValid = () => {
    const baseValidation = firstName.trim() && 
           lastName.trim() && 
           email.trim() && 
           password.trim() && 
           confirmPassword.trim() && 
           phone.trim() && 
           age.trim() && 
           address.trim() &&
           password === confirmPassword &&
           password.length >= 8;
    
    // For pet sitters, also require experience
    if (userRole === 'Pet Sitter') {
      return baseValidation && experience.trim();
    }
    
    return baseValidation;
  };

  const handleComplete = async () => {
    console.log('Step 4 - Final registration data:', { firstName, lastName, email, phone, age, gender, address });
    
    if (!isFormValid()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (parseInt(age) < 1 || parseInt(age) > 120) {
      Alert.alert('Error', 'Please enter a valid age (1-120)');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const user = {
        id: '1',
        firstName,
        lastName,
        email,
        password,
        phone,
        age: parseInt(age),
        address,
        gender,
        userRole,
        selectedPetTypes,
        selectedBreeds,
        experience: userRole === 'Pet Sitter' ? experience : '',
        hourlyRate: userRole === 'Pet Sitter' ? hourlyRate : '',
        specialties: userRole === 'Pet Sitter' ? specialties : [],
        isVerified: false,
        verificationPending: userRole === 'Pet Sitter',
        createdAt: new Date().toISOString(),
      };

      onComplete(user);
    } catch (error) {
      Alert.alert('Registration Failed', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      )}
      <Text style={styles.progressText}>4/4</Text>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Image source={require('../../assets/images/logo.png')} style={styles.logoImage} />
          </View>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.description}>
            Please provide your personal information and create your login credentials to complete your registration.
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number (e.g., 09123456789)"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Age *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your age"
                placeholderTextColor="#999"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                  onPress={() => setGender('male')}
                >
                  <Ionicons 
                    name="male" 
                    size={20} 
                    color={gender === 'male' ? '#fff' : '#666'} 
                  />
                  <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                  onPress={() => setGender('female')}
                >
                  <Ionicons 
                    name="female" 
                    size={20} 
                    color={gender === 'female' ? '#fff' : '#666'} 
                  />
                  <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>
                    Female
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderButton, gender === 'other' && styles.genderButtonActive]}
                  onPress={() => setGender('other')}
                >
                  <Ionicons 
                    name="person" 
                    size={20} 
                    color={gender === 'other' ? '#fff' : '#666'} 
                  />
                  <Text style={[styles.genderButtonText, gender === 'other' && styles.genderButtonTextActive]}>
                    Other
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your address"
                placeholderTextColor="#999"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Pet Sitter Specific Fields */}
            {userRole === 'Pet Sitter' && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Hourly Rate (₱)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your hourly rate (e.g., 250)"
                    placeholderTextColor="#999"
                    value={hourlyRate}
                    onChangeText={setHourlyRate}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Experience (Years) *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="How many years of pet sitting experience do you have? (e.g., 3 years, 1.5 years, 6 months)"
                    placeholderTextColor="#999"
                    value={experience}
                    onChangeText={setExperience}
                    multiline
                    numberOfLines={3}
                  />
                  {userRole === 'Pet Sitter' && experience.length === 0 && (
                    <Text style={styles.errorText}>Experience is required for pet sitters</Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Specialties</Text>
                  <View style={styles.specialtiesContainer}>
                    {specialties.map((specialty, index) => (
                      <View key={index} style={styles.specialtyTag}>
                        <Text style={styles.specialtyText}>{specialty}</Text>
                        <TouchableOpacity
                          style={styles.removeSpecialtyButton}
                          onPress={() => setSpecialties(specialties.filter((_, i) => i !== index))}
                        >
                          <Ionicons name="close" size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  <View style={styles.addSpecialtyContainer}>
                    <TextInput
                      style={styles.specialtyInput}
                      placeholder="Add a specialty (e.g., Dog training, Cat care, Overnight sitting)"
                      placeholderTextColor="#999"
                      value={newSpecialty}
                      onChangeText={setNewSpecialty}
                      onSubmitEditing={() => {
                        if (newSpecialty.trim()) {
                          setSpecialties([...specialties, newSpecialty.trim()]);
                          setNewSpecialty('');
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={[styles.addSpecialtyButton, !newSpecialty.trim() && styles.disabledAddButton]}
                      onPress={() => {
                        if (newSpecialty.trim()) {
                          setSpecialties([...specialties, newSpecialty.trim()]);
                          setNewSpecialty('');
                        }
                      }}
                      disabled={!newSpecialty.trim()}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Create a password (min. 8 characters)"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordStrength(checkPasswordStrength(text));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="none"
                  spellCheck={false}
                  editable={true}
                  contextMenuHidden={true}
                  dataDetectorTypes="none"
                  caretHidden={false}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
              
              {password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.strengthBar}>
                    <View 
                      style={[
                        styles.strengthFill, 
                        { 
                          width: `${passwordStrength === 'weak' ? 33 : passwordStrength === 'medium' ? 66 : 100}%`,
                          backgroundColor: getPasswordStrengthColor(passwordStrength)
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[
                    styles.strengthText, 
                    { color: getPasswordStrengthColor(passwordStrength) }
                  ]}>
                    {getPasswordStrengthText(passwordStrength)}
                  </Text>
                  
                  <View style={styles.requirementsContainer}>
                    <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                    <Text style={[styles.requirementText, password.length >= 8 && styles.requirementMet]}>
                      • At least 8 characters {password.length >= 8 ? '✓' : ''}
                    </Text>
                    <Text style={[styles.requirementText, /[a-z]/.test(password) && styles.requirementMet]}>
                      • Lowercase letter {/[a-z]/.test(password) ? '✓' : ''}
                    </Text>
                    <Text style={[styles.requirementText, /[A-Z]/.test(password) && styles.requirementMet]}>
                      • Uppercase letter {/[A-Z]/.test(password) ? '✓' : ''}
                    </Text>
                    <Text style={[styles.requirementText, /[0-9]/.test(password) && styles.requirementMet]}>
                      • Number {/[0-9]/.test(password) ? '✓' : ''}
                    </Text>
                    <Text style={[styles.requirementText, /[^A-Za-z0-9]/.test(password) && styles.requirementMet]}>
                      • Special character {/[^A-Za-z0-9]/.test(password) ? '✓' : ''}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirm your password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="none"
                  spellCheck={false}
                  editable={true}
                  contextMenuHidden={true}
                  dataDetectorTypes="none"
                  caretHidden={false}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
              
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
              
              {confirmPassword.length > 0 && password === confirmPassword && password.length >= 8 && (
                <Text style={styles.successText}>✓ Passwords match</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.continueButton, (!isFormValid() || isLoading) && styles.disabledButton]}
          onPress={handleComplete}
          disabled={!isFormValid() || isLoading}
        >
          <Text style={styles.continueButtonText}>
            {isLoading 
              ? 'Creating Account...' 
              : 'Complete Registration'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  progressText: {
    alignSelf: 'flex-end',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formSection: {
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginLeft: 4,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#F0F0F0',
  },
  inputContainer: {
    marginBottom: 28,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginLeft: 4,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 56,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    paddingRight: 10,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 8,
  },
  passwordStrengthContainer: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  strengthBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 5,
    fontWeight: '500',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 5,
    fontWeight: '500',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 56,
  },
  genderButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.3,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  buttonContainer: {
    width: '85%',
    marginBottom: 40,
    alignSelf: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  continueButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E67E22',
  },
  disabledButton: {
    backgroundColor: '#FFD7A0',
    shadowOpacity: 0.1,
    borderColor: '#FFE4B3',
    opacity: 0.7,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  requirementsContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  requirementMet: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 10,
  },
  specialtyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#C0C0C0',
  },
  specialtyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  removeSpecialtyButton: {
    padding: 4,
  },
  addSpecialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 10,
  },
  specialtyInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 56,
    color: '#333',
  },
  addSpecialtyButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginLeft: 10,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledAddButton: {
    backgroundColor: '#E0E0E0',
    opacity: 0.7,
  },
});

export default SignUpScreen4_FinalSteps;