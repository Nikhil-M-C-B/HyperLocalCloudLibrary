import bookService from '@/api/services/bookService';
import { BookCover } from '@/components/BookCover';
import { GENRES, type Book } from '@/constants/mockData';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import useAppStore from '@/store/useAppStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_W = (width - Spacing.xl * 2 - Spacing.md) / 2;
const CARD_H = CARD_W * 1.4;
const BOOKS_PER_PAGE = 6;

function mapBook(b: any): Book {
  return {
    id: b._id || b.id,
    title: b.title || 'Unknown Title',
    author: b.author || 'Unknown Author',
    pages: 200,
    releaseYear: new Date(b.createdAt || Date.now()).getFullYear(),
    genres: b.genre || [],
    summary: b.summary || '',
    rating: 4.5,
    coverColor: '#C5DDB8',
    coverAccent: '#4A7C59',
    isDigital: true,
    isPhysical: true,
    availableCopies: parseInt(b.availableCopies ?? 0),
    nearestLibrary: 'Local Library',
    ageMin: parseInt(b.ageRating?.split('-')[0]) || 0,
    ageMax: parseInt(b.ageRating?.split('-')[1]) || 99,
    keyWords: [],
    coverImage: b.coverImage
  };
}

// ─── Genre pill ───────────────────────────────────────────────────────────────
function GenrePill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[pill.base, active && pill.active]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[pill.text, active && pill.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
const pill = StyleSheet.create({
  base: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: Radius.full, backgroundColor: Colors.card,
    borderWidth: 1.5, borderColor: Colors.cardBorder, marginRight: Spacing.xs,
  },
  active: { backgroundColor: Colors.accentSage, borderColor: Colors.accentSage },
  text: { fontSize: Typography.label + 1, fontWeight: '600', color: Colors.textSecondary },
  textActive: { color: Colors.textOnDark },
});

// ─── Book card ────────────────────────────────────────────────────────────────
function ChildBookCard({ book, onPress }: { book: Book; onPress: () => void }) {
  const stars = '★'.repeat(Math.round(book.rating)) + '☆'.repeat(5 - Math.round(book.rating));
  return (
    <TouchableOpacity style={card.wrap} activeOpacity={0.82} onPress={onPress}>
      <BookCover book={book} width={CARD_W} height={CARD_H} fontSize={12} />
      <Text style={card.title} numberOfLines={2}>{book.title}</Text>
      <Text style={card.stars}>{stars}</Text>
    </TouchableOpacity>
  );
}
const card = StyleSheet.create({
  wrap: { width: CARD_W, gap: 6 },
  title: { fontSize: Typography.label + 1, fontWeight: '700', color: Colors.textPrimary, lineHeight: 18 },
  stars: { fontSize: 12, color: Colors.accentPeach, letterSpacing: 1 },
});

