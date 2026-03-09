import bookService from '@/api/services/bookService';
import { BookCover } from '@/components/BookCover';
import { NavBar, NAV_BOTTOM_PAD } from '@/components/NavBar';
import { type Book } from '@/constants/mockData';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function mapBook(b: any): Book {
  return {
    id: b._id || b.id,
    title: b.title || 'Unknown Title',
    author: b.author || 'Unknown Author',
    pages: b.pages || 200,
    releaseYear: b.publishedDate
      ? (parseInt(b.publishedDate.match(/\d{4}/)?.[0]) || new Date(b.createdAt || Date.now()).getFullYear())
      : new Date(b.createdAt || Date.now()).getFullYear(),
    genres: b.genre || [],
    summary: b.summary || 'A fantastic new adventure awaits...',
    rating: 4.5,
    coverColor: b.coverColor || '#C5DDB8',
    coverAccent: b.coverAccent || '#4A7C59',
    isDigital: b.format === 'DIGITAL' || b.format === 'BOTH',
    isPhysical: b.format === 'PHYSICAL' || b.format === 'BOTH',
    availableCopies: parseInt(b?.availableCopies ?? 0),
    nearestLibrary: 'Local Library',
    ageMin: parseInt(b.ageRating?.split('-')[0]) || 0,
    ageMax: parseInt(b.ageRating?.split('-')[1]) || 99,
    keyWords: [],
    coverImage: b.coverImage,
    isbn: b.isbn != null ? String(b.isbn) : undefined,
  };
}

function SimilarCard({ book, onPress }: { book: Book; onPress: () => void }) {
  const avail = book.availableCopies > 0;
  return (
    <TouchableOpacity style={sc.wrap} onPress={onPress} activeOpacity={0.82}>
      <View>
        <BookCover book={book} width={110} height={158} fontSize={10} />
        <View style={[sc.dot, { backgroundColor: avail ? Colors.success : Colors.error }]} />
      </View>
      <Text style={sc.title} numberOfLines={2}>{book.title}</Text>
      <Text style={sc.author} numberOfLines={1}>{book.author}</Text>
      <Text style={[sc.avail, { color: avail ? Colors.success : Colors.error }]}>
        {avail ? `${book.availableCopies} available` : 'Unavailable'}
      </Text>
    </TouchableOpacity>
  );
}
const sc = StyleSheet.create({
  wrap: { width: 110, gap: 4, marginRight: Spacing.lg },
  dot: {
    position: 'absolute', bottom: 6, right: 6,
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 2, borderColor: Colors.browseSurface,
  },
  title: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, lineHeight: 16 },
  author: { fontSize: 11, color: Colors.textSecondary },
  avail: { fontSize: 10, fontWeight: '600' },
});

