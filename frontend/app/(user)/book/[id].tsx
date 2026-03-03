import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { MOCK_BOOKS } from '@/constants/mockData';
import { BookCover } from '@/components/BookCover';

const MOCK_REVIEWS = [
  { user: 'Rohan M.', rating: 5, text: 'Absolutely loved it! My daughter read it twice.' },
  { user: 'Kavya S.', rating: 4, text: 'Beautiful story, great for kids around age 8.' },
  { user: 'Aarav (Age 9)', rating: 5, text: 'The best book ever!! I want more like this.' },
];

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
  const book = MOCK_BOOKS.find(b => b.id === id) ?? MOCK_BOOKS[0];
  const [showAllReviews, setShowAllReviews] = useState(false);

  const reviews = showAllReviews ? MOCK_REVIEWS : MOCK_REVIEWS.slice(0, 2);

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
            ['Pages', `${book.pages}`],
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

        {/* Reviews */}
        <View style={s.reviewsSection}>
          <Text style={s.reviewsTitle}>Reviews & Comments</Text>
          {reviews.map((r, i) => (
            <View key={i} style={s.reviewCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={s.reviewUser}>{r.user}</Text>
                <StarRow rating={r.rating} />
              </View>
              <Text style={s.reviewText}>{r.text}</Text>
            </View>
          ))}
          {MOCK_REVIEWS.length > 2 && (
            <TouchableOpacity onPress={() => setShowAllReviews(v => !v)}>
              <Text style={s.showMore}>
                {showAllReviews ? 'Show less' : `+${MOCK_REVIEWS.length - 2} more reviews`}
              </Text>
            </TouchableOpacity>
          )}
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

  reviewsSection: { marginBottom: Spacing.xl },
  reviewsTitle: { fontSize: Typography.body + 1, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
  reviewCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  reviewUser: { fontSize: Typography.body, fontWeight: '700', color: Colors.textPrimary },
  reviewText: { fontSize: Typography.body - 1, color: Colors.textSecondary, lineHeight: 22 },
  showMore: { fontSize: Typography.body, color: Colors.accentSage, fontWeight: '700', textAlign: 'center', paddingVertical: Spacing.sm },

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
