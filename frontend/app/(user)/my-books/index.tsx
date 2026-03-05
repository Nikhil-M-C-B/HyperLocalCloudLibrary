import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

const { width } = Dimensions.get('window');

type BookStatus = 'active' | 'returned' | 'overdue';

interface BorrowRecord {
  id: string;
  bookId: string;
  title: string;
  author: string;
  coverColor: string;
  coverAccent: string;
  borrowedDate: string;
  dueDate: string;
  returnedDate?: string;
  status: BookStatus;
  fine?: number;
  library: string;
}

const BORROW_HISTORY: BorrowRecord[] = [
  {
    id: 'r1', bookId: '2', title: 'Harry Potter and the Philosopher\'s Stone',
    author: 'J.K. Rowling', coverColor: '#4A7C59', coverAccent: '#FFD700',
    borrowedDate: 'Feb 10', dueDate: 'Mar 2', status: 'overdue',
    fine: 8, library: 'Koramangala',
  },
  {
    id: 'r2', bookId: '5', title: 'The Alchemist',
    author: 'Paulo Coelho', coverColor: '#8080C0', coverAccent: '#FFDAB9',
    borrowedDate: 'Feb 20', dueDate: 'Mar 12', status: 'active',
    library: 'Indiranagar',
  },
  {
    id: 'r3', bookId: '3', title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald', coverColor: '#E8A87C', coverAccent: '#4A7C59',
    borrowedDate: 'Jan 5', dueDate: 'Jan 25', returnedDate: 'Jan 23', status: 'returned',
    library: 'HSR Layout',
  },
  {
    id: 'r4', bookId: '4', title: 'To Kill a Mockingbird',
    author: 'Harper Lee', coverColor: '#FFDAB9', coverAccent: '#E57373',
    borrowedDate: 'Dec 15', dueDate: 'Jan 4', returnedDate: 'Jan 3', status: 'returned',
    library: 'Koramangala',
  },
  {
    id: 'r5', bookId: '7', title: 'The Hobbit',
    author: 'J.R.R. Tolkien', coverColor: '#4A7C59', coverAccent: '#C5DDB8',
    borrowedDate: 'Nov 20', dueDate: 'Dec 10', returnedDate: 'Dec 9', status: 'returned',
    library: 'Whitefield',
  },
];

const STATUS_CONFIG: Record<BookStatus, { label: string; bg: string; text: string }> = {
  active:   { label: '📖 Borrowed',   bg: '#E8F5E9', text: Colors.success },
  returned: { label: '✅ Returned',   bg: Colors.accentSageLight + '50', text: Colors.accentSage },
  overdue:  { label: '⚠️ Overdue',   bg: '#FFEBEE', text: Colors.error },
};

type Filter = 'all' | BookStatus;

