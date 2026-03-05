import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import useAppStore from '@/store/useAppStore';
import { API_BASE_URL } from '@/constants/config';

const AGE_RATINGS = ['0-3', '4-6', '6-8', '8-10', '10-12', '12-15', '15+'];

const ISSUED_BOOKS = [
  { id: 'i1', title: 'Matilda',                 user: 'Priya Sharma',   due: 'Mar 17',  daysLeft: 14, overdue: false },
  { id: 'i2', title: 'Where the Wild Things Are',user: 'Aarav (Child)',  due: 'Mar 5',   daysLeft: 2,  overdue: false },
  { id: 'i3', title: "Charlotte's Web",          user: 'Ravi Kumar',     due: 'Feb 28',  daysLeft: -3, overdue: true  },
  { id: 'i4', title: 'Harry Potter',             user: 'Neha Singh',     due: 'Mar 10',  daysLeft: 7,  overdue: false },
];

const PENDING_RETURNS = ISSUED_BOOKS.filter(b => b.overdue);

const STATS = [
  { label: 'Total Books', value: '248',  icon: '📚', tint: Colors.accentSageLight },
  { label: 'Issued Today', value: '12',  icon: '📤', tint: Colors.browseSurface },
  { label: 'Overdue',      value: '3',   icon: '⚠️', tint: '#FDE8E8' },
  { label: 'Returned',     value: '7',   icon: '✅', tint: '#E8F5E9' },
];

type Tab = 'issued' | 'returns' | 'add';

