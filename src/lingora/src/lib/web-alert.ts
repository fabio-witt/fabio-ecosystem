/**
 * React Native Web ships Alert.alert as an empty function, so on the web
 * every error message, confirmation and menu built with it silently does
 * nothing (log out, delete post, failed saves...). This replaces it with the
 * browser's own dialogs. Imported once from the root layout; native platforms
 * keep the real Alert.
 */
import { Alert, Platform, type AlertButton } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    const cancel = buttons?.find((button) => button.style === 'cancel');
    const actions = (buttons ?? []).filter((button) => button !== cancel);

    // Plain notice: one OK.
    if (actions.length <= 1 && !cancel) {
      window.alert(text);
      actions[0]?.onPress?.();
      return;
    }

    // One action with Cancel: OK / Cancel.
    if (actions.length === 1) {
      if (window.confirm(text)) actions[0].onPress?.();
      else cancel?.onPress?.();
      return;
    }

    // Several actions (a small menu): offer them one at a time.
    for (const action of actions) {
      if (window.confirm(`${text ? `${text}\n\n` : ''}${action.text ?? 'OK'}?`)) {
        action.onPress?.();
        return;
      }
    }
    cancel?.onPress?.();
  };
}
