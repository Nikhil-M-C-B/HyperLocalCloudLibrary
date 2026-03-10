/**
 * BookCover — placeholder cover using the book's color palette.
 * Swap the inner content for an <Image> once real cover assets exist.
 */
import type { Book } from '@/constants/mockData';
import { Radius } from '@/constants/theme';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  book: Book & { isbn?: string };
  width: number;
  height: number;
  fontSize?: number;
}

export function BookCover({ book, width, height, fontSize = 13 }: Props) {
  // Stage: 'primary' → try coverImage, 'fallback' → try Open Library by ISBN, 'error' → text placeholder
  const [stage, setStage] = React.useState<'primary' | 'fallback' | 'error'>('primary');

  const primaryUrl = book.coverImage || null;
  const fallbackUrl = book.isbn
    ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`
    : null;

  const handleError = () => {
    // Only advance to 'fallback' if we were actually showing the primaryUrl.
    // If primaryUrl was null and we jumped straight to fallbackUrl, an error
    // should go directly to 'error' (no point retrying the same URL).
    if (stage === 'primary' && primaryUrl && fallbackUrl) {
      setStage('fallback');
    } else {
      setStage('error');
    }
  };

  let coverUrl: string | null = null;
  if (stage === 'primary' && primaryUrl) coverUrl = primaryUrl;
  else if (stage === 'fallback' && fallbackUrl) coverUrl = fallbackUrl;
  else if (stage === 'primary' && !primaryUrl && fallbackUrl) coverUrl = fallbackUrl;

  if (coverUrl && stage !== 'error') {
    return (
      <Image
        source={{ uri: coverUrl }}
        style={[styles.cover, { width, height, borderRadius: Radius.md, backgroundColor: '#f0f0f0' }]}
        contentFit="cover"
        transition={200}
        onError={handleError}
      />
    );
  }

  // Fallback to spine line accent
  return (
    <View style={[styles.cover, { width, height, backgroundColor: book.coverColor, borderRadius: Radius.md }]}>
      {/* Spine */}
      <View style={[styles.spine, { backgroundColor: book.coverAccent }]} />
      {/* Title text */}
      <View style={styles.textArea}>
        <Text style={[styles.title, { fontSize, color: book.coverAccent }]} numberOfLines={3}>
          {book.title}
        </Text>
        <Text style={[styles.author, { fontSize: fontSize - 2, color: book.coverAccent }]} numberOfLines={1}>
          {book.author}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    overflow: 'hidden',
    flexDirection: 'row',
  },
  spine: {
    width: 6,
    height: '100%',
    opacity: 0.6,
  },
  textArea: {
    flex: 1,
    padding: 8,
    justifyContent: 'flex-end',
    gap: 3,
  },
  title: {
    fontWeight: '800',
    lineHeight: 16,
    opacity: 0.85,
  },
  author: {
    fontWeight: '500',
    opacity: 0.65,
  },
});
