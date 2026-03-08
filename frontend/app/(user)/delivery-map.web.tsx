import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Web Fallback for DeliveryMapScreen
 * react-native-maps is not supported on web.
 */
export default function DeliveryMapScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.emoji}>📍</Text>
                <Text style={styles.title}>Map Not Available on Web</Text>
                <Text style={styles.description}>
                    The interactive map for setting your delivery location is only available
                    on Android and iOS devices.
                </Text>

                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: "center",
        alignItems: "center",
        padding: Spacing.xl,
    },
    content: {
        backgroundColor: Colors.card,
        borderRadius: Radius.lg,
        padding: Spacing.xl,
        alignItems: "center",
        maxWidth: 400,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    emoji: {
        fontSize: 64,
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.title,
        fontWeight: "800",
        color: Colors.accentSage,
        textAlign: "center",
        marginBottom: Spacing.sm,
    },
    description: {
        fontSize: Typography.body,
        color: Colors.textSecondary,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: Spacing.xl,
    },
    backBtn: {
        backgroundColor: Colors.buttonPrimary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: 14,
        borderRadius: Radius.full,
        width: "100%",
        alignItems: "center",
    },
    backText: {
        fontSize: Typography.body,
        fontWeight: "700",
        color: Colors.buttonPrimaryText,
    },
});
