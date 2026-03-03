import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput, Dimensions, FlatList,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { MOCK_BOOKS, GENRES, type Book } from '@/constants/mockData';
import { BookCover } from '@/components/BookCover';

const { width } = Dimensions.get('window');
const HRCARD_W = 130;
const HRCARD_H = 190;

// ─── Horizontal book card (for recommendation row) ────────────────────────────
function HorizBookCard({ book, onPress }: { book: Book; onPress: () => void }) {
  return (
    <TouchableOpacity style={hc.wrap} onPress={onPress} activeOpacity={0.82}>
      <BookCover book={book} width={HRCARD_W} height={HRCARD_H} fontSize={11} />
      <Text style={hc.title} numberOfLines={2}>{book.title}</Text>
      <Text style={hc.author} numberOfLines={1}>{book.author}</Text>
      <Text style={hc.avail}>
        {book.availableCopies > 0 ? `✓ ${book.availableCopies} available` : '✗ Unavailable'}
      </Text>
    </TouchableOpacity>
  );
}
const hc = StyleSheet.create({
  wrap: { width: HRCARD_W, gap: 5 },
  title: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, lineHeight: 17 },
  author: { fontSize: 11, color: Colors.textSecondary },
  avail: { fontSize: 11, color: Colors.accentSage, fontWeight: '700' },
});

