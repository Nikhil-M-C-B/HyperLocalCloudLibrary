import GenreSelector from "@/components/GenreSelector";
import LanguageSelector from "@/components/LanguageSelector";
import StepEmailVerification from "@/components/StepEmailVerification";
import { API_BASE_URL } from "@/constants/config";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import useAppStore, { numToAgeGroup } from "@/store/useAppStore";
import { sendVerificationEmail } from "@/utils/emailVerification";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ProfileForm {
  name: string;
  age: string;
  genres: string[];
  languages: string[];
}

function StepIndicator({ total, current }: { total: number; current: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: Spacing.xl }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            st.dot,
            i < current
              ? st.dotDone
              : i === current
                ? st.dotActive
                : st.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

function StepDetails({
  form,
  onChange,
  onNext,
  onBack,
  error,
  sending,
}: {
  form: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirm: string;
  };
  onChange: (key: string, val: string) => void;
  onNext: () => void;
  onBack: () => void;
  error: string;
  sending: boolean;
}) {
  const [showPw, setShowPw] = useState(false);
  const fields = [
    {
      key: "name",
      label: "Full Name",
      placeholder: "Your name",
      keyboard: "default",
    },
    {
      key: "email",
      label: "Email address",
      placeholder: "you@example.com",
      keyboard: "email-address",
    },
    {
      key: "phone",
      label: "Phone number",
      placeholder: "+91 99999 99999",
      keyboard: "phone-pad",
    },
    {
      key: "password",
      label: "Password",
      placeholder: "Min. 6 characters",
      keyboard: "default",
      secure: true,
    },
    {
      key: "confirm",
      label: "Confirm Password",
      placeholder: "Repeat password",
      keyboard: "default",
      secure: true,
    },
  ];
  return (
    <View style={{ gap: Spacing.md }}>
      <Text style={st.stepTitle}>Create account</Text>
      <Text style={st.stepSubtitle}>
        Fill in your details to get started as a Reader.
      </Text>
      {fields.map((f) => (
        <View key={f.key} style={{ gap: Spacing.xs }}>
          <Text style={st.label}>{f.label}</Text>
          <TextInput
            style={st.input}
            placeholder={f.placeholder}
            placeholderTextColor={Colors.textMuted}
            secureTextEntry={!!(f.secure && !showPw)}
            keyboardType={f.keyboard as any}
            autoCapitalize={f.key === "name" ? "words" : "none"}
            autoCorrect={false}
            value={(form as any)[f.key]}
            onChangeText={(v) => onChange(f.key, v)}
          />
        </View>
      ))}
      <TouchableOpacity
        onPress={() => setShowPw((v) => !v)}
        style={{ alignSelf: "flex-end" }}
      >
        <Text style={st.togglePw}>
          {showPw ? "Hide password" : "Show password"}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={st.errorText}>{error}</Text> : null}
      <TouchableOpacity
        style={[st.btnPrimary, sending && { opacity: 0.7 }]}
        activeOpacity={0.82}
        onPress={onNext}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator color={Colors.buttonPrimaryText} />
        ) : (
          <Text style={st.btnPrimaryText}>Continue →</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={st.btnBack} onPress={onBack}>
        <Text style={st.btnBackText}>← Go back</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepAddProfile({
  profiles,
  onAddProfile,
  onNext,
  onBack,
  isChildStep,
}: {
  profiles: ProfileForm[];
  onAddProfile: (p: ProfileForm) => void;
  onNext: () => void;
  onBack: () => void;
  isChildStep?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [prefStep, setPrefStep] = useState<0 | 1 | 2>(0); // 0 = details, 1 = languages, 2 = genres

  const handleNextPref = () => {
    if (prefStep === 0) {
      if (!name.trim()) {
        setErr("Please enter a name.");
        return;
      }
      const n = parseInt(age, 10);
      if (!age || isNaN(n) || n < 1 || n > 120) {
        setErr("Please enter a valid age.");
        return;
      }
      setErr("");
      setPrefStep(1); // go to languages
      return;
    }
    if (prefStep === 1) {
      if (languages.length < 1) {
        setErr("Please select at least 1 language.");
        return;
      }
      setErr("");
      setPrefStep(2); // go to genres
      return;
    }
    // prefStep === 2
    if (genres.length < 1) {
      setErr("Please select at least 1 genre.");
      return;
    }
    setErr("");
    onAddProfile({ name: name.trim(), age, genres, languages });
    setName("");
    setAge("");
    setGenres([]);
    setLanguages([]);
    setAdding(false);
    setPrefStep(0);
  };

  const handleCancel = () => {
    if (prefStep > 0) {
      setPrefStep((p) => (p - 1) as 0 | 1 | 2);
      setErr("");
      return;
    }
    setAdding(false);
    setErr("");
    setName("");
    setAge("");
    setGenres([]);
    setLanguages([]);
    setPrefStep(0);
  };

  return (
    <View style={{ gap: Spacing.md }}>
      <Text style={st.stepTitle}>Add a profile?</Text>
      <Text style={st.stepSubtitle}>
        One account, multiple profiles — for you, a child, or anyone else in the
        family.
      </Text>
      {profiles.map((p, i) => (
        <View key={i} style={st.profileChip}>
          <Text style={st.profileChipEmoji}>
            {parseInt(p.age) <= 10 ? "🧒" : "👤"}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={st.profileChipText}>
              {p.name}{" "}
              <Text style={{ color: Colors.textMuted }}>· Age {p.age}</Text>
            </Text>
            {p.genres.length > 0 && (
              <Text style={st.profileChipGenres}>
                {p.genres.join(", ")} • {p.languages.join(", ")}
              </Text>
            )}
          </View>
        </View>
      ))}
      {adding ? (
        <View style={st.addForm}>
          {prefStep === 0 && (
            <>
              <TextInput
                style={st.input}
                placeholder="Profile name (e.g. Aarav)"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={st.input}
                placeholder="Age"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />
            </>
          )}
          {prefStep === 1 && (
            <LanguageSelector
              selectedLanguages={languages}
              onLanguagesChange={setLanguages}
            />
          )}
          {prefStep === 2 && (
            <GenreSelector
              selectedGenres={genres}
              onGenresChange={setGenres}
              isChild={parseInt(age, 10) <= 12}
            />
          )}

          {err ? <Text style={st.errorText}>{err}</Text> : null}
          <View style={{ flexDirection: "row", gap: Spacing.sm }}>
            <TouchableOpacity
              style={[st.btnPrimary, { flex: 1 }]}
              onPress={handleNextPref}
              activeOpacity={0.82}
            >
              <Text style={st.btnPrimaryText}>
                {prefStep === 2 ? "Add Profile" : "Next →"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.btnBack, { flex: 1 }]}
              onPress={handleCancel}
            >
              <Text style={st.btnBackText}>
                {prefStep === 0 ? "Cancel" : "Back"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={st.addAnotherBtn}
          onPress={() => setAdding(true)}
        >
          <Text style={st.addAnotherText}>＋ Add a profile</Text>
        </TouchableOpacity>
      )}
      {!adding && (
        <TouchableOpacity
          style={st.btnPrimary}
          activeOpacity={0.82}
          onPress={onNext}
        >
          <Text style={st.btnPrimaryText}>
            {profiles.length > 0 ? "Continue →" : "Skip for now →"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StepParentPreferences({
  parentName,
  onFinish,
  onBack,
  loading,
}: {
  parentName: string;
  onFinish: (genres: string[], languages: string[]) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [genres, setGenres] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [step, setStep] = useState<0 | 1>(0); // 0 = languages, 1 = genres

  const handleNext = () => {
    if (step === 0) {
      if (languages.length < 1) {
        setErr("Please select at least 1 language.");
        return;
      }
      setErr("");
      setStep(1);
    } else {
      if (genres.length < 1) {
        setErr("Please select at least 1 genre.");
        return;
      }
      setErr("");
      onFinish(genres, languages);
    }
  };

  return (
    <View style={{ gap: Spacing.md }}>
      <Text style={st.stepTitle}>Your reading taste</Text>
      <Text style={st.stepSubtitle}>
        Hey {parentName}! Pick what you enjoy so we can personalise your
        experience.
      </Text>

      {step === 0 ? (
        <LanguageSelector
          selectedLanguages={languages}
          onLanguagesChange={setLanguages}
        />
      ) : (
        <GenreSelector
          selectedGenres={genres}
          onGenresChange={setGenres}
          isChild={false}
        />
      )}

      {err ? <Text style={st.errorText}>{err}</Text> : null}

      <TouchableOpacity
        style={[st.btnPrimary, loading && { opacity: 0.7 }]}
        activeOpacity={0.82}
        onPress={handleNext}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.buttonPrimaryText} />
        ) : (
          <Text style={st.btnPrimaryText}>
            {step === 0 ? "Next →" : "Done — Let's go! 🎉"}
          </Text>
        )}
      </TouchableOpacity>
      {step === 1 && (
        <TouchableOpacity style={st.btnBack} onPress={() => setStep(0)}>
          <Text style={st.btnBackText}>← Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function SignupScreen() {
  const router = useRouter();
  const { setAuth, addProfile } = useAppStore();
  // Four-step flow:
  //   0 = Account Details
  //   1 = Email Verification
  //   2 = Add Profiles (children)
  //   3 = Parent Preferences
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [profiles, setProfiles] = useState<ProfileForm[]>([]);
  const [detailsError, setDetailsError] = useState("");
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [sendingLink, setSendingLink] = useState(false);

  // ... (rest of the file remains exactly the same logic, except handleFinish signature)
  const handleDetailsNext = async () => {
    const { name, email, phone, password, confirm } = details;
    if (!name || !email || !phone || !password || !confirm) {
      setDetailsError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setDetailsError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setDetailsError("Passwords do not match.");
      return;
    }
    setDetailsError("");

    // Send email verification link
    setSendingLink(true);
    try {
      const emailToCheck = email.trim().toLowerCase();
      // First, check if email is already registered
      const checkRes = await fetch(`${API_BASE_URL}/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToCheck }),
      });
      const checkJson = await checkRes.json();

      if (!checkJson.data?.available) {
        setDetailsError(
          checkJson.data?.message || "Email is already registered.",
        );
        setSendingLink(false);
        return;
      }

      await sendVerificationEmail(emailToCheck);
      setStep(1);
    } catch (e: any) {
      setDetailsError(e.message || "Could not send verification email.");
    } finally {
      setSendingLink(false);
    }
  };

  const handleEmailVerified = () => {
    setStep(2);
  };

  const handleFinish = async (
    parentGenres: string[],
    parentLanguages: string[],
  ) => {
    setLoading(true);
    setGlobalError("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: details.email.trim().toLowerCase(),
          password: details.password,
          phone: details.phone.replace(/\s/g, ""),
          name: details.name.trim(),
          role: "USER",
          preferredGenres: parentGenres,
          preferredLanguages: parentLanguages,
          emailVerified: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Registration failed");
      const { token, user } = json.data;

      await setAuth({
        userId: user.id,
        email: user.email,
        token,
        role: "USER",
        profiles: user.profiles ?? [],
      });

      for (const cp of profiles) {
        const ageNum = parseInt(cp.age, 10);
        const ageGroup = numToAgeGroup(ageNum);
        try {
          const childRes = await fetch(
            `${API_BASE_URL}/users/${user.id}/children`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                name: cp.name,
                ageGroup,
                preferredGenres: cp.genres,
                preferredLanguages: cp.languages,
              }),
            },
          );
          const childJson = await childRes.json();
          const backendProfile = childJson?.data?.profile;
          await addProfile({
            profileId:
              backendProfile?.profileId ?? String(Date.now() + Math.random()),
            name: cp.name,
            accountType: "CHILD",
            ageGroup,
            age: ageNum,
            preferredGenres: cp.genres,
            preferredLanguages: cp.languages,
          });
        } catch {
          await addProfile({
            profileId: String(Date.now() + Math.random()),
            name: cp.name,
            accountType: "CHILD",
            ageGroup,
            age: ageNum,
            preferredGenres: cp.genres,
            preferredLanguages: cp.languages,
          });
        }
      }
      router.replace("/(select-profile)");
    } catch (e: any) {
      setGlobalError(e.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={st.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={st.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step < 2 && (
            <TouchableOpacity
              style={st.backBtn}
              onPress={() =>
                step > 0 ? setStep((s) => Math.max(0, s - 1)) : router.back()
              }
            >
              <Text style={st.backArrow}>←</Text>
            </TouchableOpacity>
          )}
          <StepIndicator total={4} current={step} />
          {globalError ? (
            <Text style={[st.errorText, { marginBottom: Spacing.md }]}>
              {globalError}
            </Text>
          ) : null}

          {step === 0 && (
            <StepDetails
              form={details}
              onChange={(k, v) => setDetails((p) => ({ ...p, [k]: v }))}
              onNext={handleDetailsNext}
              onBack={() => router.back()}
              error={detailsError}
              sending={sendingLink}
            />
          )}

          {step === 1 && (
            <StepEmailVerification
              email={details.email.trim().toLowerCase()}
              onVerified={handleEmailVerified}
              onBack={() => setStep(0)}
            />
          )}

          {step === 2 && (
            <StepAddProfile
              profiles={profiles}
              onAddProfile={(p) => setProfiles((prev) => [...prev, p])}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <StepParentPreferences
              parentName={details.name.trim().split(" ")[0]}
              onFinish={handleFinish}
              onBack={() => setStep(2)}
              loading={loading}
            />
          )}

          {step === 0 && (
            <View style={st.footerRow}>
              <Text style={st.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text style={st.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
  backBtn: {
    marginTop: Spacing.xs,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  backArrow: { fontSize: 20, color: Colors.accentSage, fontWeight: "700" },
  dot: { height: 8, borderRadius: Radius.full },
  dotActive: { backgroundColor: Colors.accentSage, width: 28 },
  dotDone: { backgroundColor: Colors.accentSageLight, width: 16 },
  dotInactive: { backgroundColor: Colors.cardBorder, width: 16 },
  stepTitle: {
    fontSize: Typography.title + 2,
    fontWeight: "800",
    color: Colors.accentSage,
  },
  stepSubtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  label: {
    fontSize: Typography.label,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: Typography.body,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  togglePw: {
    fontSize: Typography.label,
    color: Colors.accentPeriwinkle,
    fontWeight: "600",
  },
  errorText: {
    fontSize: Typography.label,
    color: Colors.error,
    textAlign: "center",
  },
  btnPrimary: {
    backgroundColor: Colors.buttonPrimary,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnPrimaryText: {
    fontSize: Typography.body,
    fontWeight: "700",
    color: Colors.buttonPrimaryText,
  },
  btnDisabled: { opacity: 0.45 },
  btnBack: {
    borderRadius: Radius.full,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  btnBackText: {
    fontSize: Typography.body,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  profileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  profileChipEmoji: { fontSize: 24 },
  profileChipText: {
    fontSize: Typography.body,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  profileChipGenres: {
    fontSize: Typography.label,
    color: Colors.accentPeriwinkle,
    marginTop: 2,
  },
  addAnotherBtn: {
    borderWidth: 1.5,
    borderColor: Colors.accentSage,
    borderStyle: "dashed",
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  addAnotherText: {
    fontSize: Typography.body,
    color: Colors.accentSage,
    fontWeight: "700",
  },
  addForm: { gap: Spacing.md },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
  footerText: { fontSize: Typography.body, color: Colors.textSecondary },
  footerLink: {
    fontSize: Typography.body,
    color: Colors.accentSage,
    fontWeight: "700",
  },
});
