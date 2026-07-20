import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type RecordingEditorScreenStateProps = {
  variant: 'loading' | 'error';
};

export function RecordingEditorScreenState({ variant }: RecordingEditorScreenStateProps) {
  return (
    <View style={styles.container}>
      {variant === 'loading' ? (
        <ActivityIndicator size="large" color="#1A73E8" />
      ) : (
        <Text style={styles.errorText}>Recording could not be loaded.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#7A7F87',
    textAlign: 'center',
  },
});
