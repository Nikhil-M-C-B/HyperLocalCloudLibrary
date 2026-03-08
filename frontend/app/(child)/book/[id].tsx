import bookService from '@/api/services/bookService';
import { BookCover } from '@/components/BookCover';
import { type Book } from '@/constants/mockData';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useEffect, useState } from 'react';

function mapBook(b: any): Book {
  return {
    id: b._id || b.id,
    title: b.title || 'Unknown Title',
    author: b.author || 'Unknown Author',
    pages: b.pages || 200,
    releaseYear: new Date(b.createdAt || Date.now()).getFullYear(),
    genres: b.genre || [],
    summary: b.summary || 'A fantastic new adventure awaits...',
    rating: 4.5,
    coverColor: b.coverColor || '#C5DDB8',
    coverAccent: b.coverAccent || '#4A7C59',
    isDigital: b.format === 'DIGITAL' || b.format === 'BOTH' || true,
    isPhysical: b.format === 'PHYSICAL' || b.format === 'BOTH' || true,
    availableCopies: parseInt(b?.availableCopies ?? 0),
    nearestLibrary: 'Local Library',
    ageMin: parseInt(b.ageRating?.split('-')[0]) || 0,
    ageMax: parseInt(b.ageRating?.split('-')[1]) || 99,
    keyWords: [],
    coverImage: b.coverImage,
    isbn: b.isbn != null ? String(b.isbn) : undefined,
  };
}

import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChildBookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

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
              <Text style={[s.badgeText, { color: Colors.accentPeriwinkle }]}>📱 Digital</Text>
            </View>
          )}
          {book.isPhysical && (
            <View style={[s.badge, { backgroundColor: Colors.accentSageLight }]}>
              <Text style={[s.badgeText, { color: Colors.accentSage }]}>📦 Physical</Text>
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

        {/* Quick facts — simple for children */}
        <View style={s.factsRow}>
          <View style={s.factCard}>
            <Text style={s.factValue}>{book.pages}</Text>
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
          <TouchableOpacity
            style={s.btnPrimary}
            activeOpacity={0.82}
            onPress={() => router.push(`/(child)/read/${book.id}`)}
          >
            <Text style={s.btnPrimaryText}>📖 Read now</Text>
          </TouchableOpacity>

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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.browseSurface },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },

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
