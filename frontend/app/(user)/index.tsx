import bookService from "@/api/services/bookService";
import issueService from "@/api/services/issueService";
import { BookCover } from "@/components/BookCover";
import { API_BASE_URL } from "@/constants/config";
import { GENRES, type Book } from "@/constants/mockData";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import useAppStore from "@/store/useAppStore";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function mapBook(b: any): Book {
  return {
    id: b._id || b.id,
    title: b.title || "Unknown Title",
    author: b.author || "Unknown Author",
    pages: 200,
    releaseYear: new Date(b.createdAt || Date.now()).getFullYear(),
    genres: b.genre || [],
    summary: b.summary || "",
    rating: 4.5,
    coverColor: "#C5DDB8",
    coverAccent: "#4A7C59",
    isDigital: true,
    isPhysical: true,
    availableCopies: parseInt(b.availableCopies ?? 0),
    nearestLibrary: "Local Library",
    ageMin: parseInt(b.ageRating?.split("-")[0]) || 0,
    ageMax: parseInt(b.ageRating?.split("-")[1]) || 99,
    keyWords: [],
    coverImage: b.coverImage,
  };
}

const { width } = Dimensions.get("window");
const HRCARD_W = 130;
const HRCARD_H = 190;

// ─── Horizontal book card (for recommendation row) ────────────────────────────
function HorizBookCard({ book, onPress }: { book: Book; onPress: () => void }) {
  return (
    <TouchableOpacity style={hc.wrap} onPress={onPress} activeOpacity={0.82}>
      <BookCover book={book} width={HRCARD_W} height={HRCARD_H} fontSize={11} />
      <Text style={hc.title} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={hc.author} numberOfLines={1}>
        {book.author}
      </Text>
      <Text style={hc.avail}>
        {book.availableCopies > 0
          ? `✓ ${book.availableCopies} available`
          : "✗ Unavailable"}
      </Text>
    </TouchableOpacity>
  );
}
const hc = StyleSheet.create({
  wrap: { width: HRCARD_W, gap: 5 },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 17,
  },
  author: { fontSize: 11, color: Colors.textSecondary },
  avail: { fontSize: 11, color: Colors.accentSage, fontWeight: "700" },
});

