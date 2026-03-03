import { useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, Dimensions,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import useAppStore, { AppProfile } from '@/store/useAppStore';

const { width } = Dimensions.get('window');
const CARD_GAP = Spacing.md;
const CARD_SIZE = (width - Spacing.xl * 2 - CARD_GAP) / 2;

const AVATAR_COLORS = ['#C5DDB8', '#F4C2C2', '#C5D5EA', '#FFDAB9', '#D4C5EA', '#B8D4C8'];
const avatarColor = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length];

function getEmoji(age: number, isChild: boolean): string {
  if (!isChild) return '👤';
  if (age <= 3)  return '👶';
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
  const { profiles, clearAuth } = useAppStore();

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
            <AddProfileCard onPress={() => router.push('/(auth)/signup')} />
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
});
