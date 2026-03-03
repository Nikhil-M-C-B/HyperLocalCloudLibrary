import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Dimensions, Modal, TextInput, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import useAppStore from '@/store/useAppStore';
import { API_BASE_URL } from '@/constants/config';

const { width } = Dimensions.get('window');

const BRANCHES = [
  { id: 'b1', name: 'Koramangala',   books: 248, issued: 34, members: 120, revenue: 1840, active: true  },
  { id: 'b2', name: 'Indiranagar',   books: 185, issued: 21, members: 87,  revenue: 1100, active: true  },
  { id: 'b3', name: 'HSR Layout',    books: 302, issued: 48, members: 156, revenue: 2300, active: true  },
  { id: 'b4', name: 'Whitefield',    books: 91,  issued: 8,  members: 45,  revenue: 380,  active: false },
];

const STAT_CARDS = [
  { label: 'Total Branches',  value: '4',     icon: '🏛️', tint: Colors.accentSageLight },
  { label: 'Active Members',  value: '408',   icon: '👥', tint: Colors.browseSurface },
  { label: 'Books Issued',    value: '111',   icon: '📤', tint: Colors.buttonPrimary },
  { label: "This Month's Rev",value: '₹5,620',icon: '💰', tint: '#E8F5E9' },
];

// Simulated bar chart using View widths
const MONTHLY = [
  { month: 'Oct', val: 62 }, { month: 'Nov', val: 78 },
  { month: 'Dec', val: 95 }, { month: 'Jan', val: 88 },
  { month: 'Feb', val: 111 },{ month: 'Mar', val: 45 },
];
const MAX_BAR = Math.max(...MONTHLY.map(m => m.val));
const BAR_AREA_W = width - Spacing.xl * 2 - Spacing.md * 2;

function BarChart() {
  return (
    <View style={bc.wrap}>
      {MONTHLY.map(({ month, val }) => (
        <View key={month} style={bc.col}>
          <Text style={bc.valLabel}>{val}</Text>
          <View style={bc.barBg}>
            <View style={[bc.bar, { height: `${(val / MAX_BAR) * 100}%` }]} />
          </View>
          <Text style={bc.monthLabel}>{month}</Text>
        </View>
      ))}
    </View>
  );
}
const bc = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 120 },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  valLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  barBg: {
    width: '100%', flex: 1, backgroundColor: Colors.cardBorder,
    borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden',
  },
  bar: { backgroundColor: Colors.accentSage, borderRadius: 4 },
  monthLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
});

type Tab = 'overview' | 'branches' | 'add';

