import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDE7', // สีพื้นหลังออกเหลืองนวลตามภาพ
  },
  headerBar: {
    height: 40,
    backgroundColor: '#E67E22', // สีส้มด้านบนสุด
  },
  scrollContainer: {
    padding: 16,
  },
  titleText: {
    marginBottom: 16,
    color: '#000',
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    color: '#000',
  },
  userStats: {
    color: '#666',
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDBDBD',
  },
  editButtonText: {
    marginLeft: 4,
    color: '#000',
  },
  menuCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  menuIconContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    color: '#000',
  },
  menuSubtitle: {
    color: '#757575',
    marginTop: 2,
  },
});