function StatCard({ label, value, icon, tint }: { label: string; value: string; icon: string; tint: string }) {
  return (
    <View style={[sc.card, { backgroundColor: tint }]}>
      <Text style={sc.icon}>{icon}</Text>
      <Text style={sc.value}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card: {
    flex: 1, borderRadius: Radius.lg, padding: Spacing.md,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  icon:  { fontSize: 24 },
  value: { fontSize: Typography.title + 2, fontWeight: '900', color: Colors.textPrimary },
  label: { fontSize: Typography.label - 1, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
});

export default function LibrarianDashboard() {
  const router = useRouter();
  const { clearAuth, token } = useAppStore();
  const [tab, setTab] = useState<Tab>('issued');
  const [menuVisible, setMenuVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', isbn: '', genre: '', ageRating: '4-6', summary: '' });

  const setField = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSignOut = async () => {
    setMenuVisible(false);
    await clearAuth();
    router.replace('/(auth)/welcome');
  };

  const handleAddBook = async () => {
    if (!form.title.trim() || !form.author.trim()) {
      Alert.alert('Missing fields', 'Title and Author are required.');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        author: form.author.trim(),
        ageRating: form.ageRating,
      };
      if (form.isbn.trim())    body.isbn = form.isbn.trim();
      if (form.summary.trim()) body.summary = form.summary.trim();
      if (form.genre.trim())   body.genre = form.genre.split(',').map((g: string) => g.trim()).filter(Boolean);

      const res = await fetch(`${API_BASE_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed to add book');
      Alert.alert('✅ Book added!', `"${form.title}" has been added to the library.`);
      setForm({ title: '', author: '', isbn: '', genre: '', ageRating: '4-6', summary: '' });
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const tabList: { id: Tab; label: string; emoji: string }[] = [
    { id: 'issued',  label: 'Issued',   emoji: '📤' },
    { id: 'returns', label: 'Overdue',  emoji: '⚠️' },
    { id: 'add',     label: 'Add Book', emoji: '➕' },
  ];

  return (
    <SafeAreaView style={s.safe}>
      {/* Sign-out menu modal */}
      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={s.menuCard}>
            <Text style={s.menuTitle}>Librarian Panel</Text>
            <TouchableOpacity style={s.menuItem} onPress={handleSignOut}>
              <Text style={s.menuItemText}>🚪 Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.menuCancel} onPress={() => setMenuVisible(false)}>
              <Text style={s.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Librarian Panel</Text>
            <Text style={s.subtitle}>Koramangala Branch · Today, Mar 3</Text>
          </View>
          <TouchableOpacity style={s.profileBtn} onPress={() => setMenuVisible(true)}>
            <Text style={s.profileEmoji}>📚</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          {STATS.map(stat => <StatCard key={stat.label} {...stat} />)}
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {tabList.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[s.tabBtn, tab === t.id && s.tabBtnActive]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[s.tabText, tab === t.id && s.tabTextActive]}>{t.emoji} {t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {tab === 'issued' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Currently Issued ({ISSUED_BOOKS.length})</Text>
            {ISSUED_BOOKS.map(book => (
              <View key={book.id} style={[s.issueCard, book.overdue && s.issueCardOverdue]}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={s.issueName}>{book.title}</Text>
                  <Text style={s.issueUser}>👤 {book.user}</Text>
                  <Text style={[s.issueDue, book.overdue && { color: Colors.error }]}>
                    {book.overdue ? `⚠️ Overdue by ${Math.abs(book.daysLeft)} days` : `Due: ${book.due} · ${book.daysLeft}d left`}
                  </Text>
                </View>
                <TouchableOpacity style={s.returnBtn}>
                  <Text style={s.returnBtnText}>Return</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {tab === 'returns' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Overdue Returns ({PENDING_RETURNS.length})</Text>
            {PENDING_RETURNS.length === 0 ? (
              <Text style={s.empty}>🎉 No overdue returns!</Text>
            ) : PENDING_RETURNS.map(book => (
              <View key={book.id} style={[s.issueCard, s.issueCardOverdue]}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={s.issueName}>{book.title}</Text>
                  <Text style={s.issueUser}>👤 {book.user}</Text>
                  <Text style={[s.issueDue, { color: Colors.error }]}>
                    ⚠️ Overdue by {Math.abs(book.daysLeft)} days · Fine: ₹{Math.abs(book.daysLeft) * 2}
                  </Text>
                </View>
                <TouchableOpacity style={[s.returnBtn, { backgroundColor: Colors.error }]}>
                  <Text style={[s.returnBtnText, { color: '#fff' }]}>Collect</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {tab === 'add' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Add a new book</Text>

            {([
              { key: 'title',   label: 'Book Title *',  ph: 'e.g. The Alchemist',  multi: false },
              { key: 'author',  label: 'Author *',      ph: 'e.g. Paulo Coelho',   multi: false },
              { key: 'isbn',    label: 'ISBN',          ph: '978-...',             multi: false },
              { key: 'genre',   label: 'Genres',        ph: 'Fiction, Adventure',  multi: false },
              { key: 'summary', label: 'Summary',       ph: 'Brief description…',  multi: true  },
            ] as const).map(f => (
              <View key={f.key} style={{ gap: 5, marginBottom: Spacing.md }}>
                <Text style={s.label}>{f.label}</Text>
                <TextInput
                  style={[s.input, f.multi && { height: 90, textAlignVertical: 'top' }]}
                  placeholder={f.ph}
                  placeholderTextColor={Colors.textMuted}
                  value={form[f.key]}
                  onChangeText={v => setField(f.key, v)}
                  multiline={f.multi}
                  returnKeyType={f.multi ? 'default' : 'next'}
                />
              </View>
            ))}

            <Text style={s.label}>Age Rating *</Text>
            <View style={s.ageRow}>
              {AGE_RATINGS.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[s.ageChip, form.ageRating === r && s.ageChipActive]}
                  onPress={() => setField('ageRating', r)}
                >
                  <Text style={[s.ageChipText, form.ageRating === r && s.ageChipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[s.btnPrimary, saving && { opacity: 0.6 }]} activeOpacity={0.82} onPress={handleAddBook} disabled={saving}>
              {saving
                ? <ActivityIndicator color={Colors.buttonPrimaryText} />
                : <Text style={s.btnPrimaryText}>📚 Add Book to Library</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Issue history link */}
        <TouchableOpacity style={s.historyLink} onPress={() => router.push('/(librarian)/history')}>
          <Text style={s.historyLinkText}>📜 Full issue history →</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.librarianTint },
  scroll: { paddingBottom: Spacing.xl },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
  },
  title: { fontSize: Typography.display, fontWeight: '800', color: Colors.accentSage },
  subtitle: { fontSize: Typography.label, color: Colors.textSecondary, marginTop: 2 },
  profileBtn: {
    width: 48, height: 48, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.cardBorder,
  },
  profileEmoji: { fontSize: 22 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },

  tabRow: {
    flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.full,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.cardBorder, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: Colors.accentSage, borderColor: Colors.accentSage },
  tabText: { fontSize: Typography.label, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: Colors.textOnDark },

  section: { paddingHorizontal: Spacing.xl },
  sectionTitle: { fontSize: Typography.body + 1, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
  empty: { fontSize: Typography.body, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },

  issueCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  issueCardOverdue: { borderColor: Colors.error, backgroundColor: '#FFF5F5' },
  issueName: { fontSize: Typography.body, fontWeight: '700', color: Colors.textPrimary },
  issueUser: { fontSize: Typography.label, color: Colors.textSecondary },
  issueDue: { fontSize: Typography.label, color: Colors.textSecondary, fontWeight: '600' },
  returnBtn: {
    backgroundColor: Colors.accentSage, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
  },
  returnBtnText: { fontSize: Typography.label, fontWeight: '800', color: Colors.textOnDark },

  label: { fontSize: Typography.label, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.cardBorder,
    fontSize: Typography.body, color: Colors.textPrimary,
  },

  btnPrimary: {
    backgroundColor: Colors.buttonPrimary, borderRadius: Radius.full,
    paddingVertical: 16, alignItems: 'center', marginTop: Spacing.sm,
  },
  btnPrimaryText: { fontSize: Typography.body, fontWeight: '800', color: Colors.buttonPrimaryText },

  historyLink: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.xl,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  historyLinkText: { fontSize: Typography.body, fontWeight: '700', color: Colors.textPrimary },

  // Modal / menu
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 80, paddingRight: Spacing.xl },
  menuCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.md, minWidth: 200, borderWidth: 1.5, borderColor: Colors.cardBorder, gap: Spacing.xs },
  menuTitle: { fontSize: Typography.label, fontWeight: '700', color: Colors.textMuted, paddingHorizontal: Spacing.sm, paddingBottom: 4 },
  menuItem: { paddingVertical: 12, paddingHorizontal: Spacing.sm, borderRadius: Radius.lg },
  menuItemText: { fontSize: Typography.body, fontWeight: '700', color: Colors.error },
  menuCancel: { paddingVertical: 12, paddingHorizontal: Spacing.sm, borderRadius: Radius.lg, borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  menuCancelText: { fontSize: Typography.body, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },

  // Age rating chips
  ageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md, marginTop: 4 },
  ageChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.cardBorder },
  ageChipActive: { backgroundColor: Colors.accentSage, borderColor: Colors.accentSage },
  ageChipText: { fontSize: Typography.label, fontWeight: '700', color: Colors.textSecondary },
  ageChipTextActive: { color: Colors.textOnDark },
});
