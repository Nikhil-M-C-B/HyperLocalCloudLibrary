import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { MOCK_BOOKS } from '@/constants/mockData';

const { width, height } = Dimensions.get('window');

// ─── Sample reading content (per book ideally; using placeholder for mock) ────
const SAMPLE_PAGES = [
  "Once upon a time, in a land where books floated on clouds and stories grew on trees, there lived a very curious little rabbit named Leo.",
  "Leo loved nothing more than hopping through the meadow and finding new books hidden under flowers and behind rocks. Every day was a new adventure.",
  "One morning, Leo found a golden book with no title on its cover. He opened it carefully, and the pages glowed a warm amber colour.",
  '"This book," whispered the wind, "tells the story of whoever reads it." Leo\'s eyes went wide. He turned to the first page and began to read.',
  "And so Leo discovered that every story begins with a single curious step — and that the most magical book of all is the one you hold in your hands right now.",
];

const MIN_SIZE = 16;
const MAX_SIZE = 40;
const DEFAULT_SIZE = 24;

export default function ReadingView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const book = MOCK_BOOKS.find(b => b.id === id) ?? MOCK_BOOKS[0];

  const [page, setPage] = useState(0);
  const [fontSize, setFontSize] = useState(DEFAULT_SIZE);

  const progress = (page + 1) / SAMPLE_PAGES.length;

  return (
    <SafeAreaView style={s.safe}>

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>

        <View style={s.titleWrap}>
          <Text style={s.bookTitle} numberOfLines={1}>{book.title}</Text>
        </View>

        {/* Font size controls */}
        <View style={s.sizeControls}>
          <TouchableOpacity
            style={s.sizeBtn}
            onPress={() => setFontSize(f => Math.max(MIN_SIZE, f - 2))}
          >
            <Text style={s.sizeBtnText}>A−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.sizeBtn}
            onPress={() => setFontSize(f => Math.min(MAX_SIZE, f + 2))}
          >
            <Text style={s.sizeBtnText}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Progress bar ── */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={s.progressLabel}>{page + 1} / {SAMPLE_PAGES.length} pages</Text>

      {/* ── Page content — warm cream reading surface ── */}
      <View style={s.pageCard}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.pageContent}
        >
          <Text style={[s.pageText, { fontSize }]}>
            {SAMPLE_PAGES[page]}
          </Text>
        </ScrollView>
      </View>

      {/* ── Navigation ── */}
      <View style={s.navRow}>
        <TouchableOpacity
          style={[s.navBtn, page === 0 && s.navBtnDisabled]}
          onPress={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          <Text style={s.navBtnText}>← Prev</Text>
        </TouchableOpacity>

        {/* Page dots */}
        <View style={s.dots}>
          {SAMPLE_PAGES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setPage(i)}>
              <View
                style={[
                  s.dot,
                  i === page ? s.dotActive : i < page ? s.dotRead : s.dotUnread,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {page < SAMPLE_PAGES.length - 1 ? (
          <TouchableOpacity style={s.navBtn} onPress={() => setPage(p => p + 1)}>
            <Text style={s.navBtnText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.navBtn, { backgroundColor: Colors.accentSage }]}
            onPress={() => router.push(`/(child)/quiz/${book.id}`)}
          >
            <Text style={[s.navBtnText, { color: Colors.textOnDark }]}>Quiz! 🧠</Text>
          </TouchableOpacity>
        )}
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.readSurface },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 18, color: Colors.accentSage, fontWeight: '800' },
  titleWrap: { flex: 1 },
  bookTitle: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  sizeControls: { flexDirection: 'row', gap: 6 },
  sizeBtn: {
    backgroundColor: Colors.buttonPrimary, borderRadius: Radius.md,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  sizeBtnText: { fontSize: 13, fontWeight: '800', color: Colors.buttonPrimaryText },

  progressBar: {
    height: 6, backgroundColor: Colors.cardBorder,
    marginHorizontal: Spacing.md, borderRadius: Radius.full, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: Colors.accentSage, borderRadius: Radius.full,
  },
  progressLabel: {
    textAlign: 'center', fontSize: 12,
    color: Colors.textMuted, fontWeight: '600', marginVertical: 6,
  },

  pageCard: {
    flex: 1, marginHorizontal: Spacing.md, marginVertical: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.cardBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  pageContent: {
    padding: Spacing.xl, flexGrow: 1, justifyContent: 'center',
    minHeight: height * 0.48,
  },
  pageText: {
    color: Colors.textPrimary, lineHeight: 40, fontWeight: '500',
    textAlign: 'left', fontFamily: 'serif',
  },

  navRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm,
  },
  navBtn: {
    backgroundColor: Colors.buttonPrimary, borderRadius: Radius.full,
    paddingVertical: 12, paddingHorizontal: 20,
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { fontSize: 14, fontWeight: '800', color: Colors.buttonPrimaryText },
  dots: { flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: Radius.full },
  dotActive: { backgroundColor: Colors.accentSage, width: 20 },
  dotRead: { backgroundColor: Colors.accentSageLight },
  dotUnread: { backgroundColor: Colors.cardBorder },
});
