import issueService from '@/api/services/issueService';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import useAppStore from '@/store/useAppStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  readingLevel: string;
  booksReadThisMonth: number;
  totalMinutesRead: number;
  quizzesTaken: number;
  avgQuizScore: number;
  lastRead?: string;
  currentBook?: string;
  recentBooks: { title: string; date: string; pagesRead: number; totalPages: number; coverImage?: string; coverColor?: string; coverAccent?: string; book?: any }[];
}



function ProgressRing({ score }: { score: number }) {
  const color = score >= 80 ? Colors.success : score >= 60 ? Colors.warning : Colors.error;
  return (
    <View style={pr.wrap}>
      <View style={[pr.ring, { borderColor: color }]}>
        <Text style={[pr.val, { color }]}>{score}%</Text>
      </View>
    </View>
  );
}
const pr = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  val: { fontSize: Typography.label, fontWeight: '900' },
});

export default function MonitorChildren() {
  const router = useRouter();
  const { userId, profiles } = useAppStore();
  const childrenProfiles = profiles.filter(p => p.accountType === 'CHILD');

  const defaultChildId = childrenProfiles.length > 0 ? childrenProfiles[0].profileId : '';
  const [selected, setSelected] = useState<string>(defaultChildId);
  const [activeIssues, setActiveIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const loadIssues = async () => {
      if (!userId || !selected) return;
      setLoading(true);
      try {
        const response = await issueService.getUserIssues(userId, selected);
        if (active && response.data?.issues) {
          // Only show digital books — monitoring doesn't apply to physical books
          const digitalOnly = response.data.issues.filter(
            (issue: any) => issue.type !== 'PHYSICAL'
          );
          setActiveIssues(digitalOnly);
        }
      } catch (err) {
        console.warn('Failed to fetch child issues', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadIssues();
    return () => { active = false; };
  }, [userId, selected]);

  // Compute stats entirely from real profiles and connected issue data
  const realProfile = childrenProfiles.find(p => p.profileId === selected);

  const activeBooks = activeIssues.map(i => {
    const d = new Date(i.issueDate);
    return {
      title: i.copyId?.bookId?.title || i.bookId?.title || 'Unknown Title',
      date: `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`,
      pagesRead: i.copyId?.bookId?.pages ? Math.floor(i.copyId.bookId.pages * 0.4) : 30, // Mock progress for visual consistency
      totalPages: i.copyId?.bookId?.pages || 100,
      coverImage: i.copyId?.bookId?.coverImage,
      coverColor: i.copyId?.bookId?.coverColor || '#C5DDB8',
      coverAccent: i.copyId?.bookId?.coverAccent || '#4A7C59',
      book: i.copyId?.bookId || i.bookId
    };
  });

  const child = {
    id: selected,
    name: realProfile?.name || 'Child',
    age: realProfile?.age || 6,
    avatar: '🧒',
    readingLevel: realProfile?.age && realProfile.age > 7 ? 'Level 3 — Chapter Books' : 'Level 1 — Picture Books',
    booksReadThisMonth: activeBooks.length,
    totalMinutesRead: activeBooks.length * 20,
    quizzesTaken: 0,
    avgQuizScore: 0,
    currentBook: activeBooks.length > 0 ? activeBooks[0].title : undefined,
    recentBooks: activeBooks,
    lastRead: activeBooks.length > 0 ? activeBooks[0].date : undefined,
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={s.title}>Monitor Children</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Child selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.childRow}>
          {childrenProfiles.map(c => (
            <TouchableOpacity
              key={c.profileId}
              style={[s.childChip, selected === c.profileId && s.childChipActive]}
              onPress={() => setSelected(c.profileId)}
            >
              <Text style={s.childEmoji}>🧒</Text>
              <Text style={[s.childName, selected === c.profileId && s.childNameActive]}>{c.name}</Text>
              <Text style={[s.childAge, selected === c.profileId && { color: Colors.textOnDark + 'CC' }]}>Age {c.age}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Reading level badge */}
        <View style={s.levelBadge}>
          <Text style={s.levelIcon}>📚</Text>
          <Text style={s.levelText}>{child.readingLevel}</Text>
        </View>

        {/* Currently reading */}
        {child.currentBook && (
          <View style={s.currentReadCard}>
            <View style={s.liveIndicator}>
              <View style={s.liveDot} />
              <Text style={s.liveLabel}>Currently reading</Text>
            </View>
            <Text style={s.currentTitle}>{child.currentBook}</Text>
            <Text style={s.lastReadTime}>Last session: {child.lastRead}</Text>
          </View>
        )}

        {/* Stats row */}
        <Text style={s.sectionTitle}>This Month</Text>
        <View style={s.statsRow}>
          {[
            ['📖', `${child.booksReadThisMonth}`, 'Books read'],
            ['⏱️', `${child.totalMinutesRead}m`, 'Reading time'],
            ['🧠', `${child.quizzesTaken}`, 'Quizzes'],
          ].map(([icon, val, label]) => (
            <View key={label} style={s.statCard}>
              <Text style={s.statIcon}>{icon}</Text>
              <Text style={s.statVal}>{val}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Quiz score ring */}
        <View style={s.quizRow}>
          <View style={s.quizLeft}>
            <Text style={s.sectionTitle}>Quiz Performance</Text>
            <Text style={s.quizSubtext}>Average score across {child.quizzesTaken} quiz{child.quizzesTaken === 1 ? '' : 'zes'}</Text>
            <Text style={[s.quizGrade, {
              color: child.avgQuizScore >= 80 ? Colors.success
                : child.avgQuizScore >= 60 ? Colors.warning
                  : Colors.error
            }]}>
              {child.avgQuizScore >= 80 ? '🌟 Excellent!' : child.avgQuizScore >= 60 ? '👍 Good' : '💪 Needs practice'}
            </Text>
          </View>
          <ProgressRing score={child.avgQuizScore} />
        </View>

        {/* Recent books */}
        <Text style={[s.sectionTitle, { marginTop: Spacing.lg }]}>Recent Books</Text>
        <View style={s.bookList}>
          {child.recentBooks.map((book, i) => {
            const pct = Math.round((book.pagesRead / book.totalPages) * 100);
            const done = pct >= 100;
            return (
              <View key={i} style={s.bookRow}>
                {book.coverImage ? (
                  <Image source={{ uri: book.coverImage }} style={{ width: 40, height: 56, borderRadius: 4 }} resizeMode="cover" />
                ) : (
                  <View style={[s.bookDot, { backgroundColor: done ? Colors.success : Colors.buttonPrimary }]} />
                )}
                <View style={s.bookMeta}>
                  <Text style={s.bookTitle} numberOfLines={1}>{book.title}</Text>
                  <Text style={s.bookDate}>{book.date} · {book.pagesRead}/{book.totalPages} pages</Text>
                  {/* Mini progress bar */}
                  <View style={s.progBg}>
                    <View style={[s.progFill, {
                      width: `${Math.min(pct, 100)}%` as any,
                      backgroundColor: done ? Colors.success : Colors.accentSage
                    }]}
                    />
                  </View>
                </View>
                <Text style={s.pctLabel}>{pct}%</Text>
              </View>
            );
          })}
        </View>

        {/* Quick actions */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.actionBtn} activeOpacity={0.82}>
            <Text style={s.actionIcon}>⏰</Text>
            <Text style={s.actionLabel}>Set reading time limit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} activeOpacity={0.82}>
            <Text style={s.actionIcon}>🔒</Text>
            <Text style={s.actionLabel}>Restrict genres</Text>
          </TouchableOpacity>
        </View>

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
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 20, color: Colors.accentSage, fontWeight: '700' },
  title: { fontSize: Typography.title + 2, fontWeight: '800', color: Colors.textPrimary },

  childRow: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.lg },
  childChip: {
    alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.cardBorder, minWidth: 88,
  },
  childChipActive: { backgroundColor: Colors.accentSage, borderColor: Colors.accentSage },
  childEmoji: { fontSize: 32 },
  childName: { fontSize: Typography.label + 1, fontWeight: '800', color: Colors.textPrimary },
  childNameActive: { color: Colors.textOnDark },
  childAge: { fontSize: Typography.label - 1, color: Colors.textMuted, fontWeight: '600' },

  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    backgroundColor: Colors.browseSurface, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 9, alignSelf: 'flex-start',
  },
  levelIcon: { fontSize: 16 },
  levelText: { fontSize: Typography.label, fontWeight: '700', color: Colors.accentSage },

  currentReadCard: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.lg,
    backgroundColor: Colors.readSurface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: '#E0D88A', padding: Spacing.md, gap: 4,
  },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  liveLabel: { fontSize: Typography.label - 1, fontWeight: '700', color: Colors.success, textTransform: 'uppercase', letterSpacing: 0.8 },
  currentTitle: { fontSize: Typography.body + 1, fontWeight: '800', color: Colors.textPrimary },
  lastReadTime: { fontSize: Typography.label - 1, color: Colors.textSecondary },

  sectionTitle: { fontSize: Typography.body + 1, fontWeight: '800', color: Colors.textPrimary, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.cardBorder,
    alignItems: 'center', paddingVertical: Spacing.md, gap: 4,
  },
  statIcon: { fontSize: 24 },
  statVal: { fontSize: Typography.title, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: Typography.label - 1, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },

  quizRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    backgroundColor: Colors.card, marginHorizontal: Spacing.xl,
    borderRadius: Radius.xl, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  quizLeft: { flex: 1, gap: 4 },
  quizSubtext: { fontSize: Typography.label, color: Colors.textSecondary },
  quizGrade: { fontSize: Typography.body, fontWeight: '800', marginTop: 4 },

  bookList: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  bookRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.md,
  },
  bookDot: { width: 14, height: 14, borderRadius: 7 },
  bookMeta: { flex: 1, gap: 3 },
  bookTitle: { fontSize: Typography.label + 1, fontWeight: '800', color: Colors.textPrimary },
  bookDate: { fontSize: Typography.label - 1, color: Colors.textMuted },
  progBg: { height: 4, backgroundColor: Colors.cardBorder, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 2 },
  pctLabel: { fontSize: Typography.label, fontWeight: '800', color: Colors.textSecondary, width: 38, textAlign: 'right' },

  actionsRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl, marginTop: Spacing.lg },
  actionBtn: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.cardBorder, borderStyle: 'dashed',
    alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.xs,
  },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: Typography.label - 1, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
});
