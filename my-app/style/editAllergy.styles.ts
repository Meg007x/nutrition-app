import { StyleSheet } from 'react-native';

export const ORANGE = "#F5A400";
export const BG = "#F3F3F3";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    position: 'relative',
  },
  headerBar: {
    backgroundColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  backIcon: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'NotoSansThaiBold',
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#111',
    fontFamily: 'NotoSansThaiBold',
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1.5,
    marginBottom: 10,
    marginRight: 10,
  },
  chipSelected: {
    backgroundColor: '#FFF4DD',
    borderColor: ORANGE,
  },
  chipUnselected: {
    backgroundColor: '#FFF',
    borderColor: '#E0E0E0',
  },
  chipNone: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  chipText: {
    fontSize: 16,
    fontFamily: 'NotoSansThaiBold',
  },
  chipTextSelected: {
    color: '#8A5A00',
  },
  chipTextUnselected: {
    color: '#666',
  },
  saveButton: {
    backgroundColor: ORANGE,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'NotoSansThaiBold',
  }
});