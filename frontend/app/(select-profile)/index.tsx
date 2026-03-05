import { API_BASE_URL } from '@/constants/config';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import useAppStore, { AppProfile, numToAgeGroup } from '@/store/useAppStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_GAP = Spacing.md;
const CARD_SIZE = (width - Spacing.xl * 2 - CARD_GAP) / 2;

const AVATAR_COLORS = ['#C5DDB8', '#F4C2C2', '#C5D5EA', '#FFDAB9', '#D4C5EA', '#B8D4C8'];
const avatarColor = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length];

function getEmoji(age: number, isChild: boolean): string {
  if (!isChild) return '👤';
  if (age <= 3) return '👶';
  if (age <= 10) return '🧒';
  return '🧑';
}

function ProfileCard({ profile, index, onPress }: { profile: AppProfile; index: number; onPress: () => void }) {
  const isChild = profile.accountType === 'CHILD';
  return (
    <TouchableOpacity style={[s.card, { width: CARD_SIZE }]} activeOpacity={0.78} onPress={onPress}>
      <View style={[s.avatar, { backgroundColor: avatarColor(index) }]}>
        <Text style={s.avatarEmoji}>{getEmoji(profile.age, isChild)}</Text>
      </View>
      <Text style={s.profileName} numberOfLines={1}>{profile.name}</Text>
      <View style={[s.badge, { backgroundColor: isChild ? Colors.browseSurface : Colors.accentSageLight }]}>
        <Text style={[s.badgeText, { color: isChild ? Colors.accentPeriwinkle : Colors.accentSage }]}>
          {isChild ? (profile.ageGroup ? `Age ${profile.ageGroup}` : `Age ${profile.age}`) : 'Account'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function AddProfileCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={[s.card, s.addCard, { width: CARD_SIZE }]} activeOpacity={0.78} onPress={onPress}>
      <View style={s.addCircle}><Text style={s.addPlus}>＋</Text></View>
      <Text style={s.addLabel}>Add Profile</Text>
    </TouchableOpacity>
  );
}

export default function SelectProfileScreen() {
  const router = useRouter();
  const { profiles, clearAuth, addProfile, userId, token } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSelectProfile = (profile: AppProfile) => {
    if (profile.accountType === 'CHILD') {
      router.replace('/(child)');
    } else {
      router.replace('/(user)');
    }
  };

  const handleSignOut = async () => {
    await clearAuth();
    router.replace('/(auth)/welcome');
  };

  const handleAddProfile = async () => {
    if (!name.trim()) { setError('Please enter a name.'); return; }
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) { setError('Please enter a valid age.'); return; }
    setError('');
    setSaving(true);
    const ageGroup = numToAgeGroup(ageNum);

    try {
      // Try to add to backend
      const res = await fetch(`${API_BASE_URL}/users/${userId}/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), ageGroup }),
      });
      const json = await res.json();
      const backendProfile = json?.data?.profile;
      await addProfile({
        profileId: backendProfile?.profileId ?? String(Date.now() + Math.random()),
        name: name.trim(),
        accountType: 'CHILD',
        ageGroup,
        age: ageNum,
      });
    } catch {
      // Add locally even if backend fails
      await addProfile({
        profileId: String(Date.now() + Math.random()),
        name: name.trim(),
        accountType: 'CHILD',
        ageGroup,
        age: ageNum,
      });
    } finally {
      setSaving(false);
      setName('');
      setAge('');
      setModalVisible(false);
    }
  };

  type ListItem = AppProfile | { id: '__add__' };
  const data: ListItem[] = [...profiles, { id: '__add__' } as any];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.owl}>🦉</Text>
        <Text style={s.title}>Who's reading{'\n'}today?</Text>
        <Text style={s.subtitle}>Choose a profile to continue</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => (item as any).profileId ?? (item as any).id}
        numColumns={2}
        columnWrapperStyle={{ gap: CARD_GAP, justifyContent: 'center' }}
        contentContainerStyle={s.grid}
        renderItem={({ item, index }) =>
          (item as any).id === '__add__' ? (
            <AddProfileCard onPress={() => { setError(''); setModalVisible(true); }} />
          ) : (
            <ProfileCard
              profile={item as AppProfile}
              index={index}
              onPress={() => handleSelectProfile(item as AppProfile)}
            />
          )
        }
      />

      <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
        <Text style={s.signOutText}>← Sign out</Text>
      </TouchableOpacity>

      {/* ── Add Profile Modal ── */}
      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={s.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={s.modalCenter}
            >
              <View style={s.modalCard}>
                <Text style={s.modalTitle}>Add a profile</Text>
                <Text style={s.modalSubtitle}>For a child or another family member</Text>

                <View style={{ gap: Spacing.xs }}>
                  <Text style={s.label}>Name</Text>
                  <TextInput
                    style={s.input}
                    placeholder="e.g. Aarav"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="words"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={{ gap: Spacing.xs }}>
                  <Text style={s.label}>Age</Text>
                  <TextInput
                    style={s.input}
                    placeholder="e.g. 8"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={age}
                    onChangeText={setAge}
                  />
                </View>

                {error ? <Text style={s.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={[s.btnPrimary, saving && { opacity: 0.7 }]}
                  activeOpacity={0.82}
                  onPress={handleAddProfile}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color={Colors.buttonPrimaryText} />
                    : <Text style={s.btnPrimaryText}>Add Profile</Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.btnCancel}
                  onPress={() => { setModalVisible(false); setError(''); setName(''); setAge(''); }}
                >
                  <Text style={s.btnCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, alignItems: 'center' },
  owl: { fontSize: 48, marginBottom: Spacing.sm },
  title: { fontSize: Typography.display, fontWeight: '800', color: Colors.accentSage, textAlign: 'center', lineHeight: 36 },
  subtitle: { fontSize: Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  grid: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, gap: CARD_GAP },
  card: { backgroundColor: Colors.card, borderRadius: Radius.xl, alignItems: 'center', paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder },
  avatar: { width: 72, height: 72, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  avatarEmoji: { fontSize: 36 },
  profileName: { fontSize: Typography.body, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  badge: { borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { fontSize: Typography.label - 1, fontWeight: '700' },
  addCard: { borderWidth: 1.5, borderColor: Colors.accentSage, borderStyle: 'dashed', backgroundColor: Colors.background },
  addCircle: { width: 72, height: 72, borderRadius: Radius.full, backgroundColor: Colors.accentSageLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  addPlus: { fontSize: 32, color: Colors.accentSage, fontWeight: '300' },
  addLabel: { fontSize: Typography.body, fontWeight: '700', color: Colors.accentSage },
  signOutBtn: { alignSelf: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  signOutText: { fontSize: Typography.body, color: Colors.textSecondary, fontWeight: '600' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCenter: { width: '100%', alignItems: 'center' },
  modalCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.xl,
    width: width - Spacing.xl * 2, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  modalTitle: { fontSize: Typography.title, fontWeight: '800', color: Colors.accentSage, textAlign: 'center' },
  modalSubtitle: { fontSize: Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  label: { fontSize: Typography.label, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    backgroundColor: Colors.background, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: Typography.body, color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.cardBorder,
  },
  errorText: { fontSize: Typography.label, color: Colors.error, textAlign: 'center' },
  btnPrimary: { backgroundColor: Colors.buttonPrimary, borderRadius: Radius.full, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText: { fontSize: Typography.body, fontWeight: '700', color: Colors.buttonPrimaryText },
  btnCancel: { borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.cardBorder },
  btnCancelText: { fontSize: Typography.body, fontWeight: '600', color: Colors.textSecondary },
});