// ─── Search result row ────────────────────────────────────────────────────────
function SearchRow({ book, onPress }: { book: Book; onPress: () => void }) {
  return (
    <TouchableOpacity style={sr.row} onPress={onPress} activeOpacity={0.82}>
      <BookCover book={book} width={56} height={76} fontSize={9} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={sr.title}>{book.title}</Text>
        <Text style={sr.author}>by {book.author} · {book.releaseYear}</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {book.genres.slice(0, 2).map(g => (
            <View key={g} style={sr.chip}><Text style={sr.chipText}>{g}</Text></View>
          ))}
        </View>
      </View>
      <Text style={sr.avail}>
        {book.availableCopies > 0 ? `${book.availableCopies} left` : 'Waitlist'}
      </Text>
    </TouchableOpacity>
  );
}
const sr = StyleSheet.create({
  row: {
    flexDirection: 'row', gap: Spacing.md, alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.sm, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  title: { fontSize: Typography.body, fontWeight: '700', color: Colors.textPrimary },
  author: { fontSize: Typography.label, color: Colors.textSecondary },
  chip: {
    backgroundColor: Colors.browseSurface, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  chipText: { fontSize: 11, color: Colors.accentPeriwinkle, fontWeight: '600' },
  avail: { fontSize: 12, fontWeight: '700', color: Colors.accentSage, textAlign: 'right' },
});

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
      <Text style={{ fontSize: Typography.body + 1, fontWeight: '800', color: Colors.textPrimary }}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={{ fontSize: Typography.label, color: Colors.accentSage, fontWeight: '700' }}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function UserHome() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');

  const searching = query.trim().length > 0;
  const searchResults = MOCK_BOOKS.filter(b =>
    b.title.toLowerCase().includes(query.toLowerCase()) ||
    b.author.toLowerCase().includes(query.toLowerCase()) ||
    b.keyWords.some(k => k.toLowerCase().includes(query.toLowerCase()))
  );

  const recommended = MOCK_BOOKS.filter(b => b.rating >= 4.7);
  const byGenre = activeGenre === 'All'
    ? MOCK_BOOKS
    : MOCK_BOOKS.filter(b => b.genres.includes(activeGenre));

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Hello, Priya 👋</Text>
            <Text style={s.subGreeting}>What are you looking for today?</Text>
          </View>
          <TouchableOpacity
            style={s.profileBtn}
            onPress={() => router.replace('/(select-profile)')}
          >
            <Text style={s.profileEmoji}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* ── Search bar ── */}
        <View style={s.searchWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search by title, author, or keywords…"
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={s.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Search results ── */}
        {searching ? (
          <View style={s.section}>
            <SectionHeader title={`Results (${searchResults.length})`} />
            {searchResults.length === 0 ? (
              <Text style={s.empty}>No books found for "{query}".</Text>
            ) : (
              searchResults.map(b => (
                <SearchRow key={b.id} book={b} onPress={() => router.push(`/(user)/book/${b.id}`)} />
              ))
            )}
          </View>
        ) : (
          <>
            {/* ── Active order pill ── */}
            <TouchableOpacity style={s.orderBanner} onPress={() => router.push('/(user)/track/ord-001')}>
              <Text style={s.orderBannerIcon}>📦</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.orderBannerTitle}>Order in progress</Text>
                <Text style={s.orderBannerSub}>Matilda · Out for delivery</Text>
              </View>
              <Text style={s.orderBannerArrow}>→</Text>
            </TouchableOpacity>

            {/* ── Recommended ── */}
            <View style={s.section}>
              <SectionHeader title="⭐ Recommended for you" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
                {recommended.map(b => (
                  <HorizBookCard key={b.id} book={b} onPress={() => router.push(`/(user)/book/${b.id}`)} />
                ))}
              </ScrollView>
            </View>

            {/* ── Genre filter ── */}
            <View style={s.section}>
              <SectionHeader title="📚 Browse" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.xs, marginBottom: Spacing.md }}>
                {GENRES.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[s.genrePill, activeGenre === g && s.genrePillActive]}
                    onPress={() => setActiveGenre(g)}
                  >
                    <Text style={[s.genrePillText, activeGenre === g && s.genrePillTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {byGenre.map(b => (
                <SearchRow key={b.id} book={b} onPress={() => router.push(`/(user)/book/${b.id}`)} />
              ))}
            </View>

            {/* ── My Books ── */}
            <TouchableOpacity
              style={s.myBooksBanner}
              onPress={() => router.push('/(user)/my-books')}
            >
              <Text style={s.myBooksText}>📋 My borrowed books & history →</Text>
            </TouchableOpacity>

            {/* ── Monitor children ── */}
            <TouchableOpacity style={s.monitorBanner} onPress={() => router.push('/(user)/monitor')}>
              <Text style={s.monitorText}>👁️ Monitor child profiles →</Text>
            </TouchableOpacity>
          </>
        )}

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
  greeting: { fontSize: Typography.title + 2, fontWeight: '800', color: Colors.accentSage },
  subGreeting: { fontSize: Typography.body, color: Colors.textSecondary, marginTop: 2 },
  profileBtn: {
    width: 48, height: 48, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.cardBorder,
  },
  profileEmoji: { fontSize: 22 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.full,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderWidth: 1.5, borderColor: Colors.cardBorder,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: Typography.body, color: Colors.textPrimary },
  clearBtn: { fontSize: 14, color: Colors.textMuted, fontWeight: '700', paddingHorizontal: 4 },

  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  empty: { fontSize: Typography.body, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },

  orderBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.accentSage, borderRadius: Radius.lg,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.xl,
    padding: Spacing.md, gap: Spacing.md,
  },
  orderBannerIcon: { fontSize: 24 },
  orderBannerTitle: { fontSize: Typography.body, fontWeight: '800', color: Colors.textOnDark },
  orderBannerSub: { fontSize: Typography.label, color: '#C5DDB8', marginTop: 2 },
  orderBannerArrow: { fontSize: 20, color: Colors.textOnDark, fontWeight: '700' },

  genrePill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.cardBorder,
  },
  genrePillActive: { backgroundColor: Colors.accentSage, borderColor: Colors.accentSage },
  genrePillText: { fontSize: Typography.label, fontWeight: '600', color: Colors.textSecondary },
  genrePillTextActive: { color: Colors.textOnDark },

  myBooksBanner: {
    marginHorizontal: Spacing.xl, backgroundColor: Colors.readSurface,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  myBooksText: { fontSize: Typography.body, fontWeight: '700', color: Colors.textPrimary },
  monitorBanner: {
    marginHorizontal: Spacing.xl, backgroundColor: Colors.browseSurface,
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  monitorText: { fontSize: Typography.body, fontWeight: '700', color: Colors.accentPeriwinkle },
});
