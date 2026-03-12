import bookService from '@/api/services/bookService';
import { NavBar, NAV_BOTTOM_PAD } from '@/components/NavBar';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import useAppStore from '@/store/useAppStore';
import useChildTrackingStore from '@/store/useChildTrackingStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Mock quiz questions keyed by ISBN (number→string) or book _id ─────────
const QUIZZES: Record<string, { q: string; options: string[]; answer: number }[]> = {

  // ── Frog and Toad Are Friends — Arnold Lobel (ISBN 64440206) ──────────────
  '64440206': [
    {
      q: "In 'Spring', what does Frog do to wake Toad up?",
      options: ["Shouts very loudly", "Tears pages off Toad's calendar", "Pours water on Toad", "Knocks on his door all day"],
      answer: 1,
    },
    {
      q: "In 'The Story', why does Frog ask Toad to tell him a story?",
      options: ["He is bored", "He feels sad", "He is not feeling well and is in bed", "He wants to practice reading"],
      answer: 2,
    },
    {
      q: "In 'A Lost Button', what colour is Toad's missing button?",
      options: ["Black", "Brown", "White", "Green"],
      answer: 2,
    },
    {
      q: "What does Toad do with all the buttons they find?",
      options: ["Throws them away", "Sews them all on his jacket as a gift for Frog", "Puts them in a jar", "Gives them to other animals"],
      answer: 1,
    },
    {
      q: "In 'The Letter', who sends Toad a letter?",
      options: ["A squirrel", "His mother", "Frog", "An owl"],
      answer: 2,
    },
  ],

  // ── Charlotte's Web — E.B. White (ISBN 7770049) ───────────────────────────
  '7770049': [
    {
      q: "What is Charlotte's main talent?",
      options: ["She can sing beautifully", "She can spin webs with words in them", "She can talk to humans", "She can fly very fast"],
      answer: 1,
    },
    {
      q: "What is Wilbur's biggest fear at the start of the story?",
      options: ["Being sold to a circus", "Meeting Charlotte", "Being eaten at Christmas", "Getting lost in the barn"],
      answer: 2,
    },
    {
      q: "What is the first word Charlotte writes in her web?",
      options: ["Humble", "Terrific", "Radiant", "Some Pig"],
      answer: 3,
    },
    {
      q: "What does Wilbur win at the County Fair?",
      options: ["A blue ribbon and prize money", "A golden trophy", "A special medal", "A first-place certificate"],
      answer: 0,
    },
    {
      q: "Who is Templeton?",
      options: ["A friendly dog", "A greedy rat who helps Charlotte", "Charlotte's best spider friend", "The farmer's son"],
      answer: 1,
    },
  ],

  // ── Matilda — Roald Dahl (ISBN 7770050) ───────────────────────────────────
  '7770050': [
    {
      q: "What special power does Matilda discover she has?",
      options: ["She can become invisible", "She can move objects with her mind", "She can talk to animals", "She can fly"],
      answer: 1,
    },
    {
      q: "What is the name of the terrifying headmistress?",
      options: ["Miss Honey", "Miss Trunchbull", "Miss Rottenboard", "Miss Blackwood"],
      answer: 1,
    },
    {
      q: "What is Miss Honey like compared to Miss Trunchbull?",
      options: ["Mean and strict", "Kind and gentle", "Loud and funny", "Quiet and sneaky"],
      answer: 1,
    },
    {
      q: "What does Matilda love to do more than anything?",
      options: ["Play outside", "Watch TV", "Read books", "Cook in the kitchen"],
      answer: 2,
    },
    {
      q: "What does Matilda do to her father's hat as a prank?",
      options: ["Fills it with water", "Glues it to his head", "Paints it pink", "Hides it under his car"],
      answer: 1,
    },
  ],

  // ── The BFG — Roald Dahl (ISBN 7770051) ───────────────────────────────────
  '7770051': [
    {
      q: "What does BFG stand for?",
      options: ["Big Friendly Gorilla", "Big Friendly Giant", "Bold Fantastic Giant", "Brave Friendly Giant"],
      answer: 1,
    },
    {
      q: "What does the BFG collect and do with dreams?",
      options: ["He sells them at the market", "He eats them for breakfast", "He catches and blows them into children's rooms", "He stores them in bottles for museums"],
      answer: 2,
    },
    {
      q: "Why is the BFG different from the other giants?",
      options: ["He is the tallest", "He refuses to eat human beings", "He can become invisible", "He lives in a city instead of Giant Country"],
      answer: 1,
    },
    {
      q: "What vegetable does the BFG eat that he finds disgusting?",
      options: ["Carrots", "Snozzcumbers", "Giant cabbages", "Frogsquash"],
      answer: 1,
    },
    {
      q: "Who does Sophie and the BFG visit to stop the man-eating giants?",
      options: ["The King of England", "The Queen of England", "The President of the World", "The Prime Minister"],
      answer: 1,
    },
  ],

  // ── Diary of a Wimpy Kid — Jeff Kinney (ISBN 7770044) ─────────────────────
  '7770044': [
    {
      q: "What is the main character's name?",
      options: ["Rodrick Heffley", "Greg Heffley", "Rowley Jefferson", "Manny Heffley"],
      answer: 1,
    },
    {
      q: "Why does Greg start keeping a diary?",
      options: ["His teacher forces him", "His mom makes him", "He wants to be famous one day and have everything already written down", "He is bored over summer"],
      answer: 2,
    },
    {
      q: "What is the \"Cheese Touch\"?",
      options: ["A game where you touch cheese to win a prize", "A curse you get from touching a mouldy piece of cheese on the basketball court", "A type of lunch at school", "A prank Greg plays on Rowley"],
      answer: 1,
    },
    {
      q: "Who is Greg's best friend?",
      options: ["Fregley", "Rodrick", "Rowley Jefferson", "Holly Hills"],
      answer: 2,
    },
    {
      q: "What does Greg want more than anything at school?",
      options: ["Good grades", "To make the basketball team", "To be popular and sit at the best table in the cafeteria", "To win the school talent show"],
      answer: 2,
    },
  ],

  // ── Captain Underpants (ISBN 7770043) ─────────────────────────────────────
  '7770043': [
    {
      q: "Who are the two friends who create Captain Underpants?",
      options: ["Harold and Greg", "George and Harold", "Greg and Wimpy", "Harold and Jeff"],
      answer: 1,
    },
    {
      q: "How do George and Harold turn Principal Krupp into Captain Underpants?",
      options: ["A magic potion", "A snap of the fingers after hypnotising him with the Hypno-Ring", "A costume they make", "A spell from a book"],
      answer: 1,
    },
    {
      q: "What does Captain Underpants always wear as his 'cape'?",
      options: ["A bed sheet", "A window curtain", "A pair of underpants", "A large handkerchief"],
      answer: 2,
    },
    {
      q: "In this book, what does Professor Poopypants plan to do?",
      options: ["Take over a school", "Make everyone in the world laugh", "Shrink the boys and take over the world by removing everyone's sense of humour", "Steal the town's water supply"],
      answer: 2,
    },
    {
      q: "What snaps Principal Krupp back to normal from being Captain Underpants?",
      options: ["Throwing water on him", "Saying the word 'broccoli'", "The Hypno-Ring again", "George and Harold snapping their fingers"],
      answer: 0,
    },
  ],

  // ── The Dot — Peter H. Reynolds (ISBN 7770040) ────────────────────────────
  '7770040': [
    {
      q: "Why does Vashti say she 'can't draw' at the start of the story?",
      options: ["Her pencil broke", "She just stares at a blank piece of paper and gives up", "She has never tried", "Her teacher told her she couldn't"],
      answer: 1,
    },
    {
      q: "What does Vashti's teacher ask her to do with her blank paper?",
      options: ["Throw it away", "Make a mark and see where it takes her", "Write her name on it", "Draw a straight line"],
      answer: 1,
    },
    {
      q: "What is the very first thing Vashti draws?",
      options: ["A circle", "A squiggly line", "A tiny dot", "A star"],
      answer: 2,
    },
    {
      q: "At the art show, what surprises Vashti most?",
      options: ["Her dot sold for a lot of money", "Her teacher framed and hung her dot painting", "Everyone copied her dots", "She won a prize"],
      answer: 1,
    },
    {
      q: "At the end, what does Vashti say to a boy who can't draw?",
      options: ["'Just try harder'", "'Make a mark and see where it takes you'", "'Start with a dot'", "'Watch what I do'"],
      answer: 1,
    },
  ],

  // ── Harold and the Purple Crayon (ISBN 7770041) ───────────────────────────
  '7770041': [
    {
      q: "What does Harold use to create his adventure?",
      options: ["A magic wand", "A purple crayon", "A red marker", "A blue pencil"],
      answer: 1,
    },
    {
      q: "Harold goes for a walk at what time?",
      options: ["Morning", "Afternoon", "One evening after thinking it over for a while", "Dawn"],
      answer: 2,
    },
    {
      q: "What does Harold draw to keep himself safe from a scary dragon he creates?",
      options: ["A wall", "A knight", "He reminds himself he drew the dragon so it won't hurt him", "A cage"],
      answer: 2,
    },
    {
      q: "When Harold gets lost in the forest, how does he find his way?",
      options: ["He asks a bear for directions", "He draws a path home", "He looks for the moon outside his window", "He draws a map"],
      answer: 2,
    },
    {
      q: "How does Harold get back to his bedroom?",
      options: ["He walks back the way he came", "He draws his bedroom window and his bed around the moon", "He falls asleep in the forest", "He draws a door back home"],
      answer: 1,
    },
  ],

  // ── Panchatantra — Hindi (ISBN 7770055) ───────────────────────────────────
  '7770055': [
    {
      q: "पंचतंत्र की कहानियाँ किसने लिखी?",
      options: ["वाल्मीकि", "विष्णु शर्मा", "कालिदास", "तुलसीदास"],
      answer: 1,
    },
    {
      q: "पंचतंत्र में 'पंच' का अर्थ क्या है?",
      options: ["पाँच", "बुद्धि", "कहानी", "जानवर"],
      answer: 0,
    },
    {
      q: "पंचतंत्र की कहानियों में मुख्यतः कौन से पात्र होते हैं?",
      options: ["देवता और राक्षस", "राजा और रानी", "पशु-पक्षी", "बच्चे और बड़े"],
      answer: 2,
    },
    {
      q: "कहानी 'दो मछलियाँ और एक मेंढक' में मेंढक ने क्या किया जब बाढ़ आई?",
      options: ["वह तैरकर भाग गया", "उसने पानी से बाहर छलाँग लगा दी", "वह मछलियों के साथ रहा", "वह किनारे पर छुप गया"],
      answer: 1,
    },
    {
      q: "पंचतंत्र की कहानियों का मुख्य उद्देश्य क्या है?",
      options: ["मनोरंजन करना", "बच्चों को नीति और बुद्धि सिखाना", "भगवान की कहानियाँ सुनाना", "इतिहास बताना"],
      answer: 1,
    },
  ],

  // ── Akbar Aur Birbal ki Kahaniyan (ISBN 7770056) ──────────────────────────
  '7770056': [
    {
      q: "बीरबल अकबर के दरबार में क्या थे?",
      options: ["सेनापति", "नवरत्नों में से एक चतुर मंत्री", "राजकवि", "दरबारी संगीतकार"],
      answer: 1,
    },
    {
      q: "'सबसे बड़ी चीज़ क्या है?' — अकबर के इस सवाल पर बीरबल ने क्या जवाब दिया?",
      options: ["ईश्वर", "सोने का खज़ाना", "हाथी", "दरबार"],
      answer: 0,
    },
    {
      q: "बीरबल को उनकी किस खूबी के लिए जाना जाता था?",
      options: ["शक्ति और साहस", "बुद्धिमानी और हाज़िरजवाबी", "गायन कला", "तीरंदाज़ी"],
      answer: 1,
    },
    {
      q: "अकबर किस राजवंश के बादशाह थे?",
      options: ["मराठा", "मुगल", "राजपूत", "गुप्त"],
      answer: 1,
    },
    {
      q: "बीरबल का असली नाम क्या था?",
      options: ["राम दास", "महेश दास", "कृष्ण दास", "शिव दास"],
      answer: 1,
    },
  ],

  // ── Generic fallback — used when no ISBN-specific quiz exists ─────────────
  default: [
    {
      q: "What is the most important thing a good story needs?",
      options: ["A brave hero", "A beginning, middle, and end", "Lots of adventure", "Magic and mystery"],
      answer: 1,
    },
    {
      q: "If a character faces a big problem in a story, what do we call that?",
      options: ["A setting", "A conflict", "A theme", "A moral"],
      answer: 1,
    },
    {
      q: "What do we call the lesson a story teaches us?",
      options: ["The plot", "The setting", "The moral", "The climax"],
      answer: 2,
    },
    {
      q: "Which of these is NOT a part of a story?",
      options: ["Characters", "Setting", "Equation", "Plot"],
      answer: 2,
    },
    {
      q: "When a story reaches its most exciting point, what is that called?",
      options: ["The resolution", "The introduction", "The climax", "The epilogue"],
      answer: 2,
    },
  ],
};

