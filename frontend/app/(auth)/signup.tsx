import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { API_BASE_URL } from '@/constants/config';
import useAppStore, { AppRole, numToAgeGroup, AppProfile } from '@/store/useAppStore';

type Role = 'user' | 'librarian' | 'admin';
interface ProfileForm { name: string; age: string; }

const ROLES: { id: Role; emoji: string; title: string; desc: string; tint: string }[] = [
  { id: 'user',     emoji: '📖', title: 'Reader',    desc: 'Browse and order books for your family.', tint: Colors.userTint },
  { id: 'librarian',emoji: '📚', title: 'Librarian', desc: 'Manage inventory, issues and returns.',   tint: Colors.librarianTint },
  { id: 'admin',    emoji: '🏛️', title: 'Admin',     desc: 'Oversee all branches and analytics.',     tint: Colors.adminTint },
];

function StepIndicator({ total, current }: { total: number; current: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: Spacing.xl }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[st.dot,
          i < current ? st.dotDone : i === current ? st.dotActive : st.dotInactive]} />
      ))}
    </View>
  );
}

function StepRole({ selected, onSelect, onNext }: { selected: Role | null; onSelect: (r: Role) => void; onNext: () => void }) {
  return (
    <View style={{ gap: Spacing.md }}>
      <Text style={st.stepTitle}>I am a…</Text>
      <Text style={st.stepSubtitle}>Choose the account type that describes you.</Text>
      {ROLES.map(role => (
        <TouchableOpacity key={role.id}
          style={[st.roleCard, { backgroundColor: role.tint }, selected === role.id && st.roleCardSelected]}
          activeOpacity={0.8} onPress={() => onSelect(role.id)}>
          <Text style={st.roleEmoji}>{role.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.roleTitle}>{role.title}</Text>
            <Text style={st.roleDesc}>{role.desc}</Text>
          </View>
          {selected === role.id && <Text style={st.roleTick}>✓</Text>}
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={[st.btnPrimary, !selected && st.btnDisabled]}
        activeOpacity={0.82} onPress={onNext} disabled={!selected}>
        <Text style={st.btnPrimaryText}>Continue →</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepDetails({ form, onChange, onNext, onBack, error }: {
  form: { name: string; email: string; phone: string; password: string; confirm: string };
  onChange: (key: string, val: string) => void;
  onNext: () => void; onBack: () => void; error: string;
}) {
  const [showPw, setShowPw] = useState(false);
  const fields = [
    { key: 'name',    label: 'Full Name',       placeholder: 'Your name',          keyboard: 'default' },
    { key: 'email',   label: 'Email address',   placeholder: 'you@example.com',    keyboard: 'email-address' },
    { key: 'phone',   label: 'Phone number',    placeholder: '+91 99999 99999',    keyboard: 'phone-pad' },
    { key: 'password',label: 'Password',        placeholder: 'Min. 6 characters',  keyboard: 'default', secure: true },
    { key: 'confirm', label: 'Confirm Password',placeholder: 'Repeat password',    keyboard: 'default', secure: true },
  ];
  return (
    <View style={{ gap: Spacing.md }}>
      <Text style={st.stepTitle}>Create account</Text>
      <Text style={st.stepSubtitle}>Fill in your details to get started.</Text>
      {fields.map(f => (
        <View key={f.key} style={{ gap: Spacing.xs }}>
          <Text style={st.label}>{f.label}</Text>
          <TextInput style={st.input} placeholder={f.placeholder} placeholderTextColor={Colors.textMuted}
            secureTextEntry={!!(f.secure && !showPw)} keyboardType={f.keyboard as any}
            autoCapitalize={f.key === 'name' ? 'words' : 'none'} autoCorrect={false}
            value={(form as any)[f.key]} onChangeText={v => onChange(f.key, v)} />
        </View>
      ))}
      <TouchableOpacity onPress={() => setShowPw(v => !v)} style={{ alignSelf: 'flex-end' }}>
        <Text style={st.togglePw}>{showPw ? 'Hide password' : 'Show password'}</Text>
      </TouchableOpacity>
      {error ? <Text style={st.errorText}>{error}</Text> : null}
      <TouchableOpacity style={st.btnPrimary} activeOpacity={0.82} onPress={onNext}>
        <Text style={st.btnPrimaryText}>Continue →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={st.btnBack} onPress={onBack}>
        <Text style={st.btnBackText}>← Go back</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepAddProfile({ profiles, onAddProfile, onFinish, onBack, loading }: {
  profiles: ProfileForm[]; onAddProfile: (p: ProfileForm) => void;
  onFinish: () => void; onBack: () => void; loading: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [err, setErr] = useState('');
  const handleAdd = () => {
    if (!name.trim()) { setErr('Please enter a name.'); return; }
    const n = parseInt(age, 10);
    if (!age || isNaN(n) || n < 1 || n > 120) { setErr('Please enter a valid age.'); return; }
    setErr(''); onAddProfile({ name: name.trim(), age });
    setName(''); setAge(''); setAdding(false);
  };
  return (
    <View style={{ gap: Spacing.md }}>
      <Text style={st.stepTitle}>Add a profile?</Text>
      <Text style={st.stepSubtitle}>One account, multiple profiles — for you, a child, or anyone else in the family.</Text>
      {profiles.map((p, i) => (
        <View key={i} style={st.profileChip}>
          <Text style={st.profileChipEmoji}>{parseInt(p.age) <= 10 ? '🧒' : '👤'}</Text>
          <Text style={st.profileChipText}>{p.name} <Text style={{ color: Colors.textMuted }}>· Age {p.age}</Text></Text>
        </View>
      ))}
      {adding ? (
        <View style={st.addForm}>
          <TextInput style={st.input} placeholder="Profile name (e.g. Aarav)" placeholderTextColor={Colors.textMuted}
            autoCapitalize="words" value={name} onChangeText={setName} />
          <TextInput style={st.input} placeholder="Age" placeholderTextColor={Colors.textMuted}
            keyboardType="numeric" value={age} onChangeText={setAge} />
          {err ? <Text style={st.errorText}>{err}</Text> : null}
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity style={[st.btnPrimary, { flex: 1 }]} onPress={handleAdd} activeOpacity={0.82}>
              <Text style={st.btnPrimaryText}>Add Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.btnBack, { flex: 1 }]} onPress={() => { setAdding(false); setErr(''); }}>
              <Text style={st.btnBackText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={st.addAnotherBtn} onPress={() => setAdding(true)}>
          <Text style={st.addAnotherText}>＋ Add a profile</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={[st.btnPrimary, loading && { opacity: 0.7 }]} activeOpacity={0.82} onPress={onFinish} disabled={loading}>
        {loading ? <ActivityIndicator color={Colors.buttonPrimaryText} />
          : <Text style={st.btnPrimaryText}>{profiles.length > 0 ? "Done — Let's go! 🎉" : 'Skip for now'}</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={st.btnBack} onPress={onBack}>
        <Text style={st.btnBackText}>← Go back</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SignupScreen() {
  const router = useRouter();
  const { setAuth, addProfile } = useAppStore();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const [details, setDetails] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [profiles, setProfiles] = useState<ProfileForm[]>([]);
  const [detailsError, setDetailsError] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const handleDetailsNext = () => {
    const { name, email, phone, password, confirm } = details;
    if (!name || !email || !phone || !password || !confirm) {
      setDetailsError('All fields are required.'); return;
    }
    if (password.length < 6) { setDetailsError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setDetailsError('Passwords do not match.'); return; }
    setDetailsError('');
    // Skip profile step for librarian/admin
    if (role === 'librarian' || role === 'admin') { handleFinish([]); } else { setStep(2); }
  };

  const handleFinish = async (childProfiles: ProfileForm[]) => {
    setLoading(true);
    setGlobalError('');
    try {
      const backendRole = role === 'librarian' ? 'LIBRARIAN' : role === 'admin' ? 'ADMIN' : 'USER';
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: details.email.trim().toLowerCase(),
          password: details.password,
          phone: details.phone.replace(/\s/g, ''),
          name: details.name.trim(),
          role: backendRole,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Registration failed');
      const { token, user } = json.data;
      const appRole: AppRole = backendRole as AppRole;
      // Seed with the main profile from backend
      await setAuth({ userId: user.id, email: user.email, token, role: appRole, profiles: user.profiles ?? [] });
      // Add each child profile to backend + local store
      for (const cp of childProfiles) {
        const ageNum = parseInt(cp.age, 10);
        const ageGroup = numToAgeGroup(ageNum);
        try {
          const childRes = await fetch(`${API_BASE_URL}/users/${user.id}/children`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: cp.name, ageGroup }),
          });
          const childJson = await childRes.json();
          const backendProfile = childJson?.data?.profile;
          await addProfile({
            profileId: backendProfile?.profileId ?? String(Date.now() + Math.random()),
            name: cp.name,
            accountType: 'CHILD',
            ageGroup,
            age: ageNum,
          });
        } catch { /* add locally even if backend fails */
          await addProfile({ profileId: String(Date.now() + Math.random()), name: cp.name, accountType: 'CHILD', ageGroup, age: ageNum });
        }
      }
      if (appRole === 'LIBRARIAN') router.replace('/(librarian)');
      else if (appRole === 'ADMIN') router.replace('/(admin)');
      else router.replace('/(select-profile)');
    } catch (e: any) {
      setGlobalError(e.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={st.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 0 && <TouchableOpacity style={st.backBtn} onPress={() => router.back()}><Text style={st.backArrow}>←</Text></TouchableOpacity>}
          <StepIndicator total={3} current={step} />
          {globalError ? <Text style={[st.errorText, { marginBottom: Spacing.md }]}>{globalError}</Text> : null}
          {step === 0 && <StepRole selected={role} onSelect={setRole} onNext={() => setStep(1)} />}
          {step === 1 && <StepDetails form={details} onChange={(k, v) => setDetails(p => ({ ...p, [k]: v }))}
            onNext={handleDetailsNext} onBack={() => setStep(0)} error={detailsError} />}
          {step === 2 && <StepAddProfile profiles={profiles} onAddProfile={p => setProfiles(prev => [...prev, p])}
            onFinish={() => handleFinish(profiles)} onBack={() => setStep(1)} loading={loading} />}
          {step === 0 && (
            <View style={st.footerRow}>
              <Text style={st.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={st.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  backBtn: { marginTop: Spacing.xs, width: 44, height: 44, borderRadius: Radius.full, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  backArrow: { fontSize: 20, color: Colors.accentSage, fontWeight: '700' },
  dot: { height: 8, borderRadius: Radius.full },
  dotActive: { backgroundColor: Colors.accentSage, width: 28 },
  dotDone: { backgroundColor: Colors.accentSageLight, width: 16 },
  dotInactive: { backgroundColor: Colors.cardBorder, width: 16 },
  stepTitle: { fontSize: Typography.title + 2, fontWeight: '800', color: Colors.accentSage },
  stepSubtitle: { fontSize: Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  roleCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 2, borderColor: 'transparent' },
  roleCardSelected: { borderColor: Colors.accentSage },
  roleEmoji: { fontSize: 32 },
  roleTitle: { fontSize: Typography.body, fontWeight: '700', color: Colors.textPrimary },
  roleDesc: { fontSize: Typography.label, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  roleTick: { fontSize: 20, color: Colors.accentSage, fontWeight: '800' },
  label: { fontSize: Typography.label, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: Colors.card, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 14, fontSize: Typography.body, color: Colors.textPrimary, borderWidth: 1.5, borderColor: Colors.cardBorder },
  togglePw: { fontSize: Typography.label, color: Colors.accentPeriwinkle, fontWeight: '600' },
  errorText: { fontSize: Typography.label, color: Colors.error, textAlign: 'center' },
  btnPrimary: { backgroundColor: Colors.buttonPrimary, borderRadius: Radius.full, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText: { fontSize: Typography.body, fontWeight: '700', color: Colors.buttonPrimaryText },
  btnDisabled: { opacity: 0.45 },
  btnBack: { borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.cardBorder },
  btnBackText: { fontSize: Typography.body, fontWeight: '600', color: Colors.textSecondary },
  profileChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder },
  profileChipEmoji: { fontSize: 24 },
  profileChipText: { fontSize: Typography.body, fontWeight: '700', color: Colors.textPrimary },
  addAnotherBtn: { borderWidth: 1.5, borderColor: Colors.accentSage, borderStyle: 'dashed', borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
  addAnotherText: { fontSize: Typography.body, color: Colors.accentSage, fontWeight: '700' },
  addForm: { gap: Spacing.md },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  footerText: { fontSize: Typography.body, color: Colors.textSecondary },
  footerLink: { fontSize: Typography.body, color: Colors.accentSage, fontWeight: '700' },
});
