import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { ORANGE } from "./step6-1.styles";

export default function AllergyClearConfirmModal({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>!</Text>
          </View>
          <Text style={styles.title}>ล้างรายการที่เลือกทั้งหมด</Text>
          <Text style={styles.message}>ต้องการลบรายการอาหารที่แพ้ทั้งหมดหรือไม่?</Text>

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>ยกเลิก</Text>
            </Pressable>
            <Pressable style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmText}>ล้างทั้งหมด</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  card: {
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  iconWrap: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: "#FFF1DD",
  },
  icon: { color: ORANGE, fontSize: 30, fontWeight: "900" },
  title: {
    marginTop: 14,
    color: "#222",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    color: "#666",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  buttonRow: { flexDirection: "row", gap: 10, width: "100%", marginTop: 22 },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#F7F7F7",
  },
  cancelText: { color: "#333", fontSize: 14, fontWeight: "700" },
  confirmButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 11,
    backgroundColor: ORANGE,
  },
  confirmText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});
