import bookService from '@/api/services/bookService';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Mock quiz questions (one set per all books for now) ──────────────────────
const QUIZZES: Record<string, { q: string; options: string[]; answer: number }[]> = {
  default: [
    {
      q: "What does Leo find in the meadow?",
      options: ["A golden book", "A silver coin", "A magic wand", "A tiny house"],
      answer: 0,
    },
    {
      q: "What colour did the pages glow?",
      options: ["Blue", "Green", "Amber", "Pink"],
      answer: 2,
    },
    {
      q: "What did the wind say about the book?",
      options: [
        "It tells the story of whoever reads it",
        "It is very old",
        "It belongs to a king",
        "It has no ending",
      ],
      answer: 0,
    },
    {
      q: "What is Leo?",
      options: ["A fox", "A rabbit", "A bear", "A bird"],
      answer: 1,
    },
  ],
};

// Answer button tints cycling per option index
const OPTION_TINTS = [Colors.browseSurface, Colors.buttonPrimary, Colors.accentSageLight, '#FDE8E8'];
const OPTION_TEXT = [Colors.accentPeriwinkle, Colors.buttonPrimaryText, Colors.accentSage, Colors.error];

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [bookTitle, setBookTitle] = useState('Loading book...');
  useEffect(() => {
    let active = true;
    const fetchBook = async () => {
      try {
        const response = await bookService.getBookById(id as string);
        if (active && response.data?.book) {
          setBookTitle(response.data.book.title);
        } else if (active) {
          setBookTitle('Unknown Book');
        }
      } catch (err) {
        if (active) setBookTitle('Unknown Book');
      }
    };
    fetchBook();
    return () => { active = false; };
  }, [id]);

  const questions = QUIZZES[id ?? ''] ?? QUIZZES.default;

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[current];

  const handleSelect = (i: number) => {
    if (selected !== null) return; // already answered
    setSelected(i);
    if (i === q.answer) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
    } else {
      setDone(true);
    }
  };

  const handleReset = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  };

  // ── Results screen ──────────────────────────────────────────────────────────
  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const emoji = pct === 100 ? '🏆' : pct >= 75 ? '🌟' : pct >= 50 ? '👍' : '📖';
    const msg = pct === 100 ? 'Perfect score! Amazing!'
      : pct >= 75 ? 'So close! Great job!'
        : pct >= 50 ? 'Good effort! Keep reading!'
          : 'Keep going — reading helps!';
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.resultScroll}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>

          <Text style={s.resultEmoji}>{emoji}</Text>
          <Text style={s.resultScore}>{score} / {questions.length}</Text>
          <Text style={s.resultMsg}>{msg}</Text>

          {/* Score bar */}
          <View style={s.scoreBar}>
            <View style={[s.scoreFill, { width: `${pct}%` }]} />
          </View>
          <Text style={s.pctLabel}>{pct}%</Text>

          <TouchableOpacity style={s.btnPrimary} onPress={handleReset} activeOpacity={0.82}>
            <Text style={s.btnPrimaryText}>🔄 Generate a new quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btnSecondary} onPress={() => router.back()} activeOpacity={0.82}>
            <Text style={s.btnSecondaryText}>← Back to book</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnGhost}
            onPress={() => router.replace('/(child)')}
            activeOpacity={0.82}
          >
            <Text style={s.btnGhostText}>🏠 Go home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Question screen ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Back + progress */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <View style={s.progressWrap}>
            <View style={s.progressTrack}>
              <View
                style={[s.progressFill, {
                  width: `${((current) / questions.length) * 100}%`,
                }]}
              />
            </View>
            <Text style={s.progressLabel}>
              {current + 1} of {questions.length}
            </Text>
          </View>
        </View>

        {/* Book context */}
        <Text style={s.bookContext}>Quiz: {bookTitle}</Text>

        {/* Question */}
        <View style={s.questionBox}>
          <Text style={s.questionNum}>Question {current + 1}</Text>
          <Text style={s.questionText}>{q.q}</Text>
        </View>

        {/* Options */}
        <View style={s.optionsGrid}>
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = selected !== null && i === q.answer;
            const isWrong = isSelected && i !== q.answer;

            return (
              <TouchableOpacity
                key={i}
                style={[
                  s.optionBtn,
                  { backgroundColor: OPTION_TINTS[i % OPTION_TINTS.length] },
                  isCorrect && s.optionCorrect,
                  isWrong && s.optionWrong,
                ]}
                onPress={() => handleSelect(i)}
                activeOpacity={0.78}
                disabled={selected !== null}
              >
                <Text style={[
                  s.optionText,
                  { color: OPTION_TEXT[i % OPTION_TEXT.length] },
                  isCorrect && { color: Colors.success },
                  isWrong && { color: Colors.error },
                ]}>
                  {isCorrect ? '✓ ' : isWrong ? '✗ ' : ''}{opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback */}
        {selected !== null && (
          <View style={[
            s.feedbackBox,
            selected === q.answer ? s.feedbackCorrect : s.feedbackWrong,
          ]}>
            <Text style={s.feedbackText}>
              {selected === q.answer
                ? '🎉 Correct! Well done!'
                : `Not quite! The answer was: "${q.options[q.answer]}"`}
            </Text>
          </View>
        )}

        {/* Next */}
        {selected !== null && (
          <TouchableOpacity style={s.btnPrimary} onPress={handleNext} activeOpacity={0.82}>
            <Text style={s.btnPrimaryText}>
              {current < questions.length - 1 ? 'Next question →' : 'See my results 🏆'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.browseSurface },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  resultScroll: {
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl,
    alignItems: 'center', gap: Spacing.md,
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.xl,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  backText: { fontSize: 18, fontWeight: '800', color: Colors.accentSage },

  progressWrap: { flex: 1, gap: 4 },
  progressTrack: {
    height: 8, backgroundColor: Colors.cardBorder,
    borderRadius: Radius.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.accentSage, borderRadius: Radius.full },
  progressLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },

  bookContext: { fontSize: Typography.label, color: Colors.textMuted, fontWeight: '600', marginBottom: Spacing.sm },

  questionBox: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg, gap: 8,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  questionNum: { fontSize: Typography.label, color: Colors.accentSage, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  questionText: { fontSize: Typography.titleChild - 4, fontWeight: '700', color: Colors.textPrimary, lineHeight: 30 },

  optionsGrid: { gap: Spacing.md, marginBottom: Spacing.lg },
  optionBtn: {
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 2, borderColor: 'transparent',
  },
  optionCorrect: { borderColor: Colors.success, backgroundColor: '#E8F5E9' },
  optionWrong: { borderColor: Colors.error, backgroundColor: '#FFEBEE' },
  optionText: { fontSize: Typography.bodyChild - 2, fontWeight: '700', lineHeight: 24 },

  feedbackBox: { borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  feedbackCorrect: { backgroundColor: '#E8F5E9' },
  feedbackWrong: { backgroundColor: '#FFEBEE' },
  feedbackText: { fontSize: Typography.body, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },

  btnPrimary: {
    backgroundColor: Colors.buttonPrimary, borderRadius: Radius.full,
    paddingVertical: 16, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: Typography.body, fontWeight: '800', color: Colors.buttonPrimaryText },
  btnSecondary: {
    borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.accentSage,
  },
  btnSecondaryText: { fontSize: Typography.body, fontWeight: '700', color: Colors.accentSage },
  btnGhost: {
    borderRadius: Radius.full, paddingVertical: 12, alignItems: 'center',
  },
  btnGhostText: { fontSize: Typography.body, fontWeight: '600', color: Colors.textMuted },

  // Results
  resultEmoji: { fontSize: 80, marginTop: Spacing.xl },
  resultScore: { fontSize: 52, fontWeight: '900', color: Colors.accentSage },
  resultMsg: { fontSize: Typography.body + 2, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  scoreBar: {
    width: '100%', height: 16, backgroundColor: Colors.cardBorder,
    borderRadius: Radius.full, overflow: 'hidden',
  },
  scoreFill: { height: '100%', backgroundColor: Colors.accentSage, borderRadius: Radius.full },
  pctLabel: { fontSize: Typography.body, color: Colors.textSecondary, fontWeight: '700' },
});
