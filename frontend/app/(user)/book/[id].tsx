import bookService from '@/api/services/bookService';
import { BookCover } from '@/components/BookCover';
import type { Book } from '@/constants/mockData';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function mapBook(b: any): Book {
  return {
    id: b._id || b.id,
    title: b.title || 'Unknown Title',
    author: b.author || 'Unknown Author',
    pages: b.pageCount || null,
    releaseYear: b.publishedDate
      ? (parseInt(b.publishedDate.match(/\d{4}/)?.[0]) || new Date(b.createdAt || Date.now()).getFullYear())
      : new Date(b.createdAt || Date.now()).getFullYear(),
    genres: b.genre || [],
    summary: b.summary || '',
    rating: 4.5,
    coverColor: '#C5DDB8',
    coverAccent: '#4A7C59',
    isDigital: true,
    isPhysical: true,
    availableCopies: parseInt(b?.availableCopies ?? 0),
    nearestLibrary: 'Local Library',
    ageMin: parseInt(b.ageRating?.split('-')[0]) || 0,
    ageMax: parseInt(b.ageRating?.split('-')[1]) || 99,
    keyWords: [],
    coverImage: b.coverImage,
    isbn: b.isbn != null ? String(b.isbn) : undefined,
  };
}

function StarRow({ rating }: { rating: number }) {
  return (
    <Text style={{ color: Colors.accentPeach, fontSize: 14, letterSpacing: 1 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </Text>
  );
}

export default function UserBookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchBook = async () => {
      try {
        const response = await bookService.getBookById(id as string);
        if (active && response?.data?.book) {
          setBook(mapBook(response.data.book));
        } else if (active) {
          setBook(null);
        }
      } catch (err) {
        console.warn('Failed to fetch book detail', err);
        if (active) setBook(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBook();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.accentSage} />
      </SafeAreaView>
    );
  }

  if (!book) return null;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Back */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Cover */}
        <View style={s.coverRow}>
          <BookCover book={book} width={140} height={200} fontSize={13} />
          <View style={s.coverMeta}>
            <Text style={s.title}>{book.title}</Text>
            <Text style={s.author}>by {book.author}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <StarRow rating={Math.round(book.rating)} />
              <Text style={s.ratingNum}>{book.rating}</Text>
            </View>
            {/* Digital / Physical badges */}
            <View style={s.badgeRow}>
              {book.isDigital && (
                <View style={[s.badge, { backgroundColor: Colors.browseSurface }]}>
                  <Text style={[s.badgeText, { color: Colors.accentPeriwinkle }]}>📱 Digital</Text>
                </View>
              )}
              {book.isPhysical && (
                <View style={[s.badge, { backgroundColor: Colors.accentSageLight }]}>
                  <Text style={[s.badgeText, { color: Colors.accentSage }]}>📦 Physical</Text>
                </View>
              )}
            </View>
            <Text style={[s.avail, { color: book.availableCopies > 0 ? Colors.success : Colors.error }]}>
              {book.availableCopies > 0
                ? `✓ ${book.availableCopies} copies available`
                : '✗ Currently unavailable'}
            </Text>
          </View>
        </View>

        {/* Metadata table */}
        <View style={s.metaTable}>
          {[
            ['Pages', book.pages ? `${book.pages} pages` : '—'],
            ['Published', `${book.releaseYear}`],
            ['Genre', book.genres.join(', ')],
            ['Age range', `${book.ageMin}–${book.ageMax} years`],
            ['Nearest library', book.nearestLibrary],
          ].map(([label, value]) => (
            <View key={label} style={s.metaRow}>
              <Text style={s.metaLabel}>{label}</Text>
              <Text style={s.metaValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Keywords */}
        <View style={s.keywordsRow}>
          {book.keyWords.map(k => (
            <View key={k} style={s.keyword}><Text style={s.keywordText}>#{k}</Text></View>
          ))}
        </View>

        {/* Summary */}
        <View style={s.summaryBox}>
          <Text style={s.summaryLabel}>About this book</Text>
          <Text style={s.summaryText}>{book.summary}</Text>
        </View>

        {/* Reviews & Comments */}
        <View style={s.reviewsSection}>
          <Text style={s.reviewsTitle}>💬 Reviews & Comments</Text>
          {[
            { name: 'Ananya S.', rating: 5, comment: 'My kids absolutely loved this book! They couldn\'t put it down and kept asking to read it again.' },
            { name: 'Rahul M.', rating: 4, comment: 'A wonderful story with great illustrations. Perfect for bedtime reading with the little ones.' },
            { name: 'Priya K.', rating: 5, comment: 'Beautifully written and engaging. My daughter finished it in one sitting and immediately wanted more!' },
          ].map((review, idx) => (
            <View key={idx} style={s.reviewCard}>
              <View style={s.reviewHeader}>
                <View style={s.reviewAvatar}>
                  <Text style={s.reviewAvatarText}>{review.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.reviewName}>{review.name}</Text>
                  <Text style={s.reviewStars}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </Text>
                </View>
              </View>
              <Text style={s.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={s.actions}>
          {book.availableCopies > 0 ? (
            <TouchableOpacity
              style={s.btnPrimary}
              activeOpacity={0.82}
              onPress={() => router.push(`/(user)/order/${book.id}`)}
            >
              <Text style={s.btnPrimaryText}>📦 Order this book</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.btnWaitlist} activeOpacity={0.82}>
              <Text style={s.btnWaitlistText}>🔔 Join waitlist</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={s.btnGhost} activeOpacity={0.82}>
            <Text style={s.btnGhostText}>💬 Speak to a librarian</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },

  backBtn: { marginTop: Spacing.md, marginBottom: Spacing.lg },
  backText: { fontSize: Typography.body, color: Colors.accentSage, fontWeight: '700' },

  coverRow: {
    flexDirection: 'row', gap: Spacing.lg, alignItems: 'flex-start', marginBottom: Spacing.lg,
  },
  coverMeta: { flex: 1, gap: 5 },
  title: { fontSize: Typography.title, fontWeight: '800', color: Colors.accentSage, lineHeight: 28 },
  author: { fontSize: Typography.body, color: Colors.textSecondary },
  ratingNum: { fontSize: Typography.label, color: Colors.textMuted, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  badge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: Typography.label - 1, fontWeight: '700' },
  avail: { fontSize: Typography.label, fontWeight: '700', marginTop: 4 },

  metaTable: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.sm, overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  metaLabel: { fontSize: Typography.label, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: Typography.body, color: Colors.textPrimary, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  keywordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.lg },
  keyword: {
    backgroundColor: Colors.browseSurface, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  keywordText: { fontSize: Typography.label, color: Colors.accentPeriwinkle, fontWeight: '600' },

  summaryBox: {
    backgroundColor: Colors.readSurface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg, gap: 6,
  },
  summaryLabel: { fontSize: Typography.body, fontWeight: '800', color: Colors.textPrimary },
  summaryText: { fontSize: Typography.body, color: Colors.textSecondary, lineHeight: 24 },

  reviewsSection: { marginBottom: Spacing.lg, gap: Spacing.sm },
  reviewsTitle: { fontSize: Typography.body, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  reviewCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder, gap: 8,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accentSageLight, alignItems: 'center', justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: Typography.body, fontWeight: '800', color: Colors.accentSage },
  reviewName: { fontSize: Typography.label, fontWeight: '700', color: Colors.textPrimary },
  reviewStars: { fontSize: 12, color: Colors.accentPeach, letterSpacing: 1 },
  reviewComment: { fontSize: Typography.label, color: Colors.textSecondary, lineHeight: 20 },

  actions: { gap: Spacing.md },
  btnPrimary: {
    backgroundColor: Colors.buttonPrimary, borderRadius: Radius.full,
    paddingVertical: 16, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: Typography.body, fontWeight: '800', color: Colors.buttonPrimaryText },
  btnWaitlist: {
    backgroundColor: Colors.browseSurface, borderRadius: Radius.full,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.accentPeriwinkle,
  },
  btnWaitlistText: { fontSize: Typography.body, fontWeight: '800', color: Colors.accentPeriwinkle },
  btnGhost: {
    borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.cardBorder,
  },
  btnGhostText: { fontSize: Typography.body, fontWeight: '600', color: Colors.textSecondary },
});
