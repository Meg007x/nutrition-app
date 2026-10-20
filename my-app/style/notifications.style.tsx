import { StyleSheet } from "react-native";

export const ORANGE = "#F28A1A";
export const BG = "#F4F4F4";
export const WHITE = "#FFFFFF";
export const BLUE = "#5A9AF4";
export const BLUE_DARK = "#3F7FE0";
export const TEXT = "#111111";
export const SUBTEXT = "#6E6E6E";
export const CARD_BORDER = "#D4D4D4";

export const RING_SIZE = 210;
export const RING_THICKNESS = 16;

// 🔔 จุดที่ต้องแก้: เติมคำว่า export ไว้ข้างหน้าตัวแปร styles ตรงนี้ครับ
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  // ลบพวก fontSize, color, fontWeight ที่เกี่ยวกับตัวหนังสือในนี้ออกได้เลยครับ 
  // เพราะเราจะย้ายไปใช้สิทธิ์การคุมจากคอมโพเนนต์ <ThemedText> แทน
  scrollContainer: {
    flex: 1,
  },
  section: {
    marginTop: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
    position: 'relative',
  },
  unreadCard: {
    backgroundColor: '#F4FBF7',
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 22,
  },
  contentContainer: {
    flex: 1,
    paddingRight: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999999',
    fontSize: 15,
  }
});