/**
 * BookCover — placeholder cover using the book's color palette.
 * Swap the inner content for an <Image> once real cover assets exist.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Radius } from '@/constants/theme';
import type { Book } from '@/constants/mockData';

interface Props {
  book: Book;
  width: number;
  height: number;
  fontSize?: number;
}

export function BookCover({ book, width, height, fontSize = 13 }: Props) {
  // Spine line accent
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