export default function MyBooks() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');

  const filters: { id: Filter; label: string }[] = [
    { id: 'all',      label: 'All' },
    { id: 'active',   label: '📖 Borrowed' },
    { id: 'overdue',  label: '⚠️ Overdue' },
    { id: 'returned', label: '✅ Returned' },
  ];

  const shown = filter === 'all' ? BORROW_HISTORY : BORROW_HISTORY.filter(b => b.status === filter);
  const totalFine = BORROW_HISTORY.filter(b => b.fine).reduce((a, b) => a + (b.fine ?? 0), 0);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={s.title}>My Books</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Fine banner */}
        {totalFine > 0 && (
          <View style={s.fineBanner}>
            <Text style={s.fineBannerText}>⚠️  You have ₹{totalFine} in outstanding fines</Text>
            <TouchableOpacity style={s.payBtn}>
              <Text style={s.payBtnText}>Pay now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary strip */}
        <View style={s.summaryStrip}>
          {[
            ['📖', `${BORROW_HISTORY.filter(b => b.status === 'active').length}`, 'Active'],
            ['⚠️', `${BORROW_HISTORY.filter(b => b.status === 'overdue').length}`, 'Overdue'],
            ['✅', `${BORROW_HISTORY.filter(b => b.status === 'returned').length}`, 'Returned'],
          ].map(([icon, val, label]) => (
            <View key={label} style={s.summaryItem}>
              <Text style={s.summaryIcon}>{icon}</Text>
              <Text style={s.summaryVal}>{val}</Text>
              <Text style={s.summaryLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Filter pills */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
          style={{ marginBottom: Spacing.md }}
        >
          {filters.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[s.pill, filter === f.id && s.pillActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[s.pillText, filter === f.id && s.pillTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Book list */}
        <View style={s.list}>
          {shown.length === 0 && (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>📭</Text>
              <Text style={s.emptyText}>No books here yet</Text>
            </View>
          )}
          {shown.map(record => {
            const cfg = STATUS_CONFIG[record.status];
            return (
              <TouchableOpacity
                key={record.id}
                style={s.bookCard}
                activeOpacity={0.85}
                onPress={() => record.status !== 'returned' && router.push(`/(user)/track/${record.bookId}`)}
              >
                {/* Mini cover */}
                <View style={[s.miniCover, { backgroundColor: record.coverColor }]}>
                  <View style={[s.miniCoverAccent, { backgroundColor: record.coverAccent }]} />
                </View>

                <View style={s.bookInfo}>
                  <Text style={s.bookTitle} numberOfLines={1}>{record.title}</Text>
                  <Text style={s.bookAuthor}>{record.author}</Text>
                  <Text style={s.bookLibrary}>🏛️ {record.library}</Text>

                  <View style={s.bookBottomRow}>
                    <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
                      <Text style={[s.statusPillText, { color: cfg.text }]}>{cfg.label}</Text>
                    </View>
                    <Text style={s.dateText}>
                      {record.status === 'returned'
                        ? `Returned ${record.returnedDate}`
                        : `Due ${record.dueDate}`}
                    </Text>
                  </View>
                  {record.fine && (
                    <Text style={s.fineText}>Fine: ₹{record.fine}</Text>
                  )}
                </View>

                {record.status === 'active' && (
                  <Text style={s.arrowIcon}>→</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing.xl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 20, color: Colors.accentSage, fontWeight: '700' },
  title: { fontSize: Typography.title + 2, fontWeight: '800', color: Colors.textPrimary },

  fineBanner: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    backgroundColor: '#FFEBEE', borderRadius: Radius.lg,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: '#FFCDD2',
  },
  fineBannerText: { flex: 1, fontSize: Typography.label, fontWeight: '700', color: Colors.error },
  payBtn: {
    backgroundColor: Colors.error, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  payBtnText: { fontSize: Typography.label, fontWeight: '800', color: '#fff' },

  summaryStrip: {
    flexDirection: 'row', marginHorizontal: Spacing.xl, marginBottom: Spacing.lg,
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden',
  },
  summaryItem: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md, gap: 3,
    borderRightWidth: 1, borderRightColor: Colors.cardBorder,
  },
  summaryIcon: { fontSize: 20 },
  summaryVal: { fontSize: Typography.title, fontWeight: '900', color: Colors.textPrimary },
  summaryLabel: { fontSize: Typography.label - 1, fontWeight: '600', color: Colors.textSecondary },

  filterRow: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.full, backgroundColor: Colors.card,
    borderWidth: 1.5, borderColor: Colors.cardBorder,
  },
  pillActive: { backgroundColor: Colors.accentSage, borderColor: Colors.accentSage },
  pillText: { fontSize: Typography.label, fontWeight: '700', color: Colors.textSecondary },
  pillTextActive: { color: Colors.textOnDark },

  list: { paddingHorizontal: Spacing.xl, gap: Spacing.md },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: Typography.body, color: Colors.textMuted, fontWeight: '600' },

  bookCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  miniCover: {
    width: 56, height: 80, borderRadius: Radius.sm,
    overflow: 'hidden', justifyContent: 'flex-end',
  },
  miniCoverAccent: { height: 12, opacity: 0.6 },
  bookInfo: { flex: 1, gap: 3 },
  bookTitle: { fontSize: Typography.body, fontWeight: '800', color: Colors.textPrimary },
  bookAuthor: { fontSize: Typography.label, color: Colors.textSecondary, fontWeight: '600' },
  bookLibrary: { fontSize: Typography.label - 1, color: Colors.textMuted },
  bookBottomRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  statusPill: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusPillText: { fontSize: Typography.label - 1, fontWeight: '700' },
  dateText: { fontSize: Typography.label - 1, color: Colors.textMuted },
  fineText: { fontSize: Typography.label - 1, fontWeight: '800', color: Colors.error, marginTop: 2 },
  arrowIcon: { fontSize: 20, color: Colors.textMuted, fontWeight: '300' },
});