// ─── Page dots ────────────────────────────────────────────────────────────────
function PageDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginVertical: Spacing.md }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 20 : 8, height: 8,
            borderRadius: Radius.full,
            backgroundColor: i === current ? Colors.accentSage : Colors.cardBorder,
          }}
        />
      ))}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ChildHome() {
  const router = useRouter();
  const { profiles, activeProfileId, prefetchTopBooks } = useAppStore();
  const [genre, setGenre] = useState('All');
  const [page, setPage] = useState(0);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    let active = true;

    // Silently prefetch top books
    prefetchTopBooks();

    const fetchBooks = async () => {
      try {
        const response = await bookService.getBooks({ limit: 50 });
        if (active && response.data?.books) {
          setBooks(response.data.books.map(mapBook));
        }
      } catch (err) {
        console.warn('Failed to fetch child books', err);
      }
    };
    fetchBooks();
    return () => { active = false; };
  }, [prefetchTopBooks]);

  const activeProfile = profiles.find(p => p.profileId === activeProfileId);
  const preferredGenres = activeProfile?.preferredGenres || [];
  const firstName = activeProfile?.name?.split(' ')[0] || 'Friend';
  const childAge = activeProfile?.age ?? 6; // default child age fallback

  // Filter books appropriate for child's age
  const ageAppropriateBooks = books.filter(b => childAge >= b.ageMin && childAge <= b.ageMax);

  const filtered = genre === 'All'
    ? ageAppropriateBooks
    : ageAppropriateBooks.filter(b => b.genres.includes(genre));

  const recommendedBooks = ageAppropriateBooks.filter(b =>
    b.genres.some(g => preferredGenres.includes(g))
  );

  const totalPages = Math.ceil(filtered.length / BOOKS_PER_PAGE);
  const pageBooks = filtered.slice(page * BOOKS_PER_PAGE, (page + 1) * BOOKS_PER_PAGE);

  // Reset to page 0 when genre changes
  const handleGenre = (g: string) => { setGenre(g); setPage(0); };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Hi {firstName}! 👋</Text>
            <Text style={s.subGreeting}>What will we read today?</Text>
          </View>
          <TouchableOpacity
            style={s.profileBtn}
            onPress={() => router.replace('/(select-profile)')}
          >
            <Text style={s.profileEmoji}>🧒</Text>
          </TouchableOpacity>
        </View>

        {/* ── Based on Your interests ── */}
        {recommendedBooks.length > 0 && (
          <View style={{ marginBottom: Spacing.xl }}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>✨ Based on Your interests</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md }}
            >
              {recommendedBooks.map(book => (
                <ChildBookCard
                  key={`rec-${book.id}`}
                  book={book}
                  onPress={() => router.push(`/(child)/book/${book.id}`)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Genre filter ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.genreRow}
        >
          {GENRES.map(g => (
            <GenrePill key={g} label={g} active={genre === g} onPress={() => handleGenre(g)} />
          ))}
        </ScrollView>

        {/* ── Section title ── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>📚 All Books</Text>
          <Text style={s.pageLabel}>Page {page + 1} of {totalPages}</Text>
        </View>

        {/* ── Book grid (PAGED — no infinite scroll) ── */}
        <View style={s.grid}>
          {pageBooks.map(book => (
            <ChildBookCard
              key={book.id}
              book={book}
              onPress={() => router.push(`/(child)/book/${book.id}`)}
            />
          ))}
          {/* Pad odd count */}
          {pageBooks.length % 2 !== 0 && <View style={{ width: CARD_W }} />}
        </View>

        {/* ── Page navigation ── */}
        <PageDots total={totalPages} current={page} />
        <View style={s.pageNav}>
          <TouchableOpacity
            style={[s.pageBtn, page === 0 && s.pageBtnDisabled]}
            onPress={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <Text style={s.pageBtnText}>← Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.pageBtn, page === totalPages - 1 && s.pageBtnDisabled]}
            onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            <Text style={s.pageBtnText}>Next →</Text>
          </TouchableOpacity>
        </View>

        {/* bottom padding for FAB */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── Chatbot FAB ── */}
      <TouchableOpacity style={s.fab} activeOpacity={0.85}>
        <Text style={s.fabEmoji}>🦉</Text>
        <Text style={s.fabLabel}>Ask Owl</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.browseSurface },
  scroll: { paddingBottom: Spacing.xl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
  },
  greeting: { fontSize: Typography.titleChild, fontWeight: '800', color: Colors.accentSage },
  subGreeting: { fontSize: Typography.bodyChild - 2, color: Colors.textSecondary, marginTop: 2 },
  profileBtn: {
    width: 52, height: 52, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)', elevation: 3,
  },
  profileEmoji: { fontSize: 26 },

  genreRow: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: Typography.body + 2, fontWeight: '800', color: Colors.textPrimary },
  pageLabel: { fontSize: Typography.label, color: Colors.textMuted, fontWeight: '600' },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },

  // Page nav
  pageNav: {
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  pageBtn: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingVertical: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.cardBorder,
  },
  pageBtnDisabled: { opacity: 0.35 },
  pageBtnText: { fontSize: Typography.body, fontWeight: '700', color: Colors.accentSage },

  // FAB
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    backgroundColor: Colors.accentSage,
    borderRadius: Radius.full,
    paddingVertical: 12, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    boxShadow: '0px 4px 12px rgba(74, 124, 89, 0.4)', elevation: 8,
  },
  fabEmoji: { fontSize: 22 },
  fabLabel: { fontSize: Typography.label + 1, fontWeight: '800', color: Colors.textOnDark },
});