export default function ChildBookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarBooks, setSimilarBooks] = useState<Book[]>([]);
  const [similarGenre, setSimilarGenre] = useState<string>('');

  useEffect(() => {
    if (!book || book.genres.length === 0) return;
    let active = true;

    const toCard = (b: any): Book => ({
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
      ageMin: 0, ageMax: 99,
      keyWords: [],
      coverImage: b.coverImage,
      isbn: b.isbn != null ? String(b.isbn) : undefined,
    });

    const fetchSimilar = async () => {
      try {
        const genre1 = book.genres[0];
        const res1 = await bookService.getBooks({ genre: genre1, limit: 12 });
        let results: Book[] = (res1?.data?.books || [])
          .filter((b: any) => (b._id || b.id) !== book.id)
          .map(toCard);

        if (results.length < 3 && book.genres.length > 1) {
          const genre2 = book.genres[1];
          const res2 = await bookService.getBooks({ genre: genre2, limit: 12 });
          const extra: Book[] = (res2?.data?.books || [])
            .filter((b: any) => (b._id || b.id) !== book.id && !results.find(r => r.id === (b._id || b.id)))
            .map(toCard);
          results = [...results, ...extra];
          if (extra.length > 0) setSimilarGenre(genre2);
          else setSimilarGenre(genre1);
        } else {
          setSimilarGenre(genre1);
        }

        if (active) setSimilarBooks(results.slice(0, 10));
      } catch {
        // silently fail — similar books are non-critical
      }
    };

    fetchSimilar();
    return () => { active = false; };
  }, [book?.id]);

  useEffect(() => {
    let active = true;
    const fetchBook = async () => {
      try {
        const response = await bookService.getBookById(id);
        if (active && response.data?.book) {
          setBook(mapBook(response.data.book));
        }
      } catch (err) {
        console.warn('Failed to fetch child book detail', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBook();
    return () => { active = false; };
  }, [id]);

  if (loading || !book) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.accentSage} />
      </SafeAreaView>
    );
  }

  const stars = Array.from({ length: 5 }).map((_, i) =>
    i < Math.round(book.rating) ? '★' : '☆'
  );

  return (
    <SafeAreaView style={s.safe}>
      {Platform.OS === 'web' && <NavBar role="child" active="home" />}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Back */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Cover — centred, big */}
        <View style={s.coverWrap}>
          <BookCover book={book} width={180} height={260} fontSize={16} />
        </View>

        {/* Badges */}
        <View style={s.badgeRow}>
          {book.isDigital && (
            <View style={[s.badge, { backgroundColor: Colors.browseSurface }]}>
              <Text style={[s.badgeText, { color: Colors.accentPeriwinkle }]}>Digital</Text>
            </View>
          )}
          {book.isPhysical && (
            <View style={[s.badge, { backgroundColor: Colors.accentSageLight }]}>
              <Text style={[s.badgeText, { color: Colors.accentSage }]}>Physical</Text>
            </View>
          )}
          {book.availableCopies === 0 && (
            <View style={[s.badge, { backgroundColor: '#FDE8E8' }]}>
              <Text style={[s.badgeText, { color: Colors.error }]}>Not Available</Text>
            </View>
          )}
        </View>

        {/* Title + author */}
        <Text style={s.title}>{book.title}</Text>
        <Text style={s.author}>by {book.author}</Text>

        {/* Big emoji stars — child-friendly rating */}
        <View style={s.starsRow}>
          {stars.map((st, i) => (
            <Text key={i} style={s.star}>{st}</Text>
          ))}
          <Text style={s.ratingNum}>{book.rating}</Text>
        </View>

        {/* Genres */}
        <View style={s.genreRow}>
          {book.genres.map(g => (
            <View key={g} style={s.genreChip}>
              <Text style={s.genreText}>{g}</Text>
            </View>
          ))}
        </View>

        {/* Summary — kept brief for kids */}
        <View style={s.summaryBox}>
          <Text style={s.summaryLabel}>📖 What's it about?</Text>
          <Text style={s.summaryText}>{book.summary}</Text>
        </View>

        {/* Similar Books */}
        {similarBooks.length > 0 && (
          <View style={s.similarSection}>
            <View style={s.similarHeader}>
              <Text style={s.similarTitle}>
                {similarGenre ? `More in ${similarGenre}` : 'More like this'}
              </Text>
              <TouchableOpacity onPress={() => router.replace('/(child)')}>
                <Text style={s.similarSeeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {book.genres.length > 0 && (
              <View style={s.genreChipRow}>
                {book.genres.map(g => (
                  <View key={g} style={s.genreChip}>
                    <Text style={s.genreChipText}>{g}</Text>
                  </View>
                ))}
              </View>
            )}
            <FlatList
              data={similarBooks}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(b) => b.id}
              renderItem={({ item }) => (
                <SimilarCard
                  book={item}
                  onPress={() => router.push(`/(child)/book/${item.id}`)}
                />
              )}
              contentContainerStyle={{ paddingVertical: 4 }}
            />
          </View>
        )}

        {/* Reviews & Comments */}
        <View style={s.reviewsSection}>
          <Text style={s.reviewsTitle}>What readers say</Text>
          {[
            { name: 'Aarav', emoji: '🧒', rating: 5, comment: 'This was so much fun to read! I loved every page and want to read it again!' },
            { name: 'Meera', emoji: '👧', rating: 4, comment: 'Really cool story! The characters were amazing and I couldn\'t stop reading.' },
            { name: 'Kabir', emoji: '🧑', rating: 5, comment: 'One of the best books I\'ve ever read! I told all my friends about it!' },
          ].map((review, idx) => (
            <View key={idx} style={s.reviewCard}>
              <View style={s.reviewHeader}>
                <Text style={s.reviewEmoji}>{review.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.reviewName}>{review.name}</Text>
                  <Text style={s.reviewStars}>
                    {'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </Text>
                </View>
              </View>
              <Text style={s.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </View>

        {/* Quick facts — simple for children */}
        <View style={s.factsRow}>
          <View style={s.factCard}>
            <Text style={s.factValue}>{book.pages ?? '—'}</Text>
            <Text style={s.factLabel}>pages</Text>
          </View>
          <View style={s.factCard}>
            <Text style={s.factValue}>{book.releaseYear}</Text>
            <Text style={s.factLabel}>published</Text>
          </View>
          <View style={s.factCard}>
            <Text style={s.factValue}>{book.availableCopies}</Text>
            <Text style={s.factLabel}>available</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={s.actions}>
          {book.isDigital ? (
            <TouchableOpacity
              style={s.btnPrimary}
              activeOpacity={0.82}
              onPress={() => router.push(`/(child)/read/${book.id}`)}
            >
              <Text style={s.btnPrimaryText}>Read now</Text>
            </TouchableOpacity>
          ) : (
            <View style={[s.btnPrimary, { opacity: 0.45 }]}>
              <Text style={s.btnPrimaryText}>Not available to read digitally</Text>
            </View>
          )}

          <TouchableOpacity
            style={s.btnSecondary}
            activeOpacity={0.82}
            onPress={() => router.push(`/(child)/quiz/${book.id}`)}
          >
            <Text style={s.btnSecondaryText}>🧠 Take a quiz!</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btnGhost} activeOpacity={0.82}>
            <Text style={s.btnGhostText}>💬 Speak to a librarian</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
      {Platform.OS !== 'web' && <NavBar role="child" active="home" />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.browseSurface },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: NAV_BOTTOM_PAD + Spacing.xl },

  backBtn: { marginTop: Spacing.md, marginBottom: Spacing.lg },
  backText: { fontSize: Typography.body, color: Colors.accentSage, fontWeight: '700' },

  coverWrap: { alignItems: 'center', marginBottom: Spacing.lg },

  badgeRow: { flexDirection: 'row', gap: Spacing.xs, justifyContent: 'center', marginBottom: Spacing.sm },
  badge: { borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontSize: Typography.label, fontWeight: '700' },

  title: {
    fontSize: Typography.titleChild, fontWeight: '800',
    color: Colors.accentSage, textAlign: 'center', lineHeight: 34,
  },
  author: {
    fontSize: Typography.bodyChild - 2, color: Colors.textSecondary,
    textAlign: 'center', marginTop: 4, marginBottom: Spacing.sm,
  },

  starsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, marginBottom: Spacing.sm,
  },
  star: { fontSize: 24, color: Colors.accentPeach },
  ratingNum: { fontSize: Typography.body, color: Colors.textMuted, fontWeight: '700', marginLeft: 4 },

  genreRow: { flexDirection: 'row', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: Spacing.lg },
  genreChip: {
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  genreText: { fontSize: Typography.label, color: Colors.textSecondary, fontWeight: '600' },

  summaryBox: {
    backgroundColor: Colors.readSurface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg, gap: 6,
  },
  summaryLabel: { fontSize: Typography.body, fontWeight: '800', color: Colors.textPrimary },
  summaryText: { fontSize: Typography.bodyChild - 2, color: Colors.textSecondary, lineHeight: 24 },

  similarSection: { marginBottom: Spacing.xl },
  similarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  similarTitle: { fontSize: Typography.body + 1, fontWeight: '800', color: Colors.textPrimary },
  similarSeeAll: { fontSize: Typography.label, fontWeight: '700', color: Colors.accentSage },
  genreChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.md },
  genreChip: {
    backgroundColor: Colors.accentSageLight, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  genreChipText: { fontSize: Typography.label - 1, fontWeight: '700', color: Colors.accentSage },

  reviewsSection: { marginBottom: Spacing.lg, gap: Spacing.sm },
  reviewsTitle: { fontSize: Typography.bodyChild - 2, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4, textAlign: 'center' },
  reviewCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder, gap: 8,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewEmoji: { fontSize: 28 },
  reviewName: { fontSize: Typography.label, fontWeight: '700', color: Colors.textPrimary },
  reviewStars: { fontSize: 14, letterSpacing: 1 },
  reviewComment: { fontSize: Typography.bodyChild - 2, color: Colors.textSecondary, lineHeight: 22 },

  factsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  factCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg,
    paddingVertical: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  factValue: { fontSize: Typography.title, fontWeight: '800', color: Colors.accentSage },
  factLabel: { fontSize: Typography.label, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },

  actions: { gap: Spacing.md },
  btnPrimary: {
    backgroundColor: Colors.buttonPrimary, borderRadius: Radius.full,
    paddingVertical: 16, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: Typography.bodyChild - 2, fontWeight: '800', color: Colors.buttonPrimaryText },
  btnSecondary: {
    backgroundColor: Colors.browseSurface, borderRadius: Radius.full,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.accentPeriwinkle,
  },
  btnSecondaryText: { fontSize: Typography.bodyChild - 2, fontWeight: '800', color: Colors.accentPeriwinkle },
  btnGhost: {
    borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.cardBorder,
  },
  btnGhostText: { fontSize: Typography.body, fontWeight: '600', color: Colors.textSecondary },
});