// ─── Search result row ────────────────────────────────────────────────────────
function SearchRow({ book, onPress }: { book: Book; onPress: () => void }) {
  return (
    <TouchableOpacity style={sr.row} onPress={onPress} activeOpacity={0.82}>
      <BookCover book={book} width={56} height={76} fontSize={9} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={sr.title}>{book.title}</Text>
        <Text style={sr.author}>
          by {book.author} · {book.releaseYear}
        </Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {book.genres.slice(0, 2).map((g) => (
            <View key={g} style={sr.chip}>
              <Text style={sr.chipText}>{g}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={sr.avail}>
        {book.availableCopies > 0 ? `${book.availableCopies} left` : "Waitlist"}
      </Text>
    </TouchableOpacity>
  );
}
const sr = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  title: {
    fontSize: Typography.body,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  author: { fontSize: Typography.label, color: Colors.textSecondary },
  chip: {
    backgroundColor: Colors.browseSurface,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipText: { fontSize: 11, color: Colors.accentPeriwinkle, fontWeight: "600" },
  avail: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.accentSage,
    textAlign: "right",
  },
});

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.sm,
      }}
    >
      <Text
        style={{
          fontSize: Typography.body + 1,
          fontWeight: "800",
          color: Colors.textPrimary,
        }}
      >
        {title}
      </Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text
            style={{
              fontSize: Typography.label,
              color: Colors.accentSage,
              fontWeight: "700",
            }}
          >
            See all
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function UserHome() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const { userId, profiles, activeProfileId, clearAuth, token } = useAppStore();
  const activeProfile = profiles.find((p) => p.profileId === activeProfileId);
  const preferredGenres = activeProfile?.preferredGenres?.length
    ? activeProfile.preferredGenres
    : ["Fantasy", "Picture Book"];

  const [recommended, setRecommended] = useState<Book[]>([]);
  const [newArrivals, setNewArrivals] = useState<Book[]>([]);
  const [byGenre, setByGenre] = useState<Book[]>([]);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [activeIssues, setActiveIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial sections
  useEffect(() => {
    let active = true;
    const fetchSections = async () => {
      setLoading(true);
      try {
        const recRes = await bookService.getBooks({
          genre: preferredGenres,
          limit: 10,
        });
        if (active) setRecommended((recRes?.data?.books || []).map(mapBook));

        const newRes = await bookService.getBooks({ daysAgo: 10, limit: 10 });
        if (active) setNewArrivals((newRes?.data?.books || []).map(mapBook));

        if (activeProfile?.profileId && userId) {
          const issuesRes = await issueService.getUserIssues(
            userId,
            activeProfile.profileId,
          );
          if (active && issuesRes.data?.issues) {
            setActiveIssues(
              issuesRes.data.issues.filter((i: any) => i.status === "ISSUED"),
            );
          }
        }
      } catch (error) {
        console.warn("Failed to fetch sections:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSections();
    return () => {
      active = false;
    };
  }, [preferredGenres]);

  // Fetch browse feed
  useEffect(() => {
    let active = true;
    const fetchBrowse = async () => {
      try {
        const filters: any = { limit: 20 };
        if (activeGenre !== "All") filters.genre = activeGenre;
        const res = await bookService.getBooks(filters);
        if (active) setByGenre((res?.data?.books || []).map(mapBook));
      } catch (error) {
        console.warn("Failed to fetch browse books:", error);
      }
    };
    fetchBrowse();
    return () => {
      active = false;
    };
  }, [activeGenre]);

  // Fetch search results
  useEffect(() => {
    let active = true;
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await bookService.getBooks({ search: query, limit: 20 });
        if (active) setSearchResults((res?.data?.books || []).map(mapBook));
      } catch (error) {
        console.warn("Failed to fetch search results:", error);
      }
    }, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const searching = query.trim().length > 0;

  const handleSignOut = async () => {
    setMenuVisible(false);
    await clearAuth();
    router.replace("/(auth)/welcome");
  };

  const childProfiles = profiles.filter((p) => p.accountType === "CHILD");

  const handleDeleteProfile = () => {
    setMenuVisible(false);
    if (childProfiles.length === 0) {
      Alert.alert(
        "No Child Profiles",
        "You have no child profiles to delete. The parent account cannot be deleted from here.",
      );
      return;
    }
    setDeleteModalVisible(true);
  };

  const confirmDeleteProfile = (p: any) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete the profile "${p.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(
                `${API_BASE_URL}/users/${userId}/profiles/${p.profileId}`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                },
              );
              setDeleteModalVisible(false);
              Alert.alert("Deleted", `Profile "${p.name}" has been removed.`);
              router.replace("/(select-profile)");
            } catch {
              Alert.alert("Error", "Failed to delete profile.");
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Hamburger Menu Modal ── */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={s.menuCard}>
            <Text style={s.menuTitle}>Menu</Text>
            <TouchableOpacity
              style={s.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push("/(user)/edit-profile");
              }}
            >
              <Text style={s.menuItemText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.menuItem} onPress={handleDeleteProfile}>
              <Text style={[s.menuItemText, { color: Colors.error }]}>
                Delete Profile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.menuItem} onPress={handleSignOut}>
              <Text style={[s.menuItemText, { color: Colors.error }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.menuCancel}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={s.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Delete Profile Modal ── */}
      <Modal
        transparent
        visible={deleteModalVisible}
        animationType="slide"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={s.deleteOverlay}>
          <View style={s.deleteCard}>
            <Text style={s.deleteTitle}>Select Profile to Delete</Text>
            <Text style={s.deleteSubtitle}>
              Tap a child profile to remove it permanently.
            </Text>
            <FlatList
              data={childProfiles}
              keyExtractor={(item) => item.profileId}
              numColumns={2}
              columnWrapperStyle={{ gap: Spacing.md, marginBottom: Spacing.md }}
              contentContainerStyle={{ paddingVertical: Spacing.md }}
              renderItem={({ item, index }) => {
                const AVATAR_COLORS = [
                  "#C5DDB8",
                  "#F4C2C2",
                  "#C5D5EA",
                  "#FFDAB9",
                  "#D4C5EA",
                  "#B8D4C8",
                ];
                const bgColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                const age = item.age || 0;
                const emoji = age <= 3 ? "👶" : age <= 10 ? "🧒" : "🧑";
                return (
                  <TouchableOpacity
                    style={s.deleteProfileCard}
                    activeOpacity={0.78}
                    onPress={() => confirmDeleteProfile(item)}
                  >
                    <View
                      style={[s.deleteAvatar, { backgroundColor: bgColor }]}
                    >
                      <Text style={s.deleteAvatarEmoji}>{emoji}</Text>
                    </View>
                    <Text style={s.deleteProfileName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={s.deleteAgeBadge}>
                      <Text style={s.deleteAgeBadgeText}>
                        {item.ageGroup ? `Age ${item.ageGroup}` : `Age ${age}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={s.deleteCancelBtn}
              onPress={() => setDeleteModalVisible(false)}
            >
              <Text style={s.deleteCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.profileBtn}
            onPress={() => setMenuVisible(true)}
          >
            <Text style={s.profileEmoji}>☰</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>
              Hello, {activeProfile?.name || "Priya"} 👋
            </Text>
            <Text style={s.subGreeting}>What are you looking for today?</Text>
          </View>
          <TouchableOpacity
            style={s.profileBtn}
            onPress={() => router.replace("/(select-profile)")}
          >
            <Text style={s.profileEmoji}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* ── Search bar ── */}
        <View style={s.searchWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search by title, author, or keywords…"
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Text style={s.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading && !searching ? (
          <ActivityIndicator
            size="large"
            color={Colors.accentSage}
            style={{ marginTop: 40 }}
          />
        ) : searching ? (
          <View style={s.section}>
            <SectionHeader title={`Results (${searchResults.length})`} />
            {searchResults.length === 0 ? (
              <Text style={s.empty}>
                No books found for &quot;{query}&quot;.
              </Text>
            ) : (
              searchResults.map((b) => (
                <SearchRow
                  key={b.id}
                  book={b}
                  onPress={() => router.push(`/(user)/book/${b.id}`)}
                />
              ))
            )}
          </View>
        ) : (
          <>
            {/* ── Active order pill ── */}
            {activeIssues.length > 0 && activeIssues[0].type === "PHYSICAL" && (
              <TouchableOpacity
                style={s.orderBanner}
                onPress={() =>
                  router.push(`/(user)/track/${activeIssues[0]._id}`)
                }
              >
                <Text style={s.orderBannerIcon}>📦</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.orderBannerTitle}>Order in progress</Text>
                  <Text style={s.orderBannerSub}>
                    {activeIssues[0].copyId?.bookId?.title ||
                      activeIssues[0].bookId?.title ||
                      "Book"}{" "}
                    · Tracking
                  </Text>
                </View>
                <Text style={s.orderBannerArrow}>→</Text>
              </TouchableOpacity>
            )}

            {/* ── Based on Your Preferences ── */}
            {recommended.length > 0 && (
              <View style={s.section}>
                <SectionHeader title="⭐ Based on Your Preferences" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: Spacing.md }}
                >
                  {recommended.map((b) => (
                    <HorizBookCard
                      key={b.id}
                      book={b}
                      onPress={() => router.push(`/(user)/book/${b.id}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── New Arrivals ── */}
            {newArrivals.length > 0 && (
              <View style={s.section}>
                <SectionHeader title="🆕 New Arrivals" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: Spacing.md }}
                >
                  {newArrivals.map((b) => (
                    <HorizBookCard
                      key={b.id}
                      book={b}
                      onPress={() => router.push(`/(user)/book/${b.id}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── Genre filter ── */}
            <View style={s.section}>
              <SectionHeader title="📚 Browse" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  gap: Spacing.xs,
                  marginBottom: Spacing.md,
                }}
              >
                {GENRES.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      s.genrePill,
                      activeGenre === g && s.genrePillActive,
                    ]}
                    onPress={() => setActiveGenre(g)}
                  >
                    <Text
                      style={[
                        s.genrePillText,
                        activeGenre === g && s.genrePillTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {byGenre.map((b) => (
                <SearchRow
                  key={b.id}
                  book={b}
                  onPress={() => router.push(`/(user)/book/${b.id}`)}
                />
              ))}
              {byGenre.length === 0 && (
                <Text style={s.empty}>No books found in this genre.</Text>
              )}
            </View>

            {/* ── My Books ── */}
            <TouchableOpacity
              style={s.myBooksBanner}
              onPress={() => router.push("/(user)/my-books")}
            >
              <Text style={s.myBooksText}>
                📋 My borrowed books & history →
              </Text>
            </TouchableOpacity>

            {/* ── Monitor children ── */}
            <TouchableOpacity
              style={s.monitorBanner}
              onPress={() => router.push("/(user)/monitor")}
            >
              <Text style={s.monitorText}>👁️ Monitor child profiles →</Text>
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
  scroll: { paddingBottom: Spacing.xl },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: Typography.title + 2,
    fontWeight: "800",
    color: Colors.accentSage,
  },
  subGreeting: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  profileEmoji: { fontSize: 22 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
  clearBtn: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: "700",
    paddingHorizontal: 4,
  },

  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  empty: {
    fontSize: Typography.body,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },

  orderBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accentSage,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  orderBannerIcon: { fontSize: 24 },
  orderBannerTitle: {
    fontSize: Typography.body,
    fontWeight: "800",
    color: Colors.textOnDark,
  },
  orderBannerSub: {
    fontSize: Typography.label,
    color: "#C5DDB8",
    marginTop: 2,
  },
  orderBannerArrow: {
    fontSize: 20,
    color: Colors.textOnDark,
    fontWeight: "700",
  },

  genrePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  genrePillActive: {
    backgroundColor: Colors.accentSage,
    borderColor: Colors.accentSage,
  },
  genrePillText: {
    fontSize: Typography.label,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  genrePillTextActive: { color: Colors.textOnDark },

  myBooksBanner: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.readSurface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  myBooksText: {
    fontSize: Typography.body,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  monitorBanner: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.browseSurface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  monitorText: {
    fontSize: Typography.body,
    fontWeight: "700",
    color: Colors.accentPeriwinkle,
  },

  // Hamburger menu modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingTop: 80,
    paddingLeft: Spacing.xl,
  },

  // Delete profile modal
  deleteOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  deleteCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 360,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  deleteTitle: {
    fontSize: Typography.title,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  deleteSubtitle: {
    fontSize: Typography.label,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  deleteProfileCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.error,
    gap: 4,
  },
  deleteAvatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  deleteAvatarEmoji: { fontSize: 28 },
  deleteProfileName: {
    fontSize: Typography.body,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  deleteAgeBadge: {
    backgroundColor: Colors.browseSurface,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  deleteAgeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.accentPeriwinkle,
  },
  deleteCancelBtn: {
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    marginTop: 4,
  },
  deleteCancelText: {
    fontSize: Typography.body,
    fontWeight: "600",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    minWidth: 220,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    gap: Spacing.xs,
  },
  menuTitle: {
    fontSize: Typography.label,
    fontWeight: "700",
    color: Colors.textMuted,
    paddingHorizontal: Spacing.sm,
    paddingBottom: 4,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
  },
  menuItemText: {
    fontSize: Typography.body,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  menuCancel: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  menuCancelText: {
    fontSize: Typography.body,
    fontWeight: "600",
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