// Answer letter labels
const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activeProfileId } = useAppStore();
  const { recordQuizResult } = useChildTrackingStore();

  const [bookTitle, setBookTitle] = useState('Loading book...');
  const [bookIsbn, setBookIsbn] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const fetchBook = async () => {
      try {
        const response = await bookService.getBookById(id as string);
        if (active && response.data?.book) {
          setBookTitle(response.data.book.title);
          // isbn is stored as a Number in the DB; convert to string for quiz key lookup
          if (response.data.book.isbn != null) {
            setBookIsbn(String(response.data.book.isbn));
          }
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

  // Look up quiz first by ISBN, then by MongoDB id, then fall back to default.
  const questions = (bookIsbn ? QUIZZES[bookIsbn] : undefined) ?? QUIZZES[id ?? ''] ?? QUIZZES.default;

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
      // Record the quiz result before showing the results screen
      const finalScore = score;
      const pct = Math.round((finalScore / questions.length) * 100);
      if (activeProfileId) {
        recordQuizResult(activeProfileId, {
          bookId: id as string,
          bookTitle,
          score: finalScore,
          total: questions.length,
          pct,
          date: new Date().toISOString(),
        });
      }
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
        {Platform.OS === 'web' && <NavBar role="child" active="home" />}
        <ScrollView contentContainerStyle={s.resultScroll}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>

        {/* Results header */}
          <View style={s.resultHeader}>
            <Text style={s.resultScore}>{score} / {questions.length}</Text>
            <Text style={s.resultMsg}>{msg}</Text>
          </View>

          {/* Score bar */}
          <View style={s.scoreBar}>
            <View style={[s.scoreFill, { width: `${pct}%` }]} />
          </View>
          <Text style={s.pctLabel}>{pct}%</Text>

          <TouchableOpacity style={s.btnPrimary} onPress={handleReset} activeOpacity={0.82}>
            <Text style={s.btnPrimaryText}>Try again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btnSecondary} onPress={() => router.back()} activeOpacity={0.82}>
            <Text style={s.btnSecondaryText}>Back to book</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnGhost}
            onPress={() => router.replace('/(child)')}
            activeOpacity={0.82}
          >
            <Text style={s.btnGhostText}>Home</Text>
          </TouchableOpacity>
        </ScrollView>
        {Platform.OS !== 'web' && <NavBar role="child" active="home" />}
      </SafeAreaView>
    );
  }

  // ── Question screen ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      {Platform.OS === 'web' && <NavBar role="child" active="home" />}
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
                  isSelected && !isCorrect && !isWrong && s.optionSelected,
                  isCorrect && s.optionCorrect,
                  isWrong && s.optionWrong,
                ]}
                onPress={() => handleSelect(i)}
                activeOpacity={0.78}
                disabled={selected !== null}
              >
                <View style={[
                  s.letterBadge,
                  isCorrect && s.letterBadgeCorrect,
                  isWrong && s.letterBadgeWrong,
                ]}>
                  <Text style={s.letterText}>{LETTERS[i]}</Text>
                </View>
                <Text style={[
                  s.optionText,
                  isCorrect && { color: Colors.success },
                  isWrong && { color: Colors.error },
                ]}>
                  {opt}
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
                ? 'Correct! Well done!'
                : `Not quite — the answer was: "${q.options[q.answer]}"`}
            </Text>
          </View>
        )}

        {/* Next */}
        {selected !== null && (
          <TouchableOpacity style={s.btnPrimary} onPress={handleNext} activeOpacity={0.82}>
            <Text style={s.btnPrimaryText}>
              {current < questions.length - 1 ? 'Next question →' : 'See my results'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
      {Platform.OS !== 'web' && <NavBar role="child" active="home" />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.browseSurface },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: NAV_BOTTOM_PAD + Spacing.xl },
  resultScroll: {
    paddingHorizontal: Spacing.xl, paddingBottom: NAV_BOTTOM_PAD + Spacing.xxl,
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
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 2, borderColor: Colors.cardBorder,
  },
  optionSelected: { borderColor: Colors.accentSage, backgroundColor: Colors.accentSageLight },
  optionCorrect: { borderColor: Colors.success, backgroundColor: '#E8F5E9' },
  optionWrong: { borderColor: Colors.error, backgroundColor: '#FFEBEE' },
  letterBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.accentSage,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  letterBadgeCorrect: { backgroundColor: Colors.success },
  letterBadgeWrong: { backgroundColor: Colors.error },
  letterText: { fontSize: 14, fontWeight: '800', color: Colors.textOnDark },
  optionText: { fontSize: Typography.bodyChild - 2, fontWeight: '600', color: Colors.textPrimary, flex: 1 },

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
  resultHeader: { alignItems: 'center', gap: Spacing.xs, width: '100%', marginTop: Spacing.xl },
  resultScore: { fontSize: 52, fontWeight: '900', color: Colors.accentSage },
  resultMsg: { fontSize: Typography.body + 2, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  scoreBar: {
    width: '100%', height: 16, backgroundColor: Colors.cardBorder,
    borderRadius: Radius.full, overflow: 'hidden',
  },
  scoreFill: { height: '100%', backgroundColor: Colors.accentSage, borderRadius: Radius.full },
  pctLabel: { fontSize: Typography.body, color: Colors.textSecondary, fontWeight: '700' },
});
