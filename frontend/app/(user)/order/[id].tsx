import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { MOCK_BOOKS } from '@/constants/mockData';
import { BookCover } from '@/components/BookCover';

const LIBRARIES = [
  { id: 'lib1', name: 'Koramangala Branch', distance: '1.2 km', eta: '1–2 working days', stock: 3 },
  { id: 'lib2', name: 'Indiranagar Branch', distance: '3.5 km', eta: '2–3 working days', stock: 1 },
  { id: 'lib3', name: 'HSR Layout Branch', distance: '5.8 km', eta: '2–3 working days', stock: 4 },
];

const RETURN_PERIODS = ['7 days', '14 days', '21 days'];

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const book = MOCK_BOOKS.find(b => b.id === id) ?? MOCK_BOOKS[0];

  const [selectedLib, setSelectedLib] = useState<string | null>(null);
  const [returnDays, setReturnDays] = useState('14 days');
  const [step, setStep] = useState<'select' | 'confirm' | 'placed'>('select');

  const lib = LIBRARIES.find(l => l.id === selectedLib);
  const DELIVERY_FEE = 20;
  const LATE_FEE_PER_DAY = 2;

  if (step === 'placed') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.successScreen}>
          <Text style={s.successEmoji}>🎉</Text>
          <Text style={s.successTitle}>Order Placed!</Text>
          <Text style={s.successSub}>
            Your book will arrive in {lib?.eta ?? '2–3 working days'}.{'\n'}
            You'll get a notification when it ships.
          </Text>
          <TouchableOpacity
            style={s.btnPrimary}
            onPress={() => router.push('/(user)/track/ord-001')}
          >
            <Text style={s.btnPrimaryText}>📦 Track my order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnGhost} onPress={() => router.replace('/(user)')}>
            <Text style={s.btnGhostText}>← Back home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        <TouchableOpacity style={s.backBtn} onPress={() => step === 'select' ? router.back() : setStep('select')}>
          <Text style={s.backText}>← {step === 'confirm' ? 'Back' : 'Back to book'}</Text>
        </TouchableOpacity>

        {/* Book summary */}
        <View style={s.bookSummary}>
          <BookCover book={book} width={70} height={100} fontSize={9} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.bookTitle}>{book.title}</Text>
            <Text style={s.bookAuthor}>by {book.author}</Text>
            <View style={[s.badge, { backgroundColor: Colors.accentSageLight, alignSelf: 'flex-start' }]}>
              <Text style={[s.badgeText, { color: Colors.accentSage }]}>📦 Physical delivery</Text>
            </View>
          </View>
        </View>

        {step === 'select' && (
          <>
            {/* Library picker */}
            <Text style={s.sectionTitle}>Choose a library</Text>
            {LIBRARIES.map(lib => (
              <TouchableOpacity
                key={lib.id}
                style={[s.libCard, selectedLib === lib.id && s.libCardSelected]}
                onPress={() => setSelectedLib(lib.id)}
                activeOpacity={0.82}
              >
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={s.libName}>{lib.name}</Text>
                  <Text style={s.libMeta}>📍 {lib.distance}  ·  🕐 {lib.eta}</Text>
                  <Text style={s.libStock}>{lib.stock} copies available</Text>
                </View>
                <View style={[s.radio, selectedLib === lib.id && s.radioSelected]}>
                  {selectedLib === lib.id && <View style={s.radioFill} />}
                </View>
              </TouchableOpacity>
            ))}

            {/* Return period */}
            <Text style={[s.sectionTitle, { marginTop: Spacing.lg }]}>Return period</Text>
            <View style={s.returnRow}>
              {RETURN_PERIODS.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[s.periodBtn, returnDays === p && s.periodBtnActive]}
                  onPress={() => setReturnDays(p)}
                >
                  <Text style={[s.periodText, returnDays === p && s.periodTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fineNote}>
              ⚠️ Late returns are charged ₹{LATE_FEE_PER_DAY}/day automatically.
            </Text>

            <TouchableOpacity
              style={[s.btnPrimary, !selectedLib && s.btnDisabled]}
              disabled={!selectedLib}
              onPress={() => setStep('confirm')}
              activeOpacity={0.82}
            >
              <Text style={s.btnPrimaryText}>Continue to confirm →</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'confirm' && lib && (
          <>
            <Text style={s.sectionTitle}>Confirm your order</Text>

            {/* Summary card */}
            <View style={s.confirmCard}>
              {[
                ['Book', book.title],
                ['Library', lib.name],
                ['Distance', lib.distance],
                ['Expected delivery', lib.eta],
                ['Return by', returnDays + ' from delivery'],
                ['Delivery fee', `₹${DELIVERY_FEE}`],
                ['Late fee (if any)', `₹${LATE_FEE_PER_DAY}/day`],
              ].map(([label, value]) => (
                <View key={label} style={s.confirmRow}>
                  <Text style={s.confirmLabel}>{label}</Text>
                  <Text style={s.confirmValue}>{value}</Text>
                </View>
              ))}
            </View>

            <Text style={s.payNote}>
              💳 Payment is online only — you'll be redirected to the payment gateway.
            </Text>

            <TouchableOpacity
              style={s.btnPrimary}
              activeOpacity={0.82}
              onPress={() => setStep('placed')}
            >
              <Text style={s.btnPrimaryText}>Pay ₹{DELIVERY_FEE} & confirm →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.btnGhost} onPress={() => setStep('select')}>
              <Text style={s.btnGhostText}>← Change library</Text>
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
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  successScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xl, gap: Spacing.md,
  },

  backBtn: { marginTop: Spacing.md, marginBottom: Spacing.lg },
  backText: { fontSize: Typography.body, color: Colors.accentSage, fontWeight: '700' },

  bookSummary: {
    flexDirection: 'row', gap: Spacing.md, alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  bookTitle: { fontSize: Typography.body + 1, fontWeight: '800', color: Colors.textPrimary },
  bookAuthor: { fontSize: Typography.label, color: Colors.textSecondary },
  badge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: Typography.label - 1, fontWeight: '700' },

  sectionTitle: { fontSize: Typography.body + 1, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },

  libCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 2, borderColor: Colors.cardBorder, gap: Spacing.sm,
  },
  libCardSelected: { borderColor: Colors.accentSage, backgroundColor: '#F0F8ED' },
  libName: { fontSize: Typography.body, fontWeight: '700', color: Colors.textPrimary },
  libMeta: { fontSize: Typography.label, color: Colors.textSecondary },
  libStock: { fontSize: Typography.label, color: Colors.accentSage, fontWeight: '600' },
  radio: {
    width: 22, height: 22, borderRadius: Radius.full,
    borderWidth: 2, borderColor: Colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.accentSage },
  radioFill: { width: 12, height: 12, borderRadius: Radius.full, backgroundColor: Colors.accentSage },

  returnRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  periodBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.full,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: Colors.accentSage, borderColor: Colors.accentSage },
  periodText: { fontSize: Typography.label, fontWeight: '700', color: Colors.textSecondary },
  periodTextActive: { color: Colors.textOnDark },

  fineNote: {
    fontSize: Typography.label, color: Colors.warning, fontWeight: '600',
    marginBottom: Spacing.lg, lineHeight: 20,
  },

  confirmCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.md, overflow: 'hidden',
  },
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  confirmLabel: { fontSize: Typography.label, color: Colors.textSecondary, fontWeight: '600' },
  confirmValue: { fontSize: Typography.body, color: Colors.textPrimary, fontWeight: '700', maxWidth: '55%', textAlign: 'right' },
  payNote: {
    fontSize: Typography.label, color: Colors.textSecondary, lineHeight: 20,
    marginBottom: Spacing.lg,
  },

  btnPrimary: {
    backgroundColor: Colors.buttonPrimary, borderRadius: Radius.full,
    paddingVertical: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnPrimaryText: { fontSize: Typography.body, fontWeight: '800', color: Colors.buttonPrimaryText },
  btnGhost: {
    borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.cardBorder, marginTop: Spacing.sm,
  },
  btnGhostText: { fontSize: Typography.body, fontWeight: '600', color: Colors.textSecondary },

  successEmoji: { fontSize: 80 },
  successTitle: { fontSize: Typography.display, fontWeight: '800', color: Colors.accentSage, textAlign: 'center' },
  successSub: { fontSize: Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
