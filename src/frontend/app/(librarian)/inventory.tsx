import { API_BASE_URL } from '@/constants/config';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import useAppStore from '@/store/useAppStore';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Mode = 'book' | 'branch';
type Condition = 'GOOD' | 'FAIR' | 'POOR';

interface BranchStat {
  branchId: string;
  branchName: string;
  total: number;
  available: number;
  issued: number;
  damaged: number;
  lost: number;
}

const CONDITIONS: Condition[] = ['GOOD', 'FAIR', 'POOR'];

export default function InventoryScreen() {
  const router = useRouter();
  const { token } = useAppStore();

  const [mode, setMode] = useState<Mode>('book');

  // By-book
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [bookInventory, setBookInventory] = useState<BranchStat[]>([]);
  const [loadingBookInv, setLoadingBookInv] = useState(false);

  // By-branch
  const [branches, setBranches] = useState<any[]>([]);
  const [branchStats, setBranchStats] = useState<Record<string, any>>({});
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [branchInventory, setBranchInventory] = useState<any[]>([]);
  const [loadingBranchInv, setLoadingBranchInv] = useState(false);

  // Search inside expand panels
  const [branchSearch, setBranchSearch] = useState('');      // filter branches in By-Book panel
  const [bookInBranchSearch, setBookInBranchSearch] = useState(''); // filter books in By-Branch panel

  // Add copies modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalCtx, setModalCtx] = useState({ bookId: '', bookTitle: '', branchId: '', branchName: '' });
  const [addQty, setAddQty] = useState('1');
  const [addCondition, setAddCondition] = useState<Condition>('GOOD');
  const [saving, setSaving] = useState(false);

  // Bulk import
  const [importing, setImporting] = useState(false);
  const [importBranchId, setImportBranchId] = useState<string>('');
  const [importResult, setImportResult] = useState<{ importedCount: number; skippedCount: number; errors: any[] } | null>(null);
  const [importResultVisible, setImportResultVisible] = useState(false);
  const [branchPickerVisible, setBranchPickerVisible] = useState(false);

  const hdrs = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    fetchBooks();
    fetchBranches();
  }, [token]);

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/books`, { headers: hdrs });
      const json = await res.json();
      setBooks(json.data?.books ?? []);
    } catch {
      Alert.alert('Error', 'Could not load books.');
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/libraries`, { headers: hdrs });
      const json = await res.json();
      const list: any[] = json.data?.libraries ?? [];
      setBranches(list);
      // Fetch stats for all branches in parallel
      const stats: Record<string, any> = {};
      await Promise.all(
        list.map(async (b) => {
          try {
            const r = await fetch(`${API_BASE_URL}/inventory/branch/${b._id}/stats`, { headers: hdrs });
            const j = await r.json();
            stats[b._id] = j.data?.stats;
          } catch { /* stats are optional */ }
        })
      );
      setBranchStats(stats);
    } catch {
      Alert.alert('Error', 'Could not load branches.');
    } finally {
      setLoadingBranches(false);
    }
  };

  const selectBook = async (bookId: string) => {
    if (selectedBookId === bookId) {
      setSelectedBookId(null);
      setBranchSearch('');
      return;
    }
    setSelectedBookId(bookId);
    setBranchSearch('');
    setLoadingBookInv(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/book/${bookId}`, { headers: hdrs });
      const json = await res.json();
      setBookInventory(json.data?.inventory ?? []);
    } catch {
      Alert.alert('Error', 'Could not load inventory for this book.');
    } finally {
      setLoadingBookInv(false);
    }
  };

  const selectBranch = async (branchId: string) => {
    if (selectedBranchId === branchId) {
      setSelectedBranchId(null);
      setBookInBranchSearch('');
      return;
    }
    setSelectedBranchId(branchId);
    setBookInBranchSearch('');
    setLoadingBranchInv(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/branch/${branchId}`, { headers: hdrs });
      const json = await res.json();
      setBranchInventory(json.data?.inventory ?? []);
    } catch {
      Alert.alert('Error', 'Could not load branch inventory.');
    } finally {
      setLoadingBranchInv(false);
    }
  };

  const openAddModal = (bookId: string, bookTitle: string, branchId: string, branchName: string) => {
    setAddQty('1');
    setAddCondition('GOOD');
    setModalCtx({ bookId, bookTitle, branchId, branchName });
    setModalVisible(true);
  };

  const handleAddCopies = async () => {
    const qty = parseInt(addQty, 10);
    if (!qty || qty < 1 || qty > 100) {
      Alert.alert('Invalid quantity', 'Enter a number between 1 and 100.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inventory`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({
          bookId: modalCtx.bookId,
          branchId: modalCtx.branchId,
          quantity: qty,
          condition: addCondition,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed to add copies');

      Alert.alert('✅ Done', `Added ${qty} cop${qty === 1 ? 'y' : 'ies'} to ${modalCtx.branchName}.`);
      setModalVisible(false);

      // Refresh the active view
      if (selectedBookId) selectBook(selectedBookId);
      if (selectedBranchId) selectBranch(selectedBranchId);
      fetchBranches();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  // ── Bulk import ────────────────────────────────────────────────────────────
  const handleBulkImport = async (targetBranchId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'application/csv',
          '*/*', // fallback for devices that don't expose exact MIME
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets[0];

      setImporting(true);

      const formData = new FormData();
      // React Native FormData expects { uri, name, type } for files
      formData.append('file', {
        uri:  file.uri,
        name: file.name,
        type: file.mimeType ?? 'application/octet-stream',
      } as any);
      formData.append('branchId', targetBranchId);

      const res = await fetch(`${API_BASE_URL}/inventory/bulk-import`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` }, // NO Content-Type — fetch sets multipart boundary
        body:    formData,
      });

      const json = await res.json();
      setImportResult(json);
      setImportResultVisible(true);

      // Refresh data so the new books appear immediately
      fetchBooks();
      fetchBranches();
      if (selectedBranchId) selectBranch(selectedBranchId);
    } catch (err: any) {
      Alert.alert('Import Error', err.message ?? 'Something went wrong.');
    } finally {
      setImporting(false);
    }
  };

  // Show branch picker then kick off import
  const openImportFlow = () => {
    if (branches.length === 0) {
      Alert.alert('No branches', 'Load branches first.');
      return;
    }
    setBranchPickerVisible(true);
  };

  const filteredBooks = books.filter((b) =>
    !search.trim() ||
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase()) ||
    String(b.isbn).includes(search)
  );

  // Group branchInventory copies by distinct book, initializing with ALL global books
  const branchBookMap: Record<string, { bookId: string; title: string; available: number; issued: number; damaged: number; total: number }> = {};
  
  // Initialize map with every global book so we can always search and add copies even if count is 0
  for (const bk of books) {
    if (bk._id) {
      branchBookMap[bk._id] = { bookId: bk._id, title: bk.title ?? 'Unknown', available: 0, issued: 0, damaged: 0, total: 0 };
    }
  }

  // Populate counts from actual branch inventory
  for (const copy of branchInventory) {
    const bk = copy.bookId;
    if (!bk) continue;
    const id = bk._id;
    if (branchBookMap[id]) {
      branchBookMap[id].total++;
      if (copy.status === 'AVAILABLE')             branchBookMap[id].available++;
      else if (copy.status === 'ISSUED')           branchBookMap[id].issued++;
      else if (copy.status === 'DAMAGED' || copy.status === 'LOST') branchBookMap[id].damaged++;
    }
  }
  const branchBooks = Object.values(branchBookMap);

  // Build the branch list for the By-Book expand panel:
  // merge all known branches with inventory data already fetched.
  // Branches with no copies show zeros.
  const invByBranchId: Record<string, BranchStat> = {};
  for (const stat of bookInventory) invByBranchId[stat.branchId] = stat;

  const filteredBranchesForBook = branches.filter((b) =>
    !branchSearch.trim() ||
    b.name?.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const filteredBooksInBranch = branchBooks.filter((bk) =>
    !bookInBranchSearch.trim() ||
    bk.title.toLowerCase().includes(bookInBranchSearch.toLowerCase())
  );

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Add Copies Modal ──────────────────────────────────────────── */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Add Copies</Text>
            <Text style={s.modalMeta} numberOfLines={1}>📖 {modalCtx.bookTitle}</Text>
            <Text style={s.modalMeta}>🏛️ {modalCtx.branchName}</Text>

            <Text style={[s.label, { marginTop: Spacing.md }]}>Quantity</Text>
            <TextInput
              style={s.input}
              value={addQty}
              onChangeText={(v) => setAddQty(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={[s.label, { marginTop: Spacing.md }]}>Condition</Text>
            <View style={s.chipRow}>
              {CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.chip, addCondition === c && s.chipActive]}
                  onPress={() => setAddCondition(c)}
                >
                  <Text style={[s.chipText, addCondition === c && s.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.modalBtns}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.cardBorder }]}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={[s.modalBtnText, { color: Colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnPrimary, saving && { opacity: 0.6 }]}
                onPress={handleAddCopies}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={Colors.textOnDark} />
                  : <Text style={[s.modalBtnText, { color: Colors.textOnDark }]}>Add Copies</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Branch Picker Modal (for bulk import) ─────────────────────── */}
      <Modal
        transparent
        visible={branchPickerVisible}
        animationType="slide"
        onRequestClose={() => setBranchPickerVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Select Target Branch</Text>
            <Text style={[s.modalMeta, { marginBottom: Spacing.md }]}>
              Choose which branch the imported books will be added to.
            </Text>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {branches.map((b) => (
                <TouchableOpacity
                  key={b._id}
                  style={[s.card, { marginBottom: Spacing.xs }]}
                  onPress={() => {
                    setBranchPickerVisible(false);
                    setImportBranchId(b._id);
                    handleBulkImport(b._id);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>{b.name}</Text>
                    <Text style={s.cardMeta}>{b.address}</Text>
                  </View>
                  <Text style={{ fontSize: 18 }}>→</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[s.modalBtn, { backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.cardBorder, marginTop: Spacing.md }]}
              onPress={() => setBranchPickerVisible(false)}
            >
              <Text style={[s.modalBtnText, { color: Colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Import Result Modal ───────────────────────────────────────── */}
      <Modal
        transparent
        visible={importResultVisible}
        animationType="slide"
        onRequestClose={() => setImportResultVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>📊 Import Report</Text>
            {importResult && (
              <>
                <View style={s.importSummaryRow}>
                  <View style={[s.importBadge, { backgroundColor: '#d1fad7' }]}>
                    <Text style={[s.importBadgeNum, { color: '#1a7a33' }]}>{importResult.importedCount}</Text>
                    <Text style={[s.importBadgeLabel, { color: '#1a7a33' }]}>Imported</Text>
                  </View>
                  <View style={[s.importBadge, { backgroundColor: importResult.skippedCount > 0 ? '#fde8d8' : '#f0f0f0' }]}>
                    <Text style={[s.importBadgeNum, { color: importResult.skippedCount > 0 ? '#b94a00' : '#888' }]}>{importResult.skippedCount}</Text>
                    <Text style={[s.importBadgeLabel, { color: importResult.skippedCount > 0 ? '#b94a00' : '#888' }]}>Skipped</Text>
                  </View>
                </View>

                {importResult.errors.length > 0 && (
                  <>
                    <Text style={[s.label, { marginTop: Spacing.md }]}>Row Errors</Text>
                    <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator>
                      {importResult.errors.map((e, i) => (
                        <View key={i} style={s.errorRow}>
                          <Text style={s.errorRowText}>
                            Row {e.row}{e.isbn ? ` · ISBN ${e.isbn}` : ''}{e.title ? ` · "${e.title}"` : ''}:
                            {'
'}{e.reason}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )}
              </>
            )}
            <TouchableOpacity
              style={[s.modalBtn, s.modalBtnPrimary, { marginTop: Spacing.xl }]}
              onPress={() => setImportResultVisible(false)}
            >
              <Text style={[s.modalBtnText, { color: Colors.textOnDark }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <Text style={s.title}>Inventory</Text>
          {/* Import via spreadsheet */}
          <TouchableOpacity
            style={[s.importBtn, importing && { opacity: 0.5 }]}
            onPress={openImportFlow}
            disabled={importing}
          >
            {importing
              ? <ActivityIndicator color={Colors.textOnDark} size="small" />
              : <Text style={s.importBtnText}>📤 Import</Text>
            }
          </TouchableOpacity>
        </View>

        {/* ── Mode tabs ────────────────────────────────────────────────── */}
        <View style={s.tabRow}>
          {(['book', 'branch'] as Mode[]).map((id) => (
            <TouchableOpacity
              key={id}
              style={[s.tabBtn, mode === id && s.tabBtnActive]}
              onPress={() => setMode(id)}
            >
              <Text style={[s.tabText, mode === id && s.tabTextActive]}>
                {id === 'book' ? '📖 By Book' : '🏛️ By Branch'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── BY BOOK ──────────────────────────────────────────────────── */}
        {mode === 'book' && (
          <View style={s.section}>
            <TextInput
              style={s.search}
              placeholder="Search title, author or ISBN…"
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />

            {loadingBooks ? (
              <ActivityIndicator color={Colors.accentSage} style={{ marginTop: Spacing.xl }} />
            ) : filteredBooks.length === 0 ? (
              <Text style={s.empty}>No books found.</Text>
            ) : (
              filteredBooks.map((book) => (
                <View key={book._id}>
                  <TouchableOpacity
                    style={[s.card, selectedBookId === book._id && s.cardSelected]}
                    onPress={() => selectBook(book._id)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTitle} numberOfLines={1}>{book.title}</Text>
                      <Text style={s.cardSub}>{book.author}</Text>
                      <Text style={s.cardMeta}>
                        Age {book.minAge !== undefined ? `${book.minAge}+` : 'Unknown'} · ISBN {book.isbn}
                      </Text>
                    </View>
                    <Text style={s.chevron}>{selectedBookId === book._id ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  {selectedBookId === book._id && (
                    <View style={s.expandPanel}>
                      {/* Branch search */}
                      <TextInput
                        style={s.searchInner}
                        placeholder="Search branches…"
                        placeholderTextColor={Colors.textMuted}
                        value={branchSearch}
                        onChangeText={setBranchSearch}
                      />
                      {loadingBookInv ? (
                        <ActivityIndicator color={Colors.accentSage} />
                      ) : filteredBranchesForBook.length === 0 ? (
                        <Text style={s.empty}>No branches match.</Text>
                      ) : (
                        filteredBranchesForBook.map((b) => {
                          const stat = invByBranchId[b._id];
                          return (
                            <View key={b._id} style={s.detailRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={s.detailName}>{b.name}</Text>
                                {stat ? (
                                  <Text style={s.detailStats}>
                                    ✅ {stat.available} avail · 📤 {stat.issued} issued
                                    {stat.damaged > 0 ? ` · ⚠️ ${stat.damaged} dmg` : ''}
                                    {stat.lost > 0 ? ` · ❌ ${stat.lost} lost` : ''}
                                    {' · '}total {stat.total}
                                  </Text>
                                ) : (
                                  <Text style={s.detailStats}>No copies yet</Text>
                                )}
                              </View>
                              <TouchableOpacity
                                style={s.addBtn}
                                onPress={() => openAddModal(book._id, book.title, b._id, b.name)}
                              >
                                <Text style={s.addBtnText}>+ Add</Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* ── BY BRANCH ────────────────────────────────────────────────── */}
        {mode === 'branch' && (
          <View style={s.section}>
            {loadingBranches ? (
              <ActivityIndicator color={Colors.accentSage} style={{ marginTop: Spacing.xl }} />
            ) : (
              branches.map((branch) => {
                const stats = branchStats[branch._id];
                return (
                  <View key={branch._id}>
                    <TouchableOpacity
                      style={[s.card, selectedBranchId === branch._id && s.cardSelected]}
                      onPress={() => selectBranch(branch._id)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardTitle}>{branch.name}</Text>
                        {stats ? (
                          <Text style={s.cardSub}>
                            📚 {stats.total} total · ✅ {stats.available} avail · 📤 {stats.issued} issued
                            {stats.damaged > 0 ? ` · ⚠️ ${stats.damaged} dmg` : ''}
                            {stats.lost > 0 ? ` · ❌ ${stats.lost} lost` : ''}
                          </Text>
                        ) : (
                          <Text style={s.cardSub}>Loading stats…</Text>
                        )}
                      </View>
                      <Text style={s.chevron}>{selectedBranchId === branch._id ? '▲' : '▼'}</Text>
                    </TouchableOpacity>

                    {selectedBranchId === branch._id && (
                      <View style={s.expandPanel}>
                        {/* Book search */}
                        <TextInput
                          style={s.searchInner}
                          placeholder="Search books in this branch…"
                          placeholderTextColor={Colors.textMuted}
                          value={bookInBranchSearch}
                          onChangeText={setBookInBranchSearch}
                        />
                        {loadingBranchInv ? (
                          <ActivityIndicator color={Colors.accentSage} />
                        ) : filteredBooksInBranch.length === 0 ? (
                          <Text style={s.empty}>{branchBooks.length === 0 ? 'No inventory records for this branch.' : 'No books match.'}</Text>
                        ) : (
                          filteredBooksInBranch.map((bk) => (
                            <View key={bk.bookId} style={s.detailRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={s.detailName} numberOfLines={1}>{bk.title}</Text>
                                <Text style={s.detailStats}>
                                  ✅ {bk.available} avail · 📤 {bk.issued} issued
                                  {bk.damaged > 0 ? ` · ⚠️ ${bk.damaged} dmg/lost` : ''}
                                  {' · '}total {bk.total}
                                </Text>
                              </View>
                              <TouchableOpacity
                                style={s.addBtn}
                                onPress={() => openAddModal(bk.bookId, bk.title, branch._id, branch.name)}
                              >
                                <Text style={s.addBtnText}>+ Add</Text>
                              </TouchableOpacity>
                            </View>
                          ))
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.librarianTint },
  scroll: { paddingBottom: Spacing.xl },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, color: Colors.accentSage, fontWeight: '700' },
  title: { fontSize: Typography.title, fontWeight: '800', color: Colors.accentSage },

  tabRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.full,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: Colors.accentSage, borderColor: Colors.accentSage },
  tabText: { fontSize: Typography.label, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: Colors.textOnDark },

  section: { paddingHorizontal: Spacing.xl },

  search: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardSelected: { borderColor: Colors.accentSage, borderWidth: 1.5 },
  cardTitle: { fontSize: Typography.body, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: Typography.label, color: Colors.textSecondary, marginTop: 2 },
  cardMeta: { fontSize: Typography.caption, color: Colors.textMuted, marginTop: 1 },
  chevron: { fontSize: 12, color: Colors.textMuted, marginLeft: Spacing.sm },

  expandPanel: {
    backgroundColor: Colors.browseSurface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  detailName: { fontSize: Typography.label, fontWeight: '700', color: Colors.textPrimary },
  detailStats: { fontSize: Typography.caption, color: Colors.textSecondary, marginTop: 2 },

  addBtn: {
    backgroundColor: Colors.accentSage,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  addBtnText: { fontSize: Typography.caption, fontWeight: '800', color: Colors.textOnDark },

  empty: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: Typography.body,
    paddingVertical: Spacing.lg,
  },

  searchInner: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    fontSize: Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xs,
  },
  modalTitle: {
    fontSize: Typography.title,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  modalMeta: { fontSize: Typography.label, color: Colors.textSecondary },

  label: {
    fontSize: Typography.label,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },

  chipRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: Colors.cardBorder,
  },
  chipActive: { backgroundColor: Colors.accentSage, borderColor: Colors.accentSage },
  chipText: { fontSize: Typography.label, fontWeight: '700', color: Colors.textSecondary },
  chipTextActive: { color: Colors.textOnDark },

  modalBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl },
  modalBtn: {
    flex: 1, paddingVertical: 14, borderRadius: Radius.full, alignItems: 'center',
  },
  modalBtnPrimary: { flex: 2, backgroundColor: Colors.accentSage },
  modalBtnText: { fontSize: Typography.body, fontWeight: '800' },

  // Import button in header
  importBtn: {
    backgroundColor: Colors.accentSage,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importBtnText: { fontSize: Typography.label, fontWeight: '800', color: Colors.textOnDark },

  // Import result modal
  importSummaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  importBadge: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  importBadgeNum: { fontSize: 32, fontWeight: '900' },
  importBadgeLabel: { fontSize: Typography.label, fontWeight: '700', marginTop: 2 },
  errorRow: {
    backgroundColor: '#fff4f0',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: '#e05c00',
  },
  errorRowText: { fontSize: Typography.caption, color: '#5c2200', lineHeight: 18 },
});