export default function AdminDashboard() {
  const router = useRouter();
  const { clearAuth, token } = useAppStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [menuVisible, setMenuVisible] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', address: '', lat: '', lng: '', radius: '' });
  const [saving, setSaving] = useState(false);

  const setBF = (key: string, val: string) => setBranchForm(f => ({ ...f, [key]: val }));

  const handleAddBranch = async () => {
    if (!branchForm.name.trim() || !branchForm.address.trim()) {
      Alert.alert('Missing fields', 'Branch Name and Address are required.');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: branchForm.name.trim(),
        address: branchForm.address.trim(),
        serviceRadiusKm: branchForm.radius ? parseFloat(branchForm.radius) : 8,
      };
      if (branchForm.lat && branchForm.lng) {
        body.location = {
          type: 'Point',
          coordinates: [parseFloat(branchForm.lng), parseFloat(branchForm.lat)],
        };
      }
      const res = await fetch(`${API_BASE_URL}/libraries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed to add branch');
      Alert.alert('✅ Branch registered!', `"${branchForm.name}" has been added.`);
      setBranchForm({ name: '', address: '', lat: '', lng: '', radius: '' });
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setMenuVisible(false);
    await clearAuth();
    router.replace('/(auth)/welcome');
  };

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'overview',  label: 'Overview',  emoji: '📊' },
    { id: 'branches',  label: 'Branches',  emoji: '🏛️' },
    { id: 'add',       label: 'Add Branch',emoji: '➕' },
  ];

  return (
    <SafeAreaView style={s.safe}>
      {/* Sign-out menu modal */}
      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={s.menuCard}>
            <Text style={s.menuTitle}>Admin Dashboard</Text>
            <TouchableOpacity style={s.menuItem} onPress={handleSignOut}>
              <Text style={s.menuItemText}>🚪 Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.menuCancel} onPress={() => setMenuVisible(false)}>
              <Text style={s.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Admin Dashboard</Text>
            <Text style={s.subtitle}>City Libraries · March 2026</Text>
          </View>
          <TouchableOpacity style={s.profileBtn} onPress={() => setMenuVisible(true)}>
            <Text>🏛️</Text>
          </TouchableOpacity>
        </View>

        {/* Stat cards */}
        <View style={s.statsGrid}>
          {STAT_CARDS.map(stat => (
            <View key={stat.label} style={[s.statCard, { backgroundColor: stat.tint }]}>
              <Text style={s.statIcon}>{stat.icon}</Text>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {tabs.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[s.tabBtn, tab === t.id && s.tabBtnActive]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[s.tabText, tab === t.id && s.tabTextActive]}>{t.emoji} {t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'overview' && (
          <View style={s.section}>
            {/* Issues per month chart */}
            <Text style={s.sectionTitle}>📈 Books Issued — Last 6 Months</Text>
            <View style={s.chartCard}>
              <BarChart />
            </View>

            {/* Top performing branch */}
            <Text style={[s.sectionTitle, { marginTop: Spacing.lg }]}>🏆 Top Branch This Month</Text>
            <View style={s.topBranchCard}>
              <Text style={s.topBranchName}>HSR Layout Branch</Text>
              <View style={s.topBranchStats}>
                <View style={s.topStat}>
                  <Text style={s.topStatVal}>302</Text>
                  <Text style={s.topStatLabel}>Books</Text>
                </View>
                <View style={s.topStat}>
                  <Text style={s.topStatVal}>48</Text>
                  <Text style={s.topStatLabel}>Issued</Text>
                </View>
                <View style={s.topStat}>
                  <Text style={s.topStatVal}>₹2,300</Text>
                  <Text style={s.topStatLabel}>Revenue</Text>
                </View>
              </View>
            </View>

            {/* Recent activity */}
            <Text style={[s.sectionTitle, { marginTop: Spacing.lg }]}>🕐 Recent Activity</Text>
            {[
              { icon: '📚', msg: 'Koramangala: 5 new books added', time: '10 min ago' },
              { icon: '⚠️', msg: 'Indiranagar: 2 overdue returns', time: '1 hr ago' },
              { icon: '👤', msg: 'HSR Layout: 8 new members joined', time: '3 hrs ago' },
              { icon: '💰', msg: 'Whitefield: ₹380 collected (Mar)', time: 'Yesterday' },
            ].map((a, i) => (
              <View key={i} style={s.activityRow}>
                <Text style={s.activityIcon}>{a.icon}</Text>
                <Text style={s.activityMsg}>{a.msg}</Text>
                <Text style={s.activityTime}>{a.time}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 'branches' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>All Branches ({BRANCHES.length})</Text>
            {BRANCHES.map(b => (
              <View key={b.id} style={[s.branchCard, !b.active && s.branchCardInactive]}>
                <View style={s.branchHeader}>
                  <Text style={s.branchName}>{b.name}</Text>
                  <View style={[s.activePill, { backgroundColor: b.active ? '#E8F5E9' : '#FDE8E8' }]}>
                    <Text style={[s.activePillText, { color: b.active ? Colors.success : Colors.error }]}>
                      {b.active ? '● Active' : '● Inactive'}
                    </Text>
                  </View>
                </View>
                <View style={s.branchStats}>
                  {[
                    ['📚', `${b.books} books`],
                    ['📤', `${b.issued} issued`],
                    ['👥', `${b.members} members`],
                    ['💰', `₹${b.revenue}`],
                  ].map(([icon, val]) => (
                    <View key={val} style={s.branchStat}>
                      <Text style={s.branchStatIcon}>{icon}</Text>
                      <Text style={s.branchStatVal}>{val}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={s.manageBranchBtn}>
                  <Text style={s.manageBranchText}>Manage →</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {tab === 'add' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Register a New Branch</Text>
            <Text style={s.addDesc}>
              Adding a new library branch registers it in the system.
            </Text>
            {([
              { key: 'name',    label: 'Branch Name *',   ph: 'e.g. Jayanagar Branch', kbType: 'default'  },
              { key: 'address', label: 'Address *',       ph: 'Full street address',   kbType: 'default'  },
              { key: 'lat',     label: 'Latitude',        ph: '12.9716',               kbType: 'numeric'  },
              { key: 'lng',     label: 'Longitude',       ph: '77.5946',               kbType: 'numeric'  },
              { key: 'radius',  label: 'Service Radius (km)', ph: '8',                kbType: 'numeric'  },
            ] as const).map(f => (
              <View key={f.key} style={{ gap: 5, marginBottom: Spacing.md }}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={s.fieldInput}
                  placeholder={f.ph}
                  placeholderTextColor={Colors.textMuted}
                  value={branchForm[f.key]}
                  onChangeText={v => setBF(f.key, v)}
                  keyboardType={f.kbType as any}
                  returnKeyType="next"
                />
              </View>
            ))}
            <TouchableOpacity style={[s.btnPrimary, saving && { opacity: 0.6 }]} activeOpacity={0.82} onPress={handleAddBranch} disabled={saving}>
              {saving
                ? <ActivityIndicator color={Colors.buttonPrimaryText} />
                : <Text style={s.btnPrimaryText}>🏛️ Register Branch</Text>
              }
            </TouchableOpacity>
          </View>
          </KeyboardAvoidingView>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.adminTint },
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
    borderWidth: 1.5, borderColor: Colors.cardBorder, fontSize: 22,
  },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg,
  },
  statCard: {
    width: (width - Spacing.xl * 2 - Spacing.sm) / 2,
    borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  statIcon: { fontSize: 28 },
  statValue: { fontSize: Typography.title + 4, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: Typography.label - 1, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },

  tabRow: { flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.full,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.cardBorder, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: Colors.accentSage, borderColor: Colors.accentSage },
  tabText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: Colors.textOnDark },

  section: { paddingHorizontal: Spacing.xl },
  sectionTitle: { fontSize: Typography.body + 1, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },

  chartCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.sm,
  },

  topBranchCard: {
    backgroundColor: Colors.accentSage, borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md,
  },
  topBranchName: { fontSize: Typography.title, fontWeight: '800', color: Colors.textOnDark },
  topBranchStats: { flexDirection: 'row', gap: Spacing.lg },
  topStat: { alignItems: 'center', gap: 2 },
  topStatVal: { fontSize: Typography.title, fontWeight: '900', color: Colors.textOnDark },
  topStatLabel: { fontSize: Typography.label - 1, color: '#C5DDB8', fontWeight: '600' },

  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  activityIcon: { fontSize: 18 },
  activityMsg: { flex: 1, fontSize: Typography.label, color: Colors.textPrimary, fontWeight: '600', lineHeight: 18 },
  activityTime: { fontSize: Typography.label - 1, color: Colors.textMuted },

  branchCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder, gap: Spacing.sm,
  },
  branchCardInactive: { opacity: 0.6 },
  branchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  branchName: { fontSize: Typography.body + 1, fontWeight: '800', color: Colors.textPrimary },
  activePill: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  activePillText: { fontSize: Typography.label - 1, fontWeight: '800' },
  branchStats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  branchStat: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.background, borderRadius: Radius.md,
    paddingHorizontal: 8, paddingVertical: 5,
  },
  branchStatIcon: { fontSize: 14 },
  branchStatVal: { fontSize: Typography.label, color: Colors.textPrimary, fontWeight: '700' },
  manageBranchBtn: {
    alignSelf: 'flex-end', backgroundColor: Colors.accentSageLight,
    borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 8,
  },
  manageBranchText: { fontSize: Typography.label, fontWeight: '800', color: Colors.accentSage },

  addDesc: { fontSize: Typography.body, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.lg },
  fieldLabel: { fontSize: Typography.label, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  fieldInput: {
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

  // Sign-out modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 80, paddingRight: Spacing.xl },
  menuCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.md, minWidth: 200, borderWidth: 1.5, borderColor: Colors.cardBorder, gap: Spacing.xs },
  menuTitle: { fontSize: Typography.label, fontWeight: '700', color: Colors.textMuted, paddingHorizontal: Spacing.sm, paddingBottom: 4 },
  menuItem: { paddingVertical: 12, paddingHorizontal: Spacing.sm, borderRadius: Radius.lg },
  menuItemText: { fontSize: Typography.body, fontWeight: '700', color: Colors.error },
  menuCancel: { paddingVertical: 12, paddingHorizontal: Spacing.sm, borderRadius: Radius.lg, borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  menuCancelText: { fontSize: Typography.body, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
});